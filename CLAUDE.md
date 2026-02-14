# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**D&D Assistant** — веб-платформа-помощник для **живых настольных сессий** D&D 5e. Это НЕ виртуальная таблица (не Foundry VTT, не Roll20). Цель — собрать людей за одним столом, убрать бумажную волокиту, оставить кубики, отыгрыш и кайф от совместной игры.

### Философия проекта

> Лучшая технология за столом — та, которая незаметна. Она не заменяет живое общение, а убирает всё, что мешает играть.

**Что система ДЕЛАЕТ:**
- Заменяет стопки бумажных листов персонажей → планшет/телефон у каждого игрока
- Заменяет ручной подсчёт → автоматический расчёт модификаторов, КД, бонусов
- Заменяет «подожди, сейчас найду заклинание» → быстрый поиск с фильтрами
- Убирает создание персонажа на 2 часа → пошаговый мастер за 10 минут
- Даёт Мастеру удобный пульт управления атмосферой → музыка, сцены на большом экране
- Автоматизирует рутину Мастера → трекер битвы, таблицы случайностей, заметки

**Что система НЕ ДЕЛАЕТ:**
- Не заменяет живое общение (нет чата, нет видео)
- Не заменяет физические кубики (бросок в приложении — опция, не обязанность)
- Не рисует карты и не двигает токены (это не battlemap VTT)
- Не играет за Мастера (это инструмент, не AI-ведущий)

### Сценарий использования

```
Комната для игры:
┌─────────────────────────────────────────────┐
│                                             │
│   📺 Большой экран (Display Client)         │
│   Атмосферные сцены, музыка, экраны выбора  │
│   /display/screen — fullscreen, без UI      │
│                                             │
│   ┌─────────┐                               │
│   │ 💻 DM   │  Ноутбук Мастера             │
│   │ Back-   │  /dashboard/* — backoffice    │
│   │ office  │  Кампании, битвы, сцены,      │
│   │         │  пульт управления ТВ          │
│   └─────────┘                               │
│                                             │
│   📱 Игрок 1   📱 Игрок 2   📱 Игрок 3    │
│   /player/*    /player/*    /player/*      │
│   Лист         Лист         Лист           │
│   персонажа    персонажа    персонажа      │
│                                             │
│   🎲🎲🎲 Настоящие кубики на столе 🎲🎲🎲  │
│                                             │
└─────────────────────────────────────────────┘
Все на одном сайте, у каждого свой экран.

А тем временем на сайте:
🌐 Гость (аноним) → Видит красивый лендинг → "Хочу играть!" → Регистрация
```

Система из четырёх интерфейсов, объединённых общим бэкендом:

