import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { Card } from '@/components/common/Card';
import { XpBar } from '@/components/common/XpBar';
import type { UserStats } from '@/types';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getUserStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Ошибка загрузки статистики';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user?.id, loadStats]);

  if (!user) return null;

  const xpForNextLevel = user.level * 100;
  const currentXp = user.xp % 100;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-game text-rpg-gold mb-6">👤 Профиль</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <Card gold>
          <div className="text-center mb-6">
            <div className="w-24 h-24 rounded-full bg-rpg-purple flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
              {user.username[0].toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold text-rpg-gold mb-2">{user.username}</h2>
            <p className="text-rpg-text-dim">{user.email}</p>
            {user.faculty && (
              <p className="text-rpg-text-dim mt-1">
                {user.faculty} {user.group && `• ${user.group}`}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-rpg-bg rounded">
              <span className="text-rpg-text-dim">Уровень</span>
              <span className="text-xl font-bold text-rpg-gold">Lv.{user.level}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rpg-bg rounded">
              <span className="text-rpg-text-dim">Монеты</span>
              <span className="text-xl font-bold text-rpg-gold">💰 {user.coins}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rpg-bg rounded">
              <span className="text-rpg-text-dim">Streak</span>
              <span className="text-xl font-bold text-rpg-green">🔥 {user.streak}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rpg-bg rounded">
              <span className="text-rpg-text-dim">Опыт</span>
              <span className="text-xl font-bold text-rpg-purple">⭐ {user.xp}</span>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Card>
          <h3 className="text-xl font-bold text-rpg-text mb-4">Статистика</h3>
          {loading ? (
            <div className="text-center py-8 text-rpg-text-dim">Загрузка...</div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-rpg-red mb-4">{error}</p>
              <button
                onClick={loadStats}
                className="rpg-button-primary"
              >
                Попробовать снова
              </button>
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <XpBar current={currentXp} max={xpForNextLevel} level={user.level} />
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-rpg-bg rounded text-center">
                  <div className="text-2xl font-bold text-rpg-gold">
                    {stats.quests_completed + stats.quests_in_progress}
                  </div>
                  <div className="text-sm text-rpg-text-dim mt-1">Всего квестов</div>
                </div>
                <div className="p-4 bg-rpg-bg rounded text-center">
                  <div className="text-2xl font-bold text-rpg-green">
                    {stats.quests_completed}
                  </div>
                  <div className="text-sm text-rpg-text-dim mt-1">Выполнено</div>
                </div>
                <div className="p-4 bg-rpg-bg rounded text-center">
                  <div className="text-2xl font-bold text-rpg-purple">{stats.quests_created}</div>
                  <div className="text-sm text-rpg-text-dim mt-1">Создано</div>
                </div>
                <div className="p-4 bg-rpg-bg rounded text-center">
                  <div className="text-2xl font-bold text-rpg-red">
                    🔥 {stats.streak}
                  </div>
                  <div className="text-sm text-rpg-text-dim mt-1">Текущий streak</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-rpg-bg rounded text-center">
                <div className="text-2xl font-bold text-rpg-gold">{stats.achievements_count}</div>
                <div className="text-sm text-rpg-text-dim mt-1">Достижений получено</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-rpg-text-dim">Нет данных</div>
          )}
        </Card>
      </div>
    </div>
  );
};

