import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserIcon, LogOutIcon, BellIcon } from '@/components/icons';
import { XpBar } from '@/components/common/XpBar';
import { apiClient } from '@/api/client';
import type { Notification } from '@/types';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await apiClient.getNotifications();
      setNotifications(data.filter((n) => !n.is_read));
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiClient.markNotificationRead(id);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  if (!user) return null;

  const xpForNextLevel = user.level * 100;
  const currentXp = user.xp % 100;

  return (
    <header className="sticky top-0 z-20 bg-rpg-bg-light border-b-2 border-rpg-purple shadow-rpg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo/Title */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-game text-rpg-gold">⚔️ RPG</div>
            <span className="hidden sm:inline text-lg font-display font-bold text-rpg-text">
              Quest
            </span>
          </Link>

          {/* User Info - Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="text-right">
              <div className="text-sm font-semibold text-rpg-gold">{user.username}</div>
              <div className="text-xs text-rpg-text-dim">Lv.{user.level}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-rpg-purple flex items-center justify-center text-white font-bold">
              {user.username[0].toUpperCase()}
            </div>
          </div>

          {/* User Info - Desktop */}
          <div className="hidden md:flex md:items-center md:gap-4 md:flex-1 md:max-w-md md:ml-8">
            <XpBar
              current={currentXp}
              max={xpForNextLevel}
              level={user.level}
              showLabel={false}
            />
            <div className="flex items-center gap-2">
              <span className="text-rpg-gold font-bold">💰 {user.coins}</span>
              <span className="text-rpg-green font-bold">🔥 {user.streak}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-rpg-bg transition-colors"
              >
                <BellIcon />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-rpg-red rounded-full text-xs flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 rpg-card z-50 max-h-96 overflow-y-auto">
                  <div className="font-bold mb-2 text-rpg-gold">Уведомления</div>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-rpg-text-dim">Нет новых уведомлений</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-2 bg-rpg-bg rounded cursor-pointer hover:bg-rpg-bg-light"
                          onClick={() => markAsRead(notif.id)}
                        >
                          <p className="text-sm font-semibold">{notif.title}</p>
                          <p className="text-sm text-rpg-text-dim">{notif.body}</p>
                          <p className="text-xs text-rpg-text-dim mt-1">
                            {new Date(notif.created_at).toLocaleString('ru-RU')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile & Logout */}
            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rpg-bg transition-colors"
            >
              <UserIcon />
              <span className="font-semibold">{user.username}</span>
            </Link>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-rpg-red hover:text-white transition-colors"
              title="Выйти"
            >
              <LogOutIcon />
            </button>
          </div>
        </div>

        {/* XP Bar - Mobile */}
        <div className="md:hidden mt-3">
          <XpBar current={currentXp} max={xpForNextLevel} level={user.level} />
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-rpg-gold font-bold">💰 {user.coins}</span>
            <span className="text-rpg-green font-bold">🔥 {user.streak}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

