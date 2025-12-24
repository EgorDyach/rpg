import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData);
      navigate('/');
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rpg-bg via-rpg-bg-light to-rpg-bg">
      <Card gold className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-game text-rpg-gold mb-2">⚔️ RPG Quest</h1>
          <p className="text-rpg-text-dim">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Логин"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            autoFocus
          />
          <Input
            label="Пароль"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-rpg-text-dim">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-rpg-gold hover:underline font-semibold">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

