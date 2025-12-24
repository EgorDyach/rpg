from django.utils import timezone
from datetime import date, timedelta
from .models import User, QuestAssignment, Achievement, AchievementProgress, Notification, CurrencyTransaction, GroupGoal
from django.db.models import Q, Sum, Count, F
from django.db import transaction
import re


def calculate_xp_for_level(level):
    """
    Вычисляет необходимое количество XP для достижения уровня.
    
    Args:
        level: Целевой уровень
        
    Returns:
        int: Количество XP, необходимое для достижения уровня
        
    Formula:
        base_xp * (level ^ 1.5), где base_xp = 100
    """
    # Формула: базовый XP * (уровень ^ 1.5)
    base_xp = 100
    return int(base_xp * (level ** 1.5))


def add_xp_to_user(user, xp_amount, reason="", meta=None):
    """
    Добавляет XP пользователю и автоматически повышает уровень при необходимости.
    
    При достижении необходимого XP уровень повышается, остаток XP сохраняется.
    Создает уведомление о повышении уровня и записывает транзакцию.
    
    Args:
        user: Объект пользователя
        xp_amount: Количество XP для добавления
        reason: Причина начисления XP (для транзакции)
        meta: Дополнительные метаданные для транзакции
        
    Returns:
        int: Новый уровень пользователя
    """
    user.xp += xp_amount
    
    # Проверяем, нужно ли повысить уровень
    while True:
        xp_needed = calculate_xp_for_level(user.level)
        if user.xp >= xp_needed:
            user.xp -= xp_needed
            user.level += 1
            # Создаем уведомление о повышении уровня
            Notification.objects.create(
                user=user,
                title="Повышение уровня!",
                body=f"Поздравляем! Вы достигли {user.level} уровня!",
                data={"level": user.level, "type": "level_up"}
            )
        else:
            break
    
    user.save()
    
    # Записываем транзакцию
    CurrencyTransaction.objects.create(
        user=user,
        delta=xp_amount,
        reason=reason or "Начисление XP",
        meta=meta or {}
    )
    
    return user.level


def update_streak(user):
    """
    Обновляет streak (серию дней активности) пользователя.
    
    Streak увеличивается, если пользователь активен каждый день подряд.
    Прерывается, если пропущен хотя бы один день.
    
    Args:
        user: Объект пользователя
        
    Returns:
        int: Текущее значение streak
    """
    today = date.today()
    
    if user.last_activity_date is None:
        # Первая активность
        user.last_activity_date = today
        user.streak = 1
    elif user.last_activity_date == today:
        # Уже активен сегодня
        pass
    elif user.last_activity_date == today - timedelta(days=1):
        # Продолжение streak
        user.streak += 1
        user.last_activity_date = today
    else:
        # Streak прерван
        user.streak = 1
        user.last_activity_date = today
    
    user.save()
    return user.streak


