# Architecture

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Backend | Laravel | 12.x | REST API + WebSocket broadcasting с Passport OAuth2 |
| Frontend | Next.js | 16.x | SSR/SSG + SPA для всех клиентов |
| Language (BE) | PHP | 8.4 | Typed constants, readonly props |
| Language (FE) | TypeScript | 5.x (strict mode) | Type safety |
| React | React | 19.x | Server Components, React Compiler |
| Styling | Tailwind CSS | 4.x | CSS-first config |
| UI Components | shadcn/ui | latest | Radix-based |
| Database | PostgreSQL | 17 | JSONB, GIN indexes |
| Cache/Queue | Redis | 7.x | Sessions, cache, queues, broadcasting |
| Real-time | Laravel Reverb | latest | WebSocket |
| File Storage | S3 + CloudFront | — | Media |
| Deployment | Coolify | latest | Self-hosted PaaS |

## Architecture Principles

### SOLID

**S — Single Responsibility:**
- Controller — только HTTP (валидация, ответ)
- Model — data access, scopes, relations
- Service — бизнес-логика (`DiceService`, `CharacterCreatorService`)
- Event/Listener — side effects (broadcasting, уведомления)

**O — Open/Closed:**
- Spell effects, damage types, conditions — расширяемы через JSONB
- Overrides в сеттингах модифицируют контент без изменения оригинала

**L — Liskov Substitution:**
- Все API responses: `{ success: bool, data: {...}, meta?: {...} }`
- Все translatable модели: trait `HasTranslations`

**I — Interface Segregation:**
- Player API и Backoffice API — разные контроллеры
- Player видит упрощённые данные, DM видит полные

**D — Dependency Injection:**
- Services через constructor / method injection
- Конфигурация через `RuleSystem` model, не хардкод

### KISS

- JSONB вместо нормализации для данных, которые читаются целиком
- `useState`/`useEffect` вместо state managers
- Один Laravel монолит, не микросервисы
- REST, не GraphQL

### DRY

- Traits: `FormatsWithTranslations`, `HasSlug`
- Form Requests для повторяющейся валидации
- TypeScript types для JSONB структур

### YAGNI

- Нет мультитенантности
- Нет GraphQL
- Нет микросервисов
- Нет PWA/offline
- Нет AI-DM

## Client Architecture

Все клиенты — один Next.js app с разными route groups:

```
(landing)    → /              — 🌐 Лендинг
(auth)       → /login         — 🔐 Авторизация
(player)     → /player/*      — 📱 Телефон игрока (mobile-first)
(dashboard)  → /dashboard/*   — 💻 Backoffice DM (desktop-first)
(display)    → /display/*     — 📺 ТВ/монитор (fullscreen)
```

Синхронизация через **WebSocket** (Laravel Broadcasting + Redis):
- DM меняет сцену → на ТВ обновляется фон и музыка
- DM начинает битву → у игроков появляется инициатива
- Игрок получает урон → DM видит обновлённые HP

## Roles & Authentication

| Role | Access | Description |
|------|--------|-------------|
| `owner` | Всё | Владелец инстанса, суперпользователь |
| `dm` | Backoffice + display | Мастер подземелий |
| `player` | Player client | Игрок, видит только свои данные |
| `guest` | Landing | Неавторизованный |

**Иерархия:**
```
owner (всё)
  └─ dm (backoffice + display)
       └─ player (только player client)
            └─ guest (только landing)
```

## Project Structure

```
dnd-assistant/
├── apps/
│   ├── api/                    # Laravel 12 API
│   │   ├── app/
│   │   │   ├── Http/Controllers/Api/V1/
│   │   │   │   ├── Auth/
│   │   │   │   ├── Player/
│   │   │   │   ├── Backoffice/
│   │   │   │   └── Display/
│   │   │   ├── Models/
│   │   │   ├── Services/
│   │   │   ├── Events/
│   │   │   └── Traits/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeders/
│   │   └── routes/api.php
│   │
│   └── web/                    # Next.js 16 Frontend
│       ├── src/
│       │   ├── app/[locale]/
│       │   │   ├── (auth)/
│       │   │   ├── (landing)/
│       │   │   ├── (player)/
│       │   │   ├── (dashboard)/
│       │   │   └── (display)/
│       │   ├── components/
│       │   ├── contexts/
│       │   ├── hooks/
│       │   ├── lib/
│       │   └── types/
│       └── messages/
│
├── docs/                       # Документация
├── docker-compose.yml
└── CLAUDE.md
```

## WebSocket Channels

- `campaign.{id}` — общий канал кампании (presence channel)
- `campaign.{id}.battle` — трекер битвы
- `campaign.{id}.display` — управление ТВ (только DM → Display)
- `private-character.{id}` — приватный канал DM ↔ игрок

## Key Events

- `SceneChanged` — смена сцены на ТВ
- `MusicChanged` — смена музыки
- `BattleUpdated` — обновление трекера битвы
- `CharacterUpdated` — изменение HP/состояния персонажа
- `ChoicePresented` — экран выбора на ТВ
