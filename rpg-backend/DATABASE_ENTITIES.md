# Описание сущностей базы данных

## Основные сущности

### 1. User (Пользователь)

Расширенная модель пользователя Django (AbstractUser).

**Поля:**

- `id` - первичный ключ
- `username` - имя пользователя (уникальное)
- `email` - email (уникальный)
- `password` - хеш пароля
- `first_name`, `last_name` - имя и фамилия
- `role` - роль: "student" | "admin" (по умолчанию "student")
- `level` - уровень игрока (по умолчанию 1)
- `xp` - опыт (по умолчанию 0)
- `coins` - монеты (по умолчанию 0)
- `streak` - серия дней активности (по умолчанию 0)
- `last_active` - последняя активность (DateTime)
- `last_activity_date` - последний день активности (Date)
- `faculty` - факультет
- `group_name` - название группы
- `date_joined`, `is_active`, `is_staff`, `is_superuser` - стандартные поля Django

**Связи:**

- OneToOne → Profile
- OneToOne → LeaderboardEntry
- ForeignKey → Quest (created_quests)
- ForeignKey → Group (created_groups)
- ManyToMany → Group (members через user_groups)

**Индексы:**

- `[-xp, -coins]`
- `[-level]`

---

### 2. Profile (Профиль)

Расширенная информация о пользователе.

**Поля:**

- `id` - первичный ключ
- `user` - ForeignKey → User (OneToOne)
- `avatar` - URL аватара
- `bio` - биография
- `cosmetics` - JSON объект с косметикой
- `titles` - JSON массив титулов/достижений

**Связи:**

- OneToOne → User

---

### 3. Course (Курс)

Учебный курс.

**Поля:**

- `id` - первичный ключ
- `title` - название курса
- `code` - код курса (уникальный)
- `description` - описание

**Связи:**

- ForeignKey → Group (groups)

---

### 4. Group (Группа)

Группа пользователей для совместной работы.

**Поля:**

- `id` - первичный ключ
- `name` - название группы
- `description` - описание
- `course` - ForeignKey → Course (nullable)
- `created_by` - ForeignKey → User (создатель, nullable)
- `created_at` - дата создания
- `is_public` - публичная/приватная группа

**Связи:**

- ForeignKey → Course
- ForeignKey → User (created_by)
- ManyToMany → User (members)
- ForeignKey → QuestAssignment (quest_assignments)
- ForeignKey → GroupPost (posts)
- ForeignKey → GroupGoal (goals)

**Уникальность:**

- `(name, course)` - уникальная комбинация

---

### 5. Quest (Квест)

Задание/квест для выполнения.

**Поля:**

- `id` - первичный ключ
- `title` - название квеста
- `description` - описание
- `goal` - цель квеста
- `is_daily` - ежедневный квест
- `is_public` - публичный/личный квест
- `created_by` - ForeignKey → User (создатель, nullable)
- `active_from` - активен с (DateTime, nullable)
- `active_to` - активен до (DateTime, nullable)
- `deadline` - дедлайн (DateTime, nullable)
- `difficulty` - сложность: 1-5 (1=очень легкое, 5=эпическое)
- `xp_reward` - награда в XP
- `coin_reward` - награда в монетах
- `meta` - JSON объект с дополнительными данными
- `created_at` - дата создания
- `updated_at` - дата обновления

**Связи:**

- ForeignKey → User (created_by)
- ForeignKey → QuestAssignment (assignments)
- ForeignKey → QuestComment (comments)

**Индексы:**

- `[is_daily, difficulty]`
- `[is_public, created_by]`

---

### 6. QuestAssignment (Назначение квеста)

Связь пользователя с квестом (принятие квеста).

**Поля:**

- `id` - первичный ключ
- `quest` - ForeignKey → Quest
- `user` - ForeignKey → User
- `group` - ForeignKey → Group (nullable)
- `is_completed` - выполнено
- `completed_at` - дата выполнения (DateTime, nullable)
- `attempt_count` - количество попыток
- `due_date` - срок выполнения (Date, nullable)
- `xp_reward` - фактическая награда в XP
- `coin_reward` - фактическая награда в монетах
- `needs_review` - требует проверки
- `created_at` - дата создания

**Связи:**

- ForeignKey → Quest
- ForeignKey → User
- ForeignKey → Group (nullable)
- ForeignKey → QuestLike (likes)

**Уникальность:**

- `(quest, user, due_date)` - уникальная комбинация

**Индексы:**

- `[user, is_completed]`

---

### 7. QuestComment (Комментарий к квесту)

Комментарии пользователей к квестам.

**Поля:**

- `id` - первичный ключ
- `quest` - ForeignKey → Quest
- `user` - ForeignKey → User
- `text` - текст комментария
- `created_at` - дата создания
- `updated_at` - дата обновления

**Связи:**

- ForeignKey → Quest
- ForeignKey → User

**Сортировка:**

