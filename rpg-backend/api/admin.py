from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import *


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Game fields', {'fields': ('role', 'level', 'xp', 'coins', 'last_active', 'streak', 'last_activity_date', 'faculty', 'group_name')}),
    )

# Регистрация остальных моделей
admin.site.register(Profile)
admin.site.register(Course)
admin.site.register(Group)
admin.site.register(Quest)
admin.site.register(QuestAssignment)
admin.site.register(Achievement)
admin.site.register(AchievementProgress)
admin.site.register(Item)
admin.site.register(StoreItem)
admin.site.register(InventoryItem)
admin.site.register(EquippedItem)
admin.site.register(CurrencyTransaction)
admin.site.register(LeaderboardEntry)
admin.site.register(Notification)
admin.site.register(ActivityLog)
admin.site.register(FriendRequest)
admin.site.register(Message)
admin.site.register(QuestComment)
admin.site.register(QuestLike)
admin.site.register(GroupPost)
admin.site.register(GroupPostComment)
admin.site.register(GroupGoal)