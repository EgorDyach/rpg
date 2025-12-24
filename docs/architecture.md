# Архитектурная схема RPG Quest

## Общая архитектура

```
┌─────────────────┐
│   Браузер       │
│  (React App)    │
└────────┬────────┘
         │ HTTP/HTTPS
         │ JSON
         ▼
┌─────────────────┐
│  Frontend       │
│  Server (Vite)  │
│  :1488          │
└────────┬────────┘
         │
         │ API Requests
         │ (Axios)
         ▼
┌─────────────────┐
│  Backend API    │
│  (Django)       │
│  :8000          │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────┐   ┌─────────────────┐
│  Database   │   │  JWT Auth       │
│ (SQLite/   │   │  System         │
│ PostgreSQL)│   │                 │
└─────────────┘   └─────────────────┘
```

## Детальная схема компонентов

### Frontend Layer (React)

```
┌─────────────────────────────────────┐
│         React Application           │
├─────────────────────────────────────┤
│  Pages:                              │
│  - Home (активные квесты)            │
│  - Quests (список квестов)          │
│  - Groups (группы)                  │
│  - Leaderboard (рейтинг)            │
│  - Profile (профиль)                │
│  - Achievements (достижения)        │
│  - Shop (магазин)                   │
│  - Inventory (инвентарь)            │
├─────────────────────────────────────┤
│  Components:                         │
│  - Layout (Header, Navigation)      │
│  - Common (Button, Card, Modal)     │
│  - Forms (QuestForm, etc.)          │
├─────────────────────────────────────┤
│  Contexts:                           │
│  - AuthContext (аутентификация)     │
├─────────────────────────────────────┤
│  API Client:                         │
│  - Axios instance                    │
│  - JWT token management              │
│  - Request interceptors              │
└─────────────────────────────────────┘
```

### Backend Layer (Django)

```
┌─────────────────────────────────────┐
│         Django Application          │
├─────────────────────────────────────┤
│  API Layer (DRF):                   │
│  - ViewSets (CRUD операции)         │
│  - Serializers (валидация)          │
│  - Permissions (права доступа)      │
│  - URL routing                       │
├─────────────────────────────────────┤
│  Business Logic:                     │
│  - utils.py (XP, уровни)            │
│  - Signals (автоматические действия) │
│  - Middleware (CORS, auth)          │
├─────────────────────────────────────┤
│  Data Layer:                         │
│  - Models (ORM)                      │
│  - Migrations                        │
│  - Database queries                  │
└─────────────────────────────────────┘
```

## Поток обработки запроса

### 1. Аутентификация

```
User → Frontend → POST /api/token/
                ↓
            Django API
                ↓
        JWT Token Generation
                ↓
        Response: {access, refresh}
                ↓
        Frontend: сохраняет в localStorage
```

### 2. Создание квеста

```
User → Frontend Form → POST /api/quests/
                     ↓
                 Django API
                     ↓
            JWT Authentication Check
                     ↓
            Permission Check (IsAuthenticated)
                     ↓
            Serializer Validation
                     ↓
            Model Creation (Quest)
                     ↓
            Signal: создание уведомлений
                     ↓
            Response: Quest object
                     ↓
        Frontend: обновление UI
```

### 3. Выполнение квеста

```
User → Frontend → POST /api/assignments/{id}/complete/
                ↓
            Django API
                ↓
        QuestAssignment update
                ↓
        add_xp_to_user() → level up check
                ↓
        update_streak()
                ↓
        check_achievements()
                ↓
        Notification creation
                ↓
        Response: updated assignment
                ↓
    Frontend: обновление статистики
```

## Компоненты и их взаимодействие

### 1. Браузер
- **Роль**: Отображение UI, обработка пользовательских действий
- **Технологии**: React, TypeScript, Tailwind CSS
- **Взаимодействие**: Отправка HTTP запросов к API

### 2. Frontend Server (Vite)
- **Роль**: Dev-сервер, сборка статических файлов
- **Технологии**: Vite, ESBuild
- **Взаимодействие**: Проксирование API запросов (в dev режиме)

### 3. Backend API (Django)
- **Роль**: Обработка бизнес-логики, предоставление REST API
- **Технологии**: Django, DRF, JWT
- **Взаимодействие**: 
  - Прием HTTP запросов
  - Взаимодействие с БД
  - Генерация ответов в JSON

### 4. Database
- **Роль**: Хранение данных
- **Технологии**: SQLite (dev), PostgreSQL (prod)
- **Взаимодействие**: ORM запросы от Django

### 5. JWT Authentication
- **Роль**: Аутентификация и авторизация
- **Технологии**: djangorestframework-simplejwt
- **Взаимодействие**: Проверка токенов в каждом запросе

## Особенности архитектуры

### Stateless API
- Backend не хранит состояние сессии
- Аутентификация через JWT токены
- Каждый запрос независим

### Автоматические процессы
- Сигналы Django для автоматических действий
- Проверка достижений при выполнении квестов
- Автоматическое начисление наград

### Масштабируемость
- Разделение frontend и backend
- Возможность горизонтального масштабирования backend
- Кэширование рейтингов (LeaderboardEntry)

### Безопасность
- JWT токены с истечением срока действия
- CORS настройки
- Фильтрация нецензурных слов
- Права доступа на уровне ViewSet

