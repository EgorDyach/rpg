from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    """
    Расширенная модель пользователя Django.
    
    Добавляет игровые поля: уровень, опыт (XP), монеты, streak (серия дней активности).
    Поддерживает роли: студент и администратор.
    
    Attributes:
        role: Роль пользователя (student/admin)
        level: Текущий уровень игрока
        xp: Накопленный опыт
        coins: Количество монет
        streak: Серия дней активности без пропусков
        last_activity_date: Последний день активности
        faculty: Факультет студента
        group_name: Название группы студента
    """
    ROLE_CHOICES = [
        ("student", "Студент"),
        ("admin", "Администратор"),
    ]

    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="student")
    level = models.PositiveIntegerField(default=1)
    xp = models.PositiveIntegerField(default=0)
    coins = models.PositiveIntegerField(default=0)
    last_active = models.DateTimeField(null=True, blank=True)
    streak = models.PositiveIntegerField(default=0)  # Серия дней без пропуска
    last_activity_date = models.DateField(null=True, blank=True)  # Последний день активности
    faculty = models.CharField(max_length=255, blank=True)  # Факультет
    group_name = models.CharField(max_length=255, blank=True)  # Группа

    class Meta:
        indexes = [models.Index(fields=["-xp", "-coins"]), models.Index(fields=["-level"])]

    def __str__(self):
        return self.get_full_name() or self.username


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    avatar = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True)
    cosmetics = models.JSONField(default=dict, blank=True)
    titles = models.JSONField(default=list, blank=True)  # Список титулов/достижений


class Course(models.Model):
    title = models.CharField(max_length=255)
    code = models.CharField(max_length=32, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.code} — {self.title}"


class Group(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="groups", null=True, blank=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="user_groups")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_groups")
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=True)  # Публичная группа или приватная

    class Meta:
        unique_together = ("name", "course")

    def __str__(self):
        return self.name


class Quest(models.Model):
    """
    Модель квеста (задания).
    
    Квест может быть личным (доступен только создателю) или публичным (доступен всем).
    При выполнении квеста пользователь получает XP и монеты.
    
    Attributes:
        title: Название квеста
        description: Описание квеста
        goal: Цель квеста
        is_daily: Является ли квест ежедневным
        is_public: Публичный или личный квест
        created_by: Создатель квеста
        deadline: Дедлайн выполнения
        difficulty: Сложность (1-5)
        xp_reward: Награда в опыте
        coin_reward: Награда в монетах
    """
    DIFFICULTY_CHOICES = [(1, "Очень лёгкое"), (2, "Лёгкое"), (3, "Среднее"), (4, "Тяжёлое"), (5, "Эпическое")]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    goal = models.TextField(blank=True)  # Цель квеста
    is_daily = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)  # Публичный квест (доступен другим) или личный
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_quests", null=True, blank=True)
    active_from = models.DateTimeField(null=True, blank=True)
    active_to = models.DateTimeField(null=True, blank=True)
    deadline = models.DateTimeField(null=True, blank=True)  # Дедлайн квеста
    difficulty = models.PositiveSmallIntegerField(choices=DIFFICULTY_CHOICES, default=3)

    xp_reward = models.PositiveIntegerField(default=10)
    coin_reward = models.PositiveIntegerField(default=5)
    meta = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["is_daily", "difficulty"]), models.Index(fields=["is_public", "created_by"])]

    def __str__(self):
        return self.title


class QuestAssignment(models.Model):
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE, related_name="assignments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quest_assignments")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, null=True, blank=True, related_name="quest_assignments")

    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.PositiveIntegerField(default=0)
    due_date = models.DateField(null=True, blank=True)

    xp_reward = models.PositiveIntegerField(default=0)
    coin_reward = models.PositiveIntegerField(default=0)
    needs_review = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "is_completed"])]
        unique_together = ("quest", "user", "due_date")


class Achievement(models.Model):
    key = models.CharField(max_length=128, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    xp_reward = models.PositiveIntegerField(default=0)
    coin_reward = models.PositiveIntegerField(default=0)
    criteria = models.JSONField(default=dict)

    def __str__(self):
        return self.title


class AchievementProgress(models.Model):
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name="progress")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="achievements_progress")
    achieved = models.BooleanField(default=False)
    progress = models.JSONField(default=dict, blank=True)
    achieved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("achievement", "user")


class Item(models.Model):
    ITEM_TYPE = [("cosmetic", "Cosmetic"), ("consumable", "Consumable"), ("boost", "Boost"), ("other", "Other")]

    sku = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    item_type = models.CharField(max_length=32, choices=ITEM_TYPE, default="cosmetic")
    properties = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class StoreItem(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="store_entries")
    price = models.PositiveIntegerField()
    stock = models.IntegerField(null=True, blank=True)
    purchase_limit = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [models.Index(fields=["price"])]


class InventoryItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="inventory")
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    acquired_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    data = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ("user", "item")


class EquippedItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="equipped")
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    slot = models.CharField(max_length=64)
    equipped_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "slot")


class CurrencyTransaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions")
    delta = models.IntegerField()
    reason = models.CharField(max_length=255)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "-created_at"])]


class LeaderboardEntry(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="leaderboard_entry")
    score = models.BigIntegerField(default=0)
    rank = models.PositiveIntegerField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["-score"])]


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class ActivityLog(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    verb = models.CharField(max_length=128)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class FriendRequest(models.Model):
    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_friend_requests")
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_friend_requests")
    status = models.CharField(max_length=16, choices=[("pending", "pending"), ("accepted", "accepted"), ("rejected", "rejected")], default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("from_user", "to_user")


class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_messages")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)


# Комментарии к квестам
class QuestComment(models.Model):
    quest = models.ForeignKey(Quest, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quest_comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


# Лайки к выполненным квестам
class QuestLike(models.Model):
    quest_assignment = models.ForeignKey(QuestAssignment, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quest_likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("quest_assignment", "user")


# Посты в группах (wall-посты)
class GroupPost(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="posts")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="group_posts")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


# Комментарии к постам в группах
class GroupPostComment(models.Model):
    post = models.ForeignKey(GroupPost, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="group_post_comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']


# Групповые цели (опционально для MVP)
class GroupGoal(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="goals")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    target_xp = models.PositiveIntegerField(default=0)
    current_xp = models.PositiveIntegerField(default=0)
    deadline = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)