<?php

namespace Database\Seeders;

use App\Models\RuleSystem;
use Illuminate\Database\Seeder;

class RuleSystemsSeeder extends Seeder
{
    public function run(): void
    {
        RuleSystem::updateOrCreate(
            ['slug' => 'dnd-5e'],
            [
                'name' => ['ru' => 'D&D 5-я редакция'],
                'description' => ['ru' => 'Dungeons & Dragons пятой редакции — классическая настольная ролевая игра'],
                'is_system' => true,

                'abilities' => [
                    ['key' => 'strength', 'name' => 'Сила', 'short' => 'СИЛ'],
                    ['key' => 'dexterity', 'name' => 'Ловкость', 'short' => 'ЛОВ'],
                    ['key' => 'constitution', 'name' => 'Телосложение', 'short' => 'ТЕЛ'],
                    ['key' => 'intelligence', 'name' => 'Интеллект', 'short' => 'ИНТ'],
                    ['key' => 'wisdom', 'name' => 'Мудрость', 'short' => 'МДР'],
                    ['key' => 'charisma', 'name' => 'Харизма', 'short' => 'ХАР'],
                ],

                'skills' => [
                    ['key' => 'acrobatics', 'ability' => 'dexterity', 'name' => 'Акробатика'],
                    ['key' => 'animal_handling', 'ability' => 'wisdom', 'name' => 'Уход за животными'],
                    ['key' => 'arcana', 'ability' => 'intelligence', 'name' => 'Магия'],
                    ['key' => 'athletics', 'ability' => 'strength', 'name' => 'Атлетика'],
                    ['key' => 'deception', 'ability' => 'charisma', 'name' => 'Обман'],
                    ['key' => 'history', 'ability' => 'intelligence', 'name' => 'История'],
                    ['key' => 'insight', 'ability' => 'wisdom', 'name' => 'Проницательность'],
                    ['key' => 'intimidation', 'ability' => 'charisma', 'name' => 'Запугивание'],
                    ['key' => 'investigation', 'ability' => 'intelligence', 'name' => 'Расследование'],
                    ['key' => 'medicine', 'ability' => 'wisdom', 'name' => 'Медицина'],
                    ['key' => 'nature', 'ability' => 'intelligence', 'name' => 'Природа'],
                    ['key' => 'perception', 'ability' => 'wisdom', 'name' => 'Внимательность'],
                    ['key' => 'performance', 'ability' => 'charisma', 'name' => 'Выступление'],
                    ['key' => 'persuasion', 'ability' => 'charisma', 'name' => 'Убеждение'],
                    ['key' => 'religion', 'ability' => 'intelligence', 'name' => 'Религия'],
                    ['key' => 'sleight_of_hand', 'ability' => 'dexterity', 'name' => 'Ловкость рук'],
                    ['key' => 'stealth', 'ability' => 'dexterity', 'name' => 'Скрытность'],
                    ['key' => 'survival', 'ability' => 'wisdom', 'name' => 'Выживание'],
                ],

                'dice' => ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'],

                'formulas' => [
                    'ability_modifier' => 'floor((score - 10) / 2)',
                    'proficiency_bonus' => 'floor((level - 1) / 4) + 2',
                    'attack_roll' => 'd20 + ability_mod + proficiency',
                    'initiative' => 'd20 + dexterity_mod',
                    'passive_skill' => '10 + skill_modifier',
                    'hp_on_level_up' => 'hit_die / 2 + 1 + constitution_mod',
                ],

                'conditions' => [
                    ['key' => 'blinded', 'name' => 'Ослеплён', 'description' => 'Существо не видит и автоматически проваливает проверки, требующие зрения.'],
                    ['key' => 'charmed', 'name' => 'Очарован', 'description' => 'Существо не может атаковать того, кто его очаровал.'],
                    ['key' => 'deafened', 'name' => 'Оглушён', 'description' => 'Существо не слышит и автоматически проваливает проверки слуха.'],
                    ['key' => 'frightened', 'name' => 'Испуган', 'description' => 'Существо имеет помеху, пока видит источник страха.'],
                    ['key' => 'grappled', 'name' => 'Схвачен', 'description' => 'Скорость существа становится 0.'],
                    ['key' => 'incapacitated', 'name' => 'Недееспособен', 'description' => 'Существо не может совершать действия и реакции.'],
                    ['key' => 'invisible', 'name' => 'Невидим', 'description' => 'Существо невозможно увидеть без магии или особого чувства.'],
                    ['key' => 'paralyzed', 'name' => 'Парализован', 'description' => 'Существо недееспособно и не может двигаться или говорить.'],
                    ['key' => 'petrified', 'name' => 'Окаменён', 'description' => 'Существо превращается в камень вместе со снаряжением.'],
                    ['key' => 'poisoned', 'name' => 'Отравлен', 'description' => 'Существо имеет помеху к броскам атаки и проверкам характеристик.'],
                    ['key' => 'prone', 'name' => 'Сбит с ног', 'description' => 'Существо может только ползти. Имеет помеху к атакам.'],
                    ['key' => 'restrained', 'name' => 'Опутан', 'description' => 'Скорость 0, помеха к атакам и спасброскам Ловкости.'],
                    ['key' => 'stunned', 'name' => 'Ошеломлён', 'description' => 'Существо недееспособно и автоматически проваливает спасброски СИЛ и ЛОВ.'],
                    ['key' => 'unconscious', 'name' => 'Без сознания', 'description' => 'Существо недееспособно, не осознаёт окружение, роняет всё что держит.'],
                    ['key' => 'exhaustion', 'name' => 'Истощение', 'description' => 'Измеряется 6 уровнями с нарастающими штрафами.'],
                ],

                'damage_types' => [
                    ['key' => 'acid', 'name' => 'Кислота'],
                    ['key' => 'bludgeoning', 'name' => 'Дробящий'],
                    ['key' => 'cold', 'name' => 'Холод'],
                    ['key' => 'fire', 'name' => 'Огонь'],
                    ['key' => 'force', 'name' => 'Силовое поле'],
                    ['key' => 'lightning', 'name' => 'Молния'],
                    ['key' => 'necrotic', 'name' => 'Некротический'],
                    ['key' => 'piercing', 'name' => 'Колющий'],
                    ['key' => 'poison', 'name' => 'Яд'],
                    ['key' => 'psychic', 'name' => 'Психический'],
                    ['key' => 'radiant', 'name' => 'Излучение'],
                    ['key' => 'slashing', 'name' => 'Рубящий'],
                    ['key' => 'thunder', 'name' => 'Звук'],
                ],

                'magic_schools' => [
                    ['key' => 'abjuration', 'name' => 'Ограждение', 'description' => 'Защитная магия, барьеры и изгнание.'],
                    ['key' => 'conjuration', 'name' => 'Вызов', 'description' => 'Призыв существ и создание объектов.'],
                    ['key' => 'divination', 'name' => 'Прорицание', 'description' => 'Предсказания и получение информации.'],
                    ['key' => 'enchantment', 'name' => 'Очарование', 'description' => 'Влияние на разум и эмоции.'],
                    ['key' => 'evocation', 'name' => 'Воплощение', 'description' => 'Манипуляция энергией, боевая магия.'],
                    ['key' => 'illusion', 'name' => 'Иллюзия', 'description' => 'Обман чувств и создание образов.'],
                    ['key' => 'necromancy', 'name' => 'Некромантия', 'description' => 'Манипуляция жизненной силой и нежитью.'],
                    ['key' => 'transmutation', 'name' => 'Преобразование', 'description' => 'Изменение свойств материи и энергии.'],
                ],

                'level_range' => ['min' => 1, 'max' => 20],

                'combat_rules' => [
                    'initiative_type' => 'individual',
                    'death_saves' => true,
                    'death_save_successes' => 3,
                    'death_save_failures' => 3,
                    'critical_hit_multiplier' => 'double_dice',
                    'critical_hit_range' => 20,
                    'critical_fail_range' => 1,
                    'rest_types' => ['short', 'long'],
                    'short_rest_hours' => 1,
                    'long_rest_hours' => 8,
                ],

                'character_creation' => [
                    'methods' => ['point_buy', 'standard_array', 'roll'],
                    'point_buy_budget' => 27,
                    'point_buy_min' => 8,
                    'point_buy_max' => 15,
                    'standard_array' => [15, 14, 13, 12, 10, 8],
                    'roll_formula' => '4d6kh3',
                    'min_ability_score' => 3,
                    'max_ability_score' => 20,
                ],

                'currency' => [
                    'units' => [
                        ['key' => 'cp', 'name' => 'Медные', 'short' => 'мм', 'rate' => 1],
                        ['key' => 'sp', 'name' => 'Серебряные', 'short' => 'см', 'rate' => 10],
                        ['key' => 'ep', 'name' => 'Электрумовые', 'short' => 'эм', 'rate' => 50],
                        ['key' => 'gp', 'name' => 'Золотые', 'short' => 'зм', 'rate' => 100],
                        ['key' => 'pp', 'name' => 'Платиновые', 'short' => 'пм', 'rate' => 1000],
                    ],
                    'default' => 'gp',
                ],

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

                // D&D 5e XP Table (SRD)
                'experience_table' => [
                    '1' => 0,
                    '2' => 300,
                    '3' => 900,
                    '4' => 2700,
                    '5' => 6500,
                    '6' => 14000,
                    '7' => 23000,
                    '8' => 34000,
                    '9' => 48000,
                    '10' => 64000,
                    '11' => 85000,
                    '12' => 100000,
                    '13' => 120000,
                    '14' => 140000,
                    '15' => 165000,
                    '16' => 195000,
                    '17' => 225000,
                    '18' => 265000,
                    '19' => 305000,
                    '20' => 355000,
                ],

                // Multiclass prerequisites (D&D 5e SRD)
                'multiclass_prerequisites' => [
                    'barbarian' => ['strength' => 13],
                    'bard' => ['charisma' => 13],
                    'cleric' => ['wisdom' => 13],
                    'druid' => ['wisdom' => 13],
                    'fighter' => ['strength' => 13, 'or' => ['dexterity' => 13]],
                    'monk' => ['dexterity' => 13, 'wisdom' => 13],
                    'paladin' => ['strength' => 13, 'charisma' => 13],
                    'ranger' => ['dexterity' => 13, 'wisdom' => 13],
                    'rogue' => ['dexterity' => 13],
                    'sorcerer' => ['charisma' => 13],
                    'warlock' => ['charisma' => 13],
                    'wizard' => ['intelligence' => 13],
                ],

                // Proficiencies gained when multiclassing into a class (D&D 5e SRD)
                'multiclass_proficiencies' => [
                    'barbarian' => [
                        'armor' => ['shields'],
                        'weapons' => ['simple', 'martial'],
                    ],
                    'bard' => [
                        'armor' => ['light'],
                        'skills' => 1, // One skill of choice
                        'instruments' => 1,
                    ],
                    'cleric' => [
                        'armor' => ['light', 'medium', 'shields'],
                    ],
                    'druid' => [
                        'armor' => ['light', 'medium', 'shields'],
                    ],
                    'fighter' => [
                        'armor' => ['light', 'medium', 'shields'],
                        'weapons' => ['simple', 'martial'],
                    ],
                    'monk' => [
                        'weapons' => ['simple', 'shortswords'],
                    ],
                    'paladin' => [
                        'armor' => ['light', 'medium', 'shields'],
                        'weapons' => ['simple', 'martial'],
                    ],
                    'ranger' => [
                        'armor' => ['light', 'medium', 'shields'],
                        'weapons' => ['simple', 'martial'],
                        'skills' => 1,
                    ],
                    'rogue' => [
                        'armor' => ['light'],
                        'tools' => ['thieves_tools'],
                        'skills' => 1,
                    ],
                    'sorcerer' => [],
                    'warlock' => [
                        'armor' => ['light'],
                        'weapons' => ['simple'],
                    ],
                    'wizard' => [],
                ],
            ]
        );

        $this->command->info('RuleSystem "D&D 5e" seeded successfully.');
    }
}
