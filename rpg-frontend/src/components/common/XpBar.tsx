import React from 'react';

interface XpBarProps {
  current: number;
  max: number;
  level: number;
  showLabel?: boolean;
}

export const XpBar: React.FC<XpBarProps> = ({
  current,
  max,
  level,
  showLabel = true,
}) => {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const xpForNextLevel = max - current;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="font-semibold text-rpg-gold">Уровень {level}</span>
          <span className="text-rpg-text-dim">
            {current} / {max} XP
          </span>
        </div>
      )}
      <div className="xp-bar">
        <div
          className="xp-bar-fill"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {showLabel && xpForNextLevel > 0 && (
        <p className="mt-1 text-xs text-rpg-text-dim text-center">
          До следующего уровня: {xpForNextLevel} XP
        </p>
      )}
    </div>
  );
};

