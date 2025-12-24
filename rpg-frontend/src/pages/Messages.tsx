import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/api/client';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Loading } from '@/components/common/Loading';
import { Modal } from '@/components/common/Modal';
import type { Message, User } from '@/types';
import { format } from 'date-fns';
import ru from 'date-fns/locale/ru';
import toast from 'react-hot-toast';

interface Dialog {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [selectedDialog, setSelectedDialog] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogMessages, setDialogMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (selectedDialog) {
      loadDialogMessages(selectedDialog);
    }
  }, [selectedDialog]);

  const loadMessages = async () => {
    try {
      const allMessages = await apiClient.getMessages();
      setMessages(allMessages);
      
      // Группируем сообщения по диалогам
      const dialogMap = new Map<number, { user: User; messages: Message[]; unreadCount: number }>();
      
      allMessages.forEach((msg) => {
        const otherUserId = msg.sender === user?.id ? msg.receiver : msg.sender;
        const otherUser: User = {
          id: otherUserId,
          username: msg.sender === user?.id ? msg.receiver_username || `User #${otherUserId}` : msg.sender_username || `User #${otherUserId}`,
          email: '',
          role: 'student',
          level: 1,
          xp: 0,
          coins: 0,
          streak: 0,
        };
        
        if (!dialogMap.has(otherUserId)) {
          dialogMap.set(otherUserId, {
            user: otherUser,
            messages: [],
            unreadCount: 0,
          });
        }
        
        const dialog = dialogMap.get(otherUserId)!;
        dialog.messages.push(msg);
        if (!msg.is_read && msg.receiver === user?.id) {
          dialog.unreadCount++;
        }
      });
      
      // Создаем список диалогов с последним сообщением
      const dialogsList: Dialog[] = Array.from(dialogMap.values()).map((dialog) => {
        const sortedMessages = dialog.messages.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return {
          user: dialog.user,
          lastMessage: sortedMessages[0],
          unreadCount: dialog.unreadCount,
        };
      });
      
      // Сортируем по времени последнего сообщения
      dialogsList.sort(
        (a, b) =>
          new Date(b.lastMessage.created_at).getTime() -
          new Date(a.lastMessage.created_at).getTime()
      );
      
      setDialogs(dialogsList);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка загрузки сообщений');
    } finally {
      setLoading(false);
    }
  };

  const loadDialogMessages = async (userId: number) => {
    try {
      const allMessages = await apiClient.getMessages(userId);
      const dialogMsgs = allMessages.filter(
        (msg) =>
          (msg.sender === user?.id && msg.receiver === userId) ||
          (msg.sender === userId && msg.receiver === user?.id)
      );
      dialogMsgs.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setDialogMessages(dialogMsgs);
      
      // Обновляем информацию о пользователе из сообщений, если не была установлена
      if (!selectedUser && dialogMsgs.length > 0) {
        const firstMsg = dialogMsgs[0];
        const otherUserId = firstMsg.sender === user?.id ? firstMsg.receiver : firstMsg.sender;
        const otherUsername = firstMsg.sender === user?.id 
          ? firstMsg.receiver_username || `User #${otherUserId}`
          : firstMsg.sender_username || `User #${otherUserId}`;
        
        setSelectedUser({
          id: otherUserId,
          username: otherUsername,
          email: '',
          role: 'student',
          level: 1,
          xp: 0,
          coins: 0,
          streak: 0,
        });
      }
      
      // Отмечаем сообщения как прочитанные
      const unreadMessages = dialogMsgs.filter(
        (msg) => !msg.is_read && msg.receiver === user?.id
      );
      for (const msg of unreadMessages) {
        await apiClient.markMessageRead(msg.id);
      }
      
      // Перезагружаем список сообщений для обновления счетчиков
      await loadMessages();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка загрузки диалога');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDialog || !messageText.trim()) return;
    
    try {
      await apiClient.sendMessage(selectedDialog, messageText);
      toast.success('Сообщение отправлено!');
      setMessageText('');
      await loadDialogMessages(selectedDialog);
      await loadMessages();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка отправки сообщения');
    }
  };

  const handleSearchUsers = async () => {
    if (!searchUsername.trim()) return;
    setSearching(true);
    try {
      const users = await apiClient.searchUsers(searchUsername);
      setSearchResults(users.filter(u => u.id !== user?.id)); // Исключаем текущего пользователя
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Ошибка поиска пользователей');
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = (userToChat: User) => {
    setSelectedDialog(userToChat.id);
    setSelectedUser(userToChat);
    setShowNewChatModal(false);
    setSearchUsername('');
    setSearchResults([]);
  };

  if (loading) {
    return <Loading />;
  }

  if (selectedDialog) {
    const dialogUser = selectedUser || dialogs.find((d) => d.user.id === selectedDialog)?.user;
    
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="secondary" size="sm" onClick={() => {
            setSelectedDialog(null);
            setSelectedUser(null);
          }}>
            ← Назад
          </Button>
          <h1 className="text-2xl md:text-3xl font-game text-rpg-gold">
            {dialogUser?.username || 'Диалог'}
          </h1>
        </div>

        <Card className="mb-4" style={{ height: '60vh', overflowY: 'auto' }}>
          <div className="space-y-4">
            {dialogMessages.length === 0 ? (
              <p className="text-center text-rpg-text-dim py-8">Нет сообщений</p>
            ) : (
              dialogMessages.map((msg) => {
                const isOwn = msg.sender === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        isOwn
                          ? 'bg-rpg-gold text-rpg-bg'
                          : 'bg-rpg-bg text-rpg-text border border-rpg-border'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <div className="text-xs mt-1 opacity-70">
                        {format(new Date(msg.created_at), 'dd MMM yyyy HH:mm', { locale: ru })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Написать сообщение..."
            className="flex-1"
            required
          />
          <Button type="submit">Отправить</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-game text-rpg-gold">💬 Сообщения</h1>
        <Button onClick={() => setShowNewChatModal(true)}>
          + Новый чат
        </Button>
      </div>

      {dialogs.length === 0 ? (
        <Card>
          <p className="text-center text-rpg-text-dim py-8">Нет диалогов. Начните новый чат!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {dialogs.map((dialog) => (
            <Card
              key={dialog.user.id}
              className="cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => {
                setSelectedDialog(dialog.user.id);
                setSelectedUser(dialog.user);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-rpg-purple flex items-center justify-center text-white font-bold">
                    {dialog.user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-rpg-text">{dialog.user.username}</div>
                    <div className="text-sm text-rpg-text-dim line-clamp-1">
                      {dialog.lastMessage.text}
                    </div>
                    <div className="text-xs text-rpg-text-dim">
                      {format(new Date(dialog.lastMessage.created_at), 'dd MMM yyyy HH:mm', {
                        locale: ru,
                      })}
                    </div>
                  </div>
                </div>
                {dialog.unreadCount > 0 && (
                  <div className="bg-rpg-gold text-rpg-bg rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {dialog.unreadCount}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showNewChatModal}
        onClose={() => {
          setShowNewChatModal(false);
          setSearchUsername('');
          setSearchResults([]);
        }}
        title="Начать новый чат"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
              placeholder="Введите имя пользователя..."
              className="flex-1"
            />
            <Button onClick={handleSearchUsers} disabled={searching || !searchUsername.trim()}>
              {searching ? 'Поиск...' : 'Найти'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((resultUser) => (
                  <Card
                  key={resultUser.id}
                  className="cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => handleStartChat(resultUser)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rpg-purple flex items-center justify-center text-white font-bold">
                      {resultUser.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-rpg-text">{resultUser.username}</div>
                      {resultUser.first_name || resultUser.last_name ? (
                        <div className="text-sm text-rpg-text-dim">
                          {[resultUser.first_name, resultUser.last_name].filter(Boolean).join(' ')}
                        </div>
                      ) : null}
                    </div>
                    <Button size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleStartChat(resultUser);
                    }}>
                      Написать
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {searchUsername && !searching && searchResults.length === 0 && (
            <p className="text-center text-rpg-text-dim py-4">
              Пользователи не найдены
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

