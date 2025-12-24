import React, { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import type { LeaderboardEntry } from '@/types';
import toast from 'react-hot-toast';

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'level' | 'xp' | 'quests' | 'streak'>('level');
  const [faculty, setFaculty] = useState('');
  const [group, setGroup] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [period, sortBy, faculty, group]);

  const loadLeaderboard = async () => {
    try {
      const data = await apiClient.getLeaderboard({
        period,
        sort_by: sortBy,
        faculty: faculty || undefined,
        group: group || undefined,
      });
      setEntries(data);
    } catch (error) {
      toast.error('Ошибка загрузки рейтинга');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getSortLabel = (sort: string) => {
    const labels: Record<string, string> = {
      level: 'Уровень',
      xp: 'Опыт',
      quests: 'Квесты',
      streak: 'Streak',
    };
    return labels[sort] || sort;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-game text-rpg-gold mb-6">🏆 Таблица лидеров</h1>

      {/* Filters */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-rpg-text">Период</label>
            <div className="flex gap-2">
              {(['all', 'week', 'month'] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                >
                  {p === 'all' ? 'Все время' : p === 'week' ? 'Неделя' : 'Месяц'}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-rpg-text">Сортировка</label>
            <div className="flex gap-2 flex-wrap">
              {(['level', 'xp', 'quests', 'streak'] as const).map((s) => (
                <Button
                  key={s}
                  variant={sortBy === s ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSortBy(s)}
                >
                  {getSortLabel(s)}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-rpg-text">Факультет</label>
              <input
                type="text"
                className="rpg-input"
                placeholder="Фильтр по факультету"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-rpg-text">Группа</label>
              <input
                type="text"
                className="rpg-input"
                placeholder="Фильтр по группе"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Leaderboard */}
      {loading ? (
        <div className="text-center py-12 text-rpg-text-dim">Загрузка...</div>
      ) : entries.length === 0 ? (
        <Card>
          <p className="text-center text-rpg-text-dim py-8">Нет данных</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <Card
              key={entry.user.id}
              gold={entry.rank <= 3}
              className={entry.rank <= 3 ? 'border-rpg-gold' : ''}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold text-rpg-gold w-12 text-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 rounded-full bg-rpg-purple flex items-center justify-center text-white font-bold">
                      {entry.user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-rpg-text">{entry.user.username}</div>
                      <div className="text-sm text-rpg-text-dim">
                        {entry.user.faculty && `${entry.user.faculty} `}
                        {entry.user.group && `• ${entry.user.group}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm mt-2">
                    <span className="text-rpg-purple">Lv.{entry.user.level}</span>
                    <span className="text-rpg-gold">💰 {entry.user.coins}</span>
                    <span className="text-rpg-green">🔥 {entry.user.streak}</span>
                    <span className="text-rpg-text-dim">
                      {getSortLabel(sortBy)}: <strong>{entry.value}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

