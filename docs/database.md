# Database & Models

## PostgreSQL JSONB

PostgreSQL 17 с мощной поддержкой JSONB для сложных вложенных структур D&D.

### Когда JSONB, когда таблица

| Используй JSONB | Используй таблицу |
|-----------------|-------------------|
| Данные принадлежат одной сущности | Данные переиспользуются |
| Нет необходимости в JOIN | Нужны JOIN, агрегации |
| Структура гибкая | Структура строгая |
| Читаются целиком | Запрашиваются отдельно |

## Content Architecture

```
🎲 СИСТЕМА ПРАВИЛ (RuleSystem) — D&D 5e, Warhammer, своя система
    │
    └─ 🌍 СЕТТИНГ (Setting) — Eberron, Forgotten Realms
           │
           └─ 🎮 КАМПАНИЯ (Campaign) — "Тайны Шарна"
                  │
                  └─ 📖 АКТ (Act) — "Акт 1: Прибытие"
                         │
                         └─ 📅 СЕССИЯ (Session) — "#1 Поезд молний"
                                │
                                └─ 🎬 СЦЕНЫ (Scene) — дерево с ветвлениями
```

## Domain Models

### System Models

**RuleSystem** — Система правил
- JSONB: `abilities`, `skills`, `formulas`, `conditions`, `damage_types`, `combat_rules`
- Всё настраиваемое DM'ом

**Setting** — Сеттинг / Игровой мир
- belongsTo RuleSystem
- belongsToMany Spells, Items, Monsters, Races, Classes (pivot с overrides)

### Core Models

**Campaign** — Кампания
- belongsTo Setting, User (DM)
- hasMany Acts, Characters, Encounters
- JSONB: `settings` (allowed_races, starting_level, etc.)

**Act** — Акт (сюжетная арка)
- belongsTo Campaign
- hasMany GameSessions

**GameSession** — Игровая сессия
- belongsTo Act
- hasMany Scenes

**Scene** — Сцена (узел в дереве)
- JSONB: `choices`, `display` (lighting, weather, transition)
- belongsTo GameSession, parent Scene, Soundtrack

**Character** — Персонаж игрока
- JSONB: `abilities`, `skill_proficiencies`, `features`, `currency`, `death_info`, `stats`
- belongsTo User, Campaign

**CharacterClass** — Классы
- JSONB: `level_features`, `progression`, `spell_slots`

**Race** — Расы
- JSONB: `ability_bonuses`, `traits`

**Spell** — Заклинания
- JSONB: `components`, `effects`, `higher_levels`

**Monster** — Монстры
- JSONB: `abilities`, `actions`, `legendary_actions`

### DM Models

**Encounter** — Встреча
**BattleSession** — Активная битва
**BattleParticipant** — Участник битвы
**Npc** — Неигровые персонажи
**CampaignNote** — Заметки мастера
**RandomTable** — Таблицы случайностей

### Display Models

**DisplayToken** — Токен подключения дисплея
**Soundtrack** — Музыка

## JSONB Examples

### Character

```sql
CREATE TABLE characters (
    id BIGSERIAL PRIMARY KEY,
    name JSONB NOT NULL,                    -- {"ru": "Торин"}

    abilities JSONB NOT NULL DEFAULT '{
        "strength": 10, "dexterity": 10, "constitution": 10,
        "intelligence": 10, "wisdom": 10, "charisma": 10
    }',

    skill_proficiencies JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    currency JSONB DEFAULT '{"cp": 0, "sp": 0, "gp": 0}',

    death_info JSONB,  -- заполняется при гибели
    stats JSONB DEFAULT '{}',  -- накопительная статистика

    level INTEGER NOT NULL DEFAULT 1,
    current_hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    armor_class INTEGER NOT NULL DEFAULT 10,
    is_alive BOOLEAN DEFAULT TRUE,

    campaign_id BIGINT REFERENCES campaigns(id),
    user_id BIGINT REFERENCES users(id)
);

CREATE INDEX idx_characters_abilities ON characters USING GIN (abilities);
```

### Полезные запросы

```php
// Поиск заклинаний для класса
Spell::whereJsonContains('classes', 'wizard')->get();

// Персонажи с высокой Силой
Character::whereRaw("(abilities->>'strength')::int >= ?", [16])->get();

// Обновление JSONB
$character->update([
    'currency' => array_merge($character->currency, ['gp' => 50])
]);
```

## Seeders

All seeders are **idempotent** — use `updateOrCreate`.

1. **RolesAndPermissionsSeeder** — roles: owner, dm, player
2. **OwnerSeeder** — owner аккаунт из env vars
3. **RuleSystemsSeeder** — D&D 5e с характеристиками, формулами
4. **SettingsSeeder** — Eberron
5. **RacesSeeder** — расы на русском
6. **ClassesSeeder** — классы на русском
7. **SpellsSeeder** — заклинания (метрическая система)
8. **ItemsSeeder** — предметы
9. **MonstersSeeder** — монстры
10. **RulesSeeder** — основные правила

**DevSeeder** (local only): sample кампания, персонажи, encounters
