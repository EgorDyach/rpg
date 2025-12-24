import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    faculty: '',
    group: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        faculty: formData.faculty || undefined,
        group: formData.group || undefined,
      });
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
          <p className="text-rpg-text-dim">Создайте новый аккаунт</p>
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
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Пароль"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Input
            label="Подтвердите пароль"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
          <Input
            label="Факультет (опционально)"
            type="text"
            value={formData.faculty}
            onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
          />
          <Input
            label="Группа (опционально)"
            type="text"
            value={formData.group}
            onChange={(e) => setFormData({ ...formData, group: e.target.value })}
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-rpg-text-dim">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-rpg-gold hover:underline font-semibold">
              Войти
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