def check_achievements(user):
    """
    Проверяет критерии достижений и начисляет их пользователю.
    
    Проверяет различные критерии:
    - 5 выполненных квестов подряд
    - 7-дневный streak
    - Создание 10 квестов
    - Выполнение цели раньше дедлайна
    - Активность в комментариях
    - Участие в групповых челленджах
    
    При получении достижения начисляет награды (XP и монеты) и создает уведомление.
    
    Args:
        user: Объект пользователя
        
    Returns:
        list: Список новых полученных достижений
    """
    achievements = Achievement.objects.all()
    new_achievements = []
    
    for achievement in achievements:
        progress_obj, created = AchievementProgress.objects.get_or_create(
            achievement=achievement,
            user=user
        )
        
        if progress_obj.achieved:
            continue
        
        # Проверяем критерии достижения
        criteria = achievement.criteria
        achieved = False
        
        if achievement.key == "quests_completed_5":
            # 5 выполненных квестов подряд
            recent_completed = QuestAssignment.objects.filter(
                user=user,
                is_completed=True
            ).order_by('-completed_at')[:5]
            if recent_completed.count() == 5:
                # Проверяем, что они выполнены подряд (в течение 5 дней)
                dates = [qa.completed_at.date() for qa in recent_completed if qa.completed_at]
                if len(dates) == 5:
                    dates_sorted = sorted(dates, reverse=True)
                    is_consecutive = all(
                        dates_sorted[i] == dates_sorted[i+1] + timedelta(days=1)
                        for i in range(4)
                    )
                    if is_consecutive:
                        achieved = True
        
        elif achievement.key == "streak_7":
            # 7-дневный streak
            if user.streak >= 7:
                achieved = True
        
        elif achievement.key == "quests_created_10":
            # Создание 10 квестов
            created_count = user.created_quests.count()
            if created_count >= 10:
                achieved = True
        
        elif achievement.key == "early_completion":
            # Выполнение цели раньше дедлайна
            early_completions = QuestAssignment.objects.filter(
                user=user,
                is_completed=True,
                quest__deadline__isnull=False
            ).filter(
                completed_at__lt=F('quest__deadline')
            )
            if early_completions.exists():
                achieved = True
        
        elif achievement.key == "active_commenter":
            # Активность в комментариях (10+ комментариев)
            comments_count = user.quest_comments.count()
            if comments_count >= 10:
                achieved = True
        
        elif achievement.key == "group_challenge_participant":
            # Участие в групповых челленджах
            group_goals = GroupGoal.objects.filter(
                group__members=user,
                is_completed=True
            )
            if group_goals.exists():
                achieved = True
        
        if achieved:
            progress_obj.achieved = True
            progress_obj.achieved_at = timezone.now()
            progress_obj.save()
            
            # Начисляем награды
            if achievement.xp_reward > 0:
                add_xp_to_user(user, achievement.xp_reward, f"Достижение: {achievement.title}")
            
            if achievement.coin_reward > 0:
                user.coins += achievement.coin_reward
                user.save()
                CurrencyTransaction.objects.create(
                    user=user,
                    delta=achievement.coin_reward,
                    reason=f"Достижение: {achievement.title}",
                    meta={"achievement_id": achievement.id}
                )
            
            # Создаем уведомление
            Notification.objects.create(
                user=user,
                title="Новое достижение!",
                body=f"Вы получили достижение: {achievement.title}",
                data={"achievement_id": achievement.id, "achievement_title": achievement.title, "type": "achievement"}
            )
            
            new_achievements.append(achievement)
    
    return new_achievements


def get_leaderboard(period="all", faculty=None, group_name=None):
    """
    Возвращает рейтинг пользователей.
    
    Поддерживает фильтрацию по периоду (все время, неделя, месяц),
    факультету и группе. Для периодов "week" и "month" сортировка
    происходит по XP, полученному за этот период.
    
    Args:
        period: Период для рейтинга ("all", "week", "month")
        faculty: Фильтр по факультету (опционально)
        group_name: Фильтр по группе (опционально)
        
    Returns:
        list: Список пользователей, отсортированных по рейтингу (максимум 100)
    """
    queryset = User.objects.filter(role="student")
    
    if faculty:
        queryset = queryset.filter(faculty=faculty)
    if group_name:
        queryset = queryset.filter(group_name=group_name)
    
    if period == "week":
        week_ago = timezone.now() - timedelta(days=7)
        # Получаем XP за неделю из транзакций
        user_xp = CurrencyTransaction.objects.filter(
            created_at__gte=week_ago,
            delta__gt=0
        ).values('user').annotate(
            week_xp=Sum('delta')
        )
        # Создаем словарь для быстрого доступа
        xp_dict = {item['user']: item['week_xp'] for item in user_xp}
        # Сортируем по XP за неделю
        queryset_list = sorted(list(queryset), key=lambda u: xp_dict.get(u.id, 0), reverse=True)
        return queryset_list[:100]
    
    elif period == "month":
        month_ago = timezone.now() - timedelta(days=30)
        user_xp = CurrencyTransaction.objects.filter(
            created_at__gte=month_ago,
            delta__gt=0
        ).values('user').annotate(
            month_xp=Sum('delta')
        )
        xp_dict = {item['user']: item['month_xp'] for item in user_xp}
        queryset_list = sorted(list(queryset), key=lambda u: xp_dict.get(u.id, 0), reverse=True)
        return queryset_list[:100]
    
    # По умолчанию сортируем по уровню и XP, преобразуем в список
    queryset = queryset.order_by('-level', '-xp')[:100]
    return list(queryset)


