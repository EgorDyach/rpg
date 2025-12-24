from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Count, Sum
from datetime import timedelta

from .models import *
from .serializers import *
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin
from .utils import add_xp_to_user, update_streak, check_achievements, get_leaderboard, get_user_rank, calculate_xp_for_level


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления пользователями.
    
    Поддерживает регистрацию (без аутентификации) и управление профилем
    (требует аутентификации). Включает кастомные действия:
    - me: получение данных текущего пользователя
    - stats: статистика пользователя
    - search: поиск пользователей по username
    """
    queryset = User.objects.all().select_related('profile')
    
    def get_permissions(self):
        # OPTIONS запросы разрешаем без аутентификации (для CORS preflight)
        if self.request.method == 'OPTIONS':
            return [AllowAny()]
        if self.action == 'create':
            return [AllowAny()]  # Регистрация доступна всем
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """Получить статистику текущего пользователя"""
        user = request.user
        from .models import QuestAssignment, Quest
        
        stats = {
            'level': user.level,
            'xp': user.xp,
            'xp_to_next_level': calculate_xp_for_level(user.level) - user.xp,
            'coins': user.coins,
            'streak': user.streak,
            'quests_created': Quest.objects.filter(created_by=user).count(),
            'quests_completed': QuestAssignment.objects.filter(user=user, is_completed=True).count(),
            'quests_in_progress': QuestAssignment.objects.filter(user=user, is_completed=False).count(),
            'achievements_count': AchievementProgress.objects.filter(user=user, achieved=True).count(),
            'rank': get_user_rank(user),
        }
        return Response(stats)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def search(self, request):
        """Поиск пользователей по username"""
        username = request.query_params.get('username', '')
        if not username:
            return Response({'detail': 'Параметр username обязателен'}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(username__icontains=username).exclude(id=request.user.id)[:10]
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().select_related('created_by')
    serializer_class = GroupSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [AllowAny()]
    
    def get_queryset(self):
        queryset = Group.objects.all().select_related('created_by')
        if self.request.user.is_authenticated:
            if self.request.user.role == 'admin':
                return queryset
            # Показываем публичные группы и группы, в которых состоит пользователь
            return queryset.filter(
                Q(is_public=True) | Q(members=self.request.user)
            ).distinct()
        return queryset.filter(is_public=True)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Присоединиться к группе"""
        group = self.get_object()
        if group.members.filter(id=request.user.id).exists():
            return Response({'detail': 'Уже в группе'}, status=status.HTTP_400_BAD_REQUEST)
        group.members.add(request.user)
        
        Notification.objects.create(
            user=request.user,
            title="Присоединение к группе",
            body=f"Вы присоединились к группе: {group.name}",
            data={"group_id": group.id, "type": "group_joined"}
        )
        
        return Response({'detail': 'Присоединились к группе'})
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Покинуть группу"""
        group = self.get_object()
        if not group.members.filter(id=request.user.id).exists():
            return Response({'detail': 'Не в группе'}, status=status.HTTP_400_BAD_REQUEST)
        group.members.remove(request.user)
        return Response({'detail': 'Покинули группу'})


class QuestViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления квестами.
    
    Публичные квесты видны всем, личные - только создателю.
    Поддерживает поиск по названию и описанию.
    Включает кастомное действие:
    - accept: принятие публичного квеста (создание assignment)
    """
    queryset = Quest.objects.all().select_related('created_by')
    serializer_class = QuestSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description']
    
    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [AllowAny()]
    
    def get_queryset(self):
        queryset = Quest.objects.all().select_related('created_by')
        # Публичные квесты видны всем, личные - только создателю
        if self.request.user.is_authenticated:
            if self.request.user.role == 'admin':
                return queryset
            return queryset.filter(
                Q(is_public=True) | Q(created_by=self.request.user)
            )
        return queryset.filter(is_public=True)
    
    def perform_create(self, serializer):
        # Студенты могут создавать квесты
        quest = serializer.save(created_by=self.request.user)
        
        # Если квест публичный, создаем уведомления для других пользователей
        if quest.is_public:
            from .models import User
            students = User.objects.filter(role='student').exclude(id=self.request.user.id)
            for student in students[:50]:  # Ограничиваем количество уведомлений
                Notification.objects.create(
                    user=student,
                    title="Новый публичный квест!",
                    body=f"{self.request.user.username} создал новый квест: {quest.title}",
                    data={"quest_id": quest.id, "type": "new_public_quest"}
                )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept(self, request, pk=None):
        """Принять публичный квест (создать assignment)"""
        quest = self.get_object()
        
        if not quest.is_public:
            return Response({'detail': 'Этот квест не публичный'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Проверяем, не принят ли уже квест
        existing = QuestAssignment.objects.filter(quest=quest, user=request.user).first()
        if existing:
            return Response({'detail': 'Квест уже принят'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Создаем assignment
        assignment = QuestAssignment.objects.create(
            quest=quest,
            user=request.user,
            due_date=quest.deadline.date() if quest.deadline else None,
            xp_reward=quest.xp_reward,
            coin_reward=quest.coin_reward
        )
        
        serializer = QuestAssignmentSerializer(assignment, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class QuestAssignmentViewSet(viewsets.ModelViewSet):
    queryset = QuestAssignment.objects.all()
    serializer_class = QuestAssignmentSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return QuestAssignment.objects.all().select_related('quest', 'user')
        return QuestAssignment.objects.filter(user=user).select_related('quest', 'user')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Выполнить квест (отметить как выполненный).
        
        При выполнении:
        - Начисляет XP и монеты пользователю
        - Дает бонус +20% XP за выполнение раньше дедлайна
        - Обновляет streak
        - Проверяет достижения
        - Создает уведомление
        """
        assignment = self.get_object()
        if assignment.is_completed:
            return Response({'detail': 'Уже выполнено'}, status=status.HTTP_400_BAD_REQUEST)
        
        assignment.is_completed = True
        assignment.completed_at = timezone.now()
        
        # Начисляем награды
        quest = assignment.quest
        xp_reward = quest.xp_reward
        coin_reward = quest.coin_reward
        
        # Бонус за выполнение раньше дедлайна
        if quest.deadline and assignment.completed_at < quest.deadline:
            xp_reward = int(xp_reward * 1.2)  # +20% бонус
        
        assignment.xp_reward = xp_reward
        assignment.coin_reward = coin_reward
        assignment.save()
        
        # Начисляем XP и обновляем streak
        user = assignment.user
        add_xp_to_user(user, xp_reward, f"Выполнение квеста: {quest.title}")
        user.coins += coin_reward
        user.save()
        
        # Обновляем streak
        update_streak(user)
        
        # Проверяем достижения
        check_achievements(user)
        
        # Создаем уведомление
        Notification.objects.create(
            user=user,
            title="Квест выполнен!",
            body=f"Вы выполнили квест: {quest.title}. Получено {xp_reward} XP и {coin_reward} монет.",
            data={"quest_id": quest.id, "quest_title": quest.title, "type": "quest_completed"}
        )
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data)


# Для остальных моделей можно сделать стандартные CRUD ViewSets
class GenericModelViewSet(viewsets.ModelViewSet):
    pass


class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [IsAdminOrReadOnly]


class AchievementProgressViewSet(viewsets.ModelViewSet):
    queryset = AchievementProgress.objects.all()
    serializer_class = AchievementProgressSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return AchievementProgress.objects.all()
        return AchievementProgress.objects.filter(user=user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAdminOrReadOnly]


class StoreItemViewSet(viewsets.ModelViewSet):
    queryset = StoreItem.objects.select_related('item').filter(is_active=True)
    serializer_class = StoreItemSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'purchase']:
            return [IsAuthenticated()]
        return [IsAdminOrReadOnly()]
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def purchase(self, request, pk=None):
        """Купить предмет из магазина"""
        store_item = self.get_object()
        user = request.user
        quantity = request.data.get('quantity', 1)
        
        if not store_item.is_active:
            return Response({'detail': 'Предмет недоступен для покупки'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Проверка наличия на складе
        if store_item.stock is not None and store_item.stock < quantity:
            return Response({'detail': 'Недостаточно товара на складе'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Проверка лимита покупок
        if store_item.purchase_limit:
            purchases_count = InventoryItem.objects.filter(
                user=user, 
                item=store_item.item
            ).count()
            if purchases_count >= store_item.purchase_limit:
                return Response({'detail': 'Достигнут лимит покупок этого предмета'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Проверка достаточности средств
        total_cost = store_item.price * quantity
        if user.coins < total_cost:
            return Response({'detail': 'Недостаточно монет'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Покупка
        user.coins -= total_cost
        user.save()
        
        # Создаем запись в инвентаре
        inventory_item, created = InventoryItem.objects.get_or_create(
            user=user,
            item=store_item.item,
            defaults={'quantity': quantity}
        )
        if not created:
            inventory_item.quantity += quantity
            inventory_item.save()
        
        # Обновляем склад
        if store_item.stock is not None:
            store_item.stock -= quantity
            store_item.save()
        
        # Создаем транзакцию
        CurrencyTransaction.objects.create(
            user=user,
            delta=-total_cost,
            reason=f"Покупка: {store_item.item.name} x{quantity}",
            meta={"store_item_id": store_item.id, "item_id": store_item.item.id, "quantity": quantity}
        )
        
        # Создаем уведомление
        Notification.objects.create(
            user=user,
            title="Покупка выполнена",
            body=f"Вы купили {store_item.item.name} x{quantity} за {total_cost} монет",
            data={"store_item_id": store_item.id, "item_id": store_item.item.id, "type": "item_purchased"}
        )
        
        serializer = InventoryItemSerializer(inventory_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return InventoryItem.objects.all().select_related('item', 'user')
        return InventoryItem.objects.filter(user=user).select_related('item')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def equip(self, request, pk=None):
        """Экипировать предмет"""
        inventory_item = self.get_object()
        user = request.user
        slot = request.data.get('slot', 'default')
        
        if inventory_item.user != user:
            return Response({'detail': 'Нет прав'}, status=status.HTTP_403_FORBIDDEN)
        
        # Если предмет косметический, экипируем
        if inventory_item.item.item_type == 'cosmetic':
            EquippedItem.objects.update_or_create(
                user=user,
                slot=slot,
                defaults={'item': inventory_item.item}
            )
            return Response({'detail': 'Предмет экипирован'}, status=status.HTTP_200_OK)
        
        return Response({'detail': 'Этот тип предмета нельзя экипировать'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def unequip(self, request, pk=None):
        """Снять предмет"""
        inventory_item = self.get_object()
        user = request.user
        slot = request.data.get('slot', 'default')
        
        if inventory_item.user != user:
            return Response({'detail': 'Нет прав'}, status=status.HTTP_403_FORBIDDEN)
        
        EquippedItem.objects.filter(user=user, slot=slot, item=inventory_item.item).delete()
        return Response({'detail': 'Предмет снят'}, status=status.HTTP_200_OK)


class EquippedItemViewSet(viewsets.ModelViewSet):
    queryset = EquippedItem.objects.all()
    serializer_class = EquippedItemSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return EquippedItem.objects.all().select_related('item', 'user')
        return EquippedItem.objects.filter(user=user).select_related('item')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LeaderboardViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LeaderboardEntry.objects.select_related('user').order_by('-score')
    serializer_class = LeaderboardEntrySerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def rankings(self, request):
        """Получить рейтинг по различным критериям"""
        from .models import QuestAssignment
        
        period = request.query_params.get('period', 'all')  # all, week, month
        faculty = request.query_params.get('faculty', None)
        group_name = request.query_params.get('group', None)
        sort_by = request.query_params.get('sort_by', 'level')  # level, xp, quests, streak
        
        leaderboard = get_leaderboard(period, faculty, group_name)
        
        if sort_by == 'xp':
            leaderboard = sorted(leaderboard, key=lambda u: u.xp, reverse=True)
        elif sort_by == 'quests':
            quest_counts = QuestAssignment.objects.filter(
                is_completed=True
            ).values('user').annotate(count=Count('id'))
            quest_dict = {item['user']: item['count'] for item in quest_counts}
            leaderboard = sorted(leaderboard, key=lambda u: quest_dict.get(u.id, 0), reverse=True)
        elif sort_by == 'streak':
            leaderboard = sorted(leaderboard, key=lambda u: u.streak, reverse=True)
        else:  # level
            leaderboard = sorted(leaderboard, key=lambda u: (u.level, u.xp), reverse=True)
        
        # Ограничиваем топ-100
        leaderboard = leaderboard[:100]
        
        data = []
        for idx, user in enumerate(leaderboard, 1):
            quest_count = QuestAssignment.objects.filter(user=user, is_completed=True).count()
            data.append({
                'rank': idx,
                'user': UserSerializer(user).data,
                'level': user.level,
                'xp': user.xp,
                'quests_completed': quest_count,
                'streak': user.streak
            })
        
        # Добавляем место текущего пользователя, если он не в топе
        if request.user.is_authenticated and request.user.role == 'student':
            user_rank = get_user_rank(request.user, period, faculty, group_name)
            if user_rank and user_rank > 100:
                quest_count = QuestAssignment.objects.filter(user=request.user, is_completed=True).count()
                data.append({
                    'rank': user_rank,
                    'user': UserSerializer(request.user).data,
                    'level': request.user.level,
                    'xp': request.user.xp,
                    'quests_completed': quest_count,
                    'streak': request.user.streak,
                    'is_current_user': True
                })
        
        return Response(data)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminOrReadOnly]


class FriendRequestViewSet(viewsets.ModelViewSet):
    queryset = FriendRequest.objects.all()
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FriendRequest.objects.filter(Q(from_user=self.request.user) | Q(to_user=self.request.user))
    
    def perform_create(self, serializer):
        serializer.save(from_user=self.request.user)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(receiver=user))
    
    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


# Комментарии к квестам
class QuestCommentViewSet(viewsets.ModelViewSet):
    queryset = QuestComment.objects.all().select_related('user', 'quest')
    serializer_class = QuestCommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        quest_id = self.request.query_params.get('quest', None)
        if quest_id:
            return QuestComment.objects.filter(quest_id=quest_id).select_related('user')
        return QuestComment.objects.all().select_related('user')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        # Проверяем достижения (активность в комментариях)
        check_achievements(self.request.user)


# Лайки к выполненным квестам
class QuestLikeViewSet(viewsets.ModelViewSet):
    queryset = QuestLike.objects.all().select_related('user', 'quest_assignment')
    serializer_class = QuestLikeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        assignment_id = self.request.query_params.get('assignment', None)
        if assignment_id:
            return QuestLike.objects.filter(quest_assignment_id=assignment_id).select_related('user')
        return QuestLike.objects.all().select_related('user')
    
    def perform_create(self, serializer):
        assignment = serializer.validated_data['quest_assignment']
        # Проверяем, что квест выполнен
        if not assignment.is_completed:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Можно лайкать только выполненные квесты")
        
        # Проверяем, что пользователь не лайкал свой квест
        if assignment.user == self.request.user:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Нельзя лайкать свой квест")
        
        serializer.save(user=self.request.user)
        
        # Создаем уведомление автору квеста
        Notification.objects.create(
            user=assignment.user,
            title="Новый лайк!",
            body=f"{self.request.user.username} лайкнул ваш выполненный квест: {assignment.quest.title}",
            data={"quest_id": assignment.quest.id, "type": "quest_liked"}
        )
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return Response({'detail': 'Нет прав'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


# Посты в группах
class GroupPostViewSet(viewsets.ModelViewSet):
    queryset = GroupPost.objects.all().select_related('author', 'group')
    serializer_class = GroupPostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        group_id = self.request.query_params.get('group', None)
        if group_id:
            return GroupPost.objects.filter(group_id=group_id).select_related('author')
        return GroupPost.objects.all().select_related('author')
    
    def perform_create(self, serializer):
        group = serializer.validated_data['group']
        # Проверяем, что пользователь в группе
        if not group.members.filter(id=self.request.user.id).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Вы не состоите в этой группе")
        serializer.save(author=self.request.user)


# Комментарии к постам в группах
class GroupPostCommentViewSet(viewsets.ModelViewSet):
    queryset = GroupPostComment.objects.all().select_related('author', 'post')
    serializer_class = GroupPostCommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        post_id = self.request.query_params.get('post', None)
        if post_id:
            return GroupPostComment.objects.filter(post_id=post_id).select_related('author')
        return GroupPostComment.objects.all().select_related('author')
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


# Групповые цели
class GroupGoalViewSet(viewsets.ModelViewSet):
    queryset = GroupGoal.objects.all().select_related('group')
    serializer_class = GroupGoalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        group_id = self.request.query_params.get('group', None)
        if group_id:
            return GroupGoal.objects.filter(group_id=group_id)
        return GroupGoal.objects.all()
    
    @action(detail=True, methods=['post'])
    def contribute(self, request, pk=None):
        """Внести вклад в групповую цель"""
        goal = self.get_object()
        xp_amount = request.data.get('xp', 0)
        
        if not goal.group.members.filter(id=request.user.id).exists():
            return Response({'detail': 'Вы не в группе'}, status=status.HTTP_403_FORBIDDEN)
        
        goal.current_xp += xp_amount
        if goal.current_xp >= goal.target_xp and not goal.is_completed:
            goal.is_completed = True
            goal.completed_at = timezone.now()
            
            # Награждаем всех участников группы
            for member in goal.group.members.all():
                add_xp_to_user(member, 50, f"Групповая цель выполнена: {goal.title}")
                Notification.objects.create(
                    user=member,
                    title="Групповая цель выполнена!",
                    body=f"Группа {goal.group.name} выполнила цель: {goal.title}",
                    data={"goal_id": goal.id, "type": "group_goal_completed"}
                )
        
        goal.save()
        return Response(GroupGoalSerializer(goal).data)