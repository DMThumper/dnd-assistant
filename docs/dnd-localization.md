# D&D Локализация

## Вся система на русском

Весь интерфейс, все данные, все правила — на русском языке.

## Метрическая система

| Оригинал D&D | Наша система | Коэффициент |
|-------------|-------------|-------------|
| 1 foot (фут) | 0.3 м | ×0.3 |
| 5 feet (клетка) | 1.5 м | ×0.3 |
| 1 mile (миля) | 1.5 км | ×1.5 |
| 1 pound (фунт) | 0.5 кг | ×0.45 |

Конвертация хранится в `RuleSystem.units` JSONB:
```php
'units' => [
    'system' => 'metric',
    'distance' => 'м',
    'weight' => 'кг',
    'grid_cell' => 1.5,
    'conversion' => [
        'ft_to_m' => 0.3,
        'mile_to_km' => 1.5,
        'lb_to_kg' => 0.45,
    ],
],
```

## Русские термины D&D

### Характеристики (Ability Scores)

| English | Русский | Сокращение |
|---------|---------|------------|
| Strength | Сила | СИЛ |
| Dexterity | Ловкость | ЛОВ |
| Constitution | Телосложение | ТЕЛ |
| Intelligence | Интеллект | ИНТ |
| Wisdom | Мудрость | МДР |
| Charisma | Харизма | ХАР |

### Навыки (Skills)

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

### Классы

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

### Расы

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
| Warforged | Кованый |
| Shifter | Перевёртыш |
| Kalashtar | Калаштар |

### Школы магии

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

### Состояния (Conditions)

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

### Общие игровые термины

| English | Русский |
|---------|---------|
| Armor Class (AC) | Класс Доспеха (КД) |
| Hit Points (HP) | Очки Здоровья (ОЗ) |
| Hit Dice | Кость Здоровья |
| Proficiency Bonus | Бонус Мастерства |
| Saving Throw | Спасбросок |
| Spell Slot | Ячейка заклинания |
| Cantrip | Заговор |
| Concentration | Концентрация |
| Initiative | Инициатива |
| Advantage | Преимущество |
| Disadvantage | Помеха |
| Inspiration | Вдохновение |
| Experience Points (XP) | Очки Опыта (ОО) |
| Challenge Rating (CR) | Опасность (ОП) |

## Реализация

**Enum-ы в БД** хранятся на английском, **отображение** на русском через translations:

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
    }
  }
}
```

## Open Gaming License (OGL/SRD)

Используем D&D 5e Systems Reference Document:
- Базовые правила
- Один подкласс для каждого класса
- ~300 заклинаний
- ~300 монстров
- Базовое снаряжение

**НЕ включать** контент из платных книг (PHB, DMG, MM beyond SRD).