def get_user_rank(user, period="all", faculty=None, group_name=None):
    """
    Возвращает место пользователя в рейтинге.
    
    Args:
        user: Объект пользователя
        period: Период для рейтинга ("all", "week", "month")
        faculty: Фильтр по факультету (опционально)
        group_name: Фильтр по группе (опционально)
        
    Returns:
        int: Место в рейтинге (1-based) или None, если пользователь не найден
    """
    leaderboard = get_leaderboard(period, faculty, group_name)
    # Преобразуем в список, если это QuerySet
    if not isinstance(leaderboard, list):
        leaderboard = list(leaderboard)
    
    # Ищем индекс пользователя по ID
    try:
        for idx, leaderboard_user in enumerate(leaderboard):
            if leaderboard_user.id == user.id:
                return idx + 1
        return None
    except (ValueError, AttributeError):
        return None


# Список плохих слов для фильтрации
BAD_WORDS = [
    # Русские плохие слова
    'дурак', 'идиот', 'тупой', 'дебил', 'придурок', 'болван', 'олух',
    'кретин', 'даун', 'мразь', 'гад', 'подонок', 'ублюдок', 'сука',
    'блядь', 'блять', 'бля', 'хуй', 'хуйня', 'пизда', 'пиздец', 'ебан',
    'еблан', 'ебать', 'ебанный', 'ебнутый', 'заебись', 'ебануться',
    'ебаный', 'ебля', 'еблище', 'ебануть', 'выебываться', 'охуеть',
    'охуенный', 'похуй', 'нахрен', 'нахуй', 'нахера', 'хуйню', 'хуевый',
    'пиздец', 'пиздатый', 'пиздос', 'пиздобол', 'пиздюк', 'пиздюля',
    'трахать', 'трахнуть', 'выебать', 'выебан', 'выебываться',
    # Английские плохие слова
    'stupid', 'idiot', 'fool', 'dumb', 'damn', 'hell', 'crap', 'shit',
    'fuck', 'fucking', 'fucked', 'motherfucker', 'bitch', 'bastard',
    'ass', 'asshole', 'piss', 'pissed', 'dick', 'cock', 'pussy',
    # Можно добавить больше слов по мере необходимости
]


def filter_profanity(text):
    """
    Фильтрует плохие слова в тексте, заменяя их на звездочки
    
    Args:
        text: Текст для фильтрации
        
    Returns:
        Отфильтрованный текст
    """
    if not text or not isinstance(text, str):
        return text
    
    filtered_text = text
    
    # Заменяем каждое плохое слово на звездочки
    for bad_word in BAD_WORDS:
        # Создаем паттерн для поиска слова с учетом границ слов и игнорируем регистр
        pattern = r'\b' + re.escape(bad_word) + r'\b'
        
        # Ищем все вхождения (case-insensitive)
        matches = list(re.finditer(pattern, filtered_text, re.IGNORECASE))
        
        # Заменяем каждое вхождение на звездочки, начиная с конца (для сохранения индексов)
        for match in reversed(matches):
            start, end = match.span()
            original_word = filtered_text[start:end]
            replacement = '*' * len(original_word)
            filtered_text = filtered_text[:start] + replacement + filtered_text[end:]
    
    return filtered_text

