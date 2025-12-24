import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import type { Group, GroupPost, GroupPostComment, GroupGoal } from '@/types';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import toast from 'react-hot-toast';

export const Groups: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [goals, setGoals] = useState<GroupGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<GroupPost | null>(null);
  const [postComments, setPostComments] = useState<Record<number, GroupPostComment[]>>({});
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<'posts' | 'goals'>('posts');
  const [createForm, setCreateForm] = useState({ name: '', description: '', is_public: true });
  const [editForm, setEditForm] = useState({ name: '', description: '', is_public: true });
  const [postForm, setPostForm] = useState({ text: '' });
  const [editPostForm, setEditPostForm] = useState({ text: '' });
  const [goalForm, setGoalForm] = useState({ title: '', description: '', target_xp: 100, deadline: '' });
  const [contributeXp, setContributeXp] = useState<Record<number, number>>({});

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadPosts(selectedGroup.id);
      loadGoals(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      const data = await apiClient.getGroups();
      // Проверяем, является ли пользователь участником группы
      const groupsWithMembership = await Promise.all(
        data.map(async (group) => {
          // Проверяем через попытку получить посты (если пользователь в группе, посты доступны)
          // Или можно добавить поле is_member на бэкенде
          return { ...group, is_member: false }; // Временно, нужно добавить на бэкенде
        })
      );
      setGroups(groupsWithMembership);
    } catch (error) {
      toast.error('Ошибка загрузки групп');
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (groupId: number) => {
    try {
      const data = await apiClient.getGroupPosts(groupId);
      setPosts(data);
    } catch (error) {
      toast.error('Ошибка загрузки постов');
    }
  };

  const loadGoals = async (groupId: number) => {
    try {
      const data = await apiClient.getGroupGoals(groupId);
      setGoals(data);
    } catch (error) {
      toast.error('Ошибка загрузки целей');
    }
  };

  const loadPostComments = async (postId: number) => {
    try {
      const comments = await apiClient.getGroupPostComments(postId);
      setPostComments((prev) => ({ ...prev, [postId]: comments }));
    } catch (error) {
      toast.error('Ошибка загрузки комментариев');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createGroup(createForm);
      toast.success('Группа создана!');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', is_public: true });
      loadGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка создания группы');
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      await apiClient.updateGroup(selectedGroup.id, editForm);
      toast.success('Группа обновлена!');
      setShowEditModal(false);
      loadGroups();
      if (selectedGroup) {
        const updated = await apiClient.getGroups();
        const updatedGroup = updated.find(g => g.id === selectedGroup.id);
        if (updatedGroup) setSelectedGroup(updatedGroup);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка обновления группы');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту группу?')) return;
    try {
      await apiClient.deleteGroup(groupId);
      toast.success('Группа удалена!');
      setSelectedGroup(null);
      loadGroups();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления группы');
    }
  };

  const openEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setEditForm({
      name: group.name,
      description: group.description,
      is_public: group.is_public,
    });
    setShowEditModal(true);
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      await apiClient.joinGroup(groupId);
      toast.success('Вы присоединились к группе!');
      loadGroups();
      if (selectedGroup?.id === groupId) {
        const updated = await apiClient.getGroups();
        const updatedGroup = updated.find(g => g.id === groupId);
        if (updatedGroup) setSelectedGroup({ ...updatedGroup, is_member: true });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка присоединения');
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      await apiClient.leaveGroup(groupId);
      toast.success('Вы покинули группу');
      loadGroups();
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка');
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      await apiClient.createGroupPost({
        group: selectedGroup.id,
        text: postForm.text,
      });
      toast.success('Пост создан!');
      setShowPostModal(false);
      setPostForm({ text: '' });
      loadPosts(selectedGroup.id);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка создания поста');
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    try {
      await apiClient.updateGroupPost(selectedPost.id, { text: editPostForm.text });
      toast.success('Пост обновлен!');
      setShowEditPostModal(false);
      setSelectedPost(null);
      if (selectedGroup) {
        loadPosts(selectedGroup.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка обновления поста');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Удалить пост?')) return;
    try {
      await apiClient.deleteGroupPost(postId);
      toast.success('Пост удален!');
      if (selectedGroup) {
        loadPosts(selectedGroup.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления поста');
    }
  };

  const openEditPost = (post: GroupPost) => {
    setSelectedPost(post);
    setEditPostForm({ text: post.text });
    setShowEditPostModal(true);
  };

  const handleAddComment = async (postId: number) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;
    try {
      await apiClient.createGroupPostComment({
        post: postId,
        text,
      });
      toast.success('Комментарий добавлен!');
      setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
      await loadPostComments(postId);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка добавления комментария');
    }
  };

  const handleDeleteComment = async (commentId: number, postId: number) => {
    if (!window.confirm('Удалить комментарий?')) return;
    try {
      await apiClient.deleteGroupPostComment(commentId);
      toast.success('Комментарий удален!');
      await loadPostComments(postId);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления комментария');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      await apiClient.createGroupGoal({
        group: selectedGroup.id,
        ...goalForm,
      });
      toast.success('Цель создана!');
      setShowGoalModal(false);
      setGoalForm({ title: '', description: '', target_xp: 100, deadline: '' });
      loadGoals(selectedGroup.id);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка создания цели');
    }
  };

  const handleContributeToGoal = async (goalId: number) => {
    const xp = contributeXp[goalId];
    if (!xp || xp <= 0) {
      toast.error('Введите количество XP');
      return;
    }
    try {
      await apiClient.contributeToGroupGoal(goalId, xp);
      toast.success(`Внесено ${xp} XP!`);
      setContributeXp((prev) => ({ ...prev, [goalId]: 0 }));
      if (selectedGroup) {
        loadGoals(selectedGroup.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка внесения вклада');
    }
  };

  if (selectedGroup) {
    const isOwner = selectedGroup.created_by === user?.id;
    const isMember = selectedGroup.is_member;

    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="secondary" size="sm" onClick={() => setSelectedGroup(null)}>
              ← Назад
            </Button>
            <h1 className="text-2xl md:text-3xl font-game text-rpg-gold mt-4">
              {selectedGroup.name}
            </h1>
          </div>
          <div className="flex gap-2">
            {isMember && (
            <Button onClick={() => setShowPostModal(true)}>Создать пост</Button>
          )}
            {isOwner && (
              <>
                <Button variant="secondary" onClick={() => openEditGroup(selectedGroup)}>
                  Редактировать
                </Button>
                <Button variant="secondary" onClick={() => handleDeleteGroup(selectedGroup.id)}>
                  Удалить
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <p className="text-rpg-text-dim">{selectedGroup.description}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-rpg-text-dim">
            <span>👥 {selectedGroup.members_count} участников</span>
            <span>👤 Создатель: {selectedGroup.created_by_username}</span>
          </div>
          {!isMember && (
            <div className="mt-4">
              <Button variant="gold" onClick={() => handleJoinGroup(selectedGroup.id)}>
                Присоединиться
              </Button>
            </div>
          )}
          {isMember && (
            <div className="mt-4">
              <Button variant="secondary" size="sm" onClick={() => handleLeaveGroup(selectedGroup.id)}>
                Покинуть группу
              </Button>
            </div>
          )}
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'posts' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('posts')}
          >
            Посты
          </Button>
          <Button
            variant={activeTab === 'goals' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('goals')}
          >
            Цели
          </Button>
        </div>

        {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <p className="text-center text-rpg-text-dim py-8">Нет постов</p>
            </Card>
          ) : (
              posts.map((post) => {
                const comments = postComments[post.id] || [];
                const commentText = commentTexts[post.id] || '';
                const isPostAuthor = post.author === user?.id;

                return (
              <Card key={post.id}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-rpg-purple flex items-center justify-center text-white font-bold">
                    {post.author_username?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-rpg-text">{post.author_username}</div>
                    <div className="text-sm text-rpg-text-dim">
                      {format(new Date(post.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                    </div>
                  </div>
                </div>
                      {isPostAuthor && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditPost(post)}>
                            Редактировать
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleDeletePost(post.id)}>
                            Удалить
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-rpg-text whitespace-pre-wrap mb-4">{post.text}</p>

                    {/* Comments */}
                    <div className="border-t border-rpg-border pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (comments.length === 0) {
                              loadPostComments(post.id);
                            } else {
                              setPostComments((prev) => ({ ...prev, [post.id]: [] }));
                            }
                          }}
                        >
                          💬 {comments.length > 0 ? `Скрыть комментарии (${comments.length})` : 'Показать комментарии'}
                        </Button>
                      </div>
                      {comments.length > 0 && (
                        <div className="space-y-2 mb-4">
                          {comments.map((comment) => (
                            <div key={comment.id} className="p-2 bg-rpg-bg rounded text-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-rpg-text">
                                    {comment.author_username || 'Пользователь'}
                                  </div>
                                  <p className="text-rpg-text-dim">{comment.text}</p>
                                  <div className="text-xs text-rpg-text-dim mt-1">
                                    {format(new Date(comment.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                                  </div>
                                </div>
                                {comment.author === user?.id && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleDeleteComment(comment.id, post.id)}
                                  >
                                    Удалить
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <textarea
                          className="rpg-input flex-1 min-h-[60px] resize-none text-sm"
                          placeholder="Написать комментарий..."
                          value={commentText}
                          onChange={(e) =>
                            setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                        />
                        <Button size="sm" onClick={() => handleAddComment(post.id)}>
                          Отправить
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-4">
            {isMember && (
              <Button onClick={() => setShowGoalModal(true)}>Создать цель</Button>
            )}
            {goals.length === 0 ? (
              <Card>
                <p className="text-center text-rpg-text-dim py-8">Нет целей</p>
              </Card>
            ) : (
              goals.map((goal) => {
                const progress = (goal.current_xp / goal.target_xp) * 100;
                return (
                  <Card key={goal.id} gold={goal.is_completed}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-rpg-text">{goal.title}</h3>
                          {goal.is_completed && (
                            <span className="rpg-badge-green text-xs">Выполнено</span>
                          )}
                        </div>
                      </div>
                      <p className="text-rpg-text-dim">{goal.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-rpg-text-dim">Прогресс</span>
                          <span className="text-rpg-text">
                            {goal.current_xp} / {goal.target_xp} XP
                          </span>
                        </div>
                        <div className="w-full bg-rpg-bg rounded-full h-2">
                          <div
                            className="bg-rpg-gold h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                      {goal.deadline && (
                        <div className="text-sm text-rpg-text-dim">
                          Дедлайн: {format(new Date(goal.deadline), 'dd MMM yyyy', { locale: ru })}
                        </div>
                      )}
                      {isMember && !goal.is_completed && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="1"
                            placeholder="XP"
                            value={contributeXp[goal.id] || ''}
                            onChange={(e) =>
                              setContributeXp((prev) => ({
                                ...prev,
                                [goal.id]: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="w-24"
                          />
                          <Button size="sm" onClick={() => handleContributeToGoal(goal.id)}>
                            Внести вклад
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
          )}
        </div>
        )}

        {/* Create Post Modal */}
        <Modal isOpen={showPostModal} onClose={() => setShowPostModal(false)} title="Создать пост">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-rpg-text">Содержание</label>
              <textarea
                className="rpg-input min-h-[150px] resize-none"
                value={postForm.text}
                onChange={(e) => setPostForm({ ...postForm, text: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" fullWidth>
                Опубликовать
              </Button>
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowPostModal(false)}>
                Отмена
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Post Modal */}
        {selectedPost && (
          <Modal
            isOpen={showEditPostModal}
            onClose={() => {
              setShowEditPostModal(false);
              setSelectedPost(null);
            }}
            title="Редактировать пост"
          >
            <form onSubmit={handleUpdatePost} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-rpg-text">Содержание</label>
                <textarea
                  className="rpg-input min-h-[150px] resize-none"
                  value={editPostForm.text}
                  onChange={(e) => setEditPostForm({ ...editPostForm, text: e.target.value })}
                  required
                />
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
                    setShowEditPostModal(false);
                    setSelectedPost(null);
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Create Goal Modal */}
        <Modal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} title="Создать цель">
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <Input
              label="Название"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-semibold mb-2 text-rpg-text">Описание</label>
              <textarea
                className="rpg-input min-h-[100px] resize-none"
                value={goalForm.description}
                onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
              />
            </div>
            <Input
              label="Целевой XP"
              type="number"
              min="1"
              value={goalForm.target_xp}
              onChange={(e) => setGoalForm({ ...goalForm, target_xp: parseInt(e.target.value) || 0 })}
              required
            />
            <Input
              label="Дедлайн"
              type="datetime-local"
              value={goalForm.deadline}
              onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
            />
            <div className="flex gap-2">
              <Button type="submit" fullWidth>
                Создать
              </Button>
              <Button type="button" variant="secondary" fullWidth onClick={() => setShowGoalModal(false)}>
                Отмена
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Group Modal */}
        {selectedGroup && (
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
            }}
            title="Редактировать группу"
          >
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <Input
                label="Название"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_public"
                  checked={editForm.is_public}
                  onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="edit_is_public" className="text-rpg-text">
                  Публичная группа
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" fullWidth>
                  Сохранить
                </Button>
                <Button type="button" variant="secondary" fullWidth onClick={() => setShowEditModal(false)}>
                  Отмена
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-game text-rpg-gold">👥 Группы</h1>
        <Button onClick={() => setShowCreateModal(true)}>Создать группу</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-rpg-text-dim">Загрузка...</div>
      ) : groups.length === 0 ? (
        <Card>
          <p className="text-center text-rpg-text-dim py-8">Нет групп</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className="cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <h3 className="text-lg font-bold text-rpg-text mb-2">{group.name}</h3>
              <p className="text-sm text-rpg-text-dim mb-4 line-clamp-3">{group.description}</p>
              <div className="flex items-center justify-between text-sm text-rpg-text-dim">
                <span>👥 {group.members_count}</span>
                <span>👤 {group.created_by_username}</span>
              </div>
              {group.is_member && (
                <span className="rpg-badge-green text-xs mt-2 inline-block">Участник</span>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Создать группу">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Input
            label="Название"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={createForm.is_public}
              onChange={(e) => setCreateForm({ ...createForm, is_public: e.target.checked })}
              className="w-5 h-5"
            />
            <label htmlFor="is_public" className="text-rpg-text">
              Публичная группа
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" fullWidth>
              Создать
            </Button>
            <Button type="button" variant="secondary" fullWidth onClick={() => setShowCreateModal(false)}>
              Отмена
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
