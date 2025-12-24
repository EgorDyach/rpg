import React, { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { Card } from '@/components/common/Card';
import type { Achievement, AchievementProgress } from '@/types';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import toast from 'react-hot-toast';

export const Achievements: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [achievementsData, progressData] = await Promise.all([
        apiClient.getAchievements(),
        apiClient.getAchievementProgress(),
      ]);
      setAchievements(achievementsData);
      setProgress(progressData);
    } catch (error) {
      toast.error('Ошибка загрузки достижений');
    } finally {
      setLoading(false);
    }
  };

  const getProgressForAchievement = (achievementId: number) => {
    return progress.find((p) => p.achievement.id === achievementId);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-game text-rpg-gold mb-6">🏆 Достижения</h1>

      {loading ? (
        <div className="text-center py-12 text-rpg-text-dim">Загрузка...</div>
      ) : achievements.length === 0 ? (
        <Card>
          <p className="text-center text-rpg-text-dim py-8">Нет достижений</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const progressData = getProgressForAchievement(achievement.id);
            const isCompleted = progressData?.completed || false;
            const progressValue = progressData?.progress || 0;

            return (
              <Card
                key={achievement.id}
                gold={isCompleted}
                className={isCompleted ? 'border-rpg-gold' : ''}
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">
                    {achievement.icon || (isCompleted ? '🏆' : '🔒')}
                  </div>
                  <h3 className="text-lg font-bold text-rpg-text mb-1">{achievement.name}</h3>
                  <p className="text-sm text-rpg-text-dim">{achievement.description}</p>
                </div>

                {!isCompleted && progressValue > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-rpg-text-dim mb-1">
                      <span>Прогресс</span>
                      <span>{progressValue}%</span>
                    </div>
                    <div className="xp-bar">
                      <div
                        className="xp-bar-fill"
                        style={{ width: `${progressValue}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {isCompleted && progressData?.completed_at && (
                  <div className="text-center">
                    <p className="text-xs text-rpg-green mb-2">
                      ✅ Получено {format(new Date(progressData.completed_at), 'dd MMM yyyy', { locale: ru })}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 text-sm mt-4 pt-4 border-t border-rpg-bg">
                  <span className="text-rpg-purple">⭐ {achievement.xp_reward} XP</span>
                  <span className="text-rpg-gold">💰 {achievement.coin_reward}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