- По умолчанию: `-created_at` (новые сначала)

---

### 8. QuestLike (Лайк к выполненному квесту)

Лайки к выполненным квестам.

**Поля:**

- `id` - первичный ключ
- `quest_assignment` - ForeignKey → QuestAssignment
- `user` - ForeignKey → User
- `created_at` - дата создания

**Связи:**

- ForeignKey → QuestAssignment
- ForeignKey → User

**Уникальность:**

- `(quest_assignment, user)` - один пользователь может лайкнуть одно задание только один раз

---

### 9. Achievement (Достижение)

Достижение/достижение в системе.

**Поля:**

- `id` - первичный ключ
- `key` - уникальный ключ достижения
- `title` - название
- `description` - описание
- `xp_reward` - награда в XP
- `coin_reward` - награда в монетах
- `criteria` - JSON объект с критериями получения

**Связи:**

- ForeignKey → AchievementProgress (progress)

**Уникальность:**

- `key` - уникальный

---

### 10. AchievementProgress (Прогресс по достижению)

Прогресс пользователя по конкретному достижению.

**Поля:**

- `id` - первичный ключ
- `achievement` - ForeignKey → Achievement
- `user` - ForeignKey → User
- `achieved` - получено ли достижение
- `progress` - JSON объект с текущим прогрессом
- `achieved_at` - дата получения (DateTime, nullable)

**Связи:**

- ForeignKey → Achievement
- ForeignKey → User

**Уникальность:**

- `(achievement, user)` - один прогресс на пользователя и достижение

---

### 11. Item (Предмет)

Базовый предмет в системе.

**Поля:**

- `id` - первичный ключ
- `sku` - артикул (уникальный)
- `name` - название
- `description` - описание
- `item_type` - тип: "cosmetic" | "consumable" | "boost" | "other"
- `properties` - JSON объект с свойствами предмета
- `created_at` - дата создания

**Связи:**

- ForeignKey → StoreItem (store_entries)
- ForeignKey → InventoryItem
- ForeignKey → EquippedItem

**Уникальность:**

- `sku` - уникальный

---

### 12. StoreItem (Предмет в магазине)

Предмет, выставленный на продажу в магазине.

**Поля:**

- `id` - первичный ключ
- `item` - ForeignKey → Item
- `price` - цена
- `stock` - количество на складе (Integer, nullable, null = бесконечно)
- `purchase_limit` - лимит покупок на пользователя (nullable)
- `is_active` - активен ли для продажи

**Связи:**

- ForeignKey → Item

**Индексы:**

- `[price]`

---

### 13. InventoryItem (Предмет в инвентаре)

Предмет пользователя в инвентаре.

**Поля:**

- `id` - первичный ключ
- `user` - ForeignKey → User
- `item` - ForeignKey → Item
- `quantity` - количество
- `acquired_at` - дата получения
- `expires_at` - срок годности (DateTime, nullable)
- `data` - JSON объект с дополнительными данными

**Связи:**

- ForeignKey → User
- ForeignKey → Item

**Уникальность:**

- `(user, item)` - один тип предмета на пользователя (количество в quantity)

---

### 14. EquippedItem (Экипированный предмет)

Экипированные пользователем предметы (косметика).

**Поля:**

- `id` - первичный ключ
- `user` - ForeignKey → User
- `item` - ForeignKey → Item
- `slot` - слот экипировки (например: "head", "weapon", "back")
- `equipped_at` - дата экипировки

**Связи:**

- ForeignKey → User
- ForeignKey → Item

**Уникальность:**

- `(user, slot)` - один предмет на слот у пользователя

---

### 15. CurrencyTransaction (Транзакция валюты)

История изменений монет/валюты пользователя.

**Поля:**

- `id` - первичный ключ
- `user` - ForeignKey → User
- `delta` - изменение (положительное или отрицательное)
- `reason` - причина транзакции
- `meta` - JSON объект с метаданными
- `created_at` - дата создания

**Связи:**

- ForeignKey → User

**Индексы:**

- `[user, -created_at]` - сортировка по пользователю и дате

---

### 16. LeaderboardEntry (Запись в рейтинге)

Запись пользователя в рейтинге (кэш для быстрого доступа).

**Поля:**

- `id` - первичный ключ
- `user` - ForeignKey → User (OneToOne)
- `score` - счет (BigInteger)
- `rank` - место в рейтинге (nullable)
- `updated_at` - дата обновления

**Связи:**

- OneToOne → User

**Индексы:**

- `[-score]` - сортировка по счету (по убыванию)

---

### 17. Notification (Уведомление)

Уведомление пользователю.

**Поля:**

- `id` - первичный ключ
- `user` - ForeignKey → User
- `title` - заголовок
- `body` - текст уведомления
- `data` - JSON объект с дополнительными данными
- `is_read` - прочитано
- `created_at` - дата создания

**Связи:**

- ForeignKey → User

