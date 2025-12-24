#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
# Используем переменные из docker-compose или значения по умолчанию
POSTGRES_HOST=${POSTGRES_HOST:-db}
POSTGRES_PORT=${POSTGRES_PORT:-5432}

until nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
  echo "Waiting for PostgreSQL at $POSTGRES_HOST:$POSTGRES_PORT..."
  sleep 1
done

echo "PostgreSQL is available"

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting Django server..."
exec python manage.py runserver 0.0.0.0:8000
