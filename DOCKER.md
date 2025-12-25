# Docker Compose инструкция

## Быстрый старт

1. **Создайте файл `.env` в корне проекта** (скопируйте пример ниже)

2. **Запустите все сервисы:**
```bash
docker-compose up -d
```

3. **Примените миграции:**
```bash
docker-compose exec backend python manage.py migrate
```

4. **Создайте суперпользователя:**
```bash
docker-compose exec backend python manage.py createsuperuser
```

5. **Готово!** Откройте:
   - Frontend: http://localhost:1488
   - Backend API: http://localhost:8000
   - Swagger: http://localhost:8000/api/docs/

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Database
POSTGRES_DB=rpg_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Django
DJANGO_SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Frontend
VITE_API_URL=http://localhost:8000/api
```

## Полезные команды

```bash
# Остановить все сервисы
docker-compose down

# Остановить и удалить volumes (очистить БД)
docker-compose down -v

# Просмотр логов
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Пересобрать контейнеры
docker-compose up -d --build

# Выполнить команду в контейнере
docker-compose exec backend python manage.py <command>
docker-compose exec frontend npm run <command>

# Генерация тестовых данных
docker-compose exec backend python manage.py generate_mock_data
```

## Структура сервисов

- **db** - PostgreSQL база данных (порт 5432)
- **backend** - Django REST API (порт 8000)
- **frontend** - React приложение (порт 1488)

Все сервисы находятся в одной сети `rpg_network` и могут общаться друг с другом по именам сервисов.

