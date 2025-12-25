FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы
COPY . .

# Открываем порт
EXPOSE 1488

# Запускаем dev сервер
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

