import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-rpg-purple border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-rpg-gold border-t-transparent rounded-full animate-spin opacity-50" style={{ animationDirection: 'reverse' }}></div>
      </div>
    </div>
  );
};