1. **Landing** (🌐 любой браузер) — красивая страница о проекте для гостей, кнопка регистрации
2. **Player Client** (📱 телефон/планшет) — лист персонажа, инвентарь, заклинания, автоматический создатель персонажа, опциональный бросок кубиков
3. **Dashboard / Backoffice** (💻 ноутбук DM) — управление кампаниями, таблицы случайностей, трекер битв, заметки, NPC, монстры, пульт управления Display, управление пользователями
4. **Display Client** (📺 ТВ/монитор) — большой экран в комнате: сцены, иллюстрации, музыка, экраны выбора (стиль Pillars of Eternity / Baldur's Gate)

Монорепозиторий с архитектурой, основанной на reference-проекте XStream (`C:\Projects\xstream-next`).

## Tech Stack

Новый проект — используем последние стабильные версии всех технологий (февраль 2026).

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Backend | Laravel | 12.x | REST API + WebSocket broadcasting с Passport OAuth2 |
| Frontend | Next.js | 16.x (Turbopack by default) | SSR/SSG + SPA для всех клиентов |
| Language (BE) | PHP | 8.4 | Typed constants, readonly props, arrow functions |
| Language (FE) | TypeScript | 5.x (strict mode) | Type safety на всём фронте |
| React | React | 19.x | Server Components, ref as prop, React Compiler |
| Styling | Tailwind CSS | 4.x | CSS-first config (`@theme`), Vite plugin, no `tailwind.config.js` |
| UI Components | shadcn/ui | latest | Radix-based, Tailwind-styled |
| Database | PostgreSQL | 17 | JSONB, GIN indexes, full-text search |
| Cache/Queue | Redis | 7.x | Sessions, cache, job queues, broadcasting |
| Real-time | Laravel Reverb / Pusher | latest | WebSocket для синхронизации в реальном времени |
| File Storage | S3 + CloudFront | — | Медиа: иллюстрации сцен, музыка, портреты |
| Email | AWS SES | — | Верификация email, уведомления |
| Deployment | Coolify | latest | Self-hosted PaaS с Caddy proxy (AWS) |
| Containers | Docker | — | Local dev + production |
| Runtime | Node.js | 22 LTS | Frontend build и dev server |

**Tailwind CSS v4 — ключевые отличия от v3:**
- CSS-first конфигурация через `@theme` вместо `tailwind.config.js`
- Импорт одной строкой: `@import "tailwindcss"` (без `@tailwind` директив)
- Автоматическое обнаружение файлов (не нужен `content: [...]`)
- Vite plugin вместо PostCSS (`@tailwindcss/vite`)
- CSS layers (`@layer theme, base, components, utilities`)
- Встроенные container queries без плагина

**Next.js 16 — ключевые фичи:**
- Turbopack по умолчанию (для dev и build)
- Cache Components + `"use cache"` directive
- React Compiler (stable) — автоматическая мемоизация
- Build Adapters API
- Layout deduplication при prefetching

## Architecture Principles

### SOLID

**S — Single Responsibility:**
- Controller — только HTTP (валидация, ответ), бизнес-логика в Services
- Model — data access, scopes, relations. Не бизнес-логика
- Service — бизнес-логика (`DiceService`, `CharacterCreatorService`, `BattleTrackerService`)
- Event/Listener — side effects (broadcasting, уведомления)

```php
// ❌ Плохо — контроллер делает всё
class CharacterController {
    public function levelUp(Character $character) {
        $character->level++;
        $character->max_hp += rand(1, $character->hitDie) + $character->constitutionModifier;
        $character->save();
        broadcast(new CharacterUpdated($character));
        return response()->json($character);
    }
}

// ✅ Хорошо — контроллер делегирует сервису
class CharacterController {
    public function levelUp(Character $character, CharacterService $service): JsonResponse {
        $character = $service->levelUp($character);
        return response()->json(['success' => true, 'data' => $character]);
    }
}
```

**O — Open/Closed:**
- Spell effects, damage types, conditions — расширяемы через конфиг и JSONB
- Новый контент добавляется и привязывается к сеттингам через тот же API
- Overrides в сеттингах позволяют модифицировать существующий контент без изменения оригинала

**L — Liskov Substitution:**
- Все API responses: `{ success: bool, data: {...}, meta?: {...}, message?: string }`
- Все translatable модели: trait `HasTranslations` + `formatTranslationsForApi()`

**I — Interface Segregation:**
- Player API и Backoffice API — разные контроллеры, разные ответы
- Player видит упрощённые данные (имя, КД, ОЗ), DM видит полные (действия, тактика)

**D — Dependency Injection:**
- Services через constructor / method injection
- Конфигурация через `RuleSystem` model и `config/app-dnd.php`, не хардкод
- Storage через `StorageService`, не прямой вызов S3

### KISS — Keep It Simple, Stupid

- Не усложняй раньше времени. Простое решение → рефактор когда болит
- JSONB вместо нормализации для данных, которые читаются целиком
- `useState`/`useEffect` вместо state managers, пока не станет тесно
- Один Laravel монолит, не микросервисы
- REST, не GraphQL

### DRY — Don't Repeat Yourself

- Traits: `FormatsWithTranslations`, `HasSlug`
- Form Requests для повторяющейся валидации
- TypeScript types для JSONB структур (`types/character.ts`, `types/spell.ts`)
- Правила игры — в модели `RuleSystem` (JSONB), не размазаны по коду
- Общие UI паттерны — в shadcn/ui компоненты

### YAGNI — You Aren't Gonna Need It

- Нет мультитенантности
- Нет GraphQL — REST достаточно
- Нет микросервисов — монолит
- Нет PWA/offline
- Нет AI-DM — это инструмент, не замена Мастеру

### Дополнительные принципы

**Composition over Inheritance:**
- React: composable hooks (`useDiceRoller`, `useBattleTracker`) вместо HOC
- Laravel: traits вместо глубоких иерархий классов

**Fail Fast:**
- Form Requests — валидация на входе
- TypeScript strict mode — ошибки при компиляции
- `npm run build` перед каждым пушем

**Convention over Configuration:**
- Slug из русского названия — автоматически
- Seeders idempotent (`updateOrCreate`)
- API response format единообразный
- `snake_case` в API, `camelCase` в TypeScript

**Separation of Concerns (Frontend):**
- `lib/` — утилиты и API клиент (без UI)
- `hooks/` — бизнес-логика React (состояние, side effects)
- `components/` — UI компоненты (отображение)
- `contexts/` — глобальное состояние (auth, campaign, websocket)
- `types/` — TypeScript типы (контракты данных)

## Project Structure

```
dnd-assistant/
├── apps/
│   ├── api/                        # Laravel 12 API
│   │   ├── app/
│   │   │   ├── Http/Controllers/Api/V1/
│   │   │   │   ├── Auth/           # Login, Register, Verification
│   │   │   │   ├── Player/         # Player-facing endpoints (role: player)
│   │   │   │   ├── Backoffice/     # DM backoffice CRUD (role: owner + dm)
│   │   │   │   │   ├── RuleSystemController.php
│   │   │   │   │   ├── SettingController.php
│   │   │   │   │   ├── CampaignController.php
│   │   │   │   │   ├── SessionController.php
│   │   │   │   │   ├── SceneController.php
│   │   │   │   │   ├── EncounterController.php
│   │   │   │   │   ├── BattleController.php
│   │   │   │   │   ├── NpcController.php
│   │   │   │   │   ├── RandomTableController.php
│   │   │   │   │   ├── MonsterController.php
│   │   │   │   │   ├── SpellController.php
│   │   │   │   │   ├── ItemController.php
│   │   │   │   │   ├── SoundtrackController.php
│   │   │   │   │   ├── NoteController.php
│   │   │   │   │   ├── UserController.php       # Owner only
│   │   │   │   │   └── MediaController.php
│   │   │   │   ├── Display/        # Display client endpoints
│   │   │   │   └── Public/         # Public/landing endpoints
│   │   │   ├── Models/
│   │   │   │   ├── RuleSystem.php
│   │   │   │   ├── Setting.php
│   │   │   │   ├── Campaign.php
│   │   │   │   ├── Character.php
│   │   │   │   ├── CharacterClass.php
│   │   │   │   ├── Race.php
│   │   │   │   ├── Spell.php
│   │   │   │   ├── Item.php
│   │   │   │   ├── Monster.php
│   │   │   │   ├── Npc.php
│   │   │   │   ├── Encounter.php
│   │   │   │   ├── Session.php
│   │   │   │   ├── RandomTable.php
│   │   │   │   ├── Scene.php
│   │   │   │   ├── SceneConnection.php
│   │   │   │   ├── BattleSession.php
│   │   │   │   ├── BattleParticipant.php
│   │   │   │   ├── CampaignNote.php
│   │   │   │   ├── Soundtrack.php
│   │   │   │   └── Rule.php
│   │   │   ├── Services/
│   │   │   │   ├── ContentService.php          # Контент для кампании (Setting pivot + overrides)
│   │   │   │   ├── SceneTreeService.php        # Управление деревом сцен (CRUD, связи, порядок)
│   │   │   │   ├── DiceService.php
│   │   │   │   ├── CharacterCreatorService.php
│   │   │   │   ├── BattleTrackerService.php
│   │   │   │   ├── RandomTableService.php
│   │   │   │   └── DisplaySyncService.php
│   │   │   ├── Events/             # WebSocket broadcast events
│   │   │   │   ├── SceneChanged.php
│   │   │   │   ├── MusicChanged.php
│   │   │   │   ├── BattleUpdated.php
│   │   │   │   ├── CharacterUpdated.php
│   │   │   │   ├── DiceRolled.php
│   │   │   │   ├── ChoicePresented.php
│   │   │   │   ├── DisplayText.php
│   │   │   │   └── DisplayBlackout.php
│   │   │   └── Traits/
│   │   ├── config/
│   │   │   ├── dnd.php             # Game rules config (ability scores, skills, etc.)
│   │   │   ├── upload.php
│   │   │   └── content.php
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeders/
│   │   │       ├── RolesAndPermissionsSeeder.php
│   │   │       ├── RuleSystemsSeeder.php    # D&D 5e: характеристики, формулы, боёвка
│   │   │       ├── SettingsSeeder.php       # Eberron (первый сеттинг)
│   │   │       ├── SpellsSeeder.php         # Заклинания + привязка к сеттингам
│   │   │       ├── MonstersSeeder.php       # Монстры + привязка к сеттингам
│   │   │       ├── ItemsSeeder.php          # Предметы + привязка к сеттингам
│   │   │       ├── RacesSeeder.php          # Расы + привязка к сеттингам
│   │   │       ├── ClassesSeeder.php        # Классы + привязка к сеттингам
│   │   │       └── RulesSeeder.php          # Core rules reference
│   │   ├── docker/
│   │   └── routes/api.php
│   │
│   └── web/                        # Next.js 16 Frontend
│       ├── src/
│       │   ├── app/[locale]/
│       │   │   ├── (auth)/         # Login, register
│       │   │   ├── (landing)/      # Landing page (guest/anonymous — о проекте)
│       │   │   ├── (player)/       # Player client pages (mobile-first, role: player)
│       │   │   │   ├── campaigns/  # Выбор кампании
│       │   │   │   ├── characters/ # Выбор персонажа + кладбище
│       │   │   │   ├── create/     # Мастер создания персонажа (wizard)
│       │   │   │   ├── sheet/[id]/ # Лист персонажа (основной экран)
│       │   │   │   ├── spellbook/  # Книга заклинаний
│       │   │   │   ├── inventory/  # Инвентарь и снаряжение
│       │   │   │   └── dice/       # Роллер кубиков (опционально)
│       │   │   ├── (dashboard)/    # Backoffice DM (desktop-first, role: owner + dm)
│       │   │   │   ├── dashboard/
│       │   │   │   │   ├── rule-systems/    # Системы правил (D&D 5e, Warhammer, etc.)
│       │   │   │   │   ├── settings/        # Сеттинги (миры: Eberron, Forgotten Realms)
│       │   │   │   │   ├── campaigns/       # CRUD кампаний (привязка к сеттингу)
│       │   │   │   │   ├── campaign/[id]/   # Управление конкретной кампанией
│       │   │   │   │   │   ├── acts/        # Акты кампании (сюжетные арки)
│       │   │   │   │   │   ├── act/[id]/    # Управление конкретным актом
│       │   │   │   │   │   │   ├── sessions/    # Сессии внутри акта
│       │   │   │   │   │   │   └── session/[id]/scene-editor/ # Редактор сцен
│       │   │   │   │   │   ├── encounters/  # Встречи и столкновения
│       │   │   │   │   │   ├── battle/      # Трекер битвы
│       │   │   │   │   │   ├── music/       # Управление музыкой
│       │   │   │   │   │   ├── random-tables/ # Таблицы случайностей
│       │   │   │   │   │   ├── npcs/        # Неигровые персонажи
│       │   │   │   │   │   ├── notes/       # Заметки кампании
│       │   │   │   │   │   └── players/     # Игроки кампании и их персонажи
│       │   │   │   │   ├── monsters/        # Бестиарий (глобальная база)
│       │   │   │   │   ├── spells/          # Справочник заклинаний
│       │   │   │   │   ├── items/           # Справочник предметов
│       │   │   │   │   ├── users/           # Управление пользователями (owner only)
│       │   │   │   │   └── display-control/ # Пульт управления ТВ/монитором
│       │   │   └── (display)/      # Display client (📺 ТВ/монитор, fullscreen)
│       │   │       ├── screen/     # Основной view (сцены, музыка, выбор)
│       │   │       └── setup/      # Настройка дисплея (выбор кампании)
│       │   ├── components/
│       │   │   ├── ui/             # shadcn/ui components
│       │   │   ├── landing/        # Landing page components (hero, features, CTA)
│       │   │   ├── player/         # Player-specific components
│       │   │   │   ├── CharacterSheet.tsx       # Основной лист персонажа
│       │   │   │   ├── CharacterCreator/        # Мастер создания (wizard)
│       │   │   │   │   ├── StepRace.tsx         # Шаг: выбор расы с иллюстрациями
│       │   │   │   │   ├── StepClass.tsx        # Шаг: выбор класса
│       │   │   │   │   ├── StepAbilities.tsx    # Шаг: характеристики (point buy/roll)
│       │   │   │   │   ├── StepSkills.tsx       # Шаг: навыки и владения
│       │   │   │   │   ├── StepEquipment.tsx    # Шаг: снаряжение
│       │   │   │   │   ├── StepPersonality.tsx  # Шаг: имя, предыстория, портрет
│       │   │   │   │   └── StepSummary.tsx      # Финальная сводка
│       │   │   │   ├── AbilityScores.tsx        # Блок 6 характеристик
│       │   │   │   ├── HpBar.tsx                # HP бар с +/- кнопками
│       │   │   │   ├── SpellCard.tsx            # Карточка заклинания (popup)
│       │   │   │   ├── SpellSlots.tsx           # Ячейки заклинаний
│       │   │   │   ├── InventoryGrid.tsx        # Сетка инвентаря
│       │   │   │   ├── SkillsList.tsx           # Список навыков с модификаторами
│       │   │   │   ├── CampaignPicker.tsx       # Выбор кампании
│       │   │   │   ├── CharacterPicker.tsx      # Выбор персонажа + кладбище
│       │   │   │   ├── DiceRoller.tsx           # Роллер кубиков
│       │   │   │   └── DeathScreen.tsx          # Экран смерти персонажа (RIP)
│       │   │   ├── dashboard/      # Backoffice / DM components
│       │   │   │   ├── SceneEditor/             # Визуальный редактор дерева сцен
│       │   │   │   │   ├── SceneEditor.tsx      # Основной компонент (@xyflow/react)
│       │   │   │   │   ├── SceneNode.tsx        # Узел сцены (карточка с типом, иконкой)
│       │   │   │   │   ├── SceneEdge.tsx        # Связь между сценами
│       │   │   │   │   └── ScenePanel.tsx       # Панель редактирования выбранной сцены
│       │   │   │   ├── BattleTracker.tsx        # Трекер битвы (инициатива, HP, ходы)
│       │   │   │   ├── InitiativeOrder.tsx      # Порядок инициативы
│       │   │   │   ├── RandomTableRoller.tsx    # Бросок по таблице случайностей
│       │   │   │   ├── EncounterBuilder.tsx     # Построитель встреч
│       │   │   │   ├── CampaignTimeline.tsx     # Таймлайн кампании
│       │   │   │   ├── DisplayRemote.tsx        # Пульт управления ТВ
│       │   │   │   ├── UserManagement.tsx       # Управление пользователями (owner)
│       │   │   │   ├── data-table.tsx           # DataTable (паттерн из XStream)
│       │   │   │   └── data-table-column-header.tsx
│       │   │   └── display/        # Display client components (📺)
│       │   │       ├── SceneRenderer.tsx        # Рендер сцены (фон, эффекты)
│       │   │       ├── MusicPlayer.tsx          # Плеер музыки (фоновый)
│       │   │       ├── ChoiceScreen.tsx         # Экран выбора (Pillars of Eternity)
│       │   │       └── BattleDisplay.tsx        # Отображение битвы на ТВ
│       │   ├── contexts/
│       │   │   ├── AuthContext.tsx
│       │   │   ├── CampaignContext.tsx
│       │   │   └── WebSocketContext.tsx
│       │   ├── hooks/
│       │   │   ├── useWebSocket.ts
│       │   │   ├── useDiceRoller.ts
│       │   │   └── useBattleTracker.ts
│       │   ├── lib/
│       │   │   ├── api.ts
│       │   │   ├── dice.ts         # Dice rolling logic
│       │   │   ├── dnd-rules.ts    # D&D rules helpers
│       │   │   └── i18n.ts         # i18n config (ru only, expandable)
│       │   └── types/
│       │       ├── rule-system.ts  # RuleSystem, Abilities, Skills, Formulas, Conditions
│       │       ├── setting.ts      # Setting, SettingPivot, Overrides
│       │       ├── character.ts    # Character, Abilities, Skills, DeathInfo, CharacterStats
│       │       ├── spell.ts        # Spell, SpellSlots, Components
│       │       ├── item.ts         # Item, EquippedItem, Currency
│       │       ├── campaign.ts     # Campaign, CampaignSettings, Session
│       │       ├── scene.ts        # Scene, SceneConnection, SceneDisplay, SceneChoice
│       │       ├── battle.ts       # BattleSession, Participant, Condition
│       │       └── monster.ts      # Monster, MonsterAction
│       └── messages/               # i18n (ru.json — единственный активный язык)
│
├── docker-compose.yml
├── package.json
├── CLAUDE.md                       # This file
└── PROJECT_BOOTSTRAP_GUIDE.md
```

## Commands

### Development

**IMPORTANT:** PHP 8.4 runs inside Docker container `dnd_api`. Do NOT use local PHP. Laravel server starts automatically with docker-compose.

```bash
# Start everything (PostgreSQL, Redis, Mailpit, pgAdmin + Laravel API + Queue worker)
npm run docker:up              # API at :8000, fully automatic setup

# Install frontend dependencies (first time or after package changes)
cd apps/web && npm install

# Frontend (from root)
npm run dev                    # Start Next.js dev server on :3000

# Or work directly in apps/web
cd apps/web && npm run dev
```

**Automatic Local Dev Setup** (`docker:up` does everything automatically):
- Database creation (PostgreSQL creates DB from env vars)
- Migrations (idempotent - safe to run multiple times)
- Base seeders: roles, permissions, owner, система правил D&D 5e, сеттинг Eberron, игровые данные (заклинания, монстры, предметы, расы, классы, правила) привязанные к Eberron
- DevSeeder: sample campaigns, characters, encounters (only in `APP_ENV=local`)
- Passport keys and OAuth client
- Storage symlink

**Idempotent Design:** All seeders use `updateOrCreate`/`firstOrCreate`, so `docker:up` can be run multiple times without issues.

**Note:** This is NOT an npm workspaces monorepo. Each app manages its own dependencies:
- `apps/api` — PHP/Composer dependencies
- `apps/web` — npm dependencies (package-lock.json is here)

### Laravel Commands (via Docker)

```bash
docker exec dnd_api php artisan <command>
docker exec dnd_api php artisan migrate
docker exec dnd_api php artisan db:seed
docker exec dnd_api php artisan tinker
docker exec -it dnd_api bash
```

### Testing

```bash
# Laravel tests (via Docker)
docker exec dnd_api php artisan test
docker exec dnd_api php artisan test --filter=TestName

# Frontend lint (from root)
npm run lint

# Frontend build (IMPORTANT: run before pushing!)
npm run build
```

**IMPORTANT:** Always run `npm run build` before pushing changes. `npm run dev` does NOT check types.

### Docker

```bash
npm run docker:up              # Start containers
npm run docker:down            # Stop containers (data preserved)
npm run docker:reset           # DESTRUCTIVE: removes all volumes, fresh start
```

### Docker Containers

| Container | Purpose | Port |
|-----------|---------|------|
| dnd_api | Laravel API (PHP 8.4) | 8000 |
| dnd_queue | Queue worker (media, notifications) | - |
| dnd_postgres | PostgreSQL 17 | 5432 |
| dnd_redis | Redis 7 (cache, queue, WebSocket) | 6379 |
| dnd_mailpit | Email testing | 8025 (UI), 1025 (SMTP) |
| dnd_pgadmin | Database admin | 5050 |

## Architecture

### Client Architecture (одна комната + веб)

Все клиенты — это один Next.js app с разными route groups, оптимизированными под своё устройство и роль:

```
(landing)    → /              — 🌐 Лендинг (guest/anonymous — красивая страница о проекте)
(auth)       → /login, /register  — 🔐 Авторизация
(player)     → /player/*     — 📱 Телефон/планшет игрока (role: player, mobile-first)
(dashboard)  → /dashboard/*  — 💻 Backoffice DM (role: owner + dm, desktop-first)
(display)    → /display/*    — 📺 ТВ/монитор (fullscreen, управляется из dashboard)
```

Клиенты синхронизируются через **WebSocket** (Laravel Broadcasting + Redis) в реальном времени:
- DM меняет сцену → на ТВ обновляется фон и музыка
- DM начинает битву → у игроков на телефонах появляется инициатива
- Игрок получает урон → DM видит обновлённые HP
- DM показывает экран выбора → на ТВ отображаются варианты

**Display Client** особенный — он работает как «умный телевизор»:
- Открывается на ТВ/мониторе через браузер (fullscreen / F11)
- **Требует код подключения** — без кода показывает только экран ожидания
- Управляется только с DM Client (пульт управления)
- Полноэкранный режим, без адресной строки, без UI элементов
- Плавные переходы между сценами (fade, crossfade)
- Фоновая музыка с плавным переключением
- Экраны выбора в стиле CRPG (Pillars of Eternity, Baldur's Gate)

**Pairing Flow (код подключения):**
```
📺 TV: Открыл /display
┌─────────────────────────────────────┐
│                                     │
│     🎲 D&D Assistant                │
│                                     │
│     Код подключения:                │
│                                     │
│         4 8 2 9                     │
│                                     │
│     Введите код в панели DM         │
│     Код обновится через 4:32        │
│                                     │
└─────────────────────────────────────┘

💻 DM: Dashboard → Display Control
┌─────────────────────────────────────┐
│  Подключить дисплей                 │
│  ┌─────────────────────────────┐   │
│  │  Код: [____]  [Подключить]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Активные дисплеи:                  │
│  ✅ Display #1 — Кампания "Тайны Шарна" │
│     [Отключить]                     │
└─────────────────────────────────────┘

📺 TV: После подключения
┌─────────────────────────────────────┐
│  🎬 Ожидание команды DM...          │
│  Кампания: Тайны Шарна              │
└─────────────────────────────────────┘
```

**Безопасность Display:**
- Код 4 цифры, генерируется случайно
- Код живёт 5 минут, потом обновляется
- Без ввода кода — только экран ожидания
- Display привязывается к конкретной кампании DM
- DM может отключить display в любой момент
- При закрытии браузера на ТВ — автоматическое отключение

### Authentication & User Flow

Laravel Passport handles OAuth2 with personal access tokens.

**Roles (Spatie laravel-permission):**

| Role | Access | Назначается | Description |
|------|--------|------------|-------------|
| `owner` | Всё | Системный (сидер) | Владелец инстанса. Он же DM. Единственный кто может назначать роль `dm` другим |
| `dm` | DM client + backoffice + display | Только owner | Мастер подземелий. Создаёт и ведёт кампании, управляет контентом через backoffice |
| `player` | Player client только | При регистрации + активация | Игрок. Видит ТОЛЬКО свой player client. Не видит ничего из DM/backoffice |
| `guest` | Landing page только | Неавторизованный | Аноним. Видит только красивую лендинг-страницу |

**Иерархия доступа:**
```
owner (всё)
  └─ dm (DM client + backoffice + display control)
       └─ player (только player client)
            └─ guest/anonymous (только landing page)
```

**Ключевые правила:**
- Owner = суперпользователь. Он автоматически DM. Создаётся сидером из env vars. Не может быть удалён
- DM = назначается ТОЛЬКО owner-ом. Owner может дать роль DM другому пользователю (например, друг тоже хочет водить кампанию)
- Player = видит ТОЛЬКО player client. Никакого доступа к backoffice, кампейн-менеджменту, DM-инструментам. Полная изоляция
- Guest = не залогинен, видит только лендинг с описанием проекта и кнопкой регистрации

**Backoffice (DM + Owner):**
Управление кампаниями, контентом, пользователями идёт через backoffice — как в XStream. Это раздел `/dashboard/*` доступный только ролям `owner` и `dm`:
- Управление кампаниями (CRUD, настройки, приглашение игроков)
- Управление пользователями (активация, роли — только owner)
- Управление сеттингами (миры/вселенные, привязка контента)
- Управление контентом (заклинания, монстры, предметы — привязка к сеттингам, overrides)
- Управление сценами, музыкой, таблицами случайностей
- Трекер битвы, заметки — всё здесь

**Регистрация и активация:**
```
1. Человек заходит на сайт → Видит красивый лендинг (guest)
2. Кликает "Регистрация" → Вводит имя, email, пароль
3. На почту приходит письмо подтверждения → Кликает ссылку
4. Email подтверждён, аккаунт is_active=false, роль player
5. Owner/DM в backoffice видит нового пользователя → Активирует его
6. Игрок теперь может войти → Player client
```

**Назначение DM:**
```
Owner заходит в backoffice → Управление пользователями
  → Выбирает активного пользователя
  → "Назначить Мастером" (меняет роль player → dm)
  → Этот пользователь теперь видит DM client и backoffice
```

Owner/DM может деактивировать любого игрока в любой момент (токены отзываются, вход заблокирован).

**Campaign-level access:** Помимо глобальных ролей, доступ контролируется на уровне кампании:
- DM — создатель кампании, полный доступ к её данным в backoffice
- Player — приглашён DM в кампанию, видит только свои персонажи + общие данные
- Один DM может вести несколько кампаний
- Один игрок может быть в нескольких кампаниях (у разных DM)

### Player Client — Полный UX Flow

#### Вход и выбор кампании
```
📱 Открыл приложение (телефон/планшет)
│
├─ Не залогинен → Экран входа (login/register)
│   └─ Регистрация → Подтверждение email → Ждём активации от DM
│
├─ Залогинен, нет кампаний → "Вас пока не добавили ни в одну кампанию"
│
├─ Залогинен, одна кампания → Сразу в кампанию
│
└─ Залогинен, несколько кампаний → Выбор кампании
    ├─ Кампания "Тайны Шарна" (Eberron · DM: Вася) — 3 живых персонажа
    ├─ Кампания "Затерянные шахты" (Eberron · DM: Петя) — 1 персонаж
    └─ [карточки с названием, сеттингом, DM, последняя сессия]
```

#### Внутри кампании — выбор/создание персонажа
```
📱 Вошёл в кампанию
│
├─ Нет живых персонажей → Автоматически → Создание нового персонажа
│
├─ Один живой персонаж → Сразу открывается лист персонажа
│
└─ Несколько живых персонажей → Выбор персонажа
    ├─ Торин Дубощит (Дварф Воин, уровень 5) 🟢
    ├─ Эльминстер (Человек Волшебник, уровень 3) 🟢
    ├─ ───────── Кладбище ─────────
    ├─ Гимли (Дварф Варвар, уровень 2) 💀 Убит гоблинами (сессия #4)
    └─ [+ Создать нового персонажа]
```

**Кампания определяет правила:** при создании персонажа система знает из настроек кампании и её сеттинга:
- Какие расы доступны (из привязок сеттинга + DM может ограничить дополнительно)
- Какие классы разрешены (из привязок сеттинга)
- Стартовый уровень (может быть не 1, если кампания уже идёт)
- Допустимые сеттинги определяют доступный контент (расы, классы, заклинания)
- Метод распределения характеристик (из RuleSystem: покупка очков / стандартный набор / бросок)
- Стартовое золото (если нестандартное)

#### Создание персонажа — Пошаговый мастер

Красивый, с иллюстрациями, на весь экран телефона. Каждый шаг — отдельный экран с плавными переходами.

```
📱 Создание персонажа (wizard-style, шаги на весь экран)
│
├─ Шаг 1: РАСА 🧝
│   Карточки рас с иллюстрациями (портрет + краткое описание)
│   - Человек: "Универсальные и амбициозные..."
│   - Эльф: "Грациозные и долгоживущие..."
│   - Дварф: "Крепкие и упрямые..."
│   [Выбрал] → Показать бонусы: +2 ТЕЛ, +1 МДР, Тёмное зрение 18м
│
├─ Шаг 2: КЛАСС ⚔️
│   Карточки классов с иллюстрациями и иконками
│   - Воин: кость здоровья d10, тяжёлые доспехи
│   - Волшебник: кость здоровья d6, заклинания
│   - Плут: кость здоровья d8, скрытная атака
│   [Выбрал] → Показать основные фичи 1 уровня
│
├─ Шаг 3: ХАРАКТЕРИСТИКИ 🎲
│   Метод зависит от настроек кампании:
│   - Покупка очков (27 очков, интерактивные +/- кнопки)
│   - Стандартный набор (15,14,13,12,10,8 — drag & drop по характеристикам)
│   - Бросок кубиков (4d6kh3 — анимация броска, можно перебросить)
│   Автоматический расчёт модификаторов с учётом расовых бонусов
│
├─ Шаг 4: НАВЫКИ И ВЛАДЕНИЯ 📋
│   Выбор навыков (количество зависит от класса и предыстории)
│   Чекбоксы с подсказками: "Внимательность (МДР) — замечать скрытое"
│   Языки, инструменты
│
├─ Шаг 5: СНАРЯЖЕНИЕ 🎒
│   Два варианта:
│   - Стартовый набор класса (быстро, рекомендуется новичкам)
│   - Покупка за золотые (для опытных, каталог с фильтрами)
│
├─ Шаг 6: ЛИЧНОСТЬ 📜
│   Имя (текстовое поле)
│   Предыстория (выбор + описание)
│   Черты характера, идеалы, привязанности, слабости
│   [Опционально] Загрузить портрет
│
└─ ГОТОВО! → Красивый экран-сводка → "Начать приключение!"
```

**Дизайн мастера создания:**
- Каждый шаг — fullscreen карточка с иллюстрацией вверху
- Плавные swipe-переходы между шагами (как onboarding в мобильных приложениях)
- Прогресс-бар или точки навигации внизу
- Кнопка "Назад" всегда доступна
- На каждом шаге — краткие подсказки для новичков (разворачиваются по тапу)
- Авто-расчёт: выбрал расу → модификаторы уже применены; выбрал класс → HP посчитаны

#### Лист персонажа — Основной экран

```
📱 Лист персонажа (основной экран, mobile-first)
┌─────────────────────────────────┐
│  [Портрет]  Торин Дубощит       │
│  Дварф · Воин 5 · ОО: 6500     │
│                                 │
│  ❤️ 45/52 ОЗ    🛡️ КД 18       │
│  ████████░░  [+ ОЗ] [- ОЗ]     │
│                                 │
│  ┌─────┬─────┬─────┐           │
│  │ СИЛ │ ЛОВ │ ТЕЛ │           │
│  │ 16  │ 12  │ 14  │           │
│  │ +3  │ +1  │ +2  │           │
│  ├─────┼─────┼─────┤           │
│  │ ИНТ │ МДР │ ХАР │           │
│  │  8  │ 13  │ 10  │           │
│  │ -1  │ +1  │ +0  │           │
│  └─────┴─────┴─────┘           │
│                                 │
│  ⚔️ Атака  📖 Заклинания       │
│  🎒 Инвентарь  📋 Навыки       │
│  🎲 Кубики  📜 Особенности     │
│                                 │
│  [навигация: tabs или bottom bar]│
└─────────────────────────────────┘
```

**Табы / секции листа персонажа:**

1. **Обзор** (главный экран) — портрет, имя, раса/класс/уровень, HP-бар с быстрыми +/-, КД, скорость, 6 характеристик с модификаторами, вдохновение
2. **Атака и бой** — оружие с бонусами атаки и урона (авто-расчёт), бонус мастерства, инициатива, спасброски от смерти
3. **Заклинания** (если есть) — ячейки по уровням (✅/⬜), список подготовленных, быстрый поиск, описание по тапу
4. **Инвентарь** — предметы с весом (в кг!), экипировка (что надето), валюта (зм/см/мм/эм/пм), общий вес / грузоподъёмность
5. **Навыки** — все 18 навыков с модификаторами, владение (●) и экспертиза (◆), спасброски
6. **Особенности** — расовые черты, классовые фичи, предыстория, ресурсы класса (Ки, Ярость, etc.) с отметками использования
7. **Описание** — предыстория, черты, идеалы, привязанности, слабости, заметки

**Ключевые UX принципы листа:**
- HP бар — самый крупный и заметный элемент, кнопки +/- рядом (Мастер сказал "получаешь 8 урона" → тап-тап и готово)
- Модификаторы крупнее значений характеристик (игроку чаще нужен +3, чем 16)
- Заклинания: тап по названию → всплывающее описание (не переход на другую страницу)
- Автоматический расчёт всего: бонус атаки = бонус мастерства + модификатор характеристики
- Формулы видны по тапу: "Бонус атаки: +7 = +3 (бонус мастерства) + 4 (СИЛ)"

#### Кладбище персонажей (Character Graveyard) 💀

Каждый погибший персонаж сохраняется навсегда со статистикой:

```
📱 Кладбище
┌─────────────────────────────────┐
│  💀 Гимли Каменнолобый          │
│  Дварф · Варвар · Уровень 2    │
│                                 │
│  Прожил: 4 сессии               │
│  Убит: Гоблин-вожак            │
│  Смертельный удар: 12 урона     │
│  Последние слова: —             │
│  Сессия #4 · 15.02.2026        │
│                                 │
│  📊 Статистика:                 │
│  Монстров убито: 7              │
│  Урона нанесено: 156            │
│  Критических: 3                 │
│  Естественных 1: 2 😱           │
│  Зелий выпито: 4                │
│  Ловушек активировано: 1        │
└─────────────────────────────────┘
```

**Данные о смерти (в модели Character):**
```php
// Character model — поля смерти
'is_alive' => true,                      // false после гибели
'death_info' => null,                    // JSONB, заполняется при гибели
// {
//   "killed_by": "Гоблин-вожак",
//   "killing_blow": "12 урона рубящего",
//   "cause": "combat",                   // combat/trap/fall/spell/other
//   "session_number": 4,
//   "death_date": "2026-02-15",
//   "last_words": "За Морию!",           // опционально, DM или игрок вписывает
//   "revived": false                     // если воскресили
// }
'stats' => '{}',                         // JSONB — накопительная статистика
// {
//   "sessions_played": 4,
//   "monsters_killed": 7,
//   "damage_dealt": 156,
//   "damage_taken": 203,
//   "critical_hits": 3,
//   "natural_ones": 2,
//   "potions_used": 4,
//   "gold_earned": 450,
//   "gold_spent": 120
// }
```

**DM помечает смерть персонажа** в своём трекере: выбирает персонажа → "Персонаж погиб" → вводит причину и кто нанёс удар. У игрока персонаж автоматически перемещается в "Кладбище" и предлагается создать нового.

### Campaign Settings — что DM настраивает

```php
// Campaign model — settings JSONB
'settings' => [
    // Доступные расы (null = все из подключённых сеттингов)
    'allowed_races' => null,             // или ['human', 'elf', 'dwarf']
    'allowed_classes' => null,           // или ['fighter', 'rogue', 'wizard']

    // Создание персонажа
    'starting_level' => 1,
    'ability_method' => 'point_buy',    // 'point_buy' | 'standard_array' | 'roll'
    'starting_gold' => null,            // null = стандартное для класса

    // Правила
    'hp_method' => 'average',           // 'average' | 'roll'
    'encumbrance' => false,
    'multiclassing' => true,
    'feats' => true,
    'critical_rules' => 'standard',     // 'standard' | 'max_dice' | 'brutal_critical'

    // Необязательное
    'description' => 'Кампания по мотивам...',
    'tone' => 'Героическое фэнтези',
]
// Кампания принадлежит одному сеттингу (belongsTo Setting)
// Сеттинг принадлежит системе правил (belongsTo RuleSystem)
// Доступный контент определяется привязками сеттинга (setting_spells, setting_races, etc.)
```

### Real-time Communication (WebSocket)

WebSocket используется для мгновенной синхронизации между всеми клиентами. Обычный веб — все подключены к одному серверу через интернет.

**Типичные сценарии:**
- DM нажимает «Сменить сцену» → на ТВ мгновенно меняется фон и музыка
- DM запускает битву → у всех игроков на телефонах появляется порядок инициативы
- Игрок получает урон → DM видит обновлённые HP в трекере
- DM показывает экран выбора → на ТВ появляются варианты в стиле Pillars of Eternity

```
DM (dashboard)  ──broadcasts──→  Server (Redis)  ──→  📺 ТВ (Display)
                                                  ──→  📱📱📱 Телефоны (Player)
```

**WebSocket Channels:**
- `campaign.{id}` — общий канал кампании (presence channel — кто онлайн за столом)
- `campaign.{id}.battle` — трекер битвы (инициатива, HP, ходы)
- `campaign.{id}.display` — управление ТВ/монитором (только DM → Display)
- `private-character.{id}` — приватный канал (DM ↔ конкретный игрок, для секретных бросков/записок)

**Key Events:**
- `SceneChanged` — DM сменил сцену на ТВ (фон, музыка, освещение)
- `MusicChanged` — DM сменил музыку
- `BattleUpdated` — обновление трекера битвы (инициатива, HP, статусы, чей ход)
- `DiceRolled` — результат цифрового броска кубика (опционально — физические кубики приоритетнее)
- `ChoicePresented` — DM показал экран выбора на ТВ (стиль Pillars of Eternity)
- `ChoiceSelected` — выбор сделан
- `CharacterUpdated` — HP/состояние персонажа изменилось (синхронизация DM ↔ Player)
- `DisplayText` — DM показывает текст/описание на ТВ (вместо того чтобы зачитывать длинный текст)

### API Structure

All API routes are versioned under `/api/v1/`:

```
/auth/*                          — Login, register, logout, me
/player/*                        — Player endpoints (role: player)
│   ├─ campaigns                 — Мои кампании (только те, куда приглашён)
│   ├─ characters                — Мои персонажи в кампании
│   ├─ character/{id}            — Лист персонажа (CRUD)
│   ├─ spells                    — Поиск заклинаний (read-only)
│   └─ items                     — Поиск предметов (read-only)
/backoffice/*                    — DM/Owner endpoints (role: owner + dm, middleware: backoffice.access)
│   ├─ rule-systems              — Системы правил (CRUD: характеристики, формулы, боёвка)
│   ├─ settings                  — Сеттинги / миры (CRUD, привязка к системе правил)
│   ├─ settings/{id}/spells      — Привязка заклинаний к сеттингу (+ overrides)
│   ├─ settings/{id}/monsters    — Привязка монстров к сеттингу (+ overrides)
│   ├─ campaigns                 — CRUD кампаний (привязка к сеттингу)
│   ├─ campaigns/{id}/acts       — Акты кампании (CRUD, порядок)
│   ├─ campaigns/{id}/acts/{aid}/sessions — Сессии акта (CRUD, порядок)
│   ├─ campaigns/{id}/acts/{aid}/sessions/{sid}/scenes — Дерево сцен сессии (CRUD, дерево, связи)
│   ├─ campaigns/{id}/encounters — Встречи кампании
│   ├─ campaigns/{id}/scenes     — Сцены кампании
│   ├─ campaigns/{id}/notes      — Заметки кампании
│   ├─ campaigns/{id}/npcs       — NPC кампании
│   ├─ campaigns/{id}/random-tables — Таблицы случайностей
│   ├─ campaigns/{id}/players    — Игроки кампании (приглашение/удаление)
│   ├─ battles                   — Управление битвой
│   ├─ monsters                  — Бестиарий (глобальная база, привязка к сеттингам)
│   ├─ spells                    — Заклинания (глобальная база, привязка к сеттингам)
│   ├─ items                     — Предметы (глобальная база, привязка к сеттингам)
│   ├─ soundtracks               — Управление музыкой
│   ├─ users                     — Управление пользователями (owner only)
│   ├─ media/upload              — Загрузка файлов
│   ├─ displays                  — Активные дисплеи DM
│   ├─ displays/pair             — POST: подключить дисплей по коду {code, campaign_id}
│   └─ displays/{id}/disconnect  — POST: отключить дисплей
/display/*                       — Display client endpoints (без авторизации)
│   ├─ register                  — POST: зарегистрировать дисплей, получить token + code
│   ├─ status                    — GET: статус подключения (paired/waiting)
│   ├─ stream                    — WebSocket: получение команд от DM
│   └─ heartbeat                 — POST: дисплей жив (каждые 30 сек)
/public/*                        — Публичные (landing page data, если нужно)
```

**Middleware:**
- `auth:api` — авторизация через Passport
- `backoffice.access` — проверяет роль owner или dm (паттерн из XStream)
- `campaign.member` — проверяет что player/dm принадлежит кампании

### Queue System

| Queue | Purpose |
|-------|---------|
| `default` | Notifications, emails |
| `media` | Media conversions (scene images, portraits) |

## PostgreSQL JSONB — Паттерны использования

PostgreSQL 17 имеет мощную поддержку JSONB. Используем её агрессивно для сложных вложенных структур D&D, чтобы не плодить десятки нормализованных таблиц.

### Принцип: когда JSONB, когда отдельная таблица

| Используй JSONB | Используй отдельную таблицу |
|-----------------|---------------------------|
| Данные принадлежат одной сущности и не шарятся | Данные переиспользуются между сущностями |
| Нет необходимости в JOIN по этим данным | Нужны JOIN, агрегации, отдельные CRUD |
| Структура гибкая / может отличаться между записями | Структура строгая и одинаковая |
| Данные читаются целиком вместе с родителем | Данные запрашиваются отдельно, фильтруются |
| Homebrew / пользовательский контент | Справочные данные (расы, классы, заклинания) + сеттинги |

### Примеры JSONB полей в моделях

**Character — stats, saves, skills как JSONB:**
```sql
CREATE TABLE characters (
    id BIGSERIAL PRIMARY KEY,
    name JSONB NOT NULL,                    -- {"ru": "Торин Дубощит"}
    backstory JSONB,                        -- {"ru": "Бывший кузнец из..."}

    -- Характеристики как JSONB — удобно читать/писать целиком
    abilities JSONB NOT NULL DEFAULT '{
        "strength": 10, "dexterity": 10, "constitution": 10,
        "intelligence": 10, "wisdom": 10, "charisma": 10
    }',

    -- Владения навыками (proficiency + expertise)
    skill_proficiencies JSONB DEFAULT '[]',     -- ["athletics", "perception"]
    skill_expertise JSONB DEFAULT '[]',         -- ["stealth"]

    -- Спасброски
    saving_throw_proficiencies JSONB DEFAULT '[]',  -- ["strength", "constitution"]

    -- Спасброски от смерти
    death_saves JSONB DEFAULT '{"successes": 0, "failures": 0}',

    -- Владения (оружие, доспехи, инструменты, языки)
    proficiencies JSONB DEFAULT '{
        "armor": [], "weapons": [], "tools": [], "languages": []
    }',

    -- Особенности и черты (расовые + классовые + фиты)
    features JSONB DEFAULT '[]',
    -- [{"source": "race", "name": "Тёмное зрение", "description": "Видите в темноте на 18 м"}]

    -- Ресурсы класса (Ki, Rage, Sorcery Points, etc.)
    class_resources JSONB DEFAULT '[]',
    -- [{"name": "Ки", "current": 3, "max": 5, "recharge": "short_rest"}]

    -- Валюта
    currency JSONB DEFAULT '{"cp": 0, "sp": 0, "ep": 0, "gp": 0, "pp": 0}',

    level INTEGER NOT NULL DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    temp_hp INTEGER DEFAULT 0,
    armor_class INTEGER NOT NULL DEFAULT 10,
    speed JSONB DEFAULT '{"walk": 9}',          -- В метрах! (walk, fly, swim, climb, burrow)
    inspiration BOOLEAN DEFAULT FALSE,
    hit_dice_remaining JSONB DEFAULT '{}',       -- {"d10": 3, "d8": 2} для мультикласса

    -- Жив или мёртв
    is_alive BOOLEAN DEFAULT TRUE,

    -- Информация о смерти (заполняется при гибели)
    death_info JSONB,
    -- {
    --   "killed_by": "Гоблин-вожак",
    --   "killing_blow": "12 урона рубящего",
    --   "cause": "combat",               -- combat/trap/fall/spell/other
    --   "session_number": 4,
    --   "death_date": "2026-02-15",
    --   "last_words": "За Морию!",
    --   "revived": false
    -- }

    -- Накопительная статистика (обновляется по ходу игры)
    stats JSONB DEFAULT '{}',
    -- {
    --   "sessions_played": 4,
    --   "monsters_killed": 7,
    --   "damage_dealt": 156,
    --   "damage_taken": 203,
    --   "critical_hits": 3,
    --   "natural_ones": 2,
    --   "potions_used": 4,
    --   "gold_earned": 450,
    --   "gold_spent": 120
    -- }

    race_id BIGINT REFERENCES races(id),
    campaign_id BIGINT REFERENCES campaigns(id),
    user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP, updated_at TIMESTAMP
);

-- GIN индексы для поиска по JSONB
CREATE INDEX idx_characters_abilities ON characters USING GIN (abilities);
CREATE INDEX idx_characters_skill_prof ON characters USING GIN (skill_proficiencies);
```

**CharacterClass — features per level как JSONB:**
```sql
CREATE TABLE character_classes (
    id BIGSERIAL PRIMARY KEY,
    name JSONB NOT NULL,                    -- {"ru": "Воин"}
    description JSONB,
    slug VARCHAR(50) UNIQUE NOT NULL,       -- "fighter"
    hit_die VARCHAR(5) NOT NULL,            -- "d10"
    primary_abilities JSONB NOT NULL,       -- ["strength", "constitution"]
    saving_throws JSONB NOT NULL,           -- ["strength", "constitution"]

    -- Владения
    armor_proficiencies JSONB DEFAULT '[]', -- ["лёгкие", "средние", "тяжёлые", "щиты"]
    weapon_proficiencies JSONB DEFAULT '[]',-- ["простое", "воинское"]
    tool_proficiencies JSONB DEFAULT '[]',

    -- Стартовое снаряжение (варианты)
    starting_equipment JSONB DEFAULT '[]',
    -- [
    --   {"choice": 1, "options": [
    --     [{"item": "chain-mail"}, {"item": "shield"}],
    --     [{"item": "leather-armor"}, {"item": "longbow"}, {"item": "arrows", "qty": 20}]
    --   ]}
    -- ]

    -- Фичи по уровням — ключевое! Очень гибкая структура
    level_features JSONB NOT NULL DEFAULT '{}',
    -- {
    --   "1": [
    --     {"name": "Боевой стиль", "description": "Выберите стиль боя...", "type": "choice",
    --      "options": ["Защита", "Дуэль", "Бой двумя оружиями", "Стрельба"]},
    --     {"name": "Второе дыхание", "description": "Бонусным действием восстановить 1d10 + уровень ОЗ",
    --      "type": "feature", "recharge": "short_rest"}
    --   ],
    --   "2": [
    --     {"name": "Всплеск действий", "description": "Одно дополнительное действие",
    --      "type": "feature", "recharge": "short_rest", "uses": 1}
    --   ],
    --   "5": [
    --     {"name": "Дополнительная атака", "description": "Две атаки вместо одной",
    --      "type": "feature"}
    --   ]
    -- }

    -- Таблица развития (HP, proficiency bonus, slots, etc.)
    progression JSONB NOT NULL DEFAULT '{}',
    -- {
    --   "1":  {"proficiency_bonus": 2},
    --   "5":  {"proficiency_bonus": 3, "extra_attack": 1},
    --   "9":  {"proficiency_bonus": 4, "indomitable": 1}
    -- }

    -- Для заклинателей: слоты по уровням
    spell_slots JSONB,
    -- {
    --   "1": {"cantrips": 3, "1st": 2},
    --   "2": {"cantrips": 3, "1st": 3},
    --   "3": {"cantrips": 3, "1st": 4, "2nd": 2}
    -- }

    -- Привязка к сеттингам — через pivot таблицу setting_* (см. Content Architecture)
    created_at TIMESTAMP, updated_at TIMESTAMP
);
```

**Monster — действия, легендарные действия как JSONB:**
```sql
CREATE TABLE monsters (
    id BIGSERIAL PRIMARY KEY,
    name JSONB NOT NULL,                    -- {"ru": "Красный дракон (взрослый)"}
    description JSONB,
    slug VARCHAR(100) UNIQUE NOT NULL,

    -- Базовые параметры
    size VARCHAR(20) NOT NULL,              -- tiny/small/medium/large/huge/gargantuan
    type VARCHAR(50) NOT NULL,              -- beast/undead/fiend/dragon/etc.
    alignment VARCHAR(50),
    armor_class INTEGER NOT NULL,
    armor_type VARCHAR(100),                -- "природный доспех"
    hit_points INTEGER NOT NULL,
    hit_dice VARCHAR(20),                   -- "18d12+72"
    challenge_rating DECIMAL(5,2),          -- 0.25, 0.5, 1, 2, ... 30
    experience_points INTEGER,

    -- Всё в метрах!
    speed JSONB DEFAULT '{"walk": 9}',
    -- {"walk": 12, "fly": 24, "swim": 12, "burrow": 9}

    -- Характеристики
    abilities JSONB NOT NULL,
    -- {"strength": 27, "dexterity": 10, "constitution": 25,
    --  "intelligence": 16, "wisdom": 13, "charisma": 21}

    -- Сложные поля — идеально для JSONB
    saving_throws JSONB DEFAULT '{}',       -- {"dexterity": 6, "constitution": 13, "wisdom": 7, "charisma": 11}
    skills JSONB DEFAULT '{}',              -- {"perception": 13, "stealth": 6}
    senses JSONB DEFAULT '{}',              -- {"darkvision": "36 м", "passive_perception": 23}
    languages JSONB DEFAULT '[]',           -- ["Общий", "Драконий"]

    -- Резисты и иммунитеты
    damage_resistances JSONB DEFAULT '[]',
    damage_immunities JSONB DEFAULT '[]',   -- ["огонь"]
    condition_immunities JSONB DEFAULT '[]',-- ["frightened", "charmed"]
    damage_vulnerabilities JSONB DEFAULT '[]',

    -- Особенности (traits)
    traits JSONB DEFAULT '[]',
    -- [{"name": "Легендарное сопротивление (3/день)", "description": "Если дракон проваливает спасбросок..."}]

    -- Действия — самая важная часть, структура гибкая
    actions JSONB DEFAULT '[]',
    -- [
    --   {"name": "Мультиатака", "description": "Дракон совершает три атаки: одну укусом и две когтями"},
    --   {"name": "Укус", "type": "melee", "attack_bonus": 14,
    --    "reach": "3 м", "damage": "2d10+8 колющий + 2d6 огонь",
    --    "description": "Рукопашная атака оружием: +14, досягаемость 3 м, одна цель"},
    --   {"name": "Огненное дыхание", "type": "special", "recharge": "5-6",
    --    "save": {"ability": "dexterity", "dc": 21},
    --    "damage": "18d6 огонь", "half_on_save": true,
    --    "area": "конус 18 м",
    --    "description": "Дракон выдыхает огонь 18-метровым конусом..."}
    -- ]

    -- Легендарные действия
    legendary_actions JSONB,
    -- {"per_round": 3, "actions": [
    --   {"name": "Обнаружение", "cost": 1, "description": "Дракон совершает проверку Внимательности"},
    --   {"name": "Атака хвостом", "cost": 1, "description": "Дракон совершает атаку хвостом"},
    --   {"name": "Атака крыльями", "cost": 2, "description": "Дракон бьёт крыльями..."}
    -- ]}

    -- Логово и региональные эффекты (опционально)
    lair_actions JSONB,
    regional_effects JSONB,

    -- Привязка к сеттингам — через pivot таблицу setting_* (см. Content Architecture)
    created_at TIMESTAMP, updated_at TIMESTAMP
);

-- GIN индексы для быстрого поиска
CREATE INDEX idx_monsters_abilities ON monsters USING GIN (abilities);
CREATE INDEX idx_monsters_actions ON monsters USING GIN (actions);
```

**Spell — компоненты и scaling как JSONB:**
```sql
CREATE TABLE spells (
    id BIGSERIAL PRIMARY KEY,
    name JSONB NOT NULL,                    -- {"ru": "Огненный шар"}
    description JSONB NOT NULL,             -- {"ru": "Яркий луч вылетает..."}
    slug VARCHAR(100) UNIQUE NOT NULL,

    level SMALLINT NOT NULL,                -- 0 = заговор, 1-9
    school VARCHAR(20) NOT NULL,            -- evocation, necromancy, etc.
    casting_time VARCHAR(100) NOT NULL,     -- "1 действие", "1 бонусное действие", "1 минута"
    range VARCHAR(100) NOT NULL,            -- "45 м", "На себя", "Касание", "На себя (конус 9 м)"
    duration VARCHAR(100) NOT NULL,         -- "Мгновенная", "Концентрация, до 1 минуты", "8 часов"
    concentration BOOLEAN DEFAULT FALSE,
    ritual BOOLEAN DEFAULT FALSE,

    -- Компоненты как JSONB — гибко
    components JSONB NOT NULL,
    -- {"verbal": true, "somatic": true, "material": true,
    --  "material_description": "крошечный шарик из гуано летучей мыши и серы",
    --  "material_cost": null, "material_consumed": false}

    -- Какие классы имеют доступ
    classes JSONB DEFAULT '[]',             -- ["wizard", "sorcerer"]

    -- Масштабирование на высоких уровнях
    higher_levels JSONB,
    -- {"description": "Если вы используете ячейку 4 уровня или выше, урон увеличивается на 1d6 за каждый уровень выше 3",
    --  "scaling": {"per_level": "1d6", "base_level": 3}}

    -- Для заговоров — масштабирование по уровню персонажа
    cantrip_scaling JSONB,
    -- {"5": "2d10", "11": "3d10", "17": "4d10"}

    -- Эффекты (для автоматизации)
    effects JSONB,
    -- {"damage": {"dice": "8d6", "type": "fire"},
    --  "save": {"ability": "dexterity", "on_success": "half"},
    --  "area": {"shape": "sphere", "radius": "6 м"}}

    -- Привязка к сеттингам — через pivot таблицу setting_* (см. Content Architecture)
    created_at TIMESTAMP, updated_at TIMESTAMP
);

-- GIN для поиска по классам и компонентам
CREATE INDEX idx_spells_classes ON spells USING GIN (classes);
CREATE INDEX idx_spells_components ON spells USING GIN (components);
```

**RandomTable — гибкая структура записей:**
```sql
CREATE TABLE random_tables (
    id BIGSERIAL PRIMARY KEY,
    name JSONB NOT NULL,                    -- {"ru": "Случайные встречи в лесу"}
    description JSONB,
    campaign_id BIGINT REFERENCES campaigns(id) ON DELETE CASCADE,  -- null = глобальная
    dice_formula VARCHAR(20) NOT NULL,      -- "1d20", "2d6", "1d100"
    category VARCHAR(50),                   -- encounter/weather/loot/npc_trait/event/custom

    -- Все записи прямо в JSONB — не нужна отдельная таблица!
    entries JSONB NOT NULL DEFAULT '[]',
    -- [
    --   {"min": 1, "max": 5, "result": "Ничего не происходит. Тишина леса нарушается лишь пением птиц."},
    --   {"min": 6, "max": 10, "result": "Группа из 2d4 гоблинов устроила засаду на тропе."},
    --   {"min": 11, "max": 15, "result": "Старый отшельник предлагает погадать на костях. Проверка Проницательности (Сл 15)."},
    --   {"min": 16, "max": 18, "result": "Раненый единорог просит о помощи.", "subtable": "unicorn_reactions"},
    --   {"min": 19, "max": 20, "result": "Портал в Страну Фей мерцает между деревьями.", "tags": ["magic", "fey"]}
    -- ]

    created_at TIMESTAMP, updated_at TIMESTAMP
);
```

**Scene — настройки отображения:**
```sql
CREATE TABLE scenes (
    id BIGSERIAL PRIMARY KEY,
    name JSONB NOT NULL,
    description JSONB,
    campaign_id BIGINT REFERENCES campaigns(id) ON DELETE CASCADE,

    -- Все настройки сцены в одном JSONB
    settings JSONB DEFAULT '{}',
    -- {
    --   "lighting": "dim",              -- bright/dim/dark
    --   "weather": "rain",              -- clear/rain/snow/fog/storm
    --   "time_of_day": "evening",       -- dawn/morning/afternoon/evening/night
    --   "ambience": "forest",           -- Тег для подбора музыки
    --   "effects": ["fireflies", "mist"],
    --   "overlay_color": "rgba(0,0,50,0.3)",   -- Цветовой фильтр
    --   "transition": "fade"            -- fade/slide/instant
    -- }

    sort_order INTEGER DEFAULT 0,
    soundtrack_id BIGINT REFERENCES soundtracks(id),
    created_at TIMESTAMP, updated_at TIMESTAMP
);
```

### PostgreSQL JSONB — полезные запросы

```php
// Поиск заклинаний для конкретного класса
Spell::whereJsonContains('classes', 'wizard')->get();

// Монстры с огненным иммунитетом
Monster::whereJsonContains('damage_immunities', 'огонь')->get();

// Персонажи с высокой Силой
Character::whereRaw("(abilities->>'strength')::int >= ?", [16])->get();

// Поиск по вложенным JSONB
Monster::whereRaw("EXISTS (
    SELECT 1 FROM jsonb_array_elements(actions) AS action
    WHERE action->>'name' ILIKE ?
)", ['%дыхание%'])->get();

// Обновление вложенного JSONB поля
$character->update([
    'currency' => array_merge($character->currency, ['gp' => $character->currency['gp'] + 50])
]);

// Или через PostgreSQL jsonb_set
DB::table('characters')->where('id', $id)
    ->update(['currency' => DB::raw("jsonb_set(currency, '{gp}', to_jsonb((currency->>'gp')::int + 50))")]);
```

### Миграции — паттерн для JSONB

```php
// В миграциях всегда указываем default для JSONB
$table->jsonb('abilities')->default('{}');
$table->jsonb('features')->default('[]');
$table->jsonb('settings')->default('{}');

// GIN индексы для часто запрашиваемых JSONB полей
$table->index(DB::raw('(abilities) jsonb_path_ops'), 'idx_abilities', 'gin');

// Или в отдельном statement
Schema::table('spells', function (Blueprint $table) {
    DB::statement('CREATE INDEX idx_spells_classes ON spells USING GIN (classes)');
});
```

### Что НЕ хранить в JSONB

Даже с мощным JSONB, некоторые данные лучше нормализовать:
- **Settings** — отдельная таблица (сеттинги переиспользуются между кампаниями)
- **Spells, Items, Monsters, Races, Classes** — отдельные таблицы (глобальная база, привязка к сеттингам через pivot)
- **Characters** — отдельная таблица (CRUD, привязка к user, к campaign)
- **Campaigns, Encounters, BattleSessions** — отдельные таблицы (сложные связи, статусы)
- **Many-to-many связи** (character↔spell, character↔item, encounter↔monster, setting↔spell/item/monster/race/class) — pivot таблицы с метаданными (overrides)

Но **внутри** этих таблиц JSONB используется щедро для вложенных структур.

## Content Architecture — Правила → Сеттинг → Кампания → Акты → Сессии → Сцены

### Иерархия контента

```
┌─────────────────────────────────────────────────────────────────┐
│  🎲 СИСТЕМА ПРАВИЛ (RuleSystem)                                │
│  "D&D 5e" · "Warhammer 40k" · "Своя система"                  │
│  Определяет: характеристики, навыки, кубики, формулы, боёвка,  │
│  магия/пси, условия, типы урона — ВСЁ настраиваемое DM'ом      │
│  Не все игры используют d20 и D&D-таблицы!                     │
├─────────────────────────────────────────────────────────────────┤
│  🌍 СЕТТИНГ (Setting) → принадлежит системе правил             │
│  "Eberron" · "Forgotten Realms" · "Warhammer Imperium"        │
│  Определяет: расы, классы, заклинания, предметы, монстры       │
│  Контент переиспользуется между сеттингами (с overrides)       │
├─────────────────────────────────────────────────────────────────┤
│  🎮 КАМПАНИЯ (Campaign) → принадлежит сеттингу                 │
│  "Тайны Шарна" · "Последний маяк Кхорна"                      │
│  Наследует правила и контент от сеттинга                       │
├─────────────────────────────────────────────────────────────────┤
│  📖 АКТ (Act) → законченная история внутри кампании            │
│  "Акт 1: Прибытие" · "Акт 2: Заговор" · "Акт 3: Финал"        │
│  Группирует сессии в сюжетные арки с intro и epilogue          │
│  Как главы книги или акты пьесы                                │
├─────────────────────────────────────────────────────────────────┤
│  📅 СЕССИЯ (Session) → принадлежит акту                        │
│  #1 "Прибытие в Шарн" · #2 "Подземелья"                       │
│  Одна игровая встреча (3-5 часов за столом)                    │
├─────────────────────────────────────────────────────────────────┤
│  🎬 СЦЕНЫ (Scene) → дерево внутри сессии                       │
│  Intro → Таверна → [Выбор] → Подземелье / Лес → Boss → Outro  │
│  Drag & drop визуальный редактор с ветвлениями                 │
└─────────────────────────────────────────────────────────────────┘
```

**Зачем нужны Акты:**
- Структурируют кампанию как книгу с главами
- У каждого акта есть intro (завязка) и epilogue (развязка)
- Легче планировать долгие кампании на 50+ сессий
- DM видит общую картину: "Мы сейчас в Акте 2 из 5"
- Игроки чувствуют прогресс: "Мы завершили Акт 1!"

### Примеры

```
Система правил: D&D 5e
├─ Сеттинг: Eberron (наш первый!)
│   ├─ Кампания: "Тайны Шарна"
│   │   ├─ Акт 1: "Прибытие в Шарн" (intro + 4 сессии + epilogue)
│   │   │   ├─ Сессия #1: "Поезд молний"
│   │   │   │   └─ Intro → Поезд → Вокзал → Таверна "Сломанная наковальня"
│   │   │   ├─ Сессия #2: "Нижний город"
│   │   │   │   └─ [Выбор] → Нижний город / Верхний город → ...сцены...
│   │   │   ├─ Сессия #3: "Первое задание"
│   │   │   └─ Сессия #4: "Тайный заказчик" (epilogue акта)
│   │   ├─ Акт 2: "Заговор Изумрудного Когтя" (intro + N сессий + epilogue)
│   │   │   └─ ...
│   │   └─ Акт 3: "Война Драконьих Меток" (финал кампании)
│   └─ Расы: Человек, Эльф, Дварф, Полурослик, Перевёртыш, Калаштар, Кованый
│
├─ Сеттинг: Forgotten Realms
│   ├─ Расы: Человек, Эльф, Дварф... (без Кованого и Перевёртыша)
│   └─ Телекинез — стандартное описание
│
Система правил: Warhammer 40k (кастомная)
├─ Сеттинг: Imperium of Man
│   ├─ Кампания: "Последний маяк"
│   │   ├─ Акт 1: "Призыв на службу"
│   │   ├─ Акт 2: "Еретики среди нас"
│   │   └─ Акт 3: "Очищение огнём"
```

### RuleSystem — система правил

Определяет **фундаментальную механику**. Всё в JSONB — полностью настраиваемое DM'ом.

```sql
CREATE TABLE rule_systems (
    id BIGSERIAL PRIMARY KEY,
    name JSONB NOT NULL,                    -- {"ru": "D&D 5-я редакция"}
    description JSONB,
    slug VARCHAR(100) UNIQUE NOT NULL,      -- "dnd-5e"
    is_system BOOLEAN DEFAULT FALSE,        -- true = предустановленная

    -- Характеристики (у D&D — 6, у Warhammer — другие)
    abilities JSONB NOT NULL,
    -- [
    --   {"key": "strength", "name": "Сила", "short": "СИЛ"},
    --   {"key": "dexterity", "name": "Ловкость", "short": "ЛОВ"},
    --   ...
    -- ]

    -- Навыки → привязка к характеристикам
    skills JSONB DEFAULT '[]',

    -- Кубики, используемые в системе
    dice JSONB DEFAULT '["d4","d6","d8","d10","d12","d20","d100"]',

    -- Формулы (DM может менять!)
    formulas JSONB DEFAULT '{}',
    -- {
    --   "ability_modifier": "floor((score - 10) / 2)",
    --   "proficiency_bonus": "floor((level - 1) / 4) + 2",
    --   "attack_roll": "d20 + ability_mod + proficiency",
    --   "initiative": "d20 + dexterity_mod",
    --   "hp_on_level_up": "hit_die / 2 + 1 + constitution_mod"
    -- }

    -- Состояния (conditions)
    conditions JSONB DEFAULT '[]',
    -- [{"key": "blinded", "name": "Ослеплён", "description": "..."}]

    -- Типы урона
    damage_types JSONB DEFAULT '[]',
    -- [{"key": "fire", "name": "Огонь"}, {"key": "slashing", "name": "Рубящий"}]

    -- Школы магии / пси-дисциплины / итд
    magic_schools JSONB DEFAULT '[]',

    -- Уровни развития (для D&D — 1-20, для других может быть иначе)
    level_range JSONB DEFAULT '{"min": 1, "max": 20}',

    -- Боевые правила
    combat_rules JSONB DEFAULT '{}',
    -- {
    --   "initiative_type": "individual",  -- "individual" | "group" | "side"
    --   "death_saves": true,
    --   "death_save_successes": 3,
    --   "death_save_failures": 3,
    --   "critical_hit_multiplier": "double_dice",  -- правило крит-ударов
    --   "rest_types": ["short", "long"]
    -- }

    -- Система создания персонажа
    character_creation JSONB DEFAULT '{}',
    -- {
    --   "methods": ["point_buy", "standard_array", "roll"],
    --   "point_buy_budget": 27,
    --   "standard_array": [15, 14, 13, 12, 10, 8],
    --   "roll_formula": "4d6kh3"
    -- }

    -- Валюта
    currency JSONB DEFAULT '{}',
    -- {
    --   "units": [
    --     {"key": "cp", "name": "Медные", "rate": 1},
    --     {"key": "sp", "name": "Серебряные", "rate": 10},
    --     {"key": "gp", "name": "Золотые", "rate": 100}
    --   ]
    -- }

    -- Единицы измерения
    units JSONB DEFAULT '{}',
    -- {"distance": "м", "weight": "кг", "volume": "л"}

    created_at TIMESTAMP, updated_at TIMESTAMP
);
```

### Setting — сеттинг (мир)

Принадлежит системе правил. Определяет доступный игровой контент.

```sql
CREATE TABLE settings (
    id BIGSERIAL PRIMARY KEY,
    rule_system_id BIGINT NOT NULL REFERENCES rule_systems(id),
    name JSONB NOT NULL,                    -- {"ru": "Эберрон"}
    description JSONB,
    slug VARCHAR(100) UNIQUE NOT NULL,      -- "eberron"
    is_system BOOLEAN DEFAULT FALSE,
    icon VARCHAR(50),
    color VARCHAR(7),                       -- "#8B0000"
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP, updated_at TIMESTAMP
);

-- Pivot: сеттинг ↔ контент (с overrides)
CREATE TABLE setting_spells (
    id BIGSERIAL PRIMARY KEY,
    setting_id BIGINT NOT NULL REFERENCES settings(id) ON DELETE CASCADE,
    spell_id BIGINT NOT NULL REFERENCES spells(id) ON DELETE CASCADE,
    overrides JSONB,    -- null = оригинал, иначе переопределения
    UNIQUE(setting_id, spell_id)
);
-- Аналогично: setting_items, setting_monsters, setting_races, setting_classes
```

### Campaign → Act → Session → Scene (дерево)

```sql
CREATE TABLE campaigns (
    id BIGSERIAL PRIMARY KEY,
    setting_id BIGINT NOT NULL REFERENCES settings(id),
    user_id BIGINT NOT NULL REFERENCES users(id),    -- DM
    name JSONB NOT NULL,
    description JSONB,
    slug VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- active/paused/completed
    settings JSONB DEFAULT '{}',          -- доп. настройки (allowed_races, etc.)
    created_at TIMESTAMP, updated_at TIMESTAMP
);
-- Кампания наследует rule_system через setting.rule_system_id

CREATE TABLE acts (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,              -- порядковый номер: 1, 2, 3
    name JSONB NOT NULL,                  -- {"ru": "Акт 1: Прибытие в Шарн"}
    description JSONB,                    -- {"ru": "Краткое описание акта для DM"}
    intro JSONB,                          -- {"ru": "Вступительный текст акта"}
    epilogue JSONB,                       -- {"ru": "Завершающий текст акта"}
    status VARCHAR(20) DEFAULT 'planned', -- planned/active/completed
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP, updated_at TIMESTAMP
);
-- Акт группирует сессии в сюжетную арку

-- game_sessions (not "sessions" to avoid Laravel conflict)
CREATE TABLE game_sessions (
    id BIGSERIAL PRIMARY KEY,
    act_id BIGINT NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
    number INTEGER NOT NULL,              -- порядковый номер внутри акта: #1, #2, #3
    name JSONB NOT NULL,                  -- {"ru": "Поезд молний"}
    summary JSONB,                        -- {"ru": "Краткое содержание сессии"}
    status VARCHAR(20) DEFAULT 'planned', -- planned/active/completed
    played_at DATE,                       -- когда играли
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP, updated_at TIMESTAMP
);
-- campaign_id вычисляется через act.campaign_id

CREATE TABLE scenes (
    id BIGSERIAL PRIMARY KEY,
    game_session_id BIGINT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    name JSONB NOT NULL,                  -- {"ru": "Таверна «Сломанная наковальня»"}
    description JSONB,                    -- {"ru": "Описание для DM"}

    -- Тип сцены
    type VARCHAR(30) DEFAULT 'narrative', -- intro/narrative/combat/social/choice/exploration/boss/outro/custom

    -- Дерево: связи между сценами
    parent_id BIGINT REFERENCES scenes(id) ON DELETE SET NULL,  -- родительская сцена
    sort_order INTEGER DEFAULT 0,         -- порядок среди siblings

    -- Для сцен-выборов (type='choice'): варианты и куда ведут
    choices JSONB,
    -- [
    --   {"label": "Пойти в нижний город", "target_scene_id": 15},
    --   {"label": "Пойти в верхний город", "target_scene_id": 16},
    --   {"label": "Остаться в таверне", "target_scene_id": 17}
    -- ]

    -- Display Client настройки
    display JSONB DEFAULT '{}',
    -- {
    --   "lighting": "dim",
    --   "weather": "rain",
    --   "time_of_day": "evening",
    --   "transition": "fade",
    --   "overlay_color": "rgba(0,0,50,0.3)"
    -- }

    -- Привязки
    soundtrack_id BIGINT REFERENCES soundtracks(id),
    encounter_id BIGINT REFERENCES encounters(id),  -- если combat сцена

    created_at TIMESTAMP, updated_at TIMESTAMP
);
-- Media: background (image), ambient_video (optional)

-- Дополнительные связи между сценами (для нелинейных графов)
CREATE TABLE scene_connections (
    id BIGSERIAL PRIMARY KEY,
    from_scene_id BIGINT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    to_scene_id BIGINT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    label JSONB,                          -- {"ru": "Если игроки нашли ключ"}
    condition JSONB,                      -- опционально: условие перехода
    sort_order INTEGER DEFAULT 0,
    UNIQUE(from_scene_id, to_scene_id)
);
```

### Дерево сцен — визуальный редактор

```
📋 Backoffice → Кампания → Акт 1 → Сессия #1 → Редактор сцен

┌──────────────────────────────────────────────────────────────┐
│  📅 Сессия #1: "Поезд молний"             [+ Добавить сцену]│
│                                                              │
│  ┌─────────┐    ┌─────────────────┐    ┌───────────────┐    │
│  │  INTRO  │───→│ Поезд молний    │───→│ Вокзал Шарна  │    │
│  │ 🎬      │    │ 🚂 narrative    │    │ 🏙️ narrative  │    │
│  └─────────┘    └─────────────────┘    └───────┬───────┘    │
│                                                │             │
│                                         ┌──────┴──────┐     │
│                                         │  ВЫБОР  ⑂   │     │
│                                         │ choice      │     │
│                                         └──┬──────┬───┘     │
│                                    ┌───────┘      └──────┐  │
│                              ┌─────┴─────┐      ┌────────┴┐ │
│                              │ Нижний    │      │ Верхний │ │
│                              │ город     │      │ город   │ │
│                              │ ⚔️ combat  │      │ 🗣 social│ │
│                              └─────┬─────┘      └────┬────┘ │
│                                    └────────┬────────┘      │
│                                       ┌─────┴─────┐        │
│                                       │  OUTRO    │        │
│                                       │  🎬       │        │
│                                       └───────────┘        │
│                                                              │
│  [Drag & drop для перетаскивания сцен]                      │
│  [Клик на связь — редактировать условие перехода]            │
│  [Клик на сцену — редактировать содержимое, Display, музыку] │
└──────────────────────────────────────────────────────────────┘
```

**Реализация на фронте:**
- React + `@xyflow/react` (бывший React Flow) для визуального графа
- Drag & drop узлов (сцен) и рёбер (связей)
- Каждый узел — карточка с иконкой типа, названием, миниатюрой фона
- Двойной клик → открывает редактор сцены (описание, Display настройки, музыка)
- Типы сцен отображаются разными цветами/иконками

### Как DM работает с этим

```
📋 Backoffice
│
├─ 🎲 Системы правил
│   ├─ D&D 5e 🔒 (системная)
│   ├─ Мой Warhammer 40k (создал DM)
│   └─ [+ Создать систему правил]
│
├─ 🌍 Сеттинги
│   ├─ Eberron (D&D 5e) — наш первый!
│   ├─ Forgotten Realms (D&D 5e)
│   ├─ Imperium (Warhammer 40k)
│   └─ [+ Создать сеттинг] → выбрать систему правил
│
├─ 📖 Контент (расы / классы / заклинания / предметы / монстры)
│   ├─ Глобальная база — CRUD, поиск, фильтры
│   ├─ При создании: привязать к сеттингам
│   └─ Для сеттинга: [Переопределить поля] (override)
│
├─ 🎮 Кампании
│   ├─ "Тайны Шарна" (сеттинг: Eberron)
│   │   ├─ Игроки (приглашённые)
│   │   ├─ Акты
│   │   │   ├─ Акт 1: "Прибытие в Шарн" ✅ completed
│   │   │   │   ├─ Сессия #1 "Поезд молний" → [Редактор сцен]
│   │   │   │   ├─ Сессия #2 "Нижний город" → [Редактор сцен]
│   │   │   │   └─ [+ Новая сессия]
│   │   │   ├─ Акт 2: "Заговор" 🔄 active
│   │   │   │   └─ ...
│   │   │   └─ [+ Новый акт]
│   │   ├─ NPC
│   │   ├─ Таблицы случайностей
│   │   └─ Заметки
│   └─ [+ Создать кампанию] → выбрать сеттинг
```

### Seeders

```php
// 1. RuleSystemsSeeder
RuleSystem::updateOrCreate(
    ['slug' => 'dnd-5e'],
    [
        'name' => ['ru' => 'D&D 5-я редакция'],
        'is_system' => true,
        'abilities' => [...],  // 6 характеристик D&D
        'skills' => [...],     // 18 навыков
        'formulas' => [...],   // формулы D&D
        // ... все игровые правила в JSONB
    ]
);

// 2. SettingsSeeder
Setting::updateOrCreate(
    ['slug' => 'eberron'],
    [
        'name' => ['ru' => 'Эберрон'],
        'rule_system_id' => RuleSystem::where('slug', 'dnd-5e')->first()->id,
        'is_system' => true,
        'color' => '#8B0000',
    ]
);

// 3. SpellsSeeder — контент + привязка к сеттингу
$spell = Spell::updateOrCreate(['slug' => 'fireball'], [...]);
$eberron = Setting::where('slug', 'eberron')->first();
$spell->settings()->syncWithoutDetaching([$eberron->id]);
```

## Domain Models

### System Models

**RuleSystem** — Система правил
- Translatable: `name`, `description`
- JSONB: `abilities`, `skills`, `dice`, `formulas`, `conditions`, `damage_types`, `magic_schools`, `level_range`, `combat_rules`, `character_creation`, `currency`, `units`
- Fields: `slug`, `is_system`
- Relations: hasMany Settings
- Всё в JSONB — DM может менять формулы, характеристики, кубики, боёвку

**Setting** — Сеттинг / Игровой мир
- Translatable: `name`, `description`
- Fields: `slug`, `is_system`, `icon`, `color`, `sort_order`
- Relations: belongsTo RuleSystem; hasMany Campaigns; belongsToMany Spells, Items, Monsters, Races, CharacterClasses (через pivot с overrides)

### Core Models

**Campaign** — Кампания
- Translatable: `name`, `description`
- JSONB: `settings` (allowed_races, allowed_classes, starting_level, ability_method, hp_method, tone, etc.)
- Fields: `slug`, `status` (active/paused/completed)
- Relations: belongsTo Setting, User (DM); hasMany Acts, Characters, Encounters, Notes, RandomTables; belongsToMany Users (players)
- Наследует RuleSystem через `setting.rule_system_id`

**Act** — Акт (сюжетная арка)
- Translatable: `name`, `description`, `intro`, `epilogue`
- Fields: `campaign_id`, `number` (порядковый), `status` (planned/active/completed), `sort_order`
- Relations: belongsTo Campaign; hasMany GameSessions
- Группирует сессии в законченную историю с вступлением и эпилогом

**GameSession** — Игровая сессия (table: `game_sessions`)
- Translatable: `name`, `summary`
- Fields: `act_id`, `number` (порядковый внутри акта), `status` (planned/active/completed), `played_at`, `sort_order`
- Relations: belongsTo Act; hasMany Scenes
- campaign доступна через `act.campaign`
- Note: Модель называется `GameSession`, таблица `game_sessions` (избегаем конфликта с Laravel sessions)

**Scene** — Сцена (узел в дереве)
- Translatable: `name`, `description`
- JSONB: `choices` (для type=choice — варианты и target_scene_id), `display` (lighting, weather, transition, overlay)
- Fields: `game_session_id`, `parent_id` (дерево), `type` (intro/narrative/combat/social/choice/exploration/boss/outro/custom), `sort_order`
- Relations: belongsTo GameSession, parent Scene, Soundtrack, Encounter; hasMany child Scenes, SceneConnections
- Media: `background` (image), `ambient_video`

**SceneConnection** — Связь между сценами (для нелинейных графов)
- Translatable: `label`
- JSONB: `condition` (опциональное условие перехода)
- Fields: `from_scene_id`, `to_scene_id`, `sort_order`

**Character** — Персонаж игрока
- Translatable: `name`, `backstory`
- JSONB: `abilities`, `skill_proficiencies`, `skill_expertise`, `saving_throw_proficiencies`, `death_saves`, `proficiencies`, `features`, `class_resources`, `currency`, `speed`, `hit_dice_remaining`, `death_info`, `stats`
- Fields: `level`, `experience_points`, `current_hp`, `max_hp`, `temp_hp`, `armor_class`, `inspiration`, `is_alive`
- Relations: belongsTo User, Campaign; belongsToMany CharacterClass, Race, Spells, Items
- Media: `portrait`

**CharacterClass** — Классы
- Translatable: `name`, `description`
- JSONB: `primary_abilities`, `saving_throws`, `armor_proficiencies`, `weapon_proficiencies`, `tool_proficiencies`, `starting_equipment`, `level_features`, `progression`, `spell_slots`
- Fields: `slug`, `hit_die`
- Relations: belongsToMany Settings (pivot с overrides)

**Race** — Расы
- Translatable: `name`, `description`
- JSONB: `ability_bonuses`, `speed`, `traits`, `languages`, `proficiencies`
- Fields: `slug`, `size`
- Relations: belongsToMany Settings (pivot с overrides)

**Spell** — Заклинания / Способности
- Translatable: `name`, `description`
- JSONB: `components`, `classes`, `higher_levels`, `cantrip_scaling`, `effects`
- Fields: `slug`, `level`, `school`, `casting_time`, `range`, `duration`, `concentration`, `ritual`
- Relations: belongsToMany Settings (pivot с overrides)

**Item** — Предметы
- Translatable: `name`, `description`
- JSONB: `properties`, `requirements`
- Fields: `slug`, `type`, `rarity`, `weight`, `cost`, `requires_attunement`
- Relations: belongsToMany Settings (pivot с overrides)

**Monster** — Монстры
- Translatable: `name`, `description`
- JSONB: `abilities`, `speed`, `saving_throws`, `skills`, `senses`, `languages`, `damage_resistances`, `damage_immunities`, `damage_vulnerabilities`, `condition_immunities`, `traits`, `actions`, `legendary_actions`, `lair_actions`, `regional_effects`
- Fields: `slug`, `size`, `type`, `alignment`, `armor_class`, `armor_type`, `hit_points`, `hit_dice`, `challenge_rating`, `experience_points`
- Relations: belongsToMany Settings (pivot с overrides)

### DM Models

**Encounter** — Встреча / столкновение
- Translatable: `name`, `description`, `notes`
- Fields: `campaign_id`, `type`, `difficulty`, `status`, `sort_order`
- Relations: belongsTo Campaign, Scene (optional); belongsToMany Monsters

**BattleSession** — Активная битва
- Fields: `encounter_id`, `round`, `status`, `current_turn`
- Relations: belongsTo Encounter, Campaign; hasMany BattleParticipants

**BattleParticipant** — Участник битвы
- JSONB: `conditions`
- Fields: `battle_session_id`, `name`, `type`, `entity_id`, `initiative`, `current_hp`, `max_hp`, `armor_class`, `is_visible`, `sort_order`

**Npc** — Неигровые персонажи
- Translatable: `name`, `description`, `personality`, `appearance`, `motivation`
- Fields: `campaign_id`, `location`, `is_alive`, `is_known`
- Media: `portrait`

**CampaignNote** — Заметки мастера
- Translatable: `title`, `content`
- Fields: `campaign_id`, `category`, `is_shared`, `session_number`, `sort_order`

**RandomTable** — Таблица случайностей
- Translatable: `name`, `description`
- JSONB: `entries`
- Fields: `campaign_id` (nullable), `dice_formula`, `category`

### Display Models

**DisplayToken** — Токен подключения дисплея
- Fields: `token` (UUID), `code` (4 цифры), `campaign_id`, `user_id`, `name`, `status` (waiting/paired/disconnected), `code_expires_at`, `last_heartbeat_at`
- JSONB: `metadata` (user-agent, IP)
- Relations: belongsTo Campaign, User
- Код живёт 5 минут, heartbeat каждые 30 сек

**Soundtrack** — Музыка
- Fields: `name`, `category`, `url`, `duration`, `loop`
- Media: `audio_file`

**Rule** — Справочник правил
- Translatable: `title`, `content`
- Fields: `rule_system_id`, `category`, `slug`, `sort_order`
- Relations: belongsTo RuleSystem

## Seeders

### Base Seeders (run on every deploy)

All seeders are **idempotent** — use `updateOrCreate`/`firstOrCreate`.
All text content seeded in **Russian only**. Enum keys stored in English for code compatibility.

1. **RolesAndPermissionsSeeder** — roles: owner, dm, player + permissions
2. **OwnerSeeder** — создаёт owner аккаунт из env vars
3. **RuleSystemsSeeder** — система правил "D&D 5e" (`is_system=true`) — характеристики, навыки, формулы, кубики, условия, типы урона, школы магии, боевые правила, валюта, метрическая система
4. **SettingsSeeder** — сеттинг "Eberron" (D&D 5e, `is_system=true`). DM создаёт свои сеттинги сам
5. **RacesSeeder** — расы на русском + привязка к сеттингу Eberron (включая Кованый, Перевёртыш, Калаштар)
6. **ClassesSeeder** — классы на русском + привязка к Eberron
7. **SpellsSeeder** — заклинания на русском, дистанции в метрах + привязка к Eberron
8. **ItemsSeeder** — предметы на русском, вес в кг + привязка к Eberron
9. **MonstersSeeder** — монстры на русском, метрическая система + привязка к Eberron
10. **RulesSeeder** — основные правила на русском (привязка к системе D&D 5e)

### DevSeeder (local only)

- Sample кампания в сеттинге Eberron с двумя актами
- Акт 1 с двумя сессиями, Акт 2 с одной сессией
- Дерево сцен в первой сессии (intro → narrative → choice → combat → outro)
- 4-5 тестовых персонажей разных классов
- Sample encounters и random tables
- Тестовые сцены с placeholder изображениями

## Key Services

### DiceService
```php
// Опциональный цифровой бросок — физические кубики всегда в приоритете!
// Используется когда: нужен быстрый бросок по таблице, секретный бросок DM,
// или игрок забыл кубики (бывает)
$result = DiceService::roll('2d6+3');    // {rolls: [4, 2], modifier: 3, total: 9}
$result = DiceService::roll('1d20');     // {rolls: [17], modifier: 0, total: 17}
$result = DiceService::roll('4d6kh3');   // 4d6, keep highest 3 (для генерации статов)

// DM также может ввести результат физического броска вручную
// для обновления трекера битвы
```

### CharacterCreatorService
```php
// Пошаговое создание персонажа (учитывает RuleSystem + Setting кампании!)
// Характеристики, навыки, формулы — из campaign.setting.ruleSystem
// Доступные расы/классы — из campaign.setting (pivot с overrides)
//
// Шаг 1: Выбор расы → бонусы характеристик, скорость, особенности
//         (список рас фильтруется по setting + campaign.settings.allowed_races)
// Шаг 2: Выбор класса → навыки, ОЗ, снаряжение
// Шаг 3: Распределение характеристик
//         (метод из campaign.settings.ability_method, бюджет из ruleSystem.character_creation)
// Шаг 4: Выбор навыков, языков, особенностей
// Шаг 5: Снаряжение (стартовый набор класса или покупка за золотые)
// Шаг 6: Предыстория, имя, внешность, портрет
//
// Всё авто-рассчитывается по формулам из RuleSystem
```

### BattleTrackerService
```php
// Управление битвой
$battle = BattleTrackerService::start($encounter);
BattleTrackerService::rollInitiative($battle);          // Броски инициативы
BattleTrackerService::nextTurn($battle);                // Следующий ход
BattleTrackerService::applyDamage($participant, 15);    // Нанести урон
BattleTrackerService::addCondition($participant, 'stunned');  // Добавить состояние (Ошеломлён)
BattleTrackerService::removeParticipant($participant);  // Убрать из боя
```

### DisplaySyncService
```php
// Управление ТВ/монитором в комнате через WebSocket
// DM нажимает кнопку на ноутбуке → на ТВ мгновенно меняется картинка
DisplaySyncService::changeScene($campaign, $scene);     // Сменить сцену (фон + переход)
DisplaySyncService::playMusic($campaign, $soundtrack);  // Сменить музыку (crossfade)
DisplaySyncService::showChoice($campaign, $options);    // Экран выбора (Pillars of Eternity)
DisplaySyncService::showBattle($campaign, $battle);     // Показать инициативу и чей ход
DisplaySyncService::showText($campaign, $text);         // Показать описание на экран
DisplaySyncService::blackout($campaign);                // Затемнить экран (пауза, драма)
```

## Frontend i18n

- Locales: только `ru` на данный момент. Система i18n (next-intl) остаётся для будущего расширения
- Route structure: `[locale]/(group)/page` — locale пока всегда `ru`
- Translations in `apps/web/messages/ru.json`
- NEVER hardcode text — всегда использовать `useTranslations()` hook, даже если язык один
- `defaultLocale: 'ru'` — единственный активный язык
- Translatable поля в моделях (`HasTranslations`) — пока заполняются только `ru`, но структура JSON сохраняется для будущего

## Локализация D&D на русский язык

### ВАЖНО: Вся система на русском

Весь интерфейс, все данные, все правила — на русском языке. Это ключевое требование проекта. Цель — сделать D&D доступным для русскоязычных игроков, особенно новичков.

### Метрическая система

D&D по умолчанию использует имперскую систему (футы, фунты, мили). Мы **полностью переводим на метрическую**:

| Оригинал D&D | Наша система | Коэффициент | Примеры |
|-------------|-------------|-------------|---------|
| 1 foot (фут) | 0.3 м (30 см) | ×0.3 | Скорость 30 ft → 9 м |
| 5 feet (клетка) | 1.5 м | ×0.3 | Клетка боя = 1.5 м |
| 1 mile (миля) | 1.5 км | ×1.5 | Дальность заклинания 1 mile → 1.5 км |
| 1 pound (фунт) | 0.5 кг | ×0.45 | Меч 3 lb → 1.5 кг |
| 1 gallon (галлон) | 4 л | ×3.8 | Фляга воды 1 gallon → 4 л |
| 1 ounce (унция) | 30 г | ×28 | Зелье 4 oz → 120 г |
| 1 pint (пинта) | 0.5 л | ×0.47 | Кружка эля 1 pint → 0.5 л |

**Правила конвертации хранятся в RuleSystem.units JSONB:**
```php
// Из RuleSystem model (slug: 'dnd-5e'), поле units:
'units' => [
    'system' => 'metric',
    'distance' => 'м',
    'weight' => 'кг',
    'grid_cell' => 1.5,             // метров в одной клетке (5 ft)
    'conversion' => [
        'ft_to_m' => 0.3,
        'mile_to_km' => 1.5,
        'lb_to_kg' => 0.45,
    ],
],
```

### Русские термины D&D

Используем устоявшуюся русскую терминологию D&D:

**Характеристики (Ability Scores):**
| English | Русский | Сокращение |
|---------|---------|------------|
| Strength | Сила | СИЛ |
| Dexterity | Ловкость | ЛОВ |
| Constitution | Телосложение | ТЕЛ |
| Intelligence | Интеллект | ИНТ |
| Wisdom | Мудрость | МДР |
| Charisma | Харизма | ХАР |

**Навыки (Skills):**
| English | Русский |
|---------|---------|
| Acrobatics | Акробатика |
| Animal Handling | Уход за животными |
| Arcana | Магия |
| Athletics | Атлетика |
| Deception | Обман |
| History | История |
| Insight | Проницательность |
| Intimidation | Запугивание |
| Investigation | Расследование |
| Medicine | Медицина |
| Nature | Природа |
| Perception | Внимательность |
| Performance | Выступление |
| Persuasion | Убеждение |
| Religion | Религия |
| Sleight of Hand | Ловкость рук |
| Stealth | Скрытность |
| Survival | Выживание |

**Классы:**
| English | Русский |
|---------|---------|
| Barbarian | Варвар |
| Bard | Бард |
| Cleric | Жрец |
| Druid | Друид |
| Fighter | Воин |
| Monk | Монах |
| Paladin | Паладин |
| Ranger | Следопыт |
| Rogue | Плут |
| Sorcerer | Чародей |
| Warlock | Колдун |
| Wizard | Волшебник |

**Расы:**
| English | Русский |
|---------|---------|
| Human | Человек |
| Elf | Эльф |
| Dwarf | Дварф |
| Halfling | Полурослик |
| Gnome | Гном |
| Half-Elf | Полуэльф |
| Half-Orc | Полуорк |
| Tiefling | Тифлинг |
| Dragonborn | Драконорождённый |

**Школы магии:**
| English | Русский |
|---------|---------|
| Abjuration | Ограждение |
| Conjuration | Вызов |
| Divination | Прорицание |
| Enchantment | Очарование |
| Evocation | Воплощение |
| Illusion | Иллюзия |
| Necromancy | Некромантия |
| Transmutation | Преобразование |

**Состояния (Conditions):**
| English | Русский |
|---------|---------|
| Blinded | Ослеплён |
| Charmed | Очарован |
| Deafened | Оглушён |
| Frightened | Испуган |
| Grappled | Схвачен |
| Incapacitated | Недееспособен |
| Invisible | Невидим |
| Paralyzed | Парализован |
| Petrified | Окаменён |
| Poisoned | Отравлен |
| Prone | Сбит с ног |
| Restrained | Опутан |
| Stunned | Ошеломлён |
| Unconscious | Без сознания |
| Exhaustion | Истощение |

**Общие игровые термины:**
| English | Русский |
|---------|---------|
| Armor Class (AC) | Класс Доспеха (КД) |
| Hit Points (HP) | Очки Здоровья (ОЗ) |
| Hit Dice | Кость Здоровья |
| Proficiency Bonus | Бонус Мастерства |
| Saving Throw | Спасбросок |
| Attack Roll | Бросок атаки |
| Damage Roll | Бросок урона |
| Spell Slot | Ячейка заклинания |
| Cantrip | Заговор |
| Concentration | Концентрация |
| Ritual | Ритуал |
| Short Rest | Короткий отдых |
| Long Rest | Продолжительный отдых |
| Initiative | Инициатива |
| Advantage | Преимущество |
| Disadvantage | Помеха |
| Inspiration | Вдохновение |
| Experience Points (XP) | Очки Опыта (ОО) |
| Challenge Rating (CR) | Опасность (ОП) |
| Death Saving Throw | Спасбросок от смерти |
| Dungeon Master (DM) | Мастер Подземелий (МП) |

### Реализация в коде

**Сидеры** — данные сидятся на русском и привязываются к сеттингу:
```php
// SpellsSeeder.php
$spell = Spell::updateOrCreate(
    ['slug' => 'fireball'],
    [
        'name' => ['ru' => 'Огненный шар'],
        'description' => ['ru' => 'Яркий луч вылетает из вашего указательного пальца...'],
        'level' => 3,
        'school' => 'evocation',        // В БД храним enum на английском
        'casting_time' => '1 действие',  // Текстовые поля на русском
        'range' => '45 м',              // Метрическая система (150 ft → 45 м)
        'components' => ['В', 'С', 'М'], // Вербальный, Соматический, Материальный
        'duration' => 'Мгновенная',
        // ...
    ]
);
// Привязка к сеттингу Eberron (без overrides)
$eberron = Setting::where('slug', 'eberron')->first();
$spell->settings()->syncWithoutDetaching([$eberron->id]);
```

**Фронтенд** — маппинг enum → русское название через translations:
```json
// messages/ru.json
{
  "dnd": {
    "schools": {
      "evocation": "Воплощение",
      "necromancy": "Некромантия"
    },
    "conditions": {
      "blinded": "Ослеплён",
      "charmed": "Очарован"
    },
    "units": {
      "meters": "м",
      "kilometers": "км",
      "kilograms": "кг"
    }
  }
}
```

**Enum-ы в БД** хранятся на английском (для совместимости и расширяемости), **отображение** всегда на русском через translations.

## Game Rules Reference (D&D 5e RuleSystem Seeder Data)

Все игровые правила теперь живут в модели `RuleSystem` (JSONB), не в конфиг-файле.
Это позволяет DM'у менять правила через backoffice, а также создавать другие системы (Warhammer, Savage Worlds).

Ниже — данные для сидера системы "D&D 5-я редакция":

```php
// RuleSystemsSeeder.php — данные для D&D 5e
RuleSystem::updateOrCreate(
    ['slug' => 'dnd-5e'],
    [
        'name' => ['ru' => 'D&D 5-я редакция'],
        'is_system' => true,

        'abilities' => [
            ['key' => 'strength',     'name' => 'Сила',         'short' => 'СИЛ'],
            ['key' => 'dexterity',    'name' => 'Ловкость',     'short' => 'ЛОВ'],
            ['key' => 'constitution', 'name' => 'Телосложение', 'short' => 'ТЕЛ'],
            ['key' => 'intelligence', 'name' => 'Интеллект',    'short' => 'ИНТ'],
            ['key' => 'wisdom',       'name' => 'Мудрость',     'short' => 'МДР'],
            ['key' => 'charisma',     'name' => 'Харизма',      'short' => 'ХАР'],
        ],

        'skills' => [
            ['key' => 'acrobatics',      'ability' => 'dexterity',    'name' => 'Акробатика'],
            ['key' => 'animal_handling', 'ability' => 'wisdom',       'name' => 'Уход за животными'],
            ['key' => 'arcana',          'ability' => 'intelligence', 'name' => 'Магия'],
            ['key' => 'athletics',       'ability' => 'strength',     'name' => 'Атлетика'],
            ['key' => 'deception',       'ability' => 'charisma',     'name' => 'Обман'],
            ['key' => 'history',         'ability' => 'intelligence', 'name' => 'История'],
            ['key' => 'insight',         'ability' => 'wisdom',       'name' => 'Проницательность'],
            ['key' => 'intimidation',    'ability' => 'charisma',     'name' => 'Запугивание'],
            ['key' => 'investigation',   'ability' => 'intelligence', 'name' => 'Расследование'],
            ['key' => 'medicine',        'ability' => 'wisdom',       'name' => 'Медицина'],
            ['key' => 'nature',          'ability' => 'intelligence', 'name' => 'Природа'],
            ['key' => 'perception',      'ability' => 'wisdom',       'name' => 'Внимательность'],
            ['key' => 'performance',     'ability' => 'charisma',     'name' => 'Выступление'],
            ['key' => 'persuasion',      'ability' => 'charisma',     'name' => 'Убеждение'],
            ['key' => 'religion',        'ability' => 'intelligence', 'name' => 'Религия'],
            ['key' => 'sleight_of_hand', 'ability' => 'dexterity',    'name' => 'Ловкость рук'],
            ['key' => 'stealth',         'ability' => 'dexterity',    'name' => 'Скрытность'],
            ['key' => 'survival',        'ability' => 'wisdom',       'name' => 'Выживание'],
        ],

        'dice' => ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'],

        'formulas' => [
            'ability_modifier'  => 'floor((score - 10) / 2)',
            'proficiency_bonus' => 'floor((level - 1) / 4) + 2',
            'attack_roll'       => 'd20 + ability_mod + proficiency',
            'initiative'        => 'd20 + dexterity_mod',
            'passive_skill'     => '10 + skill_modifier',
            'hp_on_level_up'    => 'hit_die / 2 + 1 + constitution_mod',
        ],

        'conditions' => [
            ['key' => 'blinded',       'name' => 'Ослеплён'],
            ['key' => 'charmed',       'name' => 'Очарован'],
            ['key' => 'deafened',      'name' => 'Оглушён'],
            ['key' => 'frightened',    'name' => 'Испуган'],
            ['key' => 'grappled',      'name' => 'Схвачен'],
            ['key' => 'incapacitated', 'name' => 'Недееспособен'],
            ['key' => 'invisible',     'name' => 'Невидим'],
            ['key' => 'paralyzed',     'name' => 'Парализован'],
            ['key' => 'petrified',     'name' => 'Окаменён'],
            ['key' => 'poisoned',      'name' => 'Отравлен'],
            ['key' => 'prone',         'name' => 'Сбит с ног'],
            ['key' => 'restrained',    'name' => 'Опутан'],
            ['key' => 'stunned',       'name' => 'Ошеломлён'],
            ['key' => 'unconscious',   'name' => 'Без сознания'],
            ['key' => 'exhaustion',    'name' => 'Истощение'],
        ],

        'damage_types' => [
            ['key' => 'acid',        'name' => 'Кислота'],
            ['key' => 'bludgeoning', 'name' => 'Дробящий'],
            ['key' => 'cold',        'name' => 'Холод'],
            ['key' => 'fire',        'name' => 'Огонь'],
            ['key' => 'force',       'name' => 'Силовое поле'],
            ['key' => 'lightning',   'name' => 'Молния'],
            ['key' => 'necrotic',    'name' => 'Некротический'],
            ['key' => 'piercing',    'name' => 'Колющий'],
            ['key' => 'poison',      'name' => 'Яд'],
            ['key' => 'psychic',     'name' => 'Психический'],
            ['key' => 'radiant',     'name' => 'Излучение'],
            ['key' => 'slashing',    'name' => 'Рубящий'],
            ['key' => 'thunder',     'name' => 'Звук'],
        ],

        'magic_schools' => [
            ['key' => 'abjuration',    'name' => 'Ограждение'],
            ['key' => 'conjuration',   'name' => 'Вызов'],
            ['key' => 'divination',    'name' => 'Прорицание'],
            ['key' => 'enchantment',   'name' => 'Очарование'],
            ['key' => 'evocation',     'name' => 'Воплощение'],
            ['key' => 'illusion',      'name' => 'Иллюзия'],
            ['key' => 'necromancy',    'name' => 'Некромантия'],
            ['key' => 'transmutation', 'name' => 'Преобразование'],
        ],

        'level_range' => ['min' => 1, 'max' => 20],

        'combat_rules' => [
            'initiative_type' => 'individual',
            'death_saves' => true,
            'death_save_successes' => 3,
            'death_save_failures' => 3,
            'critical_hit_multiplier' => 'double_dice',
            'rest_types' => ['short', 'long'],
        ],

        'character_creation' => [
            'methods' => ['point_buy', 'standard_array', 'roll'],
            'point_buy_budget' => 27,
            'standard_array' => [15, 14, 13, 12, 10, 8],
            'roll_formula' => '4d6kh3',
        ],

        'currency' => [
            'units' => [
                ['key' => 'cp', 'name' => 'Медные', 'rate' => 1],
                ['key' => 'sp', 'name' => 'Серебряные', 'rate' => 10],
                ['key' => 'ep', 'name' => 'Электрумовые', 'rate' => 50],
                ['key' => 'gp', 'name' => 'Золотые', 'rate' => 100],
                ['key' => 'pp', 'name' => 'Платиновые', 'rate' => 1000],
            ],
        ],

        'units' => [
            'system' => 'metric',
            'distance' => 'м',
            'weight' => 'кг',
            'grid_cell' => 1.5,  // метров в одной клетке
            'conversion' => ['ft_to_m' => 0.3, 'mile_to_km' => 1.5, 'lb_to_kg' => 0.45],
        ],
    ]
);
```

**App-level config** (не зависит от системы правил):
```php
// config/app-dnd.php — только настройки приложения, не правила
return [
    'locale' => 'ru',
    'default_rule_system' => 'dnd-5e',
    'default_setting' => 'eberron',
];
```

## Security

Безопасность — не фича, а фундамент. Каждый контроллер, каждый endpoint, каждый WebSocket канал защищён.

### Authentication
- **Laravel Passport** OAuth2 с personal access tokens
- Email verification обязательна (нельзя войти без подтверждения)
- Аккаунт `is_active=false` по умолчанию → Owner/DM активирует вручную
- Деактивация игрока → все токены отзываются мгновенно (`tokens()->delete()`)
- Password hashing: bcrypt (Laravel default)

### Authorization — каждый запрос проверяется
```php
// Middleware stack (routes/api.php)
Route::middleware('auth:api')->group(function () {
    // Player routes — только авторизованные
    Route::prefix('player')->group(function () { ... });

    // Backoffice — auth + проверка роли
    Route::middleware('backoffice.access')->prefix('backoffice')->group(function () { ... });
});

// BackofficeAccess middleware
if (!$user->hasAnyRole(['owner', 'dm'])) {
    abort(403);
}

// Campaign-level: Policy
class CampaignPolicy {
    public function view(User $user, Campaign $campaign): bool {
        return $user->id === $campaign->user_id           // DM кампании
            || $campaign->players->contains($user->id);    // Приглашённый игрок
    }
}

// Character-level: принадлежность
class CharacterPolicy {
    public function update(User $user, Character $character): bool {
        return $user->id === $character->user_id           // Владелец персонажа
            || $user->id === $character->campaign->user_id; // DM кампании
    }
}
```

**Правила:**
- Player видит ТОЛЬКО свои персонажи и кампании куда приглашён
- Player НЕ видит персонажей других игроков (кроме публичных данных в битве)
- DM видит всё в своих кампаниях, но не в чужих
- Owner видит и управляет всем
- Каждый CRUD endpoint проверяет Policy: `$this->authorize('update', $character)`

### WebSocket Security
```php
// channels.php — авторизация каналов
Broadcast::channel('campaign.{id}', function (User $user, int $id) {
    $campaign = Campaign::findOrFail($id);
    return $campaign->user_id === $user->id
        || $campaign->players->contains($user->id);
});

// Приватный канал DM → конкретный игрок
Broadcast::channel('private-character.{id}', function (User $user, int $id) {
    $character = Character::findOrFail($id);
    return $user->id === $character->user_id
        || $user->id === $character->campaign->user_id;
});

// Display канал — только DM
Broadcast::channel('campaign.{id}.display', function (User $user, int $id) {
    return Campaign::where('id', $id)->where('user_id', $user->id)->exists();
});
```

### Input Validation & Protection
- **Form Requests** на каждый endpoint — валидация до контроллера
- **JSONB валидация** — кастомные правила для abilities, overrides, scene choices
- **Mass assignment** — `$fillable` на всех моделях, никогда `$guarded = []`
- **SQL injection** — Eloquent ORM + parameter binding (никогда raw SQL без bindings)
- **XSS** — все translatable поля: `strip_tags()` / `htmlspecialchars()` при сохранении
- **Rate limiting** — Laravel throttle middleware на auth endpoints (`60/min`), API (`120/min`)
- **File uploads** — валидация MIME types, размеров, Spatie MediaLibrary санитизация имён
- **CORS** — настроен только для frontend домена

### Принцип наименьших привилегий
```
guest     → GET  /                        (только лендинг)
player    → GET  /api/v1/player/*         (только свои данные)
           → PUT  /api/v1/player/character/* (только свой персонаж)
dm        → *    /api/v1/backoffice/*     (CRUD контента, своих кампаний)
owner     → *    /api/v1/backoffice/*     (всё + управление пользователями и ролями)
```

## Coding Conventions

### Reference Implementation

Use the XStream project (`C:\Projects\xstream-next`) as reference for:
- Docker setup and configuration
- Laravel API patterns (controllers, models, traits)
- Next.js frontend patterns (layouts, components, contexts)
- DataTable with server-side sorting
- Form handling with validation
- i18n implementation
- Auth flow with Passport
- Coolify deployment config

### From XStream, adopt these patterns:

- `FormatsWithTranslations` trait for translatable models
- API response format: `{ success: true, data: {...}, meta: {...} }`
- Backoffice controller CRUD pattern with search, sort, pagination
- `BackofficeAccess` middleware — проверяет роли owner/dm для доступа к `/dashboard/*`
- `config/content.php` for pagination limits
- `config/upload.php` for upload limits
- Auth context pattern for frontend
- API client class pattern
- DataTable + columns.tsx pattern for all backoffice lists
- Dashboard sidebar layout with mobile drawer (паттерн из XStream)

### UI Patterns (D&D themed)

**Color Palette:**
```css
--primary: #8B0000;        /* Deep Red — primary actions, D&D brand feel */
--secondary: #C9A94E;      /* Gold — highlights, important elements */
--background: #1a1a2e;     /* Dark Navy — основной фон */
--surface: #16213e;        /* Darker Blue — карточки, панели */
--text: #e0e0e0;           /* Light Gray — основной текст */
--text-muted: #8892a4;     /* Muted — второстепенный текст */
--success: #48c715;        /* Green — здоровье, успех */
--danger: #dc2626;         /* Red — урон, опасность */
--warning: #f59e0b;        /* Amber — предупреждения */
--info: #3b82f6;           /* Blue — магия, информация */
```

**Design Principles:**
- Dark theme by default (в комнате для игры обычно приглушённый свет — тёмный UI не слепит)
- Display client — полноэкранный, кинематографичный, НОЛЬ UI элементов (только контент)
- Player client — **mobile-first**, компактный, одна рука, быстрый доступ к нужному (телефон лежит на столе рядом с кубиками)
- DM client — **desktop-first**, много информации на экране, мультипанельный (ноутбук перед Мастером)
- Минимум взаимодействия с экраном — игроки должны смотреть друг на друга, а не в телефоны
- Крупные кнопки и текст на Player client (чтобы быстро глянуть и вернуться к игре)
- Используй иконки в стиле фэнтези где уместно (мечи, щиты, свитки)

### Toast Notifications
```typescript
import { toast } from "@/components/ui/toaster";
toast.success("Character saved!");
toast.error("Spell casting failed");
```

### State Persistence (localStorage)
```
Pattern: dnd-{context}-{purpose}
Examples:
  dnd-player-active-character
  dnd-player-active-campaign
  dnd-dashboard-active-campaign
  dnd-dashboard-battle-state
  dnd-display-settings
```

## Key Packages

### Laravel (apps/api)
- `laravel/passport` — OAuth2 authentication
- `laravel/reverb` — WebSocket server (first-party, self-hosted)
- `spatie/laravel-permission` — Roles and permissions
- `spatie/laravel-activitylog` — Audit logging
- `spatie/laravel-medialibrary` — Image/audio uploads with conversions
- `spatie/laravel-translatable` — Translatable models (ru)

### Next.js (apps/web)
- `next-intl` — i18n with locale-based routing
- `@radix-ui/*` — Headless UI (shadcn/ui)
- `tailwindcss` v4 + `@tailwindcss/vite` — CSS-first styling
- `framer-motion` — Animations (scene transitions, dice, pages)
- `@tanstack/react-table` — DataTables в backoffice
- `howler.js` — Audio playback для Display client
- `laravel-echo` + `pusher-js` — WebSocket client
- `sonner` — Toast notifications
- `lucide-react` — Icons
- `@xyflow/react` — Визуальный редактор дерева сцен (drag & drop, nodes, edges)
- `@dnd-kit/core` — Drag & drop (initiative order, inventory)
- `react-hook-form` + `zod` — Forms с валидацией

## Media Handling

### Upload Limits
| Type | Limit | Formats |
|------|-------|---------|
| Character portraits | 10MB | JPG, JPEG, WebP, PNG |
| Scene backgrounds | 20MB | JPG, JPEG, WebP, PNG |
| Scene ambient video | 500MB | MP4 |
| Soundtrack audio | 50MB | MP3, OGG, WAV |

### Media Collections (Spatie)
- Character: `portrait` (single, conversions: thumb 200x200, large 600x600)
- Scene: `background` (single, conversions: thumb 400x225, large 1920x1080)
- Scene: `ambient_video` (single, no conversions)
- Monster: `portrait` (single)
- Npc: `portrait` (single)
- Soundtrack: `audio_file` (single)

## Open Gaming License (OGL/SRD)

D&D 5e имеет Systems Reference Document (SRD) с открытой лицензией. Можно свободно использовать:
- Базовые правила (combat, magic, conditions, etc.)
- Один подкласс для каждого класса
- Базовые расы и подрасы
- ~300 заклинаний
- ~300 монстров
- Базовое снаряжение

**Весь SRD контент переводится на русский** с конвертацией в метрическую систему. Используем устоявшиеся переводы D&D на русский (см. раздел «Локализация D&D на русский язык»).

**ВАЖНО:** НЕ включать контент из платных книг (PHB, DMG, MM beyond SRD). Весь SRD контент сидится в базу и привязывается к сеттингу Eberron. Для пользовательского контента DM создаёт свои сеттинги. Для других игровых систем (Warhammer, Savage Worlds) DM создаёт новую RuleSystem с нуля.

## Environment Files

### Local Development
- `apps/api/.env` — Laravel config (copy from `.env.example`)
- `apps/web/.env.local` — Next.js config (copy from `.env.local.example`)

### Production
- `apps/api/.env.prod` — Non-secret API settings (committed to repo)
- `apps/web/.env.prod` — Non-secret Web settings for Coolify

## Deployment

Platform: **Coolify** with Git integration (Caddy proxy) on AWS.
Все клиенты подключаются к серверу через интернет — обычный веб-сайт.

### CORS: Handled by Caddy proxy (Coolify), NOT Laravel.
```php
// config/cors.php → paths => []
```

### Coolify Applications

| App | Domain | Dockerfile | Port |
|-----|--------|-----------|------|
| DnD API | api.dnd.yourdomain.com | apps/api/Dockerfile | 8000 |
| DnD Web | dnd.yourdomain.com | apps/web/Dockerfile | 3000 |

### Coolify Secrets
```
APP_KEY, DB_HOST, DB_USERNAME, DB_PASSWORD
REDIS_HOST, REDIS_PASSWORD
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
PASSPORT_PRIVATE_KEY_BASE64, PASSPORT_PUBLIC_KEY_BASE64
OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD
```

## Development Priority

### Phase 1 — MVP (Player Client + Basic DM)
1. Auth system (login, register, email verification, role: owner/dm/player)
2. Landing page (красивая страница для гостей, описание проекта, кнопка регистрации)
3. Backoffice skeleton (sidebar layout, user management — owner активирует игроков, назначает DM)
4. RuleSystem + Setting models (D&D 5e + Eberron сидятся из коробки)
5. DM: Campaign CRUD в backoffice (создание, привязка к сеттингу, настройки, приглашение игроков)
6. DM: Acts & Sessions management (акты группируют сессии, CRUD)
7. Character creation wizard (раса, класс, характеристики, снаряжение — пошагово, с иллюстрациями, контент из сеттинга кампании)
8. Character sheet view (характеристики, навыки, ОЗ, КД — крупно, читаемо с телефона)
9. Dice roller (опционально), Spell book (поиск, фильтры), Inventory management
10. DM: Заметки кампании в backoffice

### Phase 2 — Battle, Content & Scene Tree
1. Battle tracker в backoffice (инициатива, HP, состояния, ходы — DM управляет, игроки видят)
2. WebSocket интеграция для синхронизации в реальном времени
3. Визуальный редактор дерева сцен (@xyflow/react — drag & drop, ветвления, связи)
4. DM: Управление контентом (CRUD монстры, заклинания, предметы + привязка к сеттингам + overrides)
5. DM: Создание собственных сеттингов и систем правил
6. DM: Таблицы случайностей, NPC, encounter builder
7. Level up flow для персонажей
8. Кладбище персонажей (death tracking, статистика)

### Phase 3 — Display Client (📺 Большой экран)
1. Управление сценами в backoffice (фоны, освещение, эффекты)
2. Музыкальный плеер (ambient + combat + custom, плавные переходы)
3. Display client (fullscreen scene renderer для ТВ/монитора)
4. Экраны выбора в стиле CRPG (Pillars of Eternity / Baldur's Gate)
5. Отображение битвы на ТВ (порядок инициативы, чей ход)
6. Display Remote в backoffice (пульт управления ТВ — сцена, музыка, текст, затемнение)

### Phase 4 — Polish
1. Продвинутые фичи персонажа (мультиклассирование, черты)
2. Редактор homebrew контента (свои заклинания, предметы, монстры)
3. Экспорт/импорт кампании
4. История сессий и логирование
5. Оптимизация Player client для телефонов (быстрый доступ, минимум скроллинга)
6. Landing page (для нового проекта, опционально)

## Gotchas & Solutions

Refer to the XStream project's CLAUDE.md and PROJECT_BOOTSTRAP_GUIDE.md for all known issues with:
- Docker & local development
- AWS S3 & CloudFront
- Coolify & production deployment
- Laravel API patterns
- Next.js frontend patterns
- Media handling
- CI/CD

The same patterns and solutions apply to this project.

## Code Quality

### PHP Standards (PHP 8.4)
- Typed class constants: `public const string STATUS_ACTIVE = 'active';`
- Readonly properties where applicable
- Import classes — avoid fully qualified names
- Arrow functions for simple closures

### TypeScript/React Standards
- Import React types explicitly (not `React.ReactNode`)
- Handle ignored promises with `void` operator
- React 19 ref pattern (no `forwardRef`)
- `readonly` for immutable class fields

### Pre-Commit Checks
```bash
npm run lint && npm run build && docker exec dnd_api php artisan test
```
