import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, TrophyIcon, UsersIcon, AwardIcon, ShopIcon, InventoryIcon, FriendsIcon, MessagesIcon, MenuIcon, XIcon } from '@/components/icons';

const navItems = [
  { path: '/', icon: HomeIcon, label: 'Главная' },
  { path: '/quests', icon: TrophyIcon, label: 'Квесты' },
  { path: '/groups', icon: UsersIcon, label: 'Группы' },
  { path: '/leaderboard', icon: TrophyIcon, label: 'Рейтинг' },
  { path: '/achievements', icon: AwardIcon, label: 'Достижения' },
  { path: '/shop', icon: ShopIcon, label: 'Магазин' },
  { path: '/inventory', icon: InventoryIcon, label: 'Инвентарь' },
  { path: '/friends', icon: FriendsIcon, label: 'Друзья' },
  { path: '/messages', icon: MessagesIcon, label: 'Сообщения' },
];

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 w-14 h-14 rpg-button-gold rounded-full shadow-rpg-gold-glow flex items-center justify-center md:hidden"
      >
        {isOpen ? <XIcon /> : <MenuIcon />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        >
          <nav
            className="absolute bottom-0 left-0 right-0 bg-rpg-bg-light border-t-2 border-rpg-purple rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-rpg-purple text-white shadow-rpg-glow'
                        : 'text-rpg-text hover:bg-rpg-bg'
                    }`}
                  >
                    <Icon />
                    <span className="font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Nav - Trigger Zone & Menu */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-30 group">
        {/* Trigger Zone - тонкая полоска слева для активации меню */}
        <div className="absolute left-0 top-0 bottom-0 w-8 cursor-pointer" />
        
        {/* Menu Container */}
        <nav className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out bg-rpg-bg-light border-r-2 border-rpg-purple rounded-r-2xl p-3 shadow-rpg-glow">
          <div className="flex flex-col gap-2 min-w-[200px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-rpg-purple text-white shadow-rpg-glow'
                      : 'bg-rpg-bg text-rpg-text hover:bg-rpg-purple hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

