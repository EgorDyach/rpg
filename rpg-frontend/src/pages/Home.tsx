import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { XpBar } from '@/components/common/XpBar';
import { Link } from 'react-router-dom';
import type { UserStats, Assignment, Quest } from '@/types';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import toast from 'react-hot-toast';

export const Home: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeQuests, setActiveQuests] = useState<Assignment[]>([]);
  const [publicQuests, setPublicQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleCompleteQuest = async (assignmentId: number, questTitle?: string) => {
    if (!window.confirm(`Вы уверены, что хотите выполнить квест "${questTitle || 'этот квест'}"?`)) {
      return;
    }

    try {
      const result = await apiClient.completeAssignment(assignmentId);
      
      let rewardMessage = 'Квест выполнен! ';
      if (result.xp_reward) {
        rewardMessage += `Получено: ⭐ ${result.xp_reward} XP`;
      }
      if (result.coin_reward) {
        rewardMessage += ` 💰 ${result.coin_reward} монет`;
      }
      // Проверяем, был ли дедлайн и выполнено ли раньше
      if (result.quest && typeof result.quest === 'object' && 'deadline' in result.quest) {
        const quest = result.quest as Quest;
        if (quest.deadline && result.completed_at) {
          const deadline = new Date(quest.deadline);
          const completed = new Date(result.completed_at);
          if (completed < deadline) {
            rewardMessage += ' 🎉 +20% бонус за раннее выполнение!';
          }
        }
      }
      
      toast.success(rewardMessage, { duration: 5000 });
      
      // Обновляем данные
      await refreshUser();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка выполнения квеста');
    }
  };

  const loadData = async () => {
    try {
      const [statsData, assignmentsData, questsData] = await Promise.all([
        apiClient.getUserStats(),
        apiClient.getAssignments(),
        apiClient.getQuests({ is_public: true }),
      ]);
      setStats(statsData);
      setActiveQuests(assignmentsData.filter((a) => !a.is_completed).slice(0, 3));
      setPublicQuests(questsData.slice(0, 3));
    } catch (error) {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const xpForNextLevel = user.level * 100;
  const currentXp = user.xp % 100;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Hero Section */}
      <Card gold>
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-game text-rpg-gold mb-2">
            Добро пожаловать, {user.username}!
          </h1>
          <p className="text-rpg-text-dim">Продолжайте свой путь к совершенству</p>
        </div>
        <XpBar current={currentXp} max={xpForNextLevel} level={user.level} />
      </Card>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-rpg-gold">{stats.quests_completed}</div>
              <div className="text-sm text-rpg-text-dim">Выполнено</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-rpg-purple">{stats.quests_created}</div>
              <div className="text-sm text-rpg-text-dim">Создано</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-rpg-green">{stats.achievements_count}</div>
              <div className="text-sm text-rpg-text-dim">Достижений</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-rpg-red">🔥 {stats.streak}</div>
              <div className="text-sm text-rpg-text-dim">Streak</div>
            </div>
          </Card>
        </div>
      )}

      {/* Active Quests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-rpg-gold">Активные квесты</h2>
          <Link to="/quests">
            <Button variant="secondary" size="sm">
              Все квесты
            </Button>
          </Link>
        </div>
        {activeQuests.length === 0 ? (
          <Card>
            <p className="text-center text-rpg-text-dim py-4">
              Нет активных квестов. Создайте новый или примите публичный квест!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeQuests.map((assignment) => (
              <Card key={assignment.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-rpg-text mb-1">
                      {typeof assignment.quest === 'object' ? assignment.quest.title : 'Квест'}
                    </h3>
                    {typeof assignment.quest === 'object' && (
                      <>
                        <p className="text-sm text-rpg-text-dim mb-2 line-clamp-2">
                          {assignment.quest.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-rpg-text-dim">
                          <span>💰 {assignment.quest.coin_reward}</span>
                          <span>⭐ {assignment.quest.xp_reward} XP</span>
                          {assignment.quest.deadline && (
                            <span>
                              📅 {format(new Date(assignment.quest.deadline), 'dd MMM', { locale: ru })}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!assignment.is_completed && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          const questTitle = typeof assignment.quest === 'object' ? assignment.quest.title : undefined;
                          handleCompleteQuest(assignment.id, questTitle);
                        }}
                      >
                        ✅ Выполнить
                      </Button>
                    )}
                    <Link to="/quests">
                      <Button size="sm" variant="secondary">Открыть</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Public Quests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-rpg-purple">Публичные квесты</h2>
          <Link to="/quests">
            <Button variant="secondary" size="sm">
              Все квесты
            </Button>
          </Link>
        </div>
        {publicQuests.length === 0 ? (
          <Card>
            <p className="text-center text-rpg-text-dim py-4">Нет публичных квестов</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {publicQuests.map((quest) => (
              <Card key={quest.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-rpg-text">{quest.title}</h3>
                      <span className="rpg-badge-purple text-xs">Публичный</span>
                    </div>
                    <p className="text-sm text-rpg-text-dim mb-2 line-clamp-2">
                      {quest.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-rpg-text-dim">
                      <span>💰 {quest.coin_reward}</span>
                      <span>⭐ {quest.xp_reward} XP</span>
                      <span>👤 {quest.created_by_username}</span>
                    </div>
                  </div>
                  <Link to="/quests">
                    <Button size="sm" variant="gold">
                      Принять
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

