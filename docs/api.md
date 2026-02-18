# API Reference

## API Structure

All routes versioned under `/api/v1/`:

```
/auth/*                          — Login, register, logout, me

/player/*                        — Player endpoints (role: player)
├─ campaigns                     — Мои кампании
├─ characters                    — Мои персонажи
├─ character/{id}                — Лист персонажа (CRUD)
├─ spells                        — Поиск заклинаний
└─ items                         — Поиск предметов

/backoffice/*                    — DM/Owner endpoints
├─ rule-systems                  — Системы правил
├─ settings                      — Сеттинги / миры
├─ campaigns                     — CRUD кампаний
├─ campaigns/{id}/acts           — Акты кампании
├─ campaigns/{id}/acts/{aid}/sessions — Сессии
├─ campaigns/{id}/scenes         — Сцены кампании
├─ campaigns/{id}/encounters     — Встречи
├─ campaigns/{id}/notes          — Заметки
├─ campaigns/{id}/players        — Игроки (приглашение/удаление)
├─ battles                       — Управление битвой
├─ monsters                      — Бестиарий
├─ spells                        — Заклинания
├─ items                         — Предметы
├─ users                         — Управление пользователями (owner only)
├─ displays                      — Активные дисплеи
└─ displays/pair                 — Подключить дисплей по коду

/display/*                       — Display client (без авторизации)
├─ register                      — Зарегистрировать дисплей
├─ status                        — Статус подключения
├─ stream                        — WebSocket команды от DM
└─ heartbeat                     — Heartbeat каждые 30 сек
```

## Middleware

- `auth:api` — авторизация через Passport
- `backoffice.access` — проверяет роль owner или dm
- `campaign.member` — проверяет принадлежность к кампании

## Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... },
  "message": "Optional message"
}
```

## Key Services

### DiceService

```php
$result = DiceService::roll('2d6+3');    // {rolls: [4, 2], modifier: 3, total: 9}
$result = DiceService::roll('4d6kh3');   // 4d6, keep highest 3
```

### CharacterCreatorService

Пошаговое создание персонажа:
1. Выбор расы → бонусы характеристик
2. Выбор класса → навыки, ОЗ
3. Распределение характеристик
4. Выбор навыков, языков
5. Снаряжение
6. Предыстория, имя, портрет

### BattleTrackerService

```php
$battle = BattleTrackerService::start($encounter);
BattleTrackerService::rollInitiative($battle);
BattleTrackerService::nextTurn($battle);
BattleTrackerService::applyDamage($participant, 15);
BattleTrackerService::addCondition($participant, 'stunned');
```

### DisplaySyncService

```php
DisplaySyncService::changeScene($campaign, $scene);
DisplaySyncService::playMusic($campaign, $soundtrack);
DisplaySyncService::showChoice($campaign, $options);
DisplaySyncService::showBattle($campaign, $battle);
DisplaySyncService::showText($campaign, $text);
DisplaySyncService::blackout($campaign);
```

## Queue System

| Queue | Purpose |
|-------|---------|
| `default` | Notifications, emails |
| `media` | Media conversions |