---

### 18. ActivityLog (Лог активности)

Лог активности пользователей (для аналитики).

**Поля:**

- `id` - первичный ключ
- `user` - ForeignKey → User (nullable)
- `verb` - действие (например: "quest_completed", "item_purchased")
- `data` - JSON объект с данными действия
- `created_at` - дата создания

**Связи:**

- ForeignKey → User (nullable)

---

### 19. FriendRequest (Заявка в друзья)

Заявка на добавление в друзья.

**Поля:**

- `id` - первичный ключ
- `from_user` - ForeignKey → User (отправитель)
- `to_user` - ForeignKey → User (получатель)
- `status` - статус: "pending" | "accepted" | "rejected"
- `created_at` - дата создания

**Связи:**

- ForeignKey → User (from_user)
- ForeignKey → User (to_user)

**Уникальность:**

- `(from_user, to_user)` - одна заявка между двумя пользователями

---

### 20. Message (Сообщение)

Личное сообщение между пользователями.

**Поля:**

- `id` - первичный ключ
- `sender` - ForeignKey → User (отправитель)
- `receiver` - ForeignKey → User (получатель)
- `text` - текст сообщения
- `created_at` - дата создания
- `is_read` - прочитано

**Связи:**

- ForeignKey → User (sender)
- ForeignKey → User (receiver)

---

### 21. GroupPost (Пост в группе)

Пост в группе (стена группы).

**Поля:**

- `id` - первичный ключ
- `group` - ForeignKey → Group
- `author` - ForeignKey → User
- `text` - текст поста
- `created_at` - дата создания
- `updated_at` - дата обновления

**Связи:**

- ForeignKey → Group
- ForeignKey → User (author)
- ForeignKey → GroupPostComment (comments)

**Сортировка:**

- По умолчанию: `-created_at` (новые сначала)

---

### 22. GroupPostComment (Комментарий к посту в группе)

Комментарий к посту в группе.

**Поля:**

- `id` - первичный ключ
- `post` - ForeignKey → GroupPost
- `author` - ForeignKey → User
- `text` - текст комментария
- `created_at` - дата создания
- `updated_at` - дата обновления

**Связи:**

- ForeignKey → GroupPost
- ForeignKey → User (author)

**Сортировка:**

- По умолчанию: `created_at` (старые сначала)

---

### 23. GroupGoal (Групповая цель)

Групповая цель для совместного выполнения.

**Поля:**

- `id` - первичный ключ
- `group` - ForeignKey → Group
- `title` - название цели
- `description` - описание
- `target_xp` - целевой XP
- `current_xp` - текущий XP
- `deadline` - дедлайн (DateTime, nullable)
- `is_completed` - выполнено
- `created_at` - дата создания
- `completed_at` - дата выполнения (DateTime, nullable)

**Связи:**

- ForeignKey → Group

---

## Диаграмма связей

```
User
 ├── OneToOne → Profile
 ├── OneToOne → LeaderboardEntry
 ├── ForeignKey → Quest (created_by)
 ├── ForeignKey → Group (created_by)
 ├── ManyToMany → Group (members)
 ├── ForeignKey → QuestAssignment
 ├── ForeignKey → QuestComment
 ├── ForeignKey → QuestLike
 ├── ForeignKey → AchievementProgress
 ├── ForeignKey → InventoryItem
 ├── ForeignKey → EquippedItem
 ├── ForeignKey → CurrencyTransaction
 ├── ForeignKey → Notification
 ├── ForeignKey → ActivityLog
 ├── ForeignKey → FriendRequest (from_user/to_user)
 ├── ForeignKey → Message (sender/receiver)
 └── ForeignKey → GroupPost

Quest
 ├── ForeignKey → User (created_by)
 ├── ForeignKey → QuestAssignment
 └── ForeignKey → QuestComment

QuestAssignment
 ├── ForeignKey → Quest
 ├── ForeignKey → User
 ├── ForeignKey → Group
 └── ForeignKey → QuestLike

Group
 ├── ForeignKey → Course
 ├── ForeignKey → User (created_by)
 ├── ManyToMany → User (members)
 ├── ForeignKey → QuestAssignment
 ├── ForeignKey → GroupPost
 └── ForeignKey → GroupGoal

Item
 ├── ForeignKey → StoreItem
 ├── ForeignKey → InventoryItem
 └── ForeignKey → EquippedItem

Achievement
 └── ForeignKey → AchievementProgress
```

## Особенности

1. **Индексы:** Оптимизированы для частых запросов (XP, монеты, уровень, рейтинг)
2. **Уникальность:** Защита от дублирования данных (например, один лайк на задание)
3. **JSON поля:** Гибкое хранение дополнительных данных (properties, meta, data)
4. **Мягкое удаление:** Использование SET_NULL для сохранения истории (created_by в Group)
5. **Временные метки:** Автоматическое отслеживание создания и обновления
