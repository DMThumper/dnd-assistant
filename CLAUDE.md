# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**D&D Assistant** — веб-платформа-помощник для **живых настольных сессий** D&D 5e. Это НЕ виртуальная таблица (не Foundry VTT, не Roll20). Цель — убрать бумажную волокиту, оставить кубики, отыгрыш и кайф от совместной игры.

### Философия

> Лучшая технология за столом — та, которая незаметна.

**Что система ДЕЛАЕТ:**
- Заменяет бумажные листы персонажей → телефон/планшет у каждого игрока
- Автоматический расчёт модификаторов, КД, бонусов
- Быстрый поиск заклинаний с фильтрами
- Пульт управления атмосферой для DM → музыка, сцены на ТВ
- Трекер битвы, таблицы случайностей, заметки

**Что система НЕ ДЕЛАЕТ:**
- Не заменяет живое общение
- Не заменяет физические кубики
- Не рисует карты и не двигает токены (не battlemap VTT)

### Сценарий использования

```
┌─────────────────────────────────────────────┐
│  📺 Большой экран (Display Client)          │
│  /display/screen — fullscreen, без UI       │
│                                             │
│  💻 Ноутбук DM                             │
│  /dashboard/* — backoffice, управление      │
│                                             │
│  📱📱📱 Телефоны игроков                   │
│  /player/* — лист персонажа                 │
│                                             │
│  🎲🎲🎲 Настоящие кубики на столе          │
└─────────────────────────────────────────────┘
```

## Documentation

Подробная документация разбита по темам:

| Документ | Содержание |
|----------|------------|
| [docs/quick-start.md](docs/quick-start.md) | Запуск проекта, Docker, команды |
| [docs/architecture.md](docs/architecture.md) | Tech stack, SOLID, структура проекта |
| [docs/database.md](docs/database.md) | PostgreSQL JSONB, модели, контент |
| [docs/api.md](docs/api.md) | API endpoints, services |
| [docs/frontend.md](docs/frontend.md) | Next.js, компоненты, паттерны |
| [docs/dnd-localization.md](docs/dnd-localization.md) | Русские термины D&D, метрическая система |
| [docs/security.md](docs/security.md) | Auth, authorization, WebSocket security |
| [docs/deployment.md](docs/deployment.md) | Coolify, environment, media |
| [docs/status.md](docs/status.md) | Текущий статус, TODO, приоритеты |

## Quick Start

```bash
# 1. Скопировать env файлы
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 2. Запустить Docker (API + PostgreSQL + Redis + WebSocket)
npm run docker:up

# 3. Запустить фронтенд
cd apps/web && npm install && npm run dev
```

После запуска:
- API: http://localhost:8000
- Frontend: http://localhost:3000
- Mailpit: http://localhost:8025

Логин: owner@example.com / password

## Tech Stack (краткий)

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 12, PHP 8.4 |
| Frontend | Next.js 16, React 19, TypeScript |
| Database | PostgreSQL 17 + JSONB |
| WebSocket | Laravel Reverb |
| Styling | Tailwind CSS 4, shadcn/ui |

## Current Status

**Реализовано:**
- ✅ Auth + Roles (owner/dm/player)
- ✅ Campaigns, Acts, Sessions CRUD
- ✅ Characters + Level Up + Inspiration
- ✅ DM Control Panel (HP, XP, conditions, custom rules, inventory, spells)
- ✅ WebSocket real-time sync
- ✅ Live Sessions с presence

**TODO:**
- ❌ Display Client (TV mode)
- ❌ Battle Tracker
- ❌ Dice roller
- ❌ Scene Editor
- ❌ Character creation wizard

См. [docs/status.md](docs/status.md) для подробностей.

## Key Commands

```bash
# Docker
npm run docker:up       # Запустить
npm run docker:down     # Остановить
npm run docker:reset    # Сбросить всё

# Laravel (через Docker)
docker exec dnd_api php artisan migrate
docker exec dnd_api php artisan db:seed
docker exec dnd_api php artisan test

# Frontend
npm run dev             # Dev server
npm run build           # ВАЖНО: перед пушем!
npm run lint
```

## Project Structure

```
dnd-assistant/
├── apps/
│   ├── api/            # Laravel 12 API
│   └── web/            # Next.js 16 Frontend
├── docs/               # Документация
├── docker-compose.yml
└── CLAUDE.md           # Этот файл
```

## Coding Conventions

- Reference: XStream project (`C:\Projects\xstream-next`)
- API response: `{ success: true, data: {...}, meta: {...} }`
- TypeScript strict mode
- Всегда `npm run build` перед пушем
- Русский язык для всего контента D&D
- Метрическая система (метры, килограммы)

## WebSocket Channels

- `campaign.{id}` — presence channel (кто онлайн)
- `campaign.{id}.battle` — трекер битвы
- `campaign.{id}.display` — управление ТВ
- `private-character.{id}` — приватный канал DM ↔ игрок
