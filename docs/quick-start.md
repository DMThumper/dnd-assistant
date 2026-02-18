# Quick Start

Инструкция для запуска проекта на новом компьютере.

## Требования

- Docker Desktop (для Windows/Mac) или Docker + docker-compose (Linux)
- Node.js 22 LTS
- Git

## Первый запуск

```bash
# 1. Клонировать репозиторий
git clone https://github.com/DMThumper/dnd-assistant.git
cd dnd-assistant

# 2. Скопировать env файлы
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 3. Запустить Docker (API + PostgreSQL + Redis + WebSocket)
npm run docker:up
# Подождать ~2 минуты при первом запуске (миграции, сидеры, генерация ключей)

# 4. Установить зависимости фронтенда и запустить
cd apps/web && npm install && npm run dev
```

## Что делает `npm run docker:up`

- Поднимает PostgreSQL 17, Redis 7, Mailpit (email testing)
- Собирает и запускает Laravel API на порту 8000
- Автоматически запускает миграции и сидеры
- Создаёт owner аккаунт (логин/пароль из .env)
- Генерирует Passport OAuth ключи
- Запускает queue worker для фоновых задач

## После запуска

| Сервис | URL |
|--------|-----|
| API | http://localhost:8000 |
| Frontend | http://localhost:3000 |
| Mailpit (email UI) | http://localhost:8025 |
| pgAdmin | http://localhost:5050 |

## Учётные данные по умолчанию

Из `.env.example`:
- **Owner**: owner@example.com / password
- **Player** (тестовый): player@example.com / password

## Полезные команды

```bash
# Логи API контейнера
docker logs dnd_api -f

# Зайти в контейнер API
docker exec -it dnd_api bash

# Перезапустить контейнер (после изменений в PHP)
docker restart dnd_api

# Сбросить всё и начать с нуля (УДАЛЯЕТ ДАННЫЕ)
npm run docker:reset && npm run docker:up
```

## WebSocket (Laravel Reverb)

WebSocket сервер запускается автоматически в контейнере на порту 8080.
Конфигурация для фронтенда уже настроена в `.env.local.example`.

## Известные проблемы

1. **Windows + WSL2**: Убедитесь что Docker Desktop использует WSL2 backend
2. **Первый запуск медленный**: Первая сборка образов может занять 3-5 минут
3. **Port already in use**: Остановите другие сервисы на портах 8000, 3000, 5432, 6379

## Docker контейнеры

| Container | Purpose | Port |
|-----------|---------|------|
| dnd_api | Laravel API (PHP 8.4) | 8000 |
| dnd_reverb | WebSocket server | 8080 |
| dnd_queue | Queue worker | - |
| dnd_postgres | PostgreSQL 17 | 5432 |
| dnd_redis | Redis 7 | 6379 |
| dnd_mailpit | Email testing | 8025, 1025 |
| dnd_pgadmin | Database admin | 5050 |

## Команды разработки

### Laravel (через Docker)

```bash
docker exec dnd_api php artisan <command>
docker exec dnd_api php artisan migrate
docker exec dnd_api php artisan db:seed
docker exec dnd_api php artisan tinker
```

### Тестирование

```bash
# Laravel tests
docker exec dnd_api php artisan test
docker exec dnd_api php artisan test --filter=TestName

# Frontend lint
npm run lint

# Frontend build (ВАЖНО: перед пушем!)
npm run build
```

**IMPORTANT:** Всегда запускай `npm run build` перед пушем. `npm run dev` НЕ проверяет типы.

### Docker

```bash
npm run docker:up      # Запустить контейнеры
npm run docker:down    # Остановить (данные сохраняются)
npm run docker:reset   # УДАЛИТЬ всё и начать заново
```
