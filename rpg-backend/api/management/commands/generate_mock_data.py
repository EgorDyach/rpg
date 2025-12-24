"""
Django management command для генерации моковых данных
Использование: python manage.py generate_mock_data [--users N] [--quests N] [--groups N]
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
import random

from api.models import (
    User, Profile, Course, Group, Quest, QuestAssignment,
    Achievement, AchievementProgress, QuestComment, QuestLike,
    GroupPost, GroupPostComment, GroupGoal, Notification
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Генерирует моковые данные для тестирования'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=20,
            help='Количество пользователей для создания (по умолчанию: 20)'
        )
        parser.add_argument(
            '--quests',
            type=int,
            default=50,
            help='Количество квестов для создания (по умолчанию: 50)'
        )
        parser.add_argument(
            '--groups',
            type=int,
            default=5,
            help='Количество групп для создания (по умолчанию: 5)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Очистить существующие данные перед генерацией'
        )

    def handle(self, *args, **options):
        users_count = options['users']
        quests_count = options['quests']
        groups_count = options['groups']
        clear = options['clear']

        if clear:
            self.stdout.write(self.style.WARNING('Очистка существующих данных...'))
            User.objects.filter(role='student').delete()
            Quest.objects.all().delete()
            Group.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Данные очищены'))

        self.stdout.write(self.style.SUCCESS('Начинаем генерацию моковых данных...'))

        # Генерация достижений
        self.generate_achievements()

        # Генерация курсов
        courses = self.generate_courses()

        # Генерация пользователей
        users = self.generate_users(users_count)

        # Генерация групп
        groups = self.generate_groups(groups_count, courses, users)

        # Генерация квестов
        quests = self.generate_quests(quests_count, users)

        # Генерация назначений квестов
        self.generate_quest_assignments(quests, users)

        # Генерация комментариев и лайков
        self.generate_social_interactions(users)

        # Генерация постов в группах
        self.generate_group_posts(groups, users)

        # Генерация групповых целей
        self.generate_group_goals(groups, users)

        self.stdout.write(self.style.SUCCESS(f'\n✅ Генерация завершена!'))
        self.stdout.write(f'   - Пользователей: {users_count}')
        self.stdout.write(f'   - Квестов: {quests_count}')
        self.stdout.write(f'   - Групп: {groups_count}')

    def generate_achievements(self):
        """Генерирует достижения"""
        achievements_data = [
            {
                'key': 'quests_completed_5',
                'title': 'Победитель дедлайнов',
                'description': 'Выполнил 5 квестов подряд',
                'xp_reward': 50,
                'coin_reward': 25,
            },
            {
                'key': 'streak_7',
                'title': 'Железный streak',
                'description': '7 дней активности подряд',
                'xp_reward': 100,
                'coin_reward': 50,
            },
            {
                'key': 'quests_created_10',
                'title': 'Мастер планирования',
                'description': 'Создал 10 квестов',
                'xp_reward': 75,
                'coin_reward': 30,
            },
            {
                'key': 'early_completion',
                'title': 'Уборщик прокрастинации',
                'description': 'Выполнил квест раньше дедлайна',
                'xp_reward': 30,
                'coin_reward': 15,
            },
            {
                'key': 'active_commenter',
                'title': 'Активный комментатор',
                'description': 'Оставил 10 комментариев',
                'xp_reward': 40,
                'coin_reward': 20,
            },
            {
                'key': 'group_challenge_participant',
                'title': 'Командный игрок',
                'description': 'Участвовал в групповом челлендже',
                'xp_reward': 60,
                'coin_reward': 25,
            },
        ]

        for ach_data in achievements_data:
            Achievement.objects.get_or_create(
                key=ach_data['key'],
                defaults=ach_data
            )

        self.stdout.write(self.style.SUCCESS(f'   ✓ Создано достижений: {len(achievements_data)}'))

    def generate_courses(self):
        """Генерирует курсы"""
        courses_data = [
            {'code': 'CS101', 'title': 'Введение в программирование'},
            {'code': 'CS201', 'title': 'Структуры данных и алгоритмы'},
            {'code': 'CS301', 'title': 'Веб-разработка'},
            {'code': 'MATH101', 'title': 'Математический анализ'},
            {'code': 'ENG101', 'title': 'Английский язык'},
        ]

        courses = []
        for course_data in courses_data:
            course, _ = Course.objects.get_or_create(
                code=course_data['code'],
                defaults=course_data
            )
            courses.append(course)

        self.stdout.write(self.style.SUCCESS(f'   ✓ Создано курсов: {len(courses)}'))
        return courses

    def generate_users(self, count):
        """Генерирует пользователей"""
        faculties = ['ИТ', 'Математика', 'Физика', 'Экономика', 'Лингвистика']
        groups = ['ИВТ-21', 'ИВТ-22', 'ПМИ-21', 'ПМИ-22', 'ЭК-21', 'ЭК-22']
        
        users = []
        for i in range(count):
            username = f'student{i+1}'
            email = f'student{i+1}@university.edu'
            
            if User.objects.filter(username=username).exists():
                continue
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password='password123',
                role='student',
                first_name=random.choice(['Иван', 'Мария', 'Алексей', 'Анна', 'Дмитрий', 'Елена', 'Сергей', 'Ольга']),
                last_name=random.choice(['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев']),
                faculty=random.choice(faculties),
                group_name=random.choice(groups),
                level=random.randint(1, 10),
                xp=random.randint(0, 5000),
                coins=random.randint(0, 1000),
                streak=random.randint(0, 15),
            )
            
            # Обновляем профиль
            if hasattr(user, 'profile'):
                user.profile.bio = f'Студент {user.faculty}, группа {user.group_name}'
                user.profile.save()
            
            users.append(user)
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Создано пользователей: {len(users)}'))
        return users

    def generate_groups(self, count, courses, users):
        """Генерирует группы"""
        group_names = [
            'Изучаем Python',
            'Веб-разработка',
            'Алгоритмы и структуры данных',
            'Машинное обучение',
            'Мобильная разработка',
            'Игровая разработка',
            'Кибербезопасность',
        ]
        
        groups = []
        for i in range(count):
            name = random.choice(group_names) if i < len(group_names) else f'Группа {i+1}'
            
            if Group.objects.filter(name=name).exists():
                continue
            
            group = Group.objects.create(
                name=name,
                description=f'Группа для изучения {name.lower()}',
                course=random.choice(courses) if courses else None,
                created_by=random.choice(users) if users else None,
                is_public=random.choice([True, True, True, False]),  # Больше публичных
            )
            
            # Добавляем участников
            members_count = random.randint(3, min(10, len(users)))
            members = random.sample(users, members_count)
            group.members.set(members)
            
            groups.append(group)
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Создано групп: {len(groups)}'))
        return groups

    def generate_quests(self, count, users):
        """Генерирует квесты"""
        quest_templates = [
            {
                'title': 'Изучить основы {topic}',
                'description': 'Изучить базовые концепции {topic}',
                'goal': 'Понять основные принципы {topic}',
            },
            {
                'title': 'Выполнить проект по {topic}',
                'description': 'Создать проект используя {topic}',
                'goal': 'Завершить проект и представить результат',
            },
            {
                'title': 'Решить задачи по {topic}',
                'description': 'Решить 10 задач по {topic}',
                'goal': 'Выполнить все задачи правильно',
            },
            {
                'title': 'Подготовиться к экзамену по {topic}',
                'description': 'Повторить материал по {topic}',
                'goal': 'Успешно сдать экзамен',
            },
        ]
        
        topics = [
            'Python', 'Django', 'JavaScript', 'React', 'Алгоритмы',
            'Базы данных', 'Веб-разработка', 'Машинное обучение',
            'Мобильная разработка', 'Кибербезопасность'
        ]
        
        quests = []
        for i in range(count):
            template = random.choice(quest_templates)
            topic = random.choice(topics)
            
            is_public = random.choice([True, True, False])  # Больше публичных
            creator = random.choice(users) if users else None
            
            deadline = timezone.now() + timedelta(days=random.randint(1, 30))
            
            quest = Quest.objects.create(
                title=template['title'].format(topic=topic),
                description=template['description'].format(topic=topic),
                goal=template['goal'].format(topic=topic),
                is_public=is_public,
                created_by=creator,
                difficulty=random.randint(1, 5),
                xp_reward=random.randint(10, 200),
                coin_reward=random.randint(5, 100),
                deadline=deadline if random.choice([True, False]) else None,
            )
            
            quests.append(quest)
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Создано квестов: {len(quests)}'))
        return quests

    def generate_quest_assignments(self, quests, users):
        """Генерирует назначения квестов"""
        assignments_count = 0
        completed_count = 0
        
        for quest in quests:
            # Для публичных квестов назначаем нескольким пользователям
            if quest.is_public:
                assignees = random.sample(users, random.randint(2, min(5, len(users))))
            else:
                # Для личных квестов только создатель
                if quest.created_by:
                    assignees = [quest.created_by]
                else:
                    continue
            
            for user in assignees:
                is_completed = random.choice([True, True, False])  # Больше выполненных
                
                assignment = QuestAssignment.objects.create(
                    quest=quest,
                    user=user,
                    is_completed=is_completed,
                    completed_at=timezone.now() - timedelta(days=random.randint(0, 7)) if is_completed else None,
                    xp_reward=quest.xp_reward,
                    coin_reward=quest.coin_reward,
                )
                
                assignments_count += 1
                if is_completed:
                    completed_count += 1
                    
                    # Обновляем XP и уровень пользователя
                    user.xp += quest.xp_reward
                    user.coins += quest.coin_reward
                    user.save()
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Создано назначений: {assignments_count} (выполнено: {completed_count})'))

    def generate_social_interactions(self, users):
        """Генерирует комментарии и лайки"""
        # Комментарии к публичным квестам
        public_quests = Quest.objects.filter(is_public=True)
        comments_count = 0
        
        for quest in public_quests[:20]:  # Ограничиваем количество
            commenters = random.sample(users, random.randint(1, min(5, len(users))))
            for user in commenters:
                QuestComment.objects.create(
                    quest=quest,
                    user=user,
                    text=random.choice([
                        'Отличный квест!',
                        'Интересная задача',
                        'Спасибо за идею!',
                        'Попробую выполнить',
                        'Уже начал работать над этим',
                    ])
                )
                comments_count += 1
        
        # Лайки выполненных квестов
        completed_assignments = QuestAssignment.objects.filter(is_completed=True)
        likes_count = 0
        
        for assignment in completed_assignments[:30]:  # Ограничиваем
            if assignment.user not in users:
                continue
            
            likers = random.sample(
                [u for u in users if u != assignment.user],
                random.randint(0, min(3, len(users) - 1))
            )
            
            for user in likers:
                QuestLike.objects.get_or_create(
                    quest_assignment=assignment,
                    user=user
                )
                likes_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Создано комментариев: {comments_count}, лайков: {likes_count}'))

    def generate_group_posts(self, groups, users):
        """Генерирует посты в группах"""
        posts_count = 0
        comments_count = 0
        
        for group in groups:
            # Создаем несколько постов в каждой группе
            for _ in range(random.randint(2, 5)):
                author = random.choice([u for u in users if u in group.members.all()])
                if not author:
                    continue
                
                post = GroupPost.objects.create(
                    group=group,
                    author=author,
                    text=random.choice([
                        'Привет! Кто-нибудь хочет вместе изучать эту тему?',
                        'Нашел интересный ресурс, делюсь с вами',
                        'Вопрос по заданию, может кто поможет?',
                        'Отличная идея для проекта!',
                        'Кто уже выполнил это задание?',
                    ])
                )
                posts_count += 1
                
                # Добавляем комментарии к постам
                commenters = random.sample(
                    [u for u in users if u in group.members.all() and u != author],
                    random.randint(0, min(3, len(group.members.all()) - 1))
                )
                
                for commenter in commenters:
                    GroupPostComment.objects.create(
                        post=post,
                        author=commenter,
                        text=random.choice(['Согласен!', 'Интересно', 'Спасибо за информацию'])
                    )
                    comments_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Создано постов: {posts_count}, комментариев: {comments_count}'))

    def generate_group_goals(self, groups, users):
        """Генерирует групповые цели"""
        goals_count = 0
        
        for group in groups:
            if random.choice([True, False]):  # 50% групп имеют цели
                goal = GroupGoal.objects.create(
                    group=group,
                    title=random.choice([
                        'Изучить основы темы',
                        'Выполнить групповой проект',
                        'Решить все задачи',
                        'Подготовиться к экзамену',
                    ]),
                    description='Групповая цель для мотивации',
                    target_xp=random.randint(500, 2000),
                    current_xp=random.randint(0, 1500),
                    deadline=timezone.now() + timedelta(days=random.randint(7, 30)),
                )
                
                if goal.current_xp >= goal.target_xp:
                    goal.is_completed = True
                    goal.completed_at = timezone.now() - timedelta(days=random.randint(1, 7))
                    goal.save()
                
                goals_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'   ✓ Создано групповых целей: {goals_count}'))



