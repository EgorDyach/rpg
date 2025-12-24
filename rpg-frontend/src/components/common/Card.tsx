import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  gold?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  gold = false,
  onClick,
}) => {
  const cardClass = gold ? 'rpg-card-gold' : 'rpg-card';
  return (
    <div
      className={`${cardClass} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

