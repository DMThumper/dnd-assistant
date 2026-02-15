<?php

namespace Database\Seeders;

use App\Models\Spell;
use App\Models\Setting;
use Illuminate\Database\Seeder;

class SpellsSeeder extends Seeder
{
    public function run(): void
    {
        $eberron = Setting::where('slug', 'eberron')->first();
        $forgottenRealms = Setting::where('slug', 'forgotten-realms')->first();

        // Core SRD spells (available in all settings)
        $spells = $this->getSpells();

        foreach ($spells as $spellData) {
            $spell = Spell::updateOrCreate(
                ['slug' => $spellData['slug']],
                $spellData
            );

            // Attach to all available settings
            $settingIds = [];
            if ($eberron) {
                $settingIds[] = $eberron->id;
            }
            if ($forgottenRealms) {
                $settingIds[] = $forgottenRealms->id;
            }

            if (!empty($settingIds)) {
                $spell->settings()->syncWithoutDetaching($settingIds);
            }
        }

        $this->command->info('Spells seeded successfully: ' . count($spells) . ' spells.');
    }

    private function getSpells(): array
    {
        return [
            // ==========================================
            // CANTRIPS (Level 0)
            // ==========================================

            // FIRE BOLT
            [
                'slug' => 'fire-bolt',
                'name' => ['ru' => 'Огненный снаряд'],
                'description' => ['ru' => 'Вы бросаете сгусток огня в существо или предмет в пределах дистанции. Совершите дальнобойную атаку заклинанием по цели. При попадании цель получает 1d10 урона огнём. Горючий предмет, по которому попало это заклинание, загорается, если его никто не несёт и не носит.'],
                'level' => 0,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => [
                    '5' => '2d10',
                    '11' => '3d10',
                    '17' => '4d10',
                ],
                'effects' => [
                    'damage' => ['dice' => '1d10', 'type' => 'fire'],
                ],
                'is_system' => true,
                'sort_order' => 1,
            ],

            // SACRED FLAME
            [
                'slug' => 'sacred-flame',
                'name' => ['ru' => 'Священное пламя'],
                'description' => ['ru' => 'Похожее на пламя сияние нисходит на существо, которое вы видите в пределах дистанции. Цель должна преуспеть в спасброске Ловкости, иначе получит 1d8 урона излучением. Для этого спасброска цель не получает преимуществ от укрытия.'],
                'level' => 0,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['cleric'],
                'higher_levels' => null,
                'cantrip_scaling' => [
                    '5' => '2d8',
                    '11' => '3d8',
                    '17' => '4d8',
                ],
                'effects' => [
                    'damage' => ['dice' => '1d8', 'type' => 'radiant'],
                    'save' => ['ability' => 'dexterity'],
                ],
                'is_system' => true,
                'sort_order' => 2,
            ],

            // ELDRITCH BLAST
            [
                'slug' => 'eldritch-blast',
                'name' => ['ru' => 'Мистический заряд'],
                'description' => ['ru' => 'К существу в пределах дистанции устремляется луч потрескивающей энергии. Совершите дальнобойную атаку заклинанием по цели. При попадании цель получает 1d10 урона силовым полем.'],
                'level' => 0,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['warlock'],
                'higher_levels' => null,
                'cantrip_scaling' => [
                    '5' => '2 луча',
                    '11' => '3 луча',
                    '17' => '4 луча',
                ],
                'effects' => [
                    'damage' => ['dice' => '1d10', 'type' => 'force'],
                ],
                'is_system' => true,
                'sort_order' => 3,
            ],

            // LIGHT
            [
                'slug' => 'light',
                'name' => ['ru' => 'Свет'],
                'description' => ['ru' => 'Вы касаетесь одного предмета, длина которого ни по одному измерению не превышает 3 метров. Пока заклинание активно, предмет испускает яркий свет в радиусе 6 метров и тусклый свет в пределах ещё 6 метров. Свет может быть любого выбранного вами цвета. Полное покрытие предмета чем-то непрозрачным блокирует свет. Заклинание заканчивается, если вы наложите его ещё раз или окончите действием.'],
                'level' => 0,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => '1 час',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => false,
                    'material' => true,
                    'material_description' => 'светлячок или фосфоресцирующий мох',
                ],
                'classes' => ['wizard', 'sorcerer', 'cleric', 'bard', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 4,
            ],

            // PRESTIDIGITATION
            [
                'slug' => 'prestidigitation',
                'name' => ['ru' => 'Фокусы'],
                'description' => ['ru' => 'Это заклинание — небольшой магический трюк, на котором тренируются начинающие заклинатели. Вы создаёте один из следующих магических эффектов в пределах дистанции: мгновенный безвредный сенсорный эффект; зажигаете или тушите свечу, факел или небольшой костёр; чистите или пачкаете предмет; охлаждаете, нагреваете или придаёте вкус кубическому футу неживой материи; создаёте небольшую метку или символ на поверхности; создаёте безделушку или иллюзорный образ.'],
                'level' => 0,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '3 м',
                'duration' => 'До 1 часа',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'bard', 'warlock', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 5,
            ],

            // MAGE HAND
            [
                'slug' => 'mage-hand',
                'name' => ['ru' => 'Волшебная рука'],
                'description' => ['ru' => 'В точке, выбранной вами в пределах дистанции, появляется призрачная парящая рука. Рука существует, пока заклинание активно, или пока вы не отпустите её действием. Рука исчезает, если окажется более чем в 9 метрах от вас, или если вы повторно используете это заклинание. Вы можете действием контролировать руку, используя её для манипулирования предметом, открывания незапертых дверей и контейнеров, укладывания или извлечения предмета из открытого контейнера.'],
                'level' => 0,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => '1 минута',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'bard', 'warlock', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 6,
            ],

            // ==========================================
            // 1ST LEVEL SPELLS
            // ==========================================

            // MAGIC MISSILE
            [
                'slug' => 'magic-missile',
                'name' => ['ru' => 'Волшебная стрела'],
                'description' => ['ru' => 'Вы создаёте три светящихся дротика из магической силы. Каждый дротик попадает в существо на ваш выбор, видимое вами в пределах дистанции. Дротик причиняет 1d4+1 урона силовым полем. Все дротики атакуют одновременно, и вы можете направить их как в одну цель, так и в несколько.'],
                'level' => 1,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 2 уровня или выше, заклинание создаёт по одному дополнительному дротику за каждый уровень ячейки выше первого.',
                ],
                'cantrip_scaling' => null,
                'effects' => [
                    'damage' => ['dice' => '1d4+1', 'type' => 'force'],
                ],
                'is_system' => true,
                'sort_order' => 10,
            ],

            // CURE WOUNDS
            [
                'slug' => 'cure-wounds',
                'name' => ['ru' => 'Лечение ран'],
                'description' => ['ru' => 'Существо, которого вы касаетесь, восстанавливает количество хитов, равное 1d8 + ваш модификатор базовой характеристики. Это заклинание не оказывает никакого эффекта на нежить и конструктов.'],
                'level' => 1,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['cleric', 'druid', 'bard', 'paladin', 'ranger', 'artificer'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 2 уровня или выше, лечение увеличивается на 1d8 за каждый уровень ячейки выше первого.',
                ],
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 11,
            ],

            // SHIELD
            [
                'slug' => 'shield',
                'name' => ['ru' => 'Щит'],
                'description' => ['ru' => 'Невидимый барьер из магической силы появляется, защищая вас. До начала вашего следующего хода вы получаете бонус +5 к КД, в том числе против атаки, вызвавшей сотворение этого заклинания, и вы не получаете урона от волшебной стрелы.'],
                'level' => 1,
                'school' => 'abjuration',
                'casting_time' => '1 реакция, когда по вам попадают атакой или вы становитесь целью волшебной стрелы',
                'range' => 'На себя',
                'duration' => '1 раунд',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 12,
            ],

            // DETECT MAGIC
            [
                'slug' => 'detect-magic',
                'name' => ['ru' => 'Обнаружение магии'],
                'description' => ['ru' => 'Пока заклинание активно, вы чувствуете присутствие магии в пределах 9 метров от себя. Если вы почувствовали магию таким образом, вы можете действием увидеть слабую ауру вокруг видимого вами существа или предмета, несущего на себе магию, а также узнать школу магии, если она есть.'],
                'level' => 1,
                'school' => 'divination',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => true,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'cleric', 'druid', 'bard', 'paladin', 'ranger', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 13,
            ],

            // MAGE ARMOR
            [
                'slug' => 'mage-armor',
                'name' => ['ru' => 'Доспехи мага'],
                'description' => ['ru' => 'Вы касаетесь согласного существа, не носящего доспехов, и защитная магическая сила окутывает его, пока заклинание не окончится. Базовый КД цели становится равным 13 + модификатор Ловкости. Заклинание оканчивается, если цель надевает доспехи или если вы оканчиваете его действием.'],
                'level' => 1,
                'school' => 'abjuration',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => '8 часов',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'кусочек выделанной кожи',
                ],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 14,
            ],

