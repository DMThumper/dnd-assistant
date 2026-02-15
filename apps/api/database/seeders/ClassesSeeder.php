<?php

namespace Database\Seeders;

use App\Models\CharacterClass;
use App\Models\Setting;
use Illuminate\Database\Seeder;

class ClassesSeeder extends Seeder
{
    public function run(): void
    {
        $eberron = Setting::where('slug', 'eberron')->first();
        $forgottenRealms = Setting::where('slug', 'forgotten-realms')->first();

        $classes = $this->getClasses();

        foreach ($classes as $classData) {
            $class = CharacterClass::updateOrCreate(
                ['slug' => $classData['slug']],
                $classData
            );

            // Attach to both settings
            if ($eberron) {
                $class->settings()->syncWithoutDetaching([$eberron->id]);
            }
            if ($forgottenRealms) {
                $class->settings()->syncWithoutDetaching([$forgottenRealms->id]);
            }
        }

        $this->command->info('Character classes seeded successfully.');
    }

    private function getClasses(): array
    {
        return [
            // BARBARIAN
            [
                'slug' => 'barbarian',
                'name' => ['ru' => 'Варвар'],
                'description' => ['ru' => 'Свирепый воин примитивного происхождения, способный впадать в боевую ярость. Варвары черпают силу из первобытных инстинктов и яростной решимости.'],
                'hit_die' => 'd12',
                'primary_abilities' => ['strength'],
                'saving_throws' => ['strength', 'constitution'],
                'armor_proficiencies' => ['light', 'medium', 'shields'],
                'weapon_proficiencies' => ['simple', 'martial'],
                'tool_proficiencies' => [],
                'skill_choices' => 2,
                'skill_options' => ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'greataxe', 'qty' => 1]],
                        [['item' => 'martial_melee_weapon', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'handaxe', 'qty' => 2]],
                        [['item' => 'simple_weapon', 'qty' => 1]],
                    ]],
                    ['item' => 'explorer_pack', 'qty' => 1],
                    ['item' => 'javelin', 'qty' => 4],
                ],
                'starting_gold_formula' => '2d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'rage', 'name' => 'Ярость', 'description' => 'Бонусным действием вы можете впасть в ярость. Пока вы в ярости, вы получаете преимущество на проверки и спасброски Силы, +2 к урону рукопашными атаками с использованием Силы, и сопротивление дробящему, колющему и рубящему урону.', 'type' => 'feature', 'uses_per_rest' => 2, 'recharge' => 'long_rest'],
                        ['key' => 'unarmored_defense', 'name' => 'Защита без доспехов', 'description' => 'Без доспехов ваш КД равен 10 + модификатор Ловкости + модификатор Телосложения.', 'type' => 'feature'],
                    ],
                    '2' => [
                        ['key' => 'reckless_attack', 'name' => 'Безрассудная атака', 'description' => 'Когда вы совершаете первую атаку в свой ход, вы можете решить атаковать безрассудно. Вы получаете преимущество на броски атаки оружием ближнего боя с использованием Силы в этом ходу, но броски атаки по вам тоже совершаются с преимуществом до начала вашего следующего хода.', 'type' => 'feature'],
                        ['key' => 'danger_sense', 'name' => 'Чувство опасности', 'description' => 'Вы получаете преимущество на спасброски Ловкости от эффектов, которые вы можете видеть.', 'type' => 'feature'],
                    ],
                    '3' => [
                        ['key' => 'primal_path', 'name' => 'Путь дикости', 'description' => 'Выберите путь, определяющий природу вашей ярости.', 'type' => 'subclass'],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                    ],
                    '5' => [
                        ['key' => 'extra_attack', 'name' => 'Дополнительная атака', 'description' => 'Когда вы совершаете действие Атака, вы можете атаковать дважды.', 'type' => 'feature'],
                        ['key' => 'fast_movement', 'name' => 'Быстрое передвижение', 'description' => 'Ваша скорость увеличивается на 3 метра, если вы не носите тяжёлый доспех.', 'type' => 'feature'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2, 'rages' => 2, 'rage_damage' => 2],
                    '2' => ['proficiency_bonus' => 2, 'rages' => 2, 'rage_damage' => 2],
                    '3' => ['proficiency_bonus' => 2, 'rages' => 3, 'rage_damage' => 2],
                    '4' => ['proficiency_bonus' => 2, 'rages' => 3, 'rage_damage' => 2],
                    '5' => ['proficiency_bonus' => 3, 'rages' => 3, 'rage_damage' => 2],
                    '6' => ['proficiency_bonus' => 3, 'rages' => 4, 'rage_damage' => 2],
                    '7' => ['proficiency_bonus' => 3, 'rages' => 4, 'rage_damage' => 2],
                    '8' => ['proficiency_bonus' => 3, 'rages' => 4, 'rage_damage' => 2],
                    '9' => ['proficiency_bonus' => 4, 'rages' => 4, 'rage_damage' => 3],
                    '10' => ['proficiency_bonus' => 4, 'rages' => 4, 'rage_damage' => 3],
                ],
                'is_spellcaster' => false,
                'subclass_level' => '3',
                'subclass_name' => ['ru' => 'Путь дикости'],
                'is_system' => true,
                'sort_order' => 1,
            ],

            // BARD
            [
                'slug' => 'bard',
                'name' => ['ru' => 'Бард'],
                'description' => ['ru' => 'Вдохновляющий маг, чья сила отражается в музыке творения. Барды — мастера песен, речей и магии, которую они вплетают в свои выступления.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['charisma'],
                'saving_throws' => ['dexterity', 'charisma'],
                'armor_proficiencies' => ['light'],
                'weapon_proficiencies' => ['simple', 'hand_crossbow', 'longsword', 'rapier', 'shortsword'],
                'tool_proficiencies' => ['musical_instruments:3'],
                'skill_choices' => 3,
                'skill_options' => ['acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight_of_hand', 'stealth', 'survival'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'rapier', 'qty' => 1]],
                        [['item' => 'longsword', 'qty' => 1]],
                        [['item' => 'simple_weapon', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'diplomat_pack', 'qty' => 1]],
                        [['item' => 'entertainer_pack', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'lute', 'qty' => 1]],
                        [['item' => 'musical_instrument', 'qty' => 1]],
                    ]],
                    ['item' => 'leather_armor', 'qty' => 1],
                    ['item' => 'dagger', 'qty' => 1],
                ],
                'starting_gold_formula' => '5d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'spellcasting', 'name' => 'Использование заклинаний', 'description' => 'Вы научились изменять ткань реальности в гармонии с вашими желаниями и музыкой. Харизма — ваша базовая характеристика для заклинаний.', 'type' => 'spellcasting'],
                        ['key' => 'bardic_inspiration', 'name' => 'Бардовское вдохновение', 'description' => 'Бонусным действием вы можете вдохновить другое существо в пределах 18 метров. Оно получает кость бардовского вдохновения (d6), которую может добавить к одному броску атаки, проверке характеристики или спасброску в течение 10 минут.', 'type' => 'feature', 'uses' => 'charisma_mod', 'recharge' => 'long_rest'],
                    ],
                    '2' => [
                        ['key' => 'jack_of_all_trades', 'name' => 'Мастер на все руки', 'description' => 'Вы можете добавлять половину бонуса мастерства к любой проверке характеристики, которая ещё не включает ваш бонус мастерства.', 'type' => 'feature'],
                        ['key' => 'song_of_rest', 'name' => 'Песнь отдыха', 'description' => 'Во время короткого отдыха вы можете использовать успокаивающую музыку или речь, чтобы помочь оживить ваших раненых союзников. Они восстанавливают дополнительно 1d6 хитов.', 'type' => 'feature'],
                    ],
                    '3' => [
                        ['key' => 'bard_college', 'name' => 'Коллегия бардов', 'description' => 'Выберите коллегию, определяющую стиль вашего искусства.', 'type' => 'subclass'],
                        ['key' => 'expertise', 'name' => 'Экспертиза', 'description' => 'Выберите два навыка, которыми владеете. Ваш бонус мастерства удваивается для этих навыков.', 'type' => 'feature'],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                    ],
                    '5' => [
                        ['key' => 'bardic_inspiration_d8', 'name' => 'Бардовское вдохновение (d8)', 'description' => 'Ваша кость бардовского вдохновения становится d8.', 'type' => 'improvement'],
                        ['key' => 'font_of_inspiration', 'name' => 'Источник вдохновения', 'description' => 'Вы восстанавливаете все использования бардовского вдохновения после короткого или продолжительного отдыха.', 'type' => 'feature'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2, 'cantrips' => 2, 'spells_known' => 4],
                    '2' => ['proficiency_bonus' => 2, 'cantrips' => 2, 'spells_known' => 5],
                    '3' => ['proficiency_bonus' => 2, 'cantrips' => 2, 'spells_known' => 6],
                    '4' => ['proficiency_bonus' => 2, 'cantrips' => 3, 'spells_known' => 7],
                    '5' => ['proficiency_bonus' => 3, 'cantrips' => 3, 'spells_known' => 8],
                ],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'charisma',
                'spell_slots' => [
                    '1' => ['1st' => 2],
                    '2' => ['1st' => 3],
                    '3' => ['1st' => 4, '2nd' => 2],
                    '4' => ['1st' => 4, '2nd' => 3],
                    '5' => ['1st' => 4, '2nd' => 3, '3rd' => 2],
                ],
                'spells_known' => ['1' => 4, '2' => 5, '3' => 6, '4' => 7, '5' => 8],
                'subclass_level' => '3',
                'subclass_name' => ['ru' => 'Коллегия бардов'],
                'is_system' => true,
                'sort_order' => 2,
            ],

            // CLERIC
            [
                'slug' => 'cleric',
                'name' => ['ru' => 'Жрец'],
                'description' => ['ru' => 'Священный посланник богов, облачённый в доспехи и несущий божественную магию. Жрецы служат посредниками между смертным миром и далёкими планами богов.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['wisdom'],
                'saving_throws' => ['wisdom', 'charisma'],
                'armor_proficiencies' => ['light', 'medium', 'shields'],
                'weapon_proficiencies' => ['simple'],
                'tool_proficiencies' => [],
                'skill_choices' => 2,
                'skill_options' => ['history', 'insight', 'medicine', 'persuasion', 'religion'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'mace', 'qty' => 1]],
                        [['item' => 'warhammer', 'qty' => 1, 'if' => 'proficient']],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'scale_mail', 'qty' => 1]],
                        [['item' => 'leather_armor', 'qty' => 1]],
                        [['item' => 'chain_mail', 'qty' => 1, 'if' => 'proficient']],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'light_crossbow', 'qty' => 1], ['item' => 'bolts', 'qty' => 20]],
                        [['item' => 'simple_weapon', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'priest_pack', 'qty' => 1]],
                        [['item' => 'explorer_pack', 'qty' => 1]],
                    ]],
                    ['item' => 'shield', 'qty' => 1],
                    ['item' => 'holy_symbol', 'qty' => 1],
                ],
                'starting_gold_formula' => '5d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'spellcasting', 'name' => 'Использование заклинаний', 'description' => 'Будучи проводником божественной силы, вы можете творить заклинания жреца. Мудрость — ваша базовая характеристика для заклинаний.', 'type' => 'spellcasting'],
                        ['key' => 'divine_domain', 'name' => 'Божественный домен', 'description' => 'Выберите домен, связанный с вашим божеством. Домен даёт дополнительные заклинания и способности.', 'type' => 'subclass'],
                    ],
                    '2' => [
                        ['key' => 'channel_divinity', 'name' => 'Божественный канал', 'description' => 'Вы получаете способность направлять божественную энергию напрямую от вашего божества. Вы можете использовать Божественный канал один раз между отдыхами.', 'type' => 'feature', 'uses' => 1, 'recharge' => 'short_rest'],
                        ['key' => 'turn_undead', 'name' => 'Изгнание нежити', 'description' => 'Действием вы показываете свой священный символ и произносите молитву. Каждая нежить в пределах 9 метров должна совершить спасбросок Мудрости или бежать от вас 1 минуту.', 'type' => 'feature'],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                    ],
                    '5' => [
                        ['key' => 'destroy_undead', 'name' => 'Уничтожение нежити', 'description' => 'Когда нежить проваливает спасбросок против вашего Изгнания нежити, она мгновенно уничтожается, если её показатель опасности равен 1/2 или ниже.', 'type' => 'feature'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2, 'cantrips' => 3],
                    '2' => ['proficiency_bonus' => 2, 'cantrips' => 3],
                    '3' => ['proficiency_bonus' => 2, 'cantrips' => 3],
                    '4' => ['proficiency_bonus' => 2, 'cantrips' => 4],
                    '5' => ['proficiency_bonus' => 3, 'cantrips' => 4],
                ],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'spell_slots' => [
                    '1' => ['1st' => 2],
                    '2' => ['1st' => 3],
                    '3' => ['1st' => 4, '2nd' => 2],
                    '4' => ['1st' => 4, '2nd' => 3],
                    '5' => ['1st' => 4, '2nd' => 3, '3rd' => 2],
                ],
                'subclass_level' => '1',
                'subclass_name' => ['ru' => 'Божественный домен'],
                'is_system' => true,
                'sort_order' => 3,
            ],

            // DRUID
            [
                'slug' => 'druid',
                'name' => ['ru' => 'Друид'],
                'description' => ['ru' => 'Хранитель Старой Веры, облечённый силами природы — луны, Земли и огня, ветра и молнии. Друиды способны принимать облик животных и повелевать стихиями.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['wisdom'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'armor_proficiencies' => ['light', 'medium', 'shields'],
                'weapon_proficiencies' => ['club', 'dagger', 'dart', 'javelin', 'mace', 'quarterstaff', 'scimitar', 'sickle', 'sling', 'spear'],
                'tool_proficiencies' => ['herbalism_kit'],
                'skill_choices' => 2,
                'skill_options' => ['arcana', 'animal_handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'wooden_shield', 'qty' => 1]],
                        [['item' => 'simple_weapon', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'scimitar', 'qty' => 1]],
                        [['item' => 'simple_melee_weapon', 'qty' => 1]],
                    ]],
                    ['item' => 'leather_armor', 'qty' => 1],
                    ['item' => 'explorer_pack', 'qty' => 1],
                    ['item' => 'druidic_focus', 'qty' => 1],
                ],
                'starting_gold_formula' => '2d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'druidic', 'name' => 'Друидический язык', 'description' => 'Вы знаете друидический язык — тайный язык друидов. Вы можете говорить на нём и использовать его для оставления скрытых посланий.', 'type' => 'feature'],
                        ['key' => 'spellcasting', 'name' => 'Использование заклинаний', 'description' => 'Черпая божественную сущность самой природы, вы можете творить заклинания друида. Мудрость — ваша базовая характеристика для заклинаний.', 'type' => 'spellcasting'],
                    ],
                    '2' => [
                        ['key' => 'wild_shape', 'name' => 'Дикий облик', 'description' => 'Действием вы можете магически принять облик зверя, которого вы видели. Вы можете использовать эту способность дважды между отдыхами.', 'type' => 'feature', 'uses' => 2, 'recharge' => 'short_rest'],
                        ['key' => 'druid_circle', 'name' => 'Круг друидов', 'description' => 'Выберите круг друидов, определяющий вашу связь с природой.', 'type' => 'subclass'],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                        ['key' => 'wild_shape_improvement', 'name' => 'Улучшение дикого облика', 'description' => 'Вы можете превращаться в зверей с показателем опасности 1/2 или ниже без плавания.', 'type' => 'improvement'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2, 'cantrips' => 2],
                    '2' => ['proficiency_bonus' => 2, 'cantrips' => 2],
                    '3' => ['proficiency_bonus' => 2, 'cantrips' => 2],
                    '4' => ['proficiency_bonus' => 2, 'cantrips' => 3],
                    '5' => ['proficiency_bonus' => 3, 'cantrips' => 3],
                ],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'spell_slots' => [
                    '1' => ['1st' => 2],
                    '2' => ['1st' => 3],
                    '3' => ['1st' => 4, '2nd' => 2],
                    '4' => ['1st' => 4, '2nd' => 3],
                    '5' => ['1st' => 4, '2nd' => 3, '3rd' => 2],
                ],
                'subclass_level' => '2',
                'subclass_name' => ['ru' => 'Круг друидов'],
                'is_system' => true,
                'sort_order' => 4,
            ],

            // FIGHTER
            [
                'slug' => 'fighter',
                'name' => ['ru' => 'Воин'],
                'description' => ['ru' => 'Мастер боевых искусств, владеющий всеми видами оружия и доспехов. Воины — непревзойдённые бойцы, способные адаптироваться к любой ситуации на поле боя.'],
                'hit_die' => 'd10',
                'primary_abilities' => ['strength', 'dexterity'],
                'saving_throws' => ['strength', 'constitution'],
                'armor_proficiencies' => ['light', 'medium', 'heavy', 'shields'],
                'weapon_proficiencies' => ['simple', 'martial'],
                'tool_proficiencies' => [],
                'skill_choices' => 2,
                'skill_options' => ['acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'chain_mail', 'qty' => 1]],
                        [['item' => 'leather_armor', 'qty' => 1], ['item' => 'longbow', 'qty' => 1], ['item' => 'arrows', 'qty' => 20]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'martial_weapon', 'qty' => 1], ['item' => 'shield', 'qty' => 1]],
                        [['item' => 'martial_weapon', 'qty' => 2]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'light_crossbow', 'qty' => 1], ['item' => 'bolts', 'qty' => 20]],
                        [['item' => 'handaxe', 'qty' => 2]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'dungeoneer_pack', 'qty' => 1]],
                        [['item' => 'explorer_pack', 'qty' => 1]],
                    ]],
                ],
                'starting_gold_formula' => '5d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'fighting_style', 'name' => 'Боевой стиль', 'description' => 'Вы выбираете боевой стиль, в котором специализируетесь: Защита, Дуэлянт, Бой двумя оружиями, Бой большим оружием, Стрельба или Оборона.', 'type' => 'choice', 'options' => ['archery', 'defense', 'dueling', 'great_weapon_fighting', 'protection', 'two_weapon_fighting']],
                        ['key' => 'second_wind', 'name' => 'Второе дыхание', 'description' => 'Бонусным действием вы можете восстановить хиты в размере 1d10 + ваш уровень воина. Вы должны завершить короткий или продолжительный отдых, прежде чем сможете использовать эту способность снова.', 'type' => 'feature', 'uses' => 1, 'recharge' => 'short_rest'],
                    ],
                    '2' => [
                        ['key' => 'action_surge', 'name' => 'Всплеск действий', 'description' => 'В свой ход вы можете совершить одно дополнительное действие помимо обычного действия и бонусного действия. Использовав эту способность, вы должны завершить короткий или продолжительный отдых, чтобы использовать её снова.', 'type' => 'feature', 'uses' => 1, 'recharge' => 'short_rest'],
                    ],
                    '3' => [
                        ['key' => 'martial_archetype', 'name' => 'Воинский архетип', 'description' => 'Выберите архетип, отражающий ваш стиль и технику боя.', 'type' => 'subclass'],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                    ],
                    '5' => [
                        ['key' => 'extra_attack', 'name' => 'Дополнительная атака', 'description' => 'Когда вы совершаете действие Атака, вы можете атаковать дважды.', 'type' => 'feature'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2],
                    '2' => ['proficiency_bonus' => 2],
                    '3' => ['proficiency_bonus' => 2],
                    '4' => ['proficiency_bonus' => 2],
                    '5' => ['proficiency_bonus' => 3],
                ],
                'is_spellcaster' => false,
                'subclass_level' => '3',
                'subclass_name' => ['ru' => 'Воинский архетип'],
                'is_system' => true,
                'sort_order' => 5,
            ],

            // MONK
            [
                'slug' => 'monk',
                'name' => ['ru' => 'Монах'],
                'description' => ['ru' => 'Мастер боевых искусств, использующий силу тела для достижения физического и духовного совершенства. Монахи черпают магическую энергию ки, проходящую через всё живое.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['dexterity', 'wisdom'],
                'saving_throws' => ['strength', 'dexterity'],
                'armor_proficiencies' => [],
                'weapon_proficiencies' => ['simple', 'shortsword'],
                'tool_proficiencies' => ['choice:artisan_tool_or_musical_instrument'],
                'skill_choices' => 2,
                'skill_options' => ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'shortsword', 'qty' => 1]],
                        [['item' => 'simple_weapon', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'dungeoneer_pack', 'qty' => 1]],
                        [['item' => 'explorer_pack', 'qty' => 1]],
                    ]],
                    ['item' => 'dart', 'qty' => 10],
                ],
                'starting_gold_formula' => '5d4',
                'level_features' => [
                    '1' => [
                        ['key' => 'unarmored_defense', 'name' => 'Защита без доспехов', 'description' => 'Без доспехов ваш КД равен 10 + модификатор Ловкости + модификатор Мудрости.', 'type' => 'feature'],
                        ['key' => 'martial_arts', 'name' => 'Боевые искусства', 'description' => 'Вы можете использовать Ловкость вместо Силы для атак и урона безоружными ударами и монашеским оружием. Урон безоружного удара — 1d4. Когда вы совершаете действие Атака безоружным ударом или монашеским оружием, вы можете совершить один безоружный удар бонусным действием.', 'type' => 'feature'],
                    ],
                    '2' => [
                        ['key' => 'ki', 'name' => 'Ки', 'description' => 'Вы получаете доступ к мистической энергии ки. Количество очков ки равно вашему уровню монаха. Вы можете тратить ки на различные способности.', 'type' => 'resource', 'amount' => 'level', 'recharge' => 'short_rest'],
                        ['key' => 'flurry_of_blows', 'name' => 'Шквал ударов', 'description' => 'Сразу после действия Атака вы можете потратить 1 очко ки, чтобы совершить два безоружных удара бонусным действием.', 'type' => 'feature', 'cost' => '1 ki'],
                        ['key' => 'patient_defense', 'name' => 'Терпеливая оборона', 'description' => 'Вы можете потратить 1 очко ки, чтобы совершить действие Уклонение бонусным действием.', 'type' => 'feature', 'cost' => '1 ki'],
                        ['key' => 'step_of_the_wind', 'name' => 'Шаг ветра', 'description' => 'Вы можете потратить 1 очко ки, чтобы совершить действие Отход или Рывок бонусным действием, и ваша дистанция прыжка удваивается в этом ходу.', 'type' => 'feature', 'cost' => '1 ki'],
                        ['key' => 'unarmored_movement', 'name' => 'Передвижение без доспехов', 'description' => 'Ваша скорость увеличивается на 3 метра, если вы не носите доспехи и не используете щит.', 'type' => 'feature'],
                    ],
                    '3' => [
                        ['key' => 'monastic_tradition', 'name' => 'Монастырская традиция', 'description' => 'Выберите монастырскую традицию, определяющую ваш путь.', 'type' => 'subclass'],
                        ['key' => 'deflect_missiles', 'name' => 'Отражение снарядов', 'description' => 'Реакцией вы можете отклонить или поймать снаряд, уменьшая урон на 1d10 + модификатор Ловкости + уровень монаха. Если урон снижен до 0, вы можете поймать снаряд и бросить его обратно за 1 очко ки.', 'type' => 'feature'],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                        ['key' => 'slow_fall', 'name' => 'Медленное падение', 'description' => 'Реакцией при падении вы можете уменьшить урон от падения на величину, равную вашему уровню монаха × 5.', 'type' => 'feature'],
                    ],
                    '5' => [
                        ['key' => 'extra_attack', 'name' => 'Дополнительная атака', 'description' => 'Когда вы совершаете действие Атака, вы можете атаковать дважды.', 'type' => 'feature'],
                        ['key' => 'stunning_strike', 'name' => 'Ошеломляющий удар', 'description' => 'Когда вы попадаете по существу атакой рукопашным оружием, вы можете потратить 1 очко ки, чтобы попытаться ошеломить цель. Она должна преуспеть в спасброске Телосложения или станет ошеломлённой до конца вашего следующего хода.', 'type' => 'feature', 'cost' => '1 ki'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2, 'martial_arts' => 'd4', 'ki_points' => 0, 'unarmored_movement' => 0],
                    '2' => ['proficiency_bonus' => 2, 'martial_arts' => 'd4', 'ki_points' => 2, 'unarmored_movement' => 3],
                    '3' => ['proficiency_bonus' => 2, 'martial_arts' => 'd4', 'ki_points' => 3, 'unarmored_movement' => 3],
                    '4' => ['proficiency_bonus' => 2, 'martial_arts' => 'd4', 'ki_points' => 4, 'unarmored_movement' => 3],
                    '5' => ['proficiency_bonus' => 3, 'martial_arts' => 'd6', 'ki_points' => 5, 'unarmored_movement' => 3],
                ],
                'is_spellcaster' => false,
                'subclass_level' => '3',
                'subclass_name' => ['ru' => 'Монастырская традиция'],
                'is_system' => true,
                'sort_order' => 6,
            ],

            // PALADIN
            [
                'slug' => 'paladin',
                'name' => ['ru' => 'Паладин'],
                'description' => ['ru' => 'Святой воин, связанный священной клятвой. Паладины — защитники справедливости, использующие божественную магию для уничтожения зла и защиты невинных.'],
                'hit_die' => 'd10',
                'primary_abilities' => ['strength', 'charisma'],
                'saving_throws' => ['wisdom', 'charisma'],
                'armor_proficiencies' => ['light', 'medium', 'heavy', 'shields'],
                'weapon_proficiencies' => ['simple', 'martial'],
                'tool_proficiencies' => [],
                'skill_choices' => 2,
                'skill_options' => ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'martial_weapon', 'qty' => 1], ['item' => 'shield', 'qty' => 1]],
                        [['item' => 'martial_weapon', 'qty' => 2]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'javelin', 'qty' => 5]],
                        [['item' => 'simple_melee_weapon', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'priest_pack', 'qty' => 1]],
                        [['item' => 'explorer_pack', 'qty' => 1]],
                    ]],
                    ['item' => 'chain_mail', 'qty' => 1],
                    ['item' => 'holy_symbol', 'qty' => 1],
                ],
                'starting_gold_formula' => '5d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'divine_sense', 'name' => 'Божественное чувство', 'description' => 'Действием вы можете ощутить присутствие сильного зла или добра. До конца вашего следующего хода вы знаете местоположение любого исчадия, небожителя или нежити в пределах 18 метров.', 'type' => 'feature', 'uses' => 'charisma_mod + 1', 'recharge' => 'long_rest'],
                        ['key' => 'lay_on_hands', 'name' => 'Наложение рук', 'description' => 'У вас есть запас целительной силы, восстанавливающийся после продолжительного отдыха. Запас равен вашему уровню паладина × 5. Действием вы можете коснуться существа и восстановить ему хиты из вашего запаса.', 'type' => 'feature', 'pool' => 'level * 5', 'recharge' => 'long_rest'],
                    ],
                    '2' => [
                        ['key' => 'fighting_style', 'name' => 'Боевой стиль', 'description' => 'Вы выбираете боевой стиль: Защита, Дуэлянт, Бой большим оружием или Оборона.', 'type' => 'choice', 'options' => ['defense', 'dueling', 'great_weapon_fighting', 'protection']],
                        ['key' => 'spellcasting', 'name' => 'Использование заклинаний', 'description' => 'Вы научились черпать божественную магию через медитацию и молитву. Харизма — ваша базовая характеристика для заклинаний.', 'type' => 'spellcasting'],
                        ['key' => 'divine_smite', 'name' => 'Божественная кара', 'description' => 'Когда вы попадаете по существу атакой рукопашным оружием, вы можете потратить ячейку заклинания, чтобы нанести дополнительный урон излучением. 2d8 за ячейку 1-го уровня, плюс 1d8 за каждый уровень ячейки выше первого (максимум 5d8). Урон увеличивается на 1d8, если цель — нежить или исчадие.', 'type' => 'feature'],
                    ],
                    '3' => [
                        ['key' => 'divine_health', 'name' => 'Божественное здоровье', 'description' => 'Божественная магия защищает вас от болезней. Вы иммунны к болезням.', 'type' => 'feature'],
                        ['key' => 'sacred_oath', 'name' => 'Священная клятва', 'description' => 'Выберите клятву, связывающую вас как паладина навеки.', 'type' => 'subclass'],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                    ],
                    '5' => [
                        ['key' => 'extra_attack', 'name' => 'Дополнительная атака', 'description' => 'Когда вы совершаете действие Атака, вы можете атаковать дважды.', 'type' => 'feature'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2],
                    '2' => ['proficiency_bonus' => 2],
                    '3' => ['proficiency_bonus' => 2],
                    '4' => ['proficiency_bonus' => 2],
                    '5' => ['proficiency_bonus' => 3],
                ],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'charisma',
                'spell_slots' => [
                    '2' => ['1st' => 2],
                    '3' => ['1st' => 3],
                    '4' => ['1st' => 3],
                    '5' => ['1st' => 4, '2nd' => 2],
                ],
                'subclass_level' => '3',
                'subclass_name' => ['ru' => 'Священная клятва'],
                'is_system' => true,
                'sort_order' => 7,
            ],

            // RANGER
            [
                'slug' => 'ranger',
                'name' => ['ru' => 'Следопыт'],
                'description' => ['ru' => 'Воин дикой местности, использующий магию природы для усиления своих боевых способностей. Следопыты — охотники и защитники границ цивилизации.'],
                'hit_die' => 'd10',
                'primary_abilities' => ['dexterity', 'wisdom'],
                'saving_throws' => ['strength', 'dexterity'],
                'armor_proficiencies' => ['light', 'medium', 'shields'],
                'weapon_proficiencies' => ['simple', 'martial'],
                'tool_proficiencies' => [],
                'skill_choices' => 3,
                'skill_options' => ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'scale_mail', 'qty' => 1]],
                        [['item' => 'leather_armor', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'shortsword', 'qty' => 2]],
                        [['item' => 'simple_melee_weapon', 'qty' => 2]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'dungeoneer_pack', 'qty' => 1]],
                        [['item' => 'explorer_pack', 'qty' => 1]],
                    ]],
                    ['item' => 'longbow', 'qty' => 1],
                    ['item' => 'arrows', 'qty' => 20],
                ],
                'starting_gold_formula' => '5d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'favored_enemy', 'name' => 'Избранный враг', 'description' => 'Выберите тип существа как избранного врага: аберрации, звери, исчадия, драконы, великаны, гуманоиды, монстры, нежить, растения, слизи, феи или элементали. Вы имеете преимущество на проверки Мудрости (Выживание) для выслеживания избранных врагов и проверки Интеллекта для вспоминания информации о них.', 'type' => 'choice'],
                        ['key' => 'natural_explorer', 'name' => 'Естественный исследователь', 'description' => 'Выберите тип местности: арктика, болота, горы, леса, луга, пустыня, подземье или побережье. В этой местности вы получаете множество преимуществ при путешествии и выслеживании.', 'type' => 'choice'],
                    ],
                    '2' => [
                        ['key' => 'fighting_style', 'name' => 'Боевой стиль', 'description' => 'Вы выбираете боевой стиль: Стрельба, Защита, Дуэлянт или Бой двумя оружиями.', 'type' => 'choice', 'options' => ['archery', 'defense', 'dueling', 'two_weapon_fighting']],
                        ['key' => 'spellcasting', 'name' => 'Использование заклинаний', 'description' => 'Вы научились использовать магическую сущность природы для сотворения заклинаний. Мудрость — ваша базовая характеристика для заклинаний.', 'type' => 'spellcasting'],
                    ],
                    '3' => [
                        ['key' => 'ranger_archetype', 'name' => 'Архетип следопыта', 'description' => 'Выберите архетип, воплощающий ваш идеал следопыта.', 'type' => 'subclass'],
                        ['key' => 'primeval_awareness', 'name' => 'Первобытная осведомлённость', 'description' => 'Потратив ячейку заклинания, вы можете на 1 минуту за каждый уровень ячейки ощутить присутствие определённых типов существ в радиусе 1.5 км (или 300 метров в избранной местности).', 'type' => 'feature'],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                    ],
                    '5' => [
                        ['key' => 'extra_attack', 'name' => 'Дополнительная атака', 'description' => 'Когда вы совершаете действие Атака, вы можете атаковать дважды.', 'type' => 'feature'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2, 'spells_known' => 0],
                    '2' => ['proficiency_bonus' => 2, 'spells_known' => 2],
                    '3' => ['proficiency_bonus' => 2, 'spells_known' => 3],
                    '4' => ['proficiency_bonus' => 2, 'spells_known' => 3],
                    '5' => ['proficiency_bonus' => 3, 'spells_known' => 4],
                ],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'spell_slots' => [
                    '2' => ['1st' => 2],
                    '3' => ['1st' => 3],
                    '4' => ['1st' => 3],
                    '5' => ['1st' => 4, '2nd' => 2],
                ],
                'spells_known' => ['2' => 2, '3' => 3, '4' => 3, '5' => 4],
                'subclass_level' => '3',
                'subclass_name' => ['ru' => 'Архетип следопыта'],
                'is_system' => true,
                'sort_order' => 8,
            ],

            // ROGUE
            [
                'slug' => 'rogue',
                'name' => ['ru' => 'Плут'],
                'description' => ['ru' => 'Мошенник, использующий скрытность и хитрость для преодоления препятствий и врагов. Плуты полагаются на умения, а не грубую силу, предпочитая один точный удар серии атак.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['dexterity'],
                'saving_throws' => ['dexterity', 'intelligence'],
                'armor_proficiencies' => ['light'],
                'weapon_proficiencies' => ['simple', 'hand_crossbow', 'longsword', 'rapier', 'shortsword'],
                'tool_proficiencies' => ['thieves_tools'],
                'skill_choices' => 4,
                'skill_options' => ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'rapier', 'qty' => 1]],
                        [['item' => 'shortsword', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'shortbow', 'qty' => 1], ['item' => 'arrows', 'qty' => 20]],
                        [['item' => 'shortsword', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'burglar_pack', 'qty' => 1]],
                        [['item' => 'dungeoneer_pack', 'qty' => 1]],
                        [['item' => 'explorer_pack', 'qty' => 1]],
                    ]],
                    ['item' => 'leather_armor', 'qty' => 1],
                    ['item' => 'dagger', 'qty' => 2],
                    ['item' => 'thieves_tools', 'qty' => 1],
                ],
                'starting_gold_formula' => '4d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'expertise', 'name' => 'Экспертиза', 'description' => 'Выберите два навыка, которыми владеете, или один навык и воровские инструменты. Ваш бонус мастерства удваивается для этих навыков.', 'type' => 'feature'],
                        ['key' => 'sneak_attack', 'name' => 'Скрытая атака', 'description' => 'Один раз в ход вы можете нанести дополнительный урон 1d6 одному существу, по которому попали атакой, если у вас есть преимущество на бросок атаки. Атака должна использовать фехтовальное или дальнобойное оружие. Урон увеличивается с уровнем.', 'type' => 'feature', 'scaling' => '1d6 per 2 levels'],
                        ['key' => 'thieves_cant', 'name' => 'Воровской жаргон', 'description' => 'Вы выучили воровской жаргон — тайный набор диалектов, жестов и кодов, позволяющий скрывать сообщения в обычном разговоре.', 'type' => 'feature'],
                    ],
                    '2' => [
                        ['key' => 'cunning_action', 'name' => 'Хитрое действие', 'description' => 'Вы можете бонусным действием совершить Рывок, Отход или Засаду.', 'type' => 'feature'],
                    ],
                    '3' => [
                        ['key' => 'roguish_archetype', 'name' => 'Архетип плута', 'description' => 'Выберите архетип, воплощающий ваши плутовские способности.', 'type' => 'subclass'],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                    ],
                    '5' => [
                        ['key' => 'uncanny_dodge', 'name' => 'Уклонение', 'description' => 'Когда атакующий, которого вы видите, попадает по вам атакой, вы можете реакцией уменьшить урон вдвое.', 'type' => 'feature'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2, 'sneak_attack' => '1d6'],
                    '2' => ['proficiency_bonus' => 2, 'sneak_attack' => '1d6'],
                    '3' => ['proficiency_bonus' => 2, 'sneak_attack' => '2d6'],
                    '4' => ['proficiency_bonus' => 2, 'sneak_attack' => '2d6'],
                    '5' => ['proficiency_bonus' => 3, 'sneak_attack' => '3d6'],
                ],
                'is_spellcaster' => false,
                'subclass_level' => '3',
                'subclass_name' => ['ru' => 'Архетип плута'],
                'is_system' => true,
                'sort_order' => 9,
            ],

            // SORCERER
            [
                'slug' => 'sorcerer',
                'name' => ['ru' => 'Чародей'],
                'description' => ['ru' => 'Заклинатель, черпающий врождённую магию из дара, данного ему родословной или космическим происхождением. Чародеи рождаются с магией в крови.'],
                'hit_die' => 'd6',
                'primary_abilities' => ['charisma'],
                'saving_throws' => ['constitution', 'charisma'],
                'armor_proficiencies' => [],
                'weapon_proficiencies' => ['dagger', 'dart', 'sling', 'quarterstaff', 'light_crossbow'],
                'tool_proficiencies' => [],
                'skill_choices' => 2,
                'skill_options' => ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'light_crossbow', 'qty' => 1], ['item' => 'bolts', 'qty' => 20]],
                        [['item' => 'simple_weapon', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'component_pouch', 'qty' => 1]],
                        [['item' => 'arcane_focus', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'dungeoneer_pack', 'qty' => 1]],
                        [['item' => 'explorer_pack', 'qty' => 1]],
                    ]],
                    ['item' => 'dagger', 'qty' => 2],
                ],
                'starting_gold_formula' => '3d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'spellcasting', 'name' => 'Использование заклинаний', 'description' => 'Событие в вашем прошлом или жизни одного из ваших предков пробудило в вас врождённый источник магии. Харизма — ваша базовая характеристика для заклинаний.', 'type' => 'spellcasting'],
                        ['key' => 'sorcerous_origin', 'name' => 'Происхождение чародея', 'description' => 'Выберите происхождение вашей магической силы.', 'type' => 'subclass'],
                    ],
                    '2' => [
                        ['key' => 'font_of_magic', 'name' => 'Источник магии', 'description' => 'Вы получаете очки чародейства, которые можете использовать для создания дополнительных ячеек заклинаний или усиления своих заклинаний через метамагию.', 'type' => 'resource', 'amount' => 'level', 'recharge' => 'long_rest'],
                    ],
                    '3' => [
                        ['key' => 'metamagic', 'name' => 'Метамагия', 'description' => 'Вы получаете способность изменять свои заклинания. Выберите две опции метамагии: Усиленное заклинание, Заклинание-близнец, Осторожное заклинание, Незаметное заклинание и другие.', 'type' => 'feature', 'options' => ['careful', 'distant', 'empowered', 'extended', 'heightened', 'quickened', 'subtle', 'twinned']],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2, 'sorcery_points' => 0, 'cantrips' => 4, 'spells_known' => 2],
                    '2' => ['proficiency_bonus' => 2, 'sorcery_points' => 2, 'cantrips' => 4, 'spells_known' => 3],
                    '3' => ['proficiency_bonus' => 2, 'sorcery_points' => 3, 'cantrips' => 4, 'spells_known' => 4],
                    '4' => ['proficiency_bonus' => 2, 'sorcery_points' => 4, 'cantrips' => 5, 'spells_known' => 5],
                    '5' => ['proficiency_bonus' => 3, 'sorcery_points' => 5, 'cantrips' => 5, 'spells_known' => 6],
                ],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'charisma',
                'spell_slots' => [
                    '1' => ['1st' => 2],
                    '2' => ['1st' => 3],
                    '3' => ['1st' => 4, '2nd' => 2],
                    '4' => ['1st' => 4, '2nd' => 3],
                    '5' => ['1st' => 4, '2nd' => 3, '3rd' => 2],
                ],
                'spells_known' => ['1' => 2, '2' => 3, '3' => 4, '4' => 5, '5' => 6],
                'subclass_level' => '1',
                'subclass_name' => ['ru' => 'Происхождение чародея'],
                'is_system' => true,
                'sort_order' => 10,
            ],

            // WARLOCK
            [
                'slug' => 'warlock',
                'name' => ['ru' => 'Колдун'],
                'description' => ['ru' => 'Искатель знаний, скрытых в ткани мультивселенной. Колдуны получают магическую силу через договор с могущественной сущностью — покровителем.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['charisma'],
                'saving_throws' => ['wisdom', 'charisma'],
                'armor_proficiencies' => ['light'],
                'weapon_proficiencies' => ['simple'],
                'tool_proficiencies' => [],
                'skill_choices' => 2,
                'skill_options' => ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'light_crossbow', 'qty' => 1], ['item' => 'bolts', 'qty' => 20]],
                        [['item' => 'simple_weapon', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'component_pouch', 'qty' => 1]],
                        [['item' => 'arcane_focus', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'scholar_pack', 'qty' => 1]],
                        [['item' => 'dungeoneer_pack', 'qty' => 1]],
                    ]],
                    ['item' => 'leather_armor', 'qty' => 1],
                    ['item' => 'simple_weapon', 'qty' => 1],
                    ['item' => 'dagger', 'qty' => 2],
                ],
                'starting_gold_formula' => '4d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'otherworldly_patron', 'name' => 'Потусторонний покровитель', 'description' => 'Выберите сущность, с которой вы заключили договор.', 'type' => 'subclass'],
                        ['key' => 'pact_magic', 'name' => 'Магия договора', 'description' => 'Ваши тайные исследования и магия, дарованная покровителем, позволяют вам творить заклинания. Харизма — ваша базовая характеристика. Все ваши ячейки заклинаний восстанавливаются после короткого отдыха.', 'type' => 'spellcasting'],
                    ],
                    '2' => [
                        ['key' => 'eldritch_invocations', 'name' => 'Тайные воззвания', 'description' => 'Вы получаете два тайных воззвания на ваш выбор. Воззвания дают вам дополнительные способности или улучшают существующие.', 'type' => 'feature', 'count' => 2],
                    ],
                    '3' => [
                        ['key' => 'pact_boon', 'name' => 'Дар договора', 'description' => 'Ваш покровитель дарует вам подарок: Договор Клинка, Договор Цепи или Договор Гримуара.', 'type' => 'choice', 'options' => ['blade', 'chain', 'tome']],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2, 'cantrips' => 2, 'spells_known' => 2, 'spell_slots' => 1, 'slot_level' => 1, 'invocations' => 0],
                    '2' => ['proficiency_bonus' => 2, 'cantrips' => 2, 'spells_known' => 3, 'spell_slots' => 2, 'slot_level' => 1, 'invocations' => 2],
                    '3' => ['proficiency_bonus' => 2, 'cantrips' => 2, 'spells_known' => 4, 'spell_slots' => 2, 'slot_level' => 2, 'invocations' => 2],
                    '4' => ['proficiency_bonus' => 2, 'cantrips' => 3, 'spells_known' => 5, 'spell_slots' => 2, 'slot_level' => 2, 'invocations' => 2],
                    '5' => ['proficiency_bonus' => 3, 'cantrips' => 3, 'spells_known' => 6, 'spell_slots' => 2, 'slot_level' => 3, 'invocations' => 3],
                ],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'charisma',
                // Warlock has unique pact magic - all slots are same level
                'spell_slots' => [
                    '1' => ['pact' => 1, 'level' => 1],
                    '2' => ['pact' => 2, 'level' => 1],
                    '3' => ['pact' => 2, 'level' => 2],
                    '4' => ['pact' => 2, 'level' => 2],
                    '5' => ['pact' => 2, 'level' => 3],
                ],
                'spells_known' => ['1' => 2, '2' => 3, '3' => 4, '4' => 5, '5' => 6],
                'subclass_level' => '1',
                'subclass_name' => ['ru' => 'Потусторонний покровитель'],
                'is_system' => true,
                'sort_order' => 11,
            ],

            // WIZARD
            [
                'slug' => 'wizard',
                'name' => ['ru' => 'Волшебник'],
                'description' => ['ru' => 'Учёный маг, способный манипулировать структурами реальности. Волшебники — мастера тайной магии, получающие свою силу через годы обучения и исследований.'],
                'hit_die' => 'd6',
                'primary_abilities' => ['intelligence'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'armor_proficiencies' => [],
                'weapon_proficiencies' => ['dagger', 'dart', 'sling', 'quarterstaff', 'light_crossbow'],
                'tool_proficiencies' => [],
                'skill_choices' => 2,
                'skill_options' => ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
                'starting_equipment' => [
                    ['choice' => true, 'options' => [
                        [['item' => 'quarterstaff', 'qty' => 1]],
                        [['item' => 'dagger', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'component_pouch', 'qty' => 1]],
                        [['item' => 'arcane_focus', 'qty' => 1]],
                    ]],
                    ['choice' => true, 'options' => [
                        [['item' => 'scholar_pack', 'qty' => 1]],
                        [['item' => 'explorer_pack', 'qty' => 1]],
                    ]],
                    ['item' => 'spellbook', 'qty' => 1],
                ],
                'starting_gold_formula' => '4d4 * 10',
                'level_features' => [
                    '1' => [
                        ['key' => 'spellcasting', 'name' => 'Использование заклинаний', 'description' => 'Будучи учеником тайной магии, вы владеете книгой заклинаний, содержащей заклинания. Интеллект — ваша базовая характеристика для заклинаний.', 'type' => 'spellcasting'],
                        ['key' => 'arcane_recovery', 'name' => 'Магическое восстановление', 'description' => 'Один раз в день во время короткого отдыха вы можете восстановить потраченные ячейки заклинаний. Суммарный уровень ячеек не должен превышать половину вашего уровня волшебника (округлённую вверх).', 'type' => 'feature', 'uses' => 1, 'recharge' => 'long_rest'],
                    ],
                    '2' => [
                        ['key' => 'arcane_tradition', 'name' => 'Магическая традиция', 'description' => 'Выберите магическую традицию, определяющую вашу практику магии.', 'type' => 'subclass'],
                    ],
                    '4' => [
                        ['key' => 'ability_score_improvement', 'name' => 'Увеличение характеристик', 'description' => 'Увеличьте одну характеристику на 2 или две характеристики на 1, или возьмите черту.', 'type' => 'asi'],
                    ],
                ],
                'progression' => [
                    '1' => ['proficiency_bonus' => 2, 'cantrips' => 3],
                    '2' => ['proficiency_bonus' => 2, 'cantrips' => 3],
                    '3' => ['proficiency_bonus' => 2, 'cantrips' => 3],
                    '4' => ['proficiency_bonus' => 2, 'cantrips' => 4],
                    '5' => ['proficiency_bonus' => 3, 'cantrips' => 4],
                ],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'intelligence',
                'spell_slots' => [
                    '1' => ['1st' => 2],
                    '2' => ['1st' => 3],
                    '3' => ['1st' => 4, '2nd' => 2],
                    '4' => ['1st' => 4, '2nd' => 3],
                    '5' => ['1st' => 4, '2nd' => 3, '3rd' => 2],
                ],
                'subclass_level' => '2',
                'subclass_name' => ['ru' => 'Магическая традиция'],
                'is_system' => true,
                'sort_order' => 12,
            ],
        ];
    }
}
