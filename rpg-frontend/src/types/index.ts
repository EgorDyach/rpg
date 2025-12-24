export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'admin';
  level: number;
  xp: number;
  coins: number;
  streak: number;
  faculty?: string;
  group?: string;
  avatar?: string;
}

export interface UserStats {
  level: number;
  xp: number;
  xp_to_next_level: number;
  coins: number;
  streak: number;
  quests_created: number;
  quests_completed: number;
  quests_in_progress: number;
  achievements_count: number;
  rank: number | null;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  goal: string;
  is_daily: boolean;
  is_public: boolean;
  created_by: number | null;
  created_by_username?: string;
  active_from?: string | null;
  active_to?: string | null;
  deadline?: string | null;
  difficulty: number;
  xp_reward: number;
  coin_reward: number;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
  comments_count?: number;
}

export interface Assignment {
  id: number;
  quest: number | Quest;
  user: number;
  group?: number | null;
  is_completed: boolean;
  completed_at?: string | null;
  attempt_count: number;
  due_date?: string | null;
  xp_reward: number;
  coin_reward: number;
  needs_review: boolean;
  created_at: string;
  quest_title?: string;
  quest_description?: string;
  likes_count?: number;
  is_liked?: boolean;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  course?: number | null;
  created_by: number | null;
  created_by_username?: string;
  members_count?: number;
  is_public: boolean;
  created_at: string;
  is_member?: boolean;
}

export interface GroupPost {
  id: number;
  group: number;
  author: number;
  author_username?: string;
  text: string;
  created_at: string;
  updated_at: string;
  comments_count?: number;
}

export interface GroupPostComment {
  id: number;
  post: number;
  author: number;
  author_username?: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface GroupGoal {
  id: number;
  group: number;
  title: string;
  description: string;
  target_xp: number;
  current_xp: number;
  deadline?: string | null;
  is_completed: boolean;
  created_at: string;
  completed_at?: string | null;
}

export interface FriendRequest {
  id: number;
  from_user: number;
  to_user: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  from_user_username?: string;
  to_user_username?: string;
}

export interface Message {
  id: number;
  sender: number;
  receiver: number;
  text: string;
  created_at: string;
  is_read: boolean;
  sender_username?: string;
  receiver_username?: string;
}

export interface QuestComment {
  id: number;
  quest: number;
  user: number;
  user_username?: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: number;
  key: string;
  title: string;
  description: string;
  xp_reward: number;
  coin_reward: number;
  criteria: Record<string, any>;
}

export interface AchievementProgress {
  id: number;
  achievement: number | Achievement;
  user: number;
  achieved: boolean;
  progress: Record<string, any>;
  achieved_at?: string | null;
}

export interface Notification {
  id: number;
  user: number;
  title: string;
  body: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  level: number;
  xp: number;
  quests_completed: number;
  streak: number;
  is_current_user?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  faculty?: string;
  group?: string;
}

export interface Item {
  id: number;
  sku: string;
  name: string;
  description: string;
  item_type: 'cosmetic' | 'consumable' | 'boost' | 'other';
  properties: Record<string, any>;
  created_at: string;
}

export interface StoreItem {
  id: number;
  item: Item;
  price: number;
  stock: number | null;
  purchase_limit: number | null;
  is_active: boolean;
}

export interface InventoryItem {
  id: number;
  user: number;
  item: Item;
  quantity: number;
  acquired_at: string;
  expires_at: string | null;
  data: Record<string, any>;
}

export interface EquippedItem {
  id: number;
  user: number;
  item: Item;
  slot: string;
  equipped_at: string;
}