            // ==========================================
            // 2ND LEVEL SPELLS
            // ==========================================

            // MISTY STEP
            [
                'slug' => 'misty-step',
                'name' => ['ru' => 'Туманный шаг'],
                'description' => ['ru' => 'Окутавшись серебристым туманом, вы телепортируетесь на расстояние до 9 метров в свободное пространство, которое видите.'],
                'level' => 2,
                'school' => 'conjuration',
                'casting_time' => '1 бонусное действие',
                'range' => 'На себя',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => false,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'warlock'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 20,
            ],

            // HOLD PERSON
            [
                'slug' => 'hold-person',
                'name' => ['ru' => 'Удержание личности'],
                'description' => ['ru' => 'Выберите гуманоида, которого видите в пределах дистанции. Цель должна преуспеть в спасброске Мудрости, иначе станет парализованной на время действия заклинания. В конце каждого своего хода цель может совершать новый спасбросок Мудрости. При успехе заклинание оканчивается на этой цели.'],
                'level' => 2,
                'school' => 'enchantment',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'небольшой прямой кусок железа',
                ],
                'classes' => ['wizard', 'sorcerer', 'cleric', 'druid', 'bard', 'warlock'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 3 уровня или выше, вы можете сделать целью одного дополнительного гуманоида за каждый уровень ячейки выше 2. Все гуманоиды должны находиться в пределах 9 метров друг от друга.',
                ],
                'cantrip_scaling' => null,
                'effects' => [
                    'save' => ['ability' => 'wisdom'],
                ],
                'is_system' => true,
                'sort_order' => 21,
            ],

            // INVISIBILITY
            [
                'slug' => 'invisibility',
                'name' => ['ru' => 'Невидимость'],
                'description' => ['ru' => 'Существо, которого вы касаетесь, становится невидимым, пока заклинание активно. Всё, что цель несёт и носит, тоже становится невидимым, пока находится при ней. Заклинание оканчивается на цели, если она совершает атаку или накладывает заклинание.'],
                'level' => 2,
                'school' => 'illusion',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'ресница, обмазанная гуммиарабиком',
                ],
                'classes' => ['wizard', 'sorcerer', 'bard', 'warlock', 'artificer'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 3 уровня или выше, вы можете сделать целью одно дополнительное существо за каждый уровень ячейки выше 2.',
                ],
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 22,
            ],

            // ==========================================
            // 3RD LEVEL SPELLS
            // ==========================================

            // FIREBALL
            [
                'slug' => 'fireball',
                'name' => ['ru' => 'Огненный шар'],
                'description' => ['ru' => 'Яркий луч вылетает из вашего указательного пальца в точку, выбранную вами в пределах дистанции, где происходит низкочастотный взрыв пламени. Все существа в пределах сферы с радиусом 6 метров с центром в этой точке должны совершить спасбросок Ловкости. Цель получает 8d6 урона огнём при провале или половину этого урона при успехе.'],
                'level' => 3,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '45 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'крошечный шарик из гуано летучей мыши и серы',
                ],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 4 уровня или выше, урон увеличивается на 1d6 за каждый уровень ячейки выше 3.',
                ],
                'cantrip_scaling' => null,
                'effects' => [
                    'damage' => ['dice' => '8d6', 'type' => 'fire'],
                    'save' => ['ability' => 'dexterity', 'on_success' => 'half'],
                    'area' => ['shape' => 'sphere', 'radius' => '6 м'],
                ],
                'is_system' => true,
                'sort_order' => 30,
            ],

            // LIGHTNING BOLT
            [
                'slug' => 'lightning-bolt',
                'name' => ['ru' => 'Молния'],
                'description' => ['ru' => 'Луч молнии образует линию длиной 30 метров и шириной 1,5 метра, бьющую в направлении, которое вы выбираете. Все существа в этой линии должны совершить спасбросок Ловкости. При провале существо получает 8d6 урона электричеством, или половину этого урона при успехе.'],
                'level' => 3,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => 'На себя (линия 30 м)',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'кусочек меха и стеклянная палочка',
                ],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 4 уровня или выше, урон увеличивается на 1d6 за каждый уровень ячейки выше 3.',
                ],
                'cantrip_scaling' => null,
                'effects' => [
                    'damage' => ['dice' => '8d6', 'type' => 'lightning'],
                    'save' => ['ability' => 'dexterity', 'on_success' => 'half'],
                    'area' => ['shape' => 'line', 'length' => '30 м', 'width' => '1,5 м'],
                ],
                'is_system' => true,
                'sort_order' => 31,
            ],

            // COUNTERSPELL
            [
                'slug' => 'counterspell',
                'name' => ['ru' => 'Контрзаклинание'],
                'description' => ['ru' => 'Вы пытаетесь прервать существо в процессе накладывания заклинания. Если существо накладывает заклинание 3 уровня или ниже, его заклинание проваливается и не оказывает никакого эффекта. Если оно накладывает заклинание 4 уровня или выше, совершите проверку базовой характеристики. Сл равна 10 + уровень заклинания. При успехе заклинание существа проваливается и не оказывает никакого эффекта.'],
                'level' => 3,
                'school' => 'abjuration',
                'casting_time' => '1 реакция, когда вы видите существо в пределах 18 метров, накладывающее заклинание',
                'range' => '18 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => false,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'warlock'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 4 уровня или выше, прерываемое заклинание не оказывает эффекта, если его уровень не превышает уровень использованной вами ячейки.',
                ],
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 32,
            ],

            // DISPEL MAGIC
            [
                'slug' => 'dispel-magic',
                'name' => ['ru' => 'Рассеивание магии'],
                'description' => ['ru' => 'Выберите одно существо, предмет или магический эффект в пределах дистанции. Все заклинания 3 уровня и ниже, действующие на цель, оканчиваются. Для каждого заклинания 4 уровня и выше, действующего на цель, совершите проверку базовой характеристики. Сл равна 10 + уровень заклинания. При успехе заклинание оканчивается.'],
                'level' => 3,
                'school' => 'abjuration',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'cleric', 'druid', 'bard', 'paladin', 'warlock', 'artificer'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 4 уровня или выше, вы автоматически оканчиваете эффекты заклинания на цели, если уровень заклинания не превышает уровень использованной вами ячейки.',
                ],
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 33,
            ],

            // ==========================================
            // 4TH LEVEL SPELLS
            // ==========================================

            // DIMENSION DOOR
            [
                'slug' => 'dimension-door',
                'name' => ['ru' => 'Дверь измерений'],
                'description' => ['ru' => 'Вы телепортируетесь из текущего местоположения в любое другое место в пределах дистанции. Вы прибываете точно в желаемое место. Это может быть место, которое вы видите, представляете, или то, которое можете описать, назвав расстояние и направление.'],
                'level' => 4,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '150 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => false,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'bard', 'warlock'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 40,
            ],

            // GREATER INVISIBILITY
            [
                'slug' => 'greater-invisibility',
                'name' => ['ru' => 'Высшая невидимость'],
                'description' => ['ru' => 'Вы или существо, которого вы касаетесь, становится невидимым, пока заклинание активно. Всё, что цель носит или несёт, тоже становится невидимым.'],
                'level' => 4,
                'school' => 'illusion',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'bard'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 41,
            ],

            // ==========================================
            // 5TH LEVEL SPELLS
            // ==========================================

            // CONE OF COLD
            [
                'slug' => 'cone-of-cold',
                'name' => ['ru' => 'Конус холода'],
                'description' => ['ru' => 'Из ваших рук вырывается волна холодного воздуха. Все существа в 18-метровом конусе должны совершить спасбросок Телосложения. Существо получает 8d8 урона холодом при провале, или половину этого урона при успехе. Существо, убитое этим заклинанием, становится замороженной статуей, пока не оттает.'],
                'level' => 5,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => 'На себя (конус 18 м)',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'небольшой хрустальный или стеклянный конус',
                ],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 6 уровня или выше, урон увеличивается на 1d8 за каждый уровень ячейки выше 5.',
                ],
                'cantrip_scaling' => null,
                'effects' => [
                    'damage' => ['dice' => '8d8', 'type' => 'cold'],
                    'save' => ['ability' => 'constitution', 'on_success' => 'half'],
                    'area' => ['shape' => 'cone', 'length' => '18 м'],
                ],
                'is_system' => true,
                'sort_order' => 50,
            ],

            // WALL OF FORCE
            [
                'slug' => 'wall-of-force',
                'name' => ['ru' => 'Силовая стена'],
                'description' => ['ru' => 'Невидимая стена силы появляется в точке, которую вы выбираете в пределах дистанции. Стена появляется в любой ориентации на ваш выбор: горизонтально, вертикально или под углом. Она может свободно парить, либо опираться на твёрдую поверхность. Ничто физически не может пройти сквозь стену. Она неуязвима ко всем повреждениям и её нельзя рассеять рассеиванием магии.'],
                'level' => 5,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'щепотка порошка из чистого прозрачного камня',
                ],
                'classes' => ['wizard'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 51,
            ],

            // ==========================================
            // 6TH LEVEL SPELLS
            // ==========================================

            // DISINTEGRATE
            [
                'slug' => 'disintegrate',
                'name' => ['ru' => 'Распад'],
                'description' => ['ru' => 'Тонкий зелёный луч вылетает из вашего указательного пальца в цель, видимую в пределах дистанции. Целью может быть существо, предмет или творение магической силы. Существо, по которому попал этот луч, должно совершить спасбросок Ловкости. При провале цель получает 10d6+40 урона силовым полем. Если этот урон уменьшает хиты цели до 0, она распадается.'],
                'level' => 6,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'магнитный камень и щепотка пыли',
                ],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 7 уровня или выше, урон увеличивается на 3d6 за каждый уровень ячейки выше 6.',
                ],
                'cantrip_scaling' => null,
                'effects' => [
                    'damage' => ['dice' => '10d6+40', 'type' => 'force'],
                    'save' => ['ability' => 'dexterity'],
                ],
                'is_system' => true,
                'sort_order' => 60,
            ],

            // ==========================================
            // 7TH LEVEL SPELLS
            // ==========================================

            // TELEPORT
            [
                'slug' => 'teleport',
                'name' => ['ru' => 'Телепортация'],
                'description' => ['ru' => 'Это заклинание мгновенно переносит вас и до восьми согласных существ на ваш выбор, которых вы видите в пределах дистанции, или один предмет, видимый в пределах дистанции, в выбранное вами место назначения. Если вы нацелились на предмет, он должен полностью помещаться в куб с длиной ребра 3 метра, и он не должен удерживаться другим существом.'],
                'level' => 7,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '3 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => false,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'bard'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 70,
            ],

            // ==========================================
            // 8TH LEVEL SPELLS
            // ==========================================

            // POWER WORD STUN
            [
                'slug' => 'power-word-stun',
                'name' => ['ru' => 'Слово силы: Оглушение'],
                'description' => ['ru' => 'Вы произносите слово силы, способное подавить разум одного существа, которое вы видите в пределах дистанции, ошеломляя его. Если у выбранного существа 150 хитов или меньше, оно становится ошеломлённым. В противном случае заклинание не оказывает эффекта. Ошеломлённая цель должна совершать спасбросок Телосложения в конце каждого своего хода. При успехе этот ошеломляющий эффект оканчивается.'],
                'level' => 8,
                'school' => 'enchantment',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => false,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'bard', 'warlock'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 80,
            ],

            // ==========================================
            // 9TH LEVEL SPELLS
            // ==========================================

            // WISH
            [
                'slug' => 'wish',
                'name' => ['ru' => 'Исполнение желаний'],
                'description' => ['ru' => 'Исполнение желаний — самое могущественное заклинание, доступное смертным. Произнеся вслух, вы можете изменить основы реальности в соответствии с вашими желаниями. Самое простое использование этого заклинания — дублирование любого другого заклинания 8 уровня или ниже. Вам не нужно выполнять требования этого заклинания, включая дорогие компоненты. Заклинание просто вступает в силу.'],
                'level' => 9,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => false,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 90,
            ],

            // METEOR SWARM
            [
                'slug' => 'meteor-swarm',
                'name' => ['ru' => 'Метеоритный дождь'],
                'description' => ['ru' => 'Пылающие шары падают на землю в четырёх разных точках, видимых вами в пределах дистанции. Все существа в сфере с радиусом 12 метров с центром в каждой выбранной вами точке должны совершить спасбросок Ловкости. Сферы расширяются, огибая углы. При провале существо получает 20d6 урона огнём и 20d6 дробящего урона, или половину этого урона при успехе.'],
                'level' => 9,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '1,5 км',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => [
                    'damage' => ['dice' => '20d6 fire + 20d6 bludgeoning', 'type' => 'fire, bludgeoning'],
                    'save' => ['ability' => 'dexterity', 'on_success' => 'half'],
                    'area' => ['shape' => 'spheres', 'radius' => '12 м', 'count' => 4],
                ],
                'is_system' => true,
                'sort_order' => 91,
            ],
        ];
    }
}
