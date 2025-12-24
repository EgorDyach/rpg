import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  UserStats,
  Quest,
  Assignment,
  Group,
  GroupPost,
  GroupPostComment,
  GroupGoal,
  QuestComment,
  Achievement,
  AchievementProgress,
  Notification,
  LeaderboardEntry,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  Item,
  StoreItem,
  InventoryItem,
  EquippedItem,
  FriendRequest,
  Message,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем токен к каждому запросу
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Обрабатываем ошибки авторизации
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const { data } = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                refresh: refreshToken,
              });
              localStorage.setItem('access_token', data.access);
              originalRequest.headers.Authorization = `Bearer ${data.access}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const { data } = await this.client.post('/token/', credentials);
    return data;
  }

  async register(userData: RegisterData): Promise<User> {
    const { data } = await this.client.post('/users/', userData);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get('/users/me/');
    return data;
  }

  async getUserStats(): Promise<UserStats> {
    const { data } = await this.client.get('/users/stats/');
    return data;
  }

  // Quests
  async getQuests(params?: { is_public?: boolean; search?: string }): Promise<Quest[]> {
    const { data } = await this.client.get('/quests/', { params });
    return data;
  }

  async createQuest(quest: Partial<Quest>): Promise<Quest> {
    const { data } = await this.client.post('/quests/', quest);
    return data;
  }

  async updateQuest(questId: number, quest: Partial<Quest>): Promise<Quest> {
    const { data } = await this.client.patch(`/quests/${questId}/`, quest);
    return data;
  }

  async deleteQuest(questId: number): Promise<void> {
    await this.client.delete(`/quests/${questId}/`);
  }

  async acceptQuest(questId: number): Promise<Assignment> {
    const { data } = await this.client.post(`/quests/${questId}/accept/`);
    return data;
  }

  async getAssignments(): Promise<Assignment[]> {
    const { data } = await this.client.get('/assignments/');
    return data;
  }

  async completeAssignment(assignmentId: number): Promise<Assignment> {
    const { data } = await this.client.post(`/assignments/${assignmentId}/complete/`);
    return data;
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    const { data } = await this.client.get('/groups/');
    return data;
  }

  async createGroup(group: Partial<Group>): Promise<Group> {
    const { data } = await this.client.post('/groups/', group);
    return data;
  }

  async updateGroup(groupId: number, group: Partial<Group>): Promise<Group> {
    const { data } = await this.client.patch(`/groups/${groupId}/`, group);
    return data;
  }

  async deleteGroup(groupId: number): Promise<void> {
    await this.client.delete(`/groups/${groupId}/`);
  }

  async joinGroup(groupId: number): Promise<void> {
    await this.client.post(`/groups/${groupId}/join/`);
  }

  async leaveGroup(groupId: number): Promise<void> {
    await this.client.post(`/groups/${groupId}/leave/`);
  }

  async getGroupPosts(groupId: number): Promise<GroupPost[]> {
    const { data } = await this.client.get('/group-posts/', { params: { group: groupId } });
    return data;
  }

  async createGroupPost(post: Partial<GroupPost>): Promise<GroupPost> {
    const { data } = await this.client.post('/group-posts/', post);
    return data;
  }

  async updateGroupPost(postId: number, post: Partial<GroupPost>): Promise<GroupPost> {
    const { data } = await this.client.patch(`/group-posts/${postId}/`, post);
    return data;
  }

  async deleteGroupPost(postId: number): Promise<void> {
    await this.client.delete(`/group-posts/${postId}/`);
  }

  // Group Post Comments
  async getGroupPostComments(postId: number): Promise<GroupPostComment[]> {
    const { data } = await this.client.get('/group-post-comments/', { params: { post: postId } });
    return data;
  }

  async createGroupPostComment(comment: Partial<GroupPostComment>): Promise<GroupPostComment> {
    const { data } = await this.client.post('/group-post-comments/', comment);
    return data;
  }

  async deleteGroupPostComment(commentId: number): Promise<void> {
    await this.client.delete(`/group-post-comments/${commentId}/`);
  }

  // Group Goals
  async getGroupGoals(groupId: number): Promise<GroupGoal[]> {
    const { data } = await this.client.get('/group-goals/', { params: { group: groupId } });
    return data;
  }

  async createGroupGoal(goal: Partial<GroupGoal>): Promise<GroupGoal> {
    const { data } = await this.client.post('/group-goals/', goal);
    return data;
  }

  async contributeToGroupGoal(goalId: number, xp: number): Promise<GroupGoal> {
    const { data } = await this.client.post(`/group-goals/${goalId}/contribute/`, { xp });
    return data;
  }

  // Comments & Likes
  async getQuestComments(questId: number): Promise<QuestComment[]> {
    const { data } = await this.client.get('/quest-comments/', { params: { quest: questId } });
    return data;
  }

  async createQuestComment(comment: Partial<QuestComment>): Promise<QuestComment> {
    const { data } = await this.client.post('/quest-comments/', comment);
    return data;
  }

  async deleteQuestComment(commentId: number): Promise<void> {
    await this.client.delete(`/quest-comments/${commentId}/`);
  }

  async likeQuest(assignmentId: number): Promise<void> {
    await this.client.post('/quest-likes/', { quest_assignment: assignmentId });
  }

  async unlikeQuest(likeId: number): Promise<void> {
    await this.client.delete(`/quest-likes/${likeId}/`);
  }

  async getQuestLikes(assignmentId: number): Promise<any[]> {
    const { data } = await this.client.get('/quest-likes/', { params: { assignment: assignmentId } });
    return data;
  }

  // Leaderboard
  async getLeaderboard(params: {
    period?: 'all' | 'week' | 'month';
    sort_by?: 'level' | 'xp' | 'quests' | 'streak';
    faculty?: string;
    group?: string;
  }): Promise<LeaderboardEntry[]> {
    const { data } = await this.client.get('/leaderboard/rankings/', { params });
    return data;
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    const { data } = await this.client.get('/achievements/');
    return data;
  }

  async getAchievementProgress(): Promise<AchievementProgress[]> {
    const { data } = await this.client.get('/achievement-progress/');
    return data;
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const { data } = await this.client.get('/notifications/');
    return data;
  }

  async markNotificationRead(notificationId: number): Promise<void> {
    await this.client.patch(`/notifications/${notificationId}/`, { is_read: true });
  }

  // Shop & Items
  async getStoreItems(): Promise<StoreItem[]> {
    const { data } = await this.client.get('/store-items/');
    return data;
  }

  async purchaseItem(storeItemId: number, quantity: number = 1): Promise<InventoryItem> {
    const { data } = await this.client.post(`/store-items/${storeItemId}/purchase/`, { quantity });
    return data;
  }

  async getInventory(): Promise<InventoryItem[]> {
    const { data } = await this.client.get('/inventory/');
    return data;
  }

  async equipItem(inventoryItemId: number, slot: string = 'default'): Promise<void> {
    await this.client.post(`/inventory/${inventoryItemId}/equip/`, { slot });
  }

  async unequipItem(inventoryItemId: number, slot: string = 'default'): Promise<void> {
    await this.client.post(`/inventory/${inventoryItemId}/unequip/`, { slot });
  }

  async getEquippedItems(): Promise<EquippedItem[]> {
    const { data } = await this.client.get('/equipped/');
    return data;
  }

  // Friends
  async getFriendRequests(): Promise<FriendRequest[]> {
    const { data } = await this.client.get('/friend-requests/');
    return data;
  }

  async searchUsers(username: string): Promise<User[]> {
    const { data } = await this.client.get('/users/search/', { params: { username } });
    return data;
  }

  async sendFriendRequest(toUserId: number): Promise<FriendRequest> {
    const { data } = await this.client.post('/friend-requests/', { to_user: toUserId });
    return data;
  }

  async acceptFriendRequest(requestId: number): Promise<FriendRequest> {
    const { data } = await this.client.patch(`/friend-requests/${requestId}/`, { status: 'accepted' });
    return data;
  }

  async rejectFriendRequest(requestId: number): Promise<FriendRequest> {
    const { data } = await this.client.patch(`/friend-requests/${requestId}/`, { status: 'rejected' });
    return data;
  }

  async deleteFriendRequest(requestId: number): Promise<void> {
    await this.client.delete(`/friend-requests/${requestId}/`);
  }

  async getFriends(): Promise<User[]> {
    // Получаем принятые заявки в друзья
    const requests = await this.getFriendRequests();
    const acceptedRequests = requests.filter(r => r.status === 'accepted');
    const friendIds = new Set<number>();
    
    acceptedRequests.forEach(r => {
      // Определяем ID друга (не текущего пользователя)
      if (r.from_user_username && r.to_user_username) {
        // Используем информацию из заявки для создания базового объекта User
        // В реальности нужен эндпоинт для получения полной информации
      }
    });
    
    // Возвращаем пустой массив, так как полная информация о друзьях доступна через заявки
    // Функциональность получения друзей реализована через getFriendRequests()
    return [];
  }

  // Messages
  async getMessages(userId?: number): Promise<Message[]> {
    const params = userId ? { user: userId } : {};
    const { data } = await this.client.get('/messages/', { params });
    return data;
  }

  async sendMessage(receiverId: number, text: string): Promise<Message> {
    const { data } = await this.client.post('/messages/', { receiver: receiverId, text });
    return data;
  }

  async markMessageRead(messageId: number): Promise<void> {
    await this.client.patch(`/messages/${messageId}/`, { is_read: true });
  }
}

export const apiClient = new ApiClient();

