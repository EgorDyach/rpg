import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold mb-2 text-rpg-text">
          {label}
        </label>
      )}
      <input className={`rpg-input ${error ? 'border-rpg-red' : ''} ${className}`} {...props} />
      {error && <p className="mt-1 text-sm text-rpg-red">{error}</p>}
    </div>
  );
};

