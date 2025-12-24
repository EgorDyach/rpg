import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Loading } from '@/components/common/Loading';
import type { FriendRequest, User } from '@/types';
import toast from 'react-hot-toast';

export const Friends: React.FC = () => {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [showSendRequestModal, setShowSendRequestModal] = useState(false);
  const [usernameToAdd, setUsernameToAdd] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const requests = await apiClient.getFriendRequests();
      setFriendRequests(requests);
      
      // Получаем список друзей из принятых заявок
      const acceptedRequests = requests.filter(r => r.status === 'accepted');
      const friendIds = new Set<number>();
      acceptedRequests.forEach(r => {
        if (r.from_user === user?.id) {
          friendIds.add(r.to_user);
        } else if (r.to_user === user?.id) {
          friendIds.add(r.from_user);
        }
      });
      
      // Для получения полной информации о друзьях нужно будет добавить эндпоинт на бэке
      // Пока используем только ID из заявок
      setFriends([]); // Временно пустой массив
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка загрузки друзей');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameToAdd.trim()) {
      toast.error('Введите имя пользователя');
      return;
    }
    
    try {
      const users = await apiClient.searchUsers(usernameToAdd);
      if (users.length === 0) {
        toast.error('Пользователь не найден');
        return;
      }
      
      const targetUser = users[0];
      await apiClient.sendFriendRequest(targetUser.id);
      toast.success(`Заявка отправлена пользователю ${targetUser.username}!`);
      setShowSendRequestModal(false);
      setUsernameToAdd('');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка отправки заявки');
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await apiClient.acceptFriendRequest(requestId);
      toast.success('Заявка принята!');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка принятия заявки');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await apiClient.rejectFriendRequest(requestId);
      toast.success('Заявка отклонена');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка');
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!window.confirm('Удалить заявку?')) return;
    try {
      await apiClient.deleteFriendRequest(requestId);
      toast.success('Заявка удалена');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка удаления');
    }
  };

  const incomingRequests = friendRequests.filter(
    (r) => r.to_user === user?.id && r.status === 'pending'
  );
  const outgoingRequests = friendRequests.filter(
    (r) => r.from_user === user?.id && r.status === 'pending'
  );
  const acceptedRequests = friendRequests.filter((r) => r.status === 'accepted');

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-game text-rpg-gold">👥 Друзья</h1>
        <Button onClick={() => setShowSendRequestModal(true)}>Добавить друга</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'friends' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('friends')}
        >
          Друзья ({acceptedRequests.length})
        </Button>
        <Button
          variant={activeTab === 'requests' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('requests')}
        >
          Заявки ({incomingRequests.length + outgoingRequests.length})
        </Button>
      </div>

      {activeTab === 'friends' && (
        <div className="space-y-4">
          {acceptedRequests.length === 0 ? (
            <Card>
              <p className="text-center text-rpg-text-dim py-8">Нет друзей</p>
            </Card>
          ) : (
            acceptedRequests.map((request) => {
              const friendId = request.from_user === user?.id ? request.to_user : request.from_user;
              const friendUsername = request.from_user === user?.id 
                ? request.to_user_username 
                : request.from_user_username;

              return (
                <Card key={request.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rpg-text">
                        {friendUsername || `Пользователь #${friendId}`}
                      </div>
                      <div className="text-sm text-rpg-text-dim">
                        Друзья с {new Date(request.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDeleteRequest(request.id)}
                    >
                      Удалить из друзей
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-rpg-text mb-4">Входящие заявки</h2>
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <Card key={request.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-rpg-text">
                          {request.from_user_username || `Пользователь #${request.from_user}`}
                        </div>
                        <div className="text-sm text-rpg-text-dim">
                          {new Date(request.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          Принять
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Requests */}
          {outgoingRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-rpg-text mb-4">Исходящие заявки</h2>
              <div className="space-y-4">
                {outgoingRequests.map((request) => (
                  <Card key={request.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-rpg-text">
                          {request.to_user_username || `Пользователь #${request.to_user}`}
                        </div>
                        <div className="text-sm text-rpg-text-dim">
                          Отправлено {new Date(request.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        Отменить
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
            <Card>
              <p className="text-center text-rpg-text-dim py-8">Нет заявок</p>
            </Card>
          )}
        </div>
      )}

      {/* Send Request Modal */}
      <Modal
        isOpen={showSendRequestModal}
        onClose={() => {
          setShowSendRequestModal(false);
          setUsernameToAdd('');
        }}
        title="Добавить друга"
      >
        <form onSubmit={handleSendFriendRequest} className="space-y-4">
          <Input
            label="Имя пользователя"
            value={usernameToAdd}
            onChange={(e) => setUsernameToAdd(e.target.value)}
            placeholder="Введите username"
            required
          />
          <div className="flex gap-2">
            <Button type="submit" fullWidth>
              Отправить заявку
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowSendRequestModal(false);
                setUsernameToAdd('');
              }}
            >
              Отмена
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

