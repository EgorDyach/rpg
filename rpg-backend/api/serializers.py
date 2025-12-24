from rest_framework import serializers
from .models import (
    User, Profile, Course, Group, Quest, QuestAssignment, Achievement,
    AchievementProgress, Item, StoreItem, InventoryItem, EquippedItem,
    CurrencyTransaction, LeaderboardEntry, Notification, ActivityLog,
    FriendRequest, Message, QuestComment, QuestLike, GroupPost,
    GroupPostComment, GroupGoal
)
from .utils import filter_profanity


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['avatar', 'bio', 'cosmetics']
    
    def validate_bio(self, value):
        return filter_profanity(value) if value else value


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        exclude = ('password',)
        read_only_fields = ('xp', 'coins', 'level', 'streak')


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'faculty', 'group_name', 'first_name', 'last_name')

    def create(self, validated_data):
        pwd = validated_data.pop('password')
        # По умолчанию создаем студента, если роль не указана
        if 'role' not in validated_data or not validated_data['role']:
            validated_data['role'] = 'student'
        user = User(**validated_data)
        user.set_password(pwd)
        user.save()
        return user


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'
    
    def validate_title(self, value):
        return filter_profanity(value)
    
    def validate_description(self, value):
        return filter_profanity(value) if value else value


class GroupSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    members_count = serializers.IntegerField(source='members.count', read_only=True)
    is_member = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at',)
    
    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False
    
    def validate_name(self, value):
        return filter_profanity(value)
    
    def validate_description(self, value):
        return filter_profanity(value) if value else value


class QuestSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)
    
    class Meta:
        model = Quest
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')
    
    def validate_title(self, value):
        return filter_profanity(value)
    
    def validate_description(self, value):
        return filter_profanity(value) if value else value
    
    def validate_goal(self, value):
        return filter_profanity(value) if value else value


class QuestAssignmentSerializer(serializers.ModelSerializer):
    quest_title = serializers.CharField(source='quest.title', read_only=True)
    quest_description = serializers.CharField(source='quest.description', read_only=True)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestAssignment
        fields = '__all__'
        read_only_fields = ('user', 'xp_reward', 'coin_reward', 'created_at', 'completed_at')
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return QuestLike.objects.filter(quest_assignment=obj, user=request.user).exists()
        return False


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'


class AchievementProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = AchievementProgress
        fields = '__all__'
        read_only_fields = ('user', 'achieved_at')


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'
    
    def validate_name(self, value):
        return filter_profanity(value)
    
    def validate_description(self, value):
        return filter_profanity(value) if value else value


class StoreItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)

    class Meta:
        model = StoreItem
        fields = '__all__'


class InventoryItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ('user', 'acquired_at')


class EquippedItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    
    class Meta:
        model = EquippedItem
        fields = '__all__'
        read_only_fields = ('user', 'equipped_at')


class CurrencyTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurrencyTransaction
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = LeaderboardEntry
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('user', 'created_at')
    
    def validate_title(self, value):
        return filter_profanity(value)
    
    def validate_body(self, value):
        return filter_profanity(value) if value else value


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user_username = serializers.CharField(source='from_user.username', read_only=True)
    to_user_username = serializers.CharField(source='to_user.username', read_only=True)
    
    class Meta:
        model = FriendRequest
        fields = '__all__'
        read_only_fields = ('from_user', 'created_at')


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('sender', 'created_at')
    
    def validate_text(self, value):
        return filter_profanity(value)


class QuestCommentSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = QuestComment
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
    
    def validate_text(self, value):
        return filter_profanity(value)


class QuestLikeSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = QuestLike
        fields = '__all__'
        read_only_fields = ('user', 'created_at')


class GroupPostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    comments_count = serializers.IntegerField(source='comments.count', read_only=True)
    
    class Meta:
        model = GroupPost
        fields = '__all__'
        read_only_fields = ('author', 'created_at', 'updated_at')
    
    def validate_text(self, value):
        return filter_profanity(value)


class GroupPostCommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source='author.username', read_only=True)
    
    class Meta:
        model = GroupPostComment
        fields = '__all__'
        read_only_fields = ('author', 'created_at', 'updated_at')
    
    def validate_text(self, value):
        return filter_profanity(value)


class GroupGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupGoal
        fields = '__all__'
        read_only_fields = ('created_at', 'completed_at')
    
    def validate_title(self, value):
        return filter_profanity(value)
    
    def validate_description(self, value):
        return filter_profanity(value) if value else value