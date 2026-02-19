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

        // Seed subclasses
        $subclasses = $this->getSubclasses();
        foreach ($subclasses as $subclassData) {
            $subclass = CharacterClass::updateOrCreate(
                ['slug' => $subclassData['slug']],
                $subclassData
            );

            // Attach to both settings
            if ($eberron) {
                $subclass->settings()->syncWithoutDetaching([$eberron->id]);
            }
            if ($forgottenRealms) {
                $subclass->settings()->syncWithoutDetaching([$forgottenRealms->id]);
            }
        }

        $this->command->info('Character classes seeded successfully: ' . count($classes) . ' classes, ' . count($subclasses) . ' subclasses.');
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
                    '6' => ['1st' => 4, '2nd' => 3, '3rd' => 3],
                    '7' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 1],
                    '8' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 2],
                    '9' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 1],
                    '10' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2],
                    '11' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1],
                    '12' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1],
                    '13' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1, '7th' => 1],
                    '14' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1, '7th' => 1],
                    '15' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1, '7th' => 1, '8th' => 1],
                    '16' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1, '7th' => 1, '8th' => 1],
                    '17' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1, '7th' => 1, '8th' => 1, '9th' => 1],
                    '18' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 3, '6th' => 1, '7th' => 1, '8th' => 1, '9th' => 1],
                    '19' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 3, '6th' => 2, '7th' => 1, '8th' => 1, '9th' => 1],
                    '20' => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 3, '6th' => 2, '7th' => 2, '8th' => 1, '9th' => 1],
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

    private function getSubclasses(): array
    {
        return [
            // ==================== ROGUE SUBCLASSES ====================
            [
                'slug' => 'thief',
                'parent_slug' => 'rogue',
                'name' => ['ru' => 'Вор'],
                'description' => ['ru' => 'Вы оттачиваете навыки воровского искусства. Взломщики, бандиты, карманники и прочие преступники обычно следуют этому архетипу, но также его выбирают плуты, предпочитающие думать о себе как о профессиональных искателях сокровищ, исследователях и следователях.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['dexterity'],
                'saving_throws' => ['dexterity', 'intelligence'],
                'level_features' => [
                    '3' => [
                        ['key' => 'fast_hands', 'name' => 'Быстрые руки', 'description' => 'Вы можете бонусным действием совершить проверку Ловкости рук, использовать воровские инструменты для обезвреживания ловушки или взлома замка, или совершить действие Использование предмета.', 'type' => 'feature'],
                        ['key' => 'second_story_work', 'name' => 'Работа на втором этаже', 'description' => 'Вы получаете возможность лазать быстрее обычного: лазание больше не стоит вам дополнительного движения. Кроме того, когда вы совершаете прыжок с разбега, дальность прыжка увеличивается на число футов, равное вашему модификатору Ловкости.', 'type' => 'feature'],
                    ],
                    '9' => [
                        ['key' => 'supreme_sneak', 'name' => 'Превосходная скрытность', 'description' => 'Вы совершаете с преимуществом проверки Ловкости (Скрытность), если в этот ход перемещались не более чем на половину своей скорости.', 'type' => 'feature'],
                    ],
                    '13' => [
                        ['key' => 'use_magic_device', 'name' => 'Использование магических устройств', 'description' => 'Вы узнали достаточно о работе магии, чтобы уметь импровизировать при использовании предметов, даже если они не предназначены для вас. Вы игнорируете все требования класса, расы и уровня при использовании магических предметов.', 'type' => 'feature'],
                    ],
                    '17' => [
                        ['key' => 'thiefs_reflexes', 'name' => 'Воровские рефлексы', 'description' => 'Вы научились устраивать засады и быстро уходить от опасности. Вы можете совершать два хода в первом раунде боя. Первый ход вы совершаете в свою обычную инициативу, а второй — со значением инициативы минус 10.', 'type' => 'feature'],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 1,
            ],
            [
                'slug' => 'assassin',
                'parent_slug' => 'rogue',
                'name' => ['ru' => 'Убийца'],
                'description' => ['ru' => 'Вы сосредотачиваете свои тренировки на мрачном искусстве смерти. Те, кто придерживается этого архетипа, разнообразны: наёмные убийцы, шпионы, охотники за головами и даже особо помазанные священники, обученные истреблять врагов своего божества.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['dexterity'],
                'saving_throws' => ['dexterity', 'intelligence'],
                'level_features' => [
                    '3' => [
                        ['key' => 'bonus_proficiencies_assassin', 'name' => 'Бонусные владения', 'description' => 'Вы получаете владение набором для грима и набором отравителя.', 'type' => 'feature'],
                        ['key' => 'assassinate', 'name' => 'Убийство', 'description' => 'Вы наиболее смертоносны, когда опережаете врагов. Вы совершаете с преимуществом броски атаки по существам, которые ещё не совершали ход. Кроме того, любое попадание по застигнутому врасплох существу является критическим попаданием.', 'type' => 'feature'],
                    ],
                    '9' => [
                        ['key' => 'infiltration_expertise', 'name' => 'Мастер проникновения', 'description' => 'Вы можете безошибочно создавать фальшивые личности для себя. Вы должны потратить семь дней и 25 зм, чтобы создать историю, профессию и принадлежности для личности.', 'type' => 'feature'],
                    ],
                    '13' => [
                        ['key' => 'impostor', 'name' => 'Самозванец', 'description' => 'Вы получаете способность безошибочно имитировать речь, почерк и манеры другого существа. Вы должны потратить как минимум три часа на изучение этих трёх компонентов поведения существа.', 'type' => 'feature'],
                    ],
                    '17' => [
                        ['key' => 'death_strike', 'name' => 'Смертельный удар', 'description' => 'Вы становитесь мастером мгновенной смерти. Когда вы атакуете и попадаете по застигнутому врасплох существу, оно должно совершить спасбросок Телосложения (Сл 8 + ваш модификатор Ловкости + ваш бонус мастерства). При провале урон от вашей атаки удваивается.', 'type' => 'feature'],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 2,
            ],
            [
                'slug' => 'arcane-trickster',
                'parent_slug' => 'rogue',
                'name' => ['ru' => 'Мистический ловкач'],
                'description' => ['ru' => 'Некоторые плуты усиливают свои отточенные навыки скрытности и ловкости магией, изучая заклинания Очарования и Иллюзии. Эти плуты включают карманников и взломщиков, но также шутников, смутьянов и значительное количество авантюристов.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['dexterity', 'intelligence'],
                'saving_throws' => ['dexterity', 'intelligence'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'intelligence',
                'spell_slots' => [
                    '3' => ['cantrips' => 3, '1st' => 2],
                    '4' => ['cantrips' => 3, '1st' => 3],
                    '5' => ['cantrips' => 3, '1st' => 3],
                    '6' => ['cantrips' => 3, '1st' => 3],
                    '7' => ['cantrips' => 3, '1st' => 4, '2nd' => 2],
                ],
                'spells_known' => [
                    '3' => 3, '4' => 4, '5' => 4, '6' => 4, '7' => 5,
                    '8' => 6, '9' => 6, '10' => 7, '11' => 8, '12' => 8,
                    '13' => 9, '14' => 10, '15' => 10, '16' => 11, '17' => 11,
                    '18' => 11, '19' => 12, '20' => 13,
                ],
                'level_features' => [
                    '3' => [
                        ['key' => 'spellcasting_at', 'name' => 'Использование заклинаний', 'description' => 'Вы получаете возможность накладывать заклинания.', 'type' => 'spellcasting'],
                        ['key' => 'mage_hand_legerdemain', 'name' => 'Волшебная рука фокусника', 'description' => 'Когда вы накладываете заговор волшебная рука, вы можете сделать призрачную руку невидимой, и можете совершить ею следующие дополнительные действия: спрятать предмет в руке в контейнер, достать предмет из контейнера, использовать воровские инструменты на расстоянии.', 'type' => 'feature'],
                    ],
                    '9' => [
                        ['key' => 'magical_ambush', 'name' => 'Магическая засада', 'description' => 'Если вы скрыты от существа, когда накладываете на него заклинание, это существо совершает спасбросок от заклинания с помехой.', 'type' => 'feature'],
                    ],
                    '13' => [
                        ['key' => 'versatile_trickster', 'name' => 'Разносторонний ловкач', 'description' => 'Вы получаете возможность отвлекать цели своей волшебной рукой. Бонусным действием вы можете направить руку к существу в пределах 1,5 метра от неё. Вы получаете преимущество на броски атаки по этому существу до конца хода.', 'type' => 'feature'],
                    ],
                    '17' => [
                        ['key' => 'spell_thief', 'name' => 'Похититель заклинаний', 'description' => 'Вы получаете способность магически похищать знание о том, как накладывать заклинание другого заклинателя. Сразу после того как существо накладывает заклинание, нацеленное на вас или включающее вас в область воздействия, вы можете реакцией заставить существо совершить спасбросок.', 'type' => 'feature'],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 3,
            ],
            [
                'slug' => 'swashbuckler',
                'parent_slug' => 'rogue',
                'name' => ['ru' => 'Ловкач'],
                'description' => ['ru' => 'Вы фокусируетесь на искусстве клинка, сочетая скорость, элегантность и обаяние. Ловкачи преуспевают в дуэлях один на один.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['dexterity', 'charisma'],
                'saving_throws' => ['dexterity', 'intelligence'],
                'level_features' => [
                    '3' => [
                        ['key' => 'fancy_footwork', 'name' => 'Причудливая работа ног', 'description' => 'Во время своего хода, если вы совершаете рукопашную атаку по существу, это существо не может совершать по вам атаки благоприятной возможности до конца вашего хода.', 'type' => 'feature'],
                        ['key' => 'rakish_audacity', 'name' => 'Бравая дерзость', 'description' => 'Вы добавляете модификатор Харизмы к броскам инициативы. Кроме того, вам не нужно иметь преимущество на бросок атаки, чтобы использовать Скрытую атаку, если в пределах 1,5 метра от вас нет других существ кроме цели.', 'type' => 'feature'],
                    ],
                    '9' => [
                        ['key' => 'panache', 'name' => 'Панаш', 'description' => 'Вы можете использовать действие, чтобы совершить проверку Харизмы (Убеждение), противопоставленную проверке Мудрости (Проницательность) существа. Эффект зависит от того, враждебно или не враждебно существо.', 'type' => 'feature'],
                    ],
                    '13' => [
                        ['key' => 'elegant_maneuver', 'name' => 'Элегантный манёвр', 'description' => 'Вы можете бонусным действием получить преимущество на следующую проверку Ловкости (Акробатика) или Силы (Атлетика), совершаемую в этот ход.', 'type' => 'feature'],
                    ],
                    '17' => [
                        ['key' => 'master_duelist', 'name' => 'Мастер дуэлей', 'description' => 'Ваше мастерство клинка позволяет превращать неудачу в успех. Если вы промахиваетесь броском атаки, вы можете перебросить его с преимуществом. После использования вы не можете использовать эту способность до окончания короткого или продолжительного отдыха.', 'type' => 'feature'],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 4,
            ],

            // ==================== DRUID SUBCLASSES ====================
            [
                'slug' => 'circle-of-the-land',
                'parent_slug' => 'druid',
                'name' => ['ru' => 'Круг Земли'],
                'description' => ['ru' => 'Круг Земли составляют мистики и мудрецы, хранящие древние знания и обряды благодаря обширной устной традиции. Эти друиды встречаются в священных кругах деревьев или камней, где шепотом делятся первобытными тайнами на друидическом языке.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['wisdom'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'level_features' => [
                    '2' => [
                        [
                            'key' => 'bonus_cantrip_land',
                            'name' => 'Дополнительный заговор',
                            'short_description' => '+1 заговор друида на выбор.',
                            'description' => 'Вы узнаёте один дополнительный заговор друида по вашему выбору.',
                            'type' => 'choice',
                            'choice_type' => 'cantrip',
                            'choice_from' => 'druid',
                            'choice_count' => 1,
                        ],
                        [
                            'key' => 'natural_recovery',
                            'name' => 'Естественное восстановление',
                            'short_description' => 'Короткий отдых: восстановить ячейки заклинаний суммарным уровнем = половина уровня друида. Раз в день.',
                            'description' => 'Вы можете восстановить часть своей магической энергии, медитируя в единении с природой. Во время короткого отдыха вы можете восстановить ячейки заклинаний с суммарным уровнем не более половины вашего уровня друида (округляя вверх). Можно использовать один раз между длинными отдыхами.',
                            'type' => 'resource',
                            'resource_key' => 'natural_recovery_uses',
                            'resource_name' => 'Естественное восстановление',
                            'resource_max_formula' => '1',
                            'recharge' => 'long_rest',
                        ],
                        [
                            'key' => 'circle_spells_choice',
                            'name' => 'Заклинания круга',
                            'short_description' => 'Выберите тип местности → получите заклинания круга (всегда подготовлены).',
                            'description' => 'Ваша мистическая связь с землёй наделяет вас способностью накладывать определённые заклинания. Выберите тип местности: арктика, побережье, пустыня, лес, луг, гора, болото или Подземье.',
                            'type' => 'choice',
                            'choice_type' => 'terrain',
                        ],
                    ],
                    '6' => [
                        [
                            'key' => 'lands_stride',
                            'name' => 'Тропами земли',
                            'short_description' => 'Труднопроходимая местность не замедляет. Проход через растения без урона.',
                            'description' => 'Перемещение по немагической труднопроходимой местности не требует от вас дополнительного движения. Вы также можете проходить сквозь немагические растения без замедления и не получая урона от них.',
                            'type' => 'feature',
                        ],
                    ],
                    '10' => [
                        [
                            'key' => 'natures_ward',
                            'name' => 'Страж природы',
                            'short_description' => 'Иммунитет к очарованию/испугу от элементалей и фей. Иммунитет к яду и болезням.',
                            'description' => 'Вы не можете быть очарованы или напуганы элементалями или феями, и вы получаете иммунитет к яду и болезням.',
                            'type' => 'feature',
                        ],
                    ],
                    '14' => [
                        [
                            'key' => 'natures_sanctuary',
                            'name' => 'Святилище природы',
                            'short_description' => 'Звери и растения колеблются атаковать — спасбросок МДР или не могут атаковать этот ход.',
                            'description' => 'Существа природного мира чувствуют вашу связь с природой и колеблются перед тем, как атаковать вас. Когда зверь или растение атакует вас, оно должно совершить спасбросок Мудрости. При провале существо должно выбрать другую цель или атака автоматически промахивается.',
                            'type' => 'feature',
                        ],
                    ],
                ],
                // Заклинания круга по типу местности (всегда подготовлены, не считаются в лимит)
                'circle_spells' => [
                    'arctic' => [
                        'name' => ['ru' => 'Арктика'],
                        '3' => ['hold-person', 'spike-growth'],
                        '5' => ['sleet-storm', 'slow'],
                        '7' => ['freedom-of-movement', 'ice-storm'],
                        '9' => ['commune-with-nature', 'cone-of-cold'],
                    ],
                    'coast' => [
                        'name' => ['ru' => 'Побережье'],
                        '3' => ['mirror-image', 'misty-step'],
                        '5' => ['water-breathing', 'water-walk'],
                        '7' => ['control-water', 'freedom-of-movement'],
                        '9' => ['conjure-elemental', 'scrying'],
                    ],
                    'desert' => [
                        'name' => ['ru' => 'Пустыня'],
                        '3' => ['blur', 'silence'],
                        '5' => ['create-food-and-water', 'protection-from-energy'],
                        '7' => ['blight', 'hallucinatory-terrain'],
                        '9' => ['insect-plague', 'wall-of-stone'],
                    ],
                    'forest' => [
                        'name' => ['ru' => 'Лес'],
                        '3' => ['barkskin', 'spider-climb'],
                        '5' => ['call-lightning', 'plant-growth'],
                        '7' => ['divination', 'freedom-of-movement'],
                        '9' => ['commune-with-nature', 'tree-stride'],
                    ],
                    'grassland' => [
                        'name' => ['ru' => 'Луг'],
                        '3' => ['invisibility', 'pass-without-trace'],
                        '5' => ['daylight', 'haste'],
                        '7' => ['divination', 'freedom-of-movement'],
                        '9' => ['dream', 'insect-plague'],
                    ],
                    'mountain' => [
                        'name' => ['ru' => 'Гора'],
                        '3' => ['spider-climb', 'spike-growth'],
                        '5' => ['lightning-bolt', 'meld-into-stone'],
                        '7' => ['stone-shape', 'stoneskin'],
                        '9' => ['passwall', 'wall-of-stone'],
                    ],
                    'swamp' => [
                        'name' => ['ru' => 'Болото'],
                        '3' => ['darkness', 'melfs-acid-arrow'],
                        '5' => ['water-walk', 'stinking-cloud'],
                        '7' => ['freedom-of-movement', 'locate-creature'],
                        '9' => ['insect-plague', 'scrying'],
                    ],
                    'underdark' => [
                        'name' => ['ru' => 'Подземье'],
                        '3' => ['spider-climb', 'web'],
                        '5' => ['gaseous-form', 'stinking-cloud'],
                        '7' => ['greater-invisibility', 'stone-shape'],
                        '9' => ['cloudkill', 'insect-plague'],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 1,
            ],
            [
                'slug' => 'circle-of-the-moon',
                'parent_slug' => 'druid',
                'name' => ['ru' => 'Круг Луны'],
                'description' => ['ru' => 'Друиды Круга Луны являются свирепыми защитниками дикой природы. Их орден собирается под полной луной, чтобы делиться новостями и обмениваться предостережениями. Они бродят по самым глубоким уголкам дикой природы, где могут неделями не встретить другого гуманоида.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['wisdom'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'level_features' => [
                    '2' => [
                        [
                            'key' => 'combat_wild_shape',
                            'name' => 'Боевой дикий облик',
                            'short_description' => 'Дикий облик как бонусное действие! В облике: тратите ячейку → лечитесь на 1d8 × уровень ячейки.',
                            'description' => 'Вы получаете возможность использовать Дикий облик бонусным действием, а не действием. Кроме того, находясь в диком облике, вы можете бонусным действием потратить одну ячейку заклинаний, чтобы восстановить 1d8 хитов за каждый уровень потраченной ячейки.',
                            'type' => 'feature',
                        ],
                        [
                            'key' => 'circle_forms',
                            'name' => 'Формы круга',
                            'short_description' => 'Превращение в зверей ПО 1 (вместо 1/4). С 6 ур. — ПО = треть уровня друида.',
                            'description' => 'Вы можете превращаться в зверей с показателем опасности 1 и ниже, игнорируя колонку «Макс. ПО» таблицы «Облики зверей». Начиная с 6 уровня, вы можете превращаться в зверей с показателем опасности равным трети вашего уровня друида, округлённой вниз.',
                            'type' => 'feature',
                        ],
                    ],
                    '6' => [
                        [
                            'key' => 'primal_strike',
                            'name' => 'Первобытный удар',
                            'short_description' => 'Атаки в облике зверя считаются магическими.',
                            'description' => 'Ваши атаки в облике зверя считаются магическими при определении преодоления сопротивления и иммунитета к немагическим атакам и урону.',
                            'type' => 'feature',
                        ],
                    ],
                    '10' => [
                        [
                            'key' => 'elemental_wild_shape',
                            'name' => 'Стихийный дикий облик',
                            'short_description' => '2 использования Дикого облика → превращение в элементаля (воздух, вода, земля, огонь).',
                            'description' => 'Вы можете потратить два использования Дикого облика одновременно, чтобы превратиться в воздушного, водного, земляного или огненного элементаля.',
                            'type' => 'feature',
                        ],
                    ],
                    '14' => [
                        [
                            'key' => 'thousand_forms',
                            'name' => 'Тысяча обликов',
                            'short_description' => 'Изменение обличья по желанию (бесплатно, без ограничений).',
                            'description' => 'Вы научились использовать магию для изменения своего внешнего вида более тонкими способами. Вы можете накладывать заклинание Изменение обличья по желанию, без траты ячейки заклинаний.',
                            'type' => 'feature',
                        ],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 2,
            ],
            [
                'slug' => 'circle-of-wildfire',
                'parent_slug' => 'druid',
                'name' => ['ru' => 'Круг Дикого Огня'],
                'description' => ['ru' => 'Друиды Круга Дикого Огня понимают, что разрушение иногда является предвестником созидания, например, когда лесной пожар способствует последующему росту. Эти друиды связываются с первобытным духом огня, который содержит в себе как творческую теплоту очага, так и разрушительную жадность пожара.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['wisdom'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'level_features' => [
                    '2' => [
                        ['key' => 'circle_spells_wildfire', 'name' => 'Заклинания круга', 'description' => 'Вы получаете доступ к заклинаниям круга на определённых уровнях. Они всегда подготовлены и не учитываются в числе подготавливаемых заклинаний.', 'type' => 'feature'],
                        [
                            'key' => 'summon_wildfire_spirit',
                            'name' => 'Призыв духа дикого огня',
                            'short_description' => 'Действием тратите Дикий облик, чтобы призвать огненного духа. Он атакует, телепортирует союзников и наносит урон.',
                            'description' => 'Действием тратите Дикий облик → призываете духа в пределах 9 м (существа в 3 м: спасбросок ЛОВ или 2d6 огня). Дух: маленький элементаль, КД 13, ОЗ = 5 + 5×уровень, скорость 9 м (парит). Действует после вашего хода. Атака: 1d6+бонус мастерства огня (18 м). Ваше бонусное действие: телепортирует союзника на 4,5 м (1d6+БМ урона в начальной точке). Длится 1 час.',
                            'type' => 'feature'
                        ],
                    ],
                    '6' => [
                        [
                            'key' => 'enhanced_bond',
                            'name' => 'Усиленная связь',
                            'short_description' => '+1d8 к урону огнём или лечению, если вы/цель рядом с духом. Без ограничений!',
                            'description' => '+1d8 к одному броску урона огнём или лечения (без ограничений), если: заклинание через духа, ИЛИ вы в 4,5 м от духа, ИЛИ цель в 4,5 м от духа. Бонус: заклинания могут исходить от духа вместо вас.',
                            'type' => 'feature'
                        ],
                    ],
                    '10' => [
                        [
                            'key' => 'cauterizing_flames',
                            'name' => 'Прижигающее пламя',
                            'short_description' => 'Реакция: существо умирает в 9 м → призрачное пламя. Следующий входящий: лечение или урон 2d10+МДР. Число раз = бонус мастерства.',
                            'description' => 'Когда небольшое или среднее существо умирает в пределах 9 м от вас или вашего духа дикого огня, вы можете реакцией вызвать призрачное пламя. Когда существо входит в это пространство, оно может получить лечение или урон огнём 2d10 + ваш модификатор Мудрости. Число раз, равное бонусу мастерства.',
                            'type' => 'resource',
                            'resource_key' => 'cauterizing_flames_uses',
                            'resource_name' => 'Прижигающее пламя',
                            'resource_max_formula' => 'proficiency_bonus',
                            'recharge' => 'long_rest',
                        ],
                    ],
                    '14' => [
                        [
                            'key' => 'blazing_revival',
                            'name' => 'Пылающее возрождение',
                            'short_description' => 'При падении до 0 ОЗ — развеять духа в 36 м → встать с половиной ОЗ. Раз за длинный отдых.',
                            'description' => 'Если дух находится в пределах 36 м от вас, когда вы падаете до 0 хитов и теряете сознание, вы можете развеять духа. Вы получаете половину ваших хитов и немедленно встаёте. Один раз за долгий отдых.',
                            'type' => 'resource',
                            'resource_key' => 'blazing_revival_uses',
                            'resource_name' => 'Пылающее возрождение',
                            'resource_max_formula' => '1',
                            'recharge' => 'long_rest',
                        ],
                    ],
                ],
                // Заклинания круга (всегда подготовлены, не считаются в лимит)
                'circle_spells' => [
                    'name' => ['ru' => 'Круг Дикого Огня'],
                    '2' => ['burning-hands', 'cure-wounds'],
                    '3' => ['flaming-sphere', 'scorching-ray'],
                    '5' => ['plant-growth', 'revivify'],
                    '7' => ['aura-of-life', 'fire-shield'],
                    '9' => ['flame-strike', 'mass-cure-wounds'],
                ],
                'is_system' => true,
                'sort_order' => 3,
            ],
            [
                'slug' => 'circle-of-stars',
                'parent_slug' => 'druid',
                'name' => ['ru' => 'Круг Звёзд'],
                'description' => ['ru' => 'Друиды Круга Звёзд черпают силу из древних звёздных карт и созвездий. Они изучают небесные тела и используют их энергию для усиления своей магии, читая будущее по звёздам и принимая формы созвездий.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['wisdom'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'level_features' => [
                    '2' => [
                        [
                            'key' => 'star_map',
                            'name' => 'Звёздная карта',
                            'short_description' => 'Фокус + Руководство (+1d4 к проверке). Направленный снаряд бонус мастерства раз (4d6 урона, цель светится).',
                            'description' => "Вы создаёте звёздную карту — крошечный предмет, который служит фокусом для заклинаний друида.\n\n**Руководство** (заговор, всегда известен):\n• Касание союзника, концентрация до 1 мин.\n• Союзник добавляет 1d4 к одной проверке навыка\n\n**Направленный снаряд** (бонус мастерства раз/длинный отдых):\n• Дальность 36 м, бросок атаки заклинанием\n• При попадании: 4d6 урона (свет)\n• Цель начинает светиться — следующая атака по ней с преимуществом",
                            'type' => 'resource',
                            'resource_key' => 'guiding_bolt_uses',
                            'resource_name' => 'Направленный снаряд',
                            'resource_max_formula' => 'proficiency_bonus',
                            'recharge' => 'long_rest',
                        ],
                        [
                            'key' => 'starry_form',
                            'name' => 'Звёздная форма',
                            'short_description' => 'Бонусным действием тратите Дикий облик → созвездие: Лучник (+1d8), Чаша (лечение), Дракон (концентрация+полёт).',
                            'description' => 'Бонусным действием вы можете потратить использование Дикого облика, чтобы принять звёздную форму вместо превращения в зверя. Выберите созвездие: Лучник (1d8+МДР к атаке заклинанием раз в ход), Чаша (исцеление 1d8+МДР при заклинании), или Дракон (минимум 10 на проверках концентрации и полёт 6 м).',
                            'type' => 'feature',
                        ],
                    ],
                    '6' => [
                        [
                            'key' => 'cosmic_omen',
                            'name' => 'Космическое знамение',
                            'short_description' => 'После длинного отдыха — знамение (Горе/Радость). Реакцией ±1d6 к броску существа в 9 м. Число раз = бонус мастерства.',
                            'description' => 'После длинного отдыха бросьте кость и узнайте знамение: чётное (Горе) или нечётное (Радость). Реакцией вы можете повлиять на бросок существа в пределах 9 м, вычитая или добавляя 1d6. Число раз, равное бонусу мастерства.',
                            'type' => 'resource',
                            'resource_key' => 'cosmic_omen_uses',
                            'resource_name' => 'Космическое знамение',
                            'resource_max_formula' => 'proficiency_bonus',
                            'recharge' => 'long_rest',
                        ],
                    ],
                    '10' => [
                        [
                            'key' => 'twinkling_constellations',
                            'name' => 'Мерцающие созвездия',
                            'short_description' => 'Созвездия усиливаются: Лучник 2d8, Чаша 2d8, Дракон 6 м полёта. Можно менять созвездие каждый ход.',
                            'description' => 'Созвездия Звёздной формы усиливаются: Лучник и Чаша используют 2d8, Дракон даёт 6 м скорости полёта. В начале каждого хода в Звёздной форме вы можете сменить созвездие.',
                            'type' => 'feature',
                        ],
                    ],
                    '14' => [
                        [
                            'key' => 'full_of_stars',
                            'name' => 'Полный звёзд',
                            'short_description' => 'В Звёздной форме — сопротивление дробящему, колющему и рубящему урону.',
                            'description' => 'В Звёздной форме вы получаете сопротивление к дробящему, колющему и рубящему урону.',
                            'type' => 'feature',
                        ],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 4,
            ],
            [
                'slug' => 'circle-of-dreams',
                'parent_slug' => 'druid',
                'name' => ['ru' => 'Круг Снов'],
                'description' => ['ru' => 'Друиды Круга Снов имеют связь со Страной Фей и благословлены силами, дарованными духами этого царства. Их магия исцеляет и защищает усталых и слабых, принося покой и отдых.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['wisdom'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'level_features' => [
                    '2' => [
                        [
                            'key' => 'balm_of_summer_court',
                            'name' => 'Бальзам Летнего двора',
                            'short_description' => 'Запас 5 × уровень друида d6 (восст. длинный отдых). Бонусным действием: выбираете союзника в 36 м, тратите кости (макс. половина уровня), бросаете — лечите + временные ОЗ.',
                            'description' => "У вас есть запас целительных d6 = 5 × уровень друида. Восстанавливается после длинного отдыха.\n\n**Использование:** Бонусным действием выберите существо в 36 м и потратьте любое количество d6 из запаса (но не больше половины уровня друида за раз). Бросьте эти кости. Цель восстанавливает ОЗ = сумме выпавших значений и получает временные ОЗ = количеству потраченных костей.\n\nПример (2 ур.): запас 10d6, макс. 1d6 за раз. Тратите 1d6, выпало 4 → цель лечится на 4 ОЗ + 1 временный ОЗ.",
                            'type' => 'resource',
                            'resource_key' => 'balm_dice',
                            'resource_name' => 'Кости Бальзама',
                            'resource_die' => 'd6',
                            'resource_max_formula' => 'level * 5',
                            'resource_use_max_formula' => 'ceil(level / 2)',
                            'recharge' => 'long_rest',
                        ],
                    ],
                    '6' => [
                        [
                            'key' => 'hearth_of_moonlight',
                            'name' => 'Очаг лунного света',
                            'short_description' => 'На отдыхе — сфера лунного света 9 м. Союзники +5 к Скрытности/Внимательности, свет виден только вам.',
                            'description' => 'Во время короткого или длинного отдыха вы можете создать сферу лунного света радиусом 9 м. Существа в ней получают +5 к проверкам Скрытности и Внимательности, а свет виден только вам и союзникам.',
                            'type' => 'feature',
                        ],
                    ],
                    '10' => [
                        [
                            'key' => 'hidden_paths',
                            'name' => 'Скрытые тропы',
                            'short_description' => 'Бонусным действием: телепорт себя на 18 м ИЛИ союзника касанием на 9 м. Число раз = бонус мастерства.',
                            'description' => 'Бонусным действием вы можете телепортировать себя на 18 м в видимое незанятое пространство, ИЛИ коснуться согласного существа и телепортировать его на 9 м. Число раз, равное бонусу мастерства. Восстанавливается после длинного отдыха.',
                            'type' => 'resource',
                            'resource_key' => 'hidden_paths_uses',
                            'resource_name' => 'Скрытые тропы',
                            'resource_max_formula' => 'proficiency_bonus',
                            'recharge' => 'long_rest',
                        ],
                    ],
                    '14' => [
                        [
                            'key' => 'walker_in_dreams',
                            'name' => 'Странник снов',
                            'short_description' => 'После короткого отдыха: бесплатно Сон, Наблюдение (без компонентов), или Телепортационный круг домой. Раз за длинный отдых.',
                            'description' => 'После короткого отдыха вы можете наложить одно из заклинаний без траты ячейки: Сон, Наблюдение (без материальных компонентов), или Телепортационный круг к последнему месту длинного отдыха. Можно использовать раз между длинными отдыхами.',
                            'type' => 'resource',
                            'resource_key' => 'walker_in_dreams_uses',
                            'resource_name' => 'Странник снов',
                            'resource_max_formula' => '1',
                            'recharge' => 'long_rest',
                        ],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 5,
            ],
            [
                'slug' => 'circle-of-spores',
                'parent_slug' => 'druid',
                'name' => ['ru' => 'Круг Спор'],
                'description' => ['ru' => 'Друиды Круга Спор находят красоту в разложении, видя в нём часть великого цикла жизни. Они используют силу грибов и спор, управляя процессами гниения и перерождения, превращая смерть в жизнь.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['wisdom'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'level_features' => [
                    '2' => [
                        [
                            'key' => 'halo_of_spores',
                            'name' => 'Ореол спор',
                            'short_description' => 'Реакция: существо в 3 м → спас. ТЕЛ или 1d4 некротического (1d6/1d8/1d10 на 6/10/14 ур.).',
                            'description' => 'Вы окружены невидимыми некротическими спорами. Когда существо перемещается в пределах 3 м от вас или начинает там ход, вы можете реакцией заставить его совершить спасбросок Телосложения. При провале — 1d4 некротического урона (1d6 на 6 ур., 1d8 на 10 ур., 1d10 на 14 ур.).',
                            'type' => 'feature',
                        ],
                        [
                            'key' => 'symbiotic_entity',
                            'name' => 'Симбиотическая сущность',
                            'short_description' => 'Действием тратите Дикий облик → 4 временных хита за уровень друида, удвоенный урон спор, +1d6 некротического в рукопашной.',
                            'description' => 'Действием потратьте использование Дикого облика, чтобы пробудить споры. Вы получаете 4 временных хита за уровень друида, урон Ореола спор удваивается, и рукопашные атаки наносят +1d6 некротического урона.',
                            'type' => 'feature',
                        ],
                    ],
                    '6' => [
                        [
                            'key' => 'fungal_infestation',
                            'name' => 'Грибковое заражение',
                            'short_description' => 'Реакция: зверь/гуманоид ≤1 КЗ умирает в 3 м → оживает как зомби (1 ОЗ, 1 час). Число раз = МДР.',
                            'description' => 'Реакцией когда зверь или гуманоид с 1 КЗ или менее умирает в пределах 3 м, вы можете использовать споры, чтобы оживить его как зомби с 1 хитом. Зомби действует сразу после вас и умирает через 1 час. Число раз, равное модификатору Мудрости (минимум 1).',
                            'type' => 'feature',
                        ],
                    ],
                    '10' => [
                        [
                            'key' => 'spreading_spores',
                            'name' => 'Распространяющиеся споры',
                            'short_description' => 'Бонусным действием во время Симбиоза — куб спор 3 м на расстоянии 9 м. Существа внутри получают урон.',
                            'description' => 'Бонусным действием во время Симбиотической сущности вы можете метнуть споры на 9 м, создав куб 3 м. Существа, входящие в куб или начинающие там ход, получают урон от Ореола спор.',
                            'type' => 'feature',
                        ],
                    ],
                    '14' => [
                        [
                            'key' => 'fungal_body',
                            'name' => 'Грибковое тело',
                            'short_description' => 'Иммунитет к ослеплению, оглушению, испугу, отравлению. Криты становятся обычными ударами.',
                            'description' => 'Вы не можете быть ослеплены, оглушены, напуганы или отравлены. Критические попадания по вам становятся обычными, если вы не недееспособны.',
                            'type' => 'feature',
                        ],
                    ],
                ],
                // Circle of Spores also has circle spells!
                'circle_spells' => [
                    'name' => ['ru' => 'Круг Спор'],
                    '2' => ['chill-touch'],  // Cantrip learned at 2nd
                    '3' => ['blindness-deafness', 'gentle-repose'],
                    '5' => ['animate-dead', 'gaseous-form'],
                    '7' => ['blight', 'confusion'],
                    '9' => ['cloudkill', 'contagion'],
                ],
                'is_system' => true,
                'sort_order' => 6,
            ],
            [
                'slug' => 'circle-of-the-shepherd',
                'parent_slug' => 'druid',
                'name' => ['ru' => 'Круг Пастыря'],
                'description' => ['ru' => 'Друиды Круга Пастыря общаются с духами природы, особенно с духами зверей и фей. Они призывают духов-тотемов, которые защищают и усиливают союзников, и их магия призыва особенно могущественна.'],
                'hit_die' => 'd8',
                'primary_abilities' => ['wisdom'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'level_features' => [
                    '2' => [
                        [
                            'key' => 'speech_of_the_woods',
                            'name' => 'Речь леса',
                            'short_description' => 'Сильванский язык. Звери понимают вас, преимущество на ХАР при общении с ними.',
                            'description' => 'Вы получаете способность говорить на Сильване. Звери понимают вашу речь и вы получаете преимущество на проверки Харизмы при взаимодействии с ними.',
                            'type' => 'feature',
                        ],
                        [
                            'key' => 'spirit_totem',
                            'name' => 'Дух-тотем',
                            'short_description' => 'Бонусным действием — тотем в 18 м (1 мин, короткий отдых). Аура 9 м: Медведь/Ястреб/Единорог.',
                            'description' => 'Бонусным действием призовите бестелесного духа в точку в пределах 18 м на 1 минуту. Аура радиусом 9 м: Медведь (временные хиты = 5 + уровень друида), Ястреб (преимущество на атаки по врагам в ауре), Единорог (+уровень друида к исцелению заклинаниями). Восстанавливается после короткого или длинного отдыха.',
                            'type' => 'resource',
                            'resource_key' => 'spirit_totem_uses',
                            'resource_name' => 'Дух-тотем',
                            'resource_max_formula' => '1',
                            'recharge' => 'short_rest',
                        ],
                    ],
                    '6' => [
                        [
                            'key' => 'mighty_summoner',
                            'name' => 'Могучий призыватель',
                            'short_description' => 'Призванные звери/феи: +2 ОЗ за КЗ, атаки магические.',
                            'description' => 'Звери и феи, которых вы призываете, более выносливы: +2 хита за Кость Здоровья и их атаки считаются магическими.',
                            'type' => 'feature',
                        ],
                    ],
                    '10' => [
                        [
                            'key' => 'guardian_spirit',
                            'name' => 'Дух-хранитель',
                            'short_description' => 'Призванные существа в ауре тотема восстанавливают половина уровня друида ОЗ в конце хода.',
                            'description' => 'Когда зверь или фея, которую вы призвали или создали заклинанием, заканчивает ход в ауре вашего Духа-тотема, существо восстанавливает хиты = половина вашего уровня друида.',
                            'type' => 'feature',
                        ],
                    ],
                    '14' => [
                        [
                            'key' => 'faithful_summons',
                            'name' => 'Верные призывы',
                            'short_description' => 'При падении до 0 ОЗ — автопризыв 4 зверей ПО 2 в 6 м. Раз за длинный отдых.',
                            'description' => 'Когда вы падаете до 0 хитов или становитесь недееспособны, вы можете немедленно призвать 4 зверей с ПО 2 или ниже в пределах 6 м. Они защищают вас. Один раз за длинный отдых.',
                            'type' => 'resource',
                            'resource_key' => 'faithful_summons_uses',
                            'resource_name' => 'Верные призывы',
                            'resource_max_formula' => '1',
                            'recharge' => 'long_rest',
                        ],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 7,
            ],

            // ==================== WIZARD SUBCLASSES ====================
            [
                'slug' => 'school-of-evocation',
                'parent_slug' => 'wizard',
                'name' => ['ru' => 'Школа Воплощения'],
                'description' => ['ru' => 'Вы сосредотачиваетесь на магии, создающей мощные стихийные эффекты: обжигающее пламя, замораживающий холод, раскатистый гром, трескучую молнию и жгучую кислоту. Некоторые воплотители находят работу в военных силах, служа артиллерией для взрыва вражеских армий издалека.'],
                'hit_die' => 'd6',
                'primary_abilities' => ['intelligence'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'intelligence',
                'level_features' => [
                    '2' => [
                        ['key' => 'evocation_savant', 'name' => 'Знаток воплощения', 'description' => 'Золото и время, которое вы тратите на копирование заклинания школы Воплощения в свою книгу заклинаний, уменьшаются вдвое.', 'type' => 'feature'],
                        ['key' => 'sculpt_spells', 'name' => 'Скульптор заклинаний', 'description' => 'Вы можете создавать карманы относительной безопасности в пределах эффектов ваших заклинаний воплощения. Когда вы накладываете заклинание воплощения, которое воздействует на других существ, вы можете выбрать количество существ равное 1 + круг заклинания. Эти существа автоматически преуспевают в спасбросках от заклинания и не получают урона.', 'type' => 'feature'],
                    ],
                    '6' => [
                        ['key' => 'potent_cantrip', 'name' => 'Мощный заговор', 'description' => 'Ваши наносящие урон заговоры воздействуют даже на существ, которые избегают основной силы эффекта. Когда существо преуспевает в спасброске от вашего заговора, оно получает половину урона заговора (если есть), но не получает дополнительных эффектов.', 'type' => 'feature'],
                    ],
                    '10' => [
                        ['key' => 'empowered_evocation', 'name' => 'Усиленное воплощение', 'description' => 'Вы можете добавлять свой модификатор Интеллекта к одному броску урона любого накладываемого вами заклинания школы Воплощения.', 'type' => 'feature'],
                    ],
                    '14' => [
                        ['key' => 'overchannel', 'name' => 'Перенасыщение', 'description' => 'Вы можете увеличить мощность более простых заклинаний. Когда вы накладываете заклинание волшебника 1-5 круга, которое наносит урон, вы можете нанести максимальный урон этим заклинанием.', 'type' => 'feature'],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 1,
            ],
            [
                'slug' => 'school-of-abjuration',
                'parent_slug' => 'wizard',
                'name' => ['ru' => 'Школа Ограждения'],
                'description' => ['ru' => 'Школа Ограждения подчёркивает магию, которая блокирует, изгоняет или защищает. Последователи этой школы говорят, что их магия — искусство отрицания заклинаний.'],
                'hit_die' => 'd6',
                'primary_abilities' => ['intelligence'],
                'saving_throws' => ['intelligence', 'wisdom'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'intelligence',
                'level_features' => [
                    '2' => [
                        ['key' => 'abjuration_savant', 'name' => 'Знаток ограждения', 'description' => 'Золото и время, которое вы тратите на копирование заклинания школы Ограждения в свою книгу заклинаний, уменьшаются вдвое.', 'type' => 'feature'],
                        ['key' => 'arcane_ward', 'name' => 'Мистический оберег', 'description' => 'Вы можете плести магию вокруг себя для защиты. Когда вы накладываете заклинание школы Ограждения 1 круга или выше, вы можете одновременно использовать часть магии заклинания для создания магического оберега на себе, который существует до завершения продолжительного отдыха.', 'type' => 'feature'],
                    ],
                    '6' => [
                        ['key' => 'projected_ward', 'name' => 'Проецируемый оберег', 'description' => 'Когда существо, которое вы можете видеть в пределах 9 метров, получает урон, вы можете реакцией сделать так, чтобы ваш Мистический оберег поглотил этот урон.', 'type' => 'feature'],
                    ],
                    '10' => [
                        ['key' => 'improved_abjuration', 'name' => 'Улучшенное ограждение', 'description' => 'Когда вы накладываете заклинание школы Ограждения, требующее проверку характеристики как части накладывания заклинания (как рассеивание магии и контрзаклинание), вы добавляете ваш бонус мастерства к этой проверке.', 'type' => 'feature'],
                    ],
                    '14' => [
                        ['key' => 'spell_resistance', 'name' => 'Сопротивление заклинаниям', 'description' => 'Вы совершаете с преимуществом спасброски от заклинаний. Кроме того, вы получаете сопротивление к урону от заклинаний.', 'type' => 'feature'],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 2,
            ],

            // ==================== RANGER SUBCLASSES ====================
            [
                'slug' => 'hunter',
                'parent_slug' => 'ranger',
                'name' => ['ru' => 'Охотник'],
                'description' => ['ru' => 'Эмуляция архетипа Охотника означает принятие вашего места как оплота между цивилизацией и ужасами дикой природы. На пути Охотника вы учитесь специализированным техникам для сражения с угрозами, с которыми сталкиваетесь.'],
                'hit_die' => 'd10',
                'primary_abilities' => ['dexterity', 'wisdom'],
                'saving_throws' => ['strength', 'dexterity'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'level_features' => [
                    '3' => [
                        ['key' => 'hunters_prey', 'name' => 'Добыча охотника', 'description' => 'Выберите одну из следующих особенностей: Убийца колоссов, Убийца великанов или Убийца орд.', 'type' => 'choice', 'options' => ['Убийца колоссов', 'Убийца великанов', 'Убийца орд']],
                    ],
                    '7' => [
                        ['key' => 'defensive_tactics', 'name' => 'Защитная тактика', 'description' => 'Выберите одну из следующих особенностей: Уход от атаки нескольких противников, Стальная воля или Бегство от орды.', 'type' => 'choice', 'options' => ['Уход от атаки нескольких противников', 'Стальная воля', 'Бегство от орды']],
                    ],
                    '11' => [
                        ['key' => 'multiattack', 'name' => 'Мультиатака', 'description' => 'Выберите одну из следующих особенностей: Залп или Вихревая атака.', 'type' => 'choice', 'options' => ['Залп', 'Вихревая атака']],
                    ],
                    '15' => [
                        ['key' => 'superior_hunters_defense', 'name' => 'Превосходная защита охотника', 'description' => 'Выберите одну из следующих особенностей: Уклонение, Отражение стихий или Ответный удар.', 'type' => 'choice', 'options' => ['Уклонение', 'Отражение стихий', 'Ответный удар']],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 1,
            ],
            [
                'slug' => 'beast-master',
                'parent_slug' => 'ranger',
                'name' => ['ru' => 'Повелитель зверей'],
                'description' => ['ru' => 'Архетип Повелителя зверей воплощает дружбу между цивилизованными расами и зверями мира. Объединённые в едином фокусе, зверь и следопыт работают как одно, сражаясь с чудовищными врагами, которые угрожают цивилизации и дикой природе.'],
                'hit_die' => 'd10',
                'primary_abilities' => ['dexterity', 'wisdom'],
                'saving_throws' => ['strength', 'dexterity'],
                'is_spellcaster' => true,
                'spellcasting_ability' => 'wisdom',
                'level_features' => [
                    '3' => [
                        ['key' => 'rangers_companion', 'name' => 'Спутник следопыта', 'description' => 'Вы получаете зверя-компаньона, который сопровождает вас в приключениях и обучен сражаться вместе с вами. Выберите зверя не больше Среднего размера с показателем опасности 1/4 или ниже.', 'type' => 'feature'],
                    ],
                    '7' => [
                        ['key' => 'exceptional_training', 'name' => 'Исключительная тренировка', 'description' => 'Бонусным действием вы можете командовать зверю совершить действие Рывок, Отход или Помощь в свой ход.', 'type' => 'feature'],
                    ],
                    '11' => [
                        ['key' => 'bestial_fury', 'name' => 'Звериная ярость', 'description' => 'Когда вы командуете своему зверю-компаньону совершить действие Атака, зверь может совершить две атаки или совершить действие Мультиатака, если оно у него есть.', 'type' => 'feature'],
                    ],
                    '15' => [
                        ['key' => 'share_spells', 'name' => 'Разделение заклинаний', 'description' => 'Когда вы накладываете заклинание с целью на себя, вы также можете воздействовать этим заклинанием на своего зверя-компаньона, если он находится в пределах 9 метров от вас.', 'type' => 'feature'],
                    ],
                ],
                'is_system' => true,
                'sort_order' => 2,
            ],
        ];
    }
}
