FROM python:3.12-alpine

RUN apk update && apk add --no-cache netcat-openbsd postgresql-client

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Копируем requirements и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем entrypoint.sh в корень файловой системы (не будет перезаписан volume)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Копируем остальные файлы
COPY . .

RUN addgroup --system django && adduser --system --ingroup django django

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
