import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import type { Quest, Assignment, QuestComment } from '@/types';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import toast from 'react-hot-toast';

export const Quests: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [comments, setComments] = useState<QuestComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [filter, setFilter] = useState<'all' | 'my' | 'public'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    xp_reward: 10,
    coin_reward: 5,
    deadline: '',
    is_public: false,
  });
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    xp_reward: 10,
    coin_reward: 5,
    deadline: '',
    is_public: false,
  });

  useEffect(() => {
    loadData();
  }, [filter, searchQuery]);

  const loadData = async () => {
    try {
      const params: any = {};
      if (filter === 'public') params.is_public = true;
      if (searchQuery) params.search = searchQuery;
      
      const [questsData, assignmentsData] = await Promise.all([
        apiClient.getQuests(params),
        apiClient.getAssignments(),
      ]);
      setQuests(questsData);
      setAssignments(assignmentsData);
    } catch (error) {
      toast.error('Ошибка загрузки квестов');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestDetails = async (questId: number) => {
    try {
      const commentsData = await apiClient.getQuestComments(questId);
      setComments(commentsData);
    } catch (error) {
      toast.error('Ошибка загрузки комментариев');
    }
  };

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createQuest(createForm);
      toast.success('Квест создан!');
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        xp_reward: 10,
        coin_reward: 5,
        deadline: '',
        is_public: false,
      });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка создания квеста');
    }
  };

  const handleEditQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuest) return;
    try {
      await apiClient.updateQuest(selectedQuest.id, editForm);
      toast.success('Квест обновлен!');
      setShowEditModal(false);
      setSelectedQuest(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка обновления квеста');
    }
  };

  const handleDeleteQuest = async (questId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот квест?')) {
      return;
    }
    try {
      await apiClient.deleteQuest(questId);
      toast.success('Квест удален!');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления квеста');
    }
  };

  const openEditModal = (quest: Quest) => {
    setSelectedQuest(quest);
    setEditForm({
      title: quest.title,
      description: quest.description,
      xp_reward: quest.xp_reward,
      coin_reward: quest.coin_reward,
      deadline: quest.deadline ? new Date(quest.deadline).toISOString().slice(0, 16) : '',
      is_public: quest.is_public,
    });
    setShowEditModal(true);
  };

  const openDetailsModal = async (quest: Quest) => {
    const assignment = getAssignmentForQuest(quest.id);
    setSelectedQuest(quest);
    setSelectedAssignment(assignment || null);
    setShowDetailsModal(true);
    await loadQuestDetails(quest.id);
  };

  const handleAcceptQuest = async (questId: number) => {
    try {
      await apiClient.acceptQuest(questId);
      toast.success('Квест принят!');
      loadData();
      if (selectedQuest?.id === questId) {
        const assignment = await apiClient.getAssignments();
        const newAssignment = assignment.find(a => a.quest === questId || (typeof a.quest === 'object' && a.quest.id === questId));
        setSelectedAssignment(newAssignment || null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка принятия квеста');
    }
  };

  const getAssignmentForQuest = (questId: number) => {
    return assignments.find((a) => {
      if (typeof a.quest === 'object') {
        return a.quest.id === questId;
      }
      return a.quest === questId;
    });
  };

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
      
      await refreshUser();
      loadData();
      if (selectedQuest) {
        const updatedAssignment = await apiClient.getAssignments();
        const newAssignment = updatedAssignment.find(a => a.id === assignmentId);
        setSelectedAssignment(newAssignment || null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка выполнения квеста');
    }
  };

  const handleLikeQuest = async (assignmentId: number) => {
    try {
      await apiClient.likeQuest(assignmentId);
      toast.success('Квест лайкнут!');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка лайка');
    }
  };

  const handleUnlikeQuest = async (likeId: number) => {
    try {
      await apiClient.unlikeQuest(likeId);
      toast.success('Лайк убран');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuest || !commentText.trim()) return;
    try {
      await apiClient.createQuestComment({
        quest: selectedQuest.id,
        text: commentText,
      });
      toast.success('Комментарий добавлен!');
      setCommentText('');
      await loadQuestDetails(selectedQuest.id);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка добавления комментария');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Удалить комментарий?')) return;
    try {
      await apiClient.deleteQuestComment(commentId);
      toast.success('Комментарий удален!');
      if (selectedQuest) {
        await loadQuestDetails(selectedQuest.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления комментария');
    }
  };

  const filteredQuests = quests
    .filter((quest) => {
      if (filter === 'my') return quest.created_by === user?.id;
      if (filter === 'public') return quest.is_public;
      return true;
    })
    .map((quest) => {
      const assignment = getAssignmentForQuest(quest.id);
      return { quest, assignment };
    });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-game text-rpg-gold">⚔️ Квесты</h1>
        <Button onClick={() => setShowCreateModal(true)}>Создать квест</Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Поиск квестов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Все
        </Button>
        <Button
          variant={filter === 'my' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('my')}
        >
          Мои
        </Button>
        <Button
          variant={filter === 'public' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setFilter('public')}
        >
          Публичные
        </Button>
      </div>

      {/* Quests List */}
      {loading ? (
        <div className="text-center py-12 text-rpg-text-dim">Загрузка...</div>
      ) : filteredQuests.length === 0 ? (
        <Card>
          <p className="text-center text-rpg-text-dim py-8">Нет квестов</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuests.map(({ quest, assignment }) => {
            const isMyQuest = quest.created_by === user?.id;
            const canAccept = quest.is_public && !assignment && !isMyQuest;
            const canComplete = assignment && !assignment.is_completed;

            return (
              <Card key={quest.id} gold={assignment?.is_completed}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 
                          className="text-lg font-bold text-rpg-text cursor-pointer hover:text-rpg-gold"
                          onClick={() => openDetailsModal(quest)}
                        >
                          {quest.title}
                        </h3>
                        {quest.is_public && (
                          <span className="rpg-badge-purple text-xs">Публичный</span>
                        )}
                        {isMyQuest && (
                          <span className="rpg-badge-gold text-xs">Мой</span>
                        )}
                        {assignment?.is_completed && (
                          <span className="rpg-badge-green text-xs">Выполнено</span>
                        )}
                      </div>
                      <p className="text-rpg-text-dim mb-3">{quest.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="text-rpg-gold font-semibold">💰 {quest.coin_reward}</span>
                        <span className="text-rpg-purple font-semibold">
                          ⭐ {quest.xp_reward} XP
                        </span>
                        {quest.deadline && (
                          <span className="text-rpg-text-dim">
                            📅 {format(new Date(quest.deadline), 'dd MMM yyyy', { locale: ru })}
                          </span>
                        )}
                        {quest.created_by_username && (
                          <span className="text-rpg-text-dim">👤 {quest.created_by_username}</span>
                        )}
                        {quest.comments_count !== undefined && quest.comments_count > 0 && (
                          <span className="text-rpg-text-dim">💬 {quest.comments_count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openDetailsModal(quest)}
                    >
                      Детали
                    </Button>
                    {canAccept && (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleAcceptQuest(quest.id)}
                      >
                        Принять квест
                      </Button>
                    )}
                    {canComplete && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleCompleteQuest(assignment!.id, quest.title)}
                      >
                        ✅ Выполнить квест
                      </Button>
                    )}
                    {isMyQuest && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openEditModal(quest)}
                        >
                          Редактировать
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDeleteQuest(quest.id)}
                        >
                          Удалить
                        </Button>
                      </>
                    )}
                    {assignment?.is_completed && (
                      <div className="text-sm text-rpg-green space-y-1">
                        <div className="font-semibold">✅ Квест выполнен!</div>
                        {assignment.xp_reward > 0 && (
                          <div>Получено: ⭐ {assignment.xp_reward} XP</div>
                        )}
                        {assignment.coin_reward > 0 && (
                          <div>💰 {assignment.coin_reward} монет</div>
                        )}
                        {assignment.completed_at && (
                          <div className="text-xs text-rpg-text-dim">
                            Выполнено: {format(new Date(assignment.completed_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                          </div>
                        )}
                        {assignment.likes_count !== undefined && assignment.likes_count > 0 && (
                          <div className="text-xs text-rpg-text-dim">
                            ❤️ {assignment.likes_count} лайков
                          </div>
                        )}
                        {assignment.is_liked ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              // Нужно получить ID лайка, но для упрощения просто убираем лайк через API
                              // В реальности нужно хранить ID лайка
                              toast.info('Функция удаления лайка будет реализована');
                            }}
                          >
                            ❤️ Убрать лайк
                          </Button>
                        ) : assignment && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleLikeQuest(assignment.id)}
                          >
                            ❤️ Лайкнуть
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quest Details Modal */}
      {selectedQuest && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedQuest(null);
            setSelectedAssignment(null);
            setComments([]);
            setCommentText('');
          }}
          title={selectedQuest.title}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-rpg-text mb-2">Описание</h3>
              <p className="text-rpg-text-dim">{selectedQuest.description}</p>
            </div>
            {selectedQuest.goal && (
              <div>
                <h3 className="font-bold text-rpg-text mb-2">Цель</h3>
                <p className="text-rpg-text-dim">{selectedQuest.goal}</p>
              </div>
            )}
            <div className="flex gap-4 text-sm">
              <span className="text-rpg-gold font-semibold">💰 {selectedQuest.coin_reward} монет</span>
              <span className="text-rpg-purple font-semibold">⭐ {selectedQuest.xp_reward} XP</span>
              {selectedQuest.deadline && (
                <span className="text-rpg-text-dim">
                  📅 {format(new Date(selectedQuest.deadline), 'dd MMM yyyy HH:mm', { locale: ru })}
                </span>
              )}
            </div>

            {selectedAssignment && (
              <div className="p-4 bg-rpg-bg rounded">
                <h3 className="font-bold text-rpg-text mb-2">Статус выполнения</h3>
                {selectedAssignment.is_completed ? (
                  <div className="text-rpg-green">
                    <div className="font-semibold">✅ Выполнено</div>
                    {selectedAssignment.completed_at && (
                      <div className="text-sm">
                        {format(new Date(selectedAssignment.completed_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                      </div>
                    )}
                    {selectedAssignment.likes_count !== undefined && selectedAssignment.likes_count > 0 && (
                      <div className="text-sm mt-2">❤️ {selectedAssignment.likes_count} лайков</div>
                    )}
                    {!selectedAssignment.is_liked && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={() => handleLikeQuest(selectedAssignment.id)}
                      >
                        ❤️ Лайкнуть
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleCompleteQuest(selectedAssignment.id, selectedQuest.title)}
                  >
                    ✅ Выполнить квест
                  </Button>
                )}
              </div>
            )}

            {/* Comments Section */}
            <div>
              <h3 className="font-bold text-rpg-text mb-2">Комментарии ({comments.length})</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {comments.length === 0 ? (
                  <p className="text-rpg-text-dim text-sm">Нет комментариев</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-rpg-bg rounded">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-rpg-text text-sm">
                            {comment.user_username || 'Пользователь'}
                          </div>
                          <p className="text-rpg-text-dim text-sm mt-1">{comment.text}</p>
                          <div className="text-xs text-rpg-text-dim mt-1">
                            {format(new Date(comment.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                          </div>
                        </div>
                        {comment.user === user?.id && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            Удалить
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  className="rpg-input min-h-[80px] resize-none w-full"
                  placeholder="Написать комментарий..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                />
                <Button type="submit" size="sm" fullWidth>
                  Отправить
                </Button>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Quest Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать квест"
        size="lg"
      >
        <form onSubmit={handleCreateQuest} className="space-y-4">
          <Input
            label="Название"
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-semibold mb-2 text-rpg-text">Описание</label>
            <textarea
              className="rpg-input min-h-[100px] resize-none"
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="XP награда"
              type="number"
              min="1"
              value={createForm.xp_reward}
              onChange={(e) =>
                setCreateForm({ ...createForm, xp_reward: parseInt(e.target.value) || 0 })
              }
              required
            />
            <Input
              label="Монеты"
              type="number"
              min="1"
              value={createForm.coin_reward}
              onChange={(e) =>
                setCreateForm({ ...createForm, coin_reward: parseInt(e.target.value) || 0 })
              }
              required
            />
          </div>
          <Input
            label="Дедлайн"
            type="datetime-local"
            value={createForm.deadline}
            onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={createForm.is_public}
              onChange={(e) => setCreateForm({ ...createForm, is_public: e.target.checked })}
              className="w-5 h-5"
            />
            <label htmlFor="is_public" className="text-rpg-text">
              Сделать публичным
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" fullWidth>
              Создать
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateModal(false)}
            >
              Отмена
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Quest Modal */}
      {selectedQuest && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedQuest(null);
          }}
          title="Редактировать квест"
          size="lg"
        >
          <form onSubmit={handleEditQuest} className="space-y-4">
            <Input
              label="Название"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-semibold mb-2 text-rpg-text">Описание</label>
              <textarea
                className="rpg-input min-h-[100px] resize-none"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="XP награда"
                type="number"
                min="1"
                value={editForm.xp_reward}
                onChange={(e) =>
                  setEditForm({ ...editForm, xp_reward: parseInt(e.target.value) || 0 })
                }
                required
              />
              <Input
                label="Монеты"
                type="number"
                min="1"
                value={editForm.coin_reward}
                onChange={(e) =>
                  setEditForm({ ...editForm, coin_reward: parseInt(e.target.value) || 0 })
                }
                required
              />
            </div>
            <Input
              label="Дедлайн"
              type="datetime-local"
              value={editForm.deadline}
              onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
              required
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_public"
                checked={editForm.is_public}
                onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="edit_is_public" className="text-rpg-text">
                Сделать публичным
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" fullWidth>
                Сохранить
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedQuest(null);
                }}
              >
                Отмена
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
