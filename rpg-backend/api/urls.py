from rest_framework import routers
from django.urls import path, include
from .views import (
    UserViewSet, CourseViewSet, GroupViewSet, QuestViewSet,
    QuestAssignmentViewSet, AchievementViewSet, AchievementProgressViewSet,
    ItemViewSet, StoreItemViewSet, InventoryItemViewSet, EquippedItemViewSet,
    LeaderboardViewSet, NotificationViewSet, ActivityLogViewSet, 
    FriendRequestViewSet, MessageViewSet, QuestCommentViewSet, QuestLikeViewSet, 
    GroupPostViewSet, GroupPostCommentViewSet, GroupGoalViewSet
)

router = routers.DefaultRouter()
router.register('users', UserViewSet)
router.register('courses', CourseViewSet)
router.register('groups', GroupViewSet)
router.register('quests', QuestViewSet)
router.register('assignments', QuestAssignmentViewSet)
router.register('achievements', AchievementViewSet)
router.register('achievement-progress', AchievementProgressViewSet)
router.register('items', ItemViewSet)
router.register('store-items', StoreItemViewSet)
router.register('inventory', InventoryItemViewSet)
router.register('equipped', EquippedItemViewSet)
router.register('leaderboard', LeaderboardViewSet, basename='leaderboard')
router.register('notifications', NotificationViewSet)
router.register('activity', ActivityLogViewSet)
router.register('friend-requests', FriendRequestViewSet)
router.register('messages', MessageViewSet)
router.register('quest-comments', QuestCommentViewSet, basename='quest-comments')
router.register('quest-likes', QuestLikeViewSet, basename='quest-likes')
router.register('group-posts', GroupPostViewSet, basename='group-posts')
router.register('group-post-comments', GroupPostCommentViewSet, basename='group-post-comments')
router.register('group-goals', GroupGoalViewSet, basename='group-goals')

urlpatterns = [
    path('', include(router.urls)),
]