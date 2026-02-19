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

            // DRUIDCRAFT
            [
                'slug' => 'druidcraft',
                'name' => ['ru' => 'Искусство друидов'],
                'description' => ['ru' => 'Шепча слова духам природы, вы создаёте один из следующих эффектов в пределах дистанции: Вы создаёте крохотный безвредный ощутимый эффект, предсказывающий погоду в текущем месте на следующие 24 часа. Вы мгновенно заставляете цветок распуститься, семечку раскрыться или листик распуститься. Вы создаёте мгновенный безвредный ощутимый эффект, такой как падающие листья, небольшой порыв ветра, звук маленького животного или слабый запах скунса. Вы мгновенно зажигаете или тушите свечу, факел или небольшой костёр.'],
                'level' => 0,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['druid'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 7,
            ],

            // GUIDANCE
            [
                'slug' => 'guidance',
                'name' => ['ru' => 'Указание'],
                'description' => ['ru' => 'Вы касаетесь одного согласного существа. Пока заклинание активно, цель может один раз бросить d4 и добавить выпавшее число к одной проверке характеристики на свой выбор. Она может бросить эту кость до или после совершения проверки. После этого заклинание оканчивается.'],
                'level' => 0,
                'school' => 'divination',
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
                'classes' => ['cleric', 'druid', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 8,
            ],

            // MENDING
            [
                'slug' => 'mending',
                'name' => ['ru' => 'Починка'],
                'description' => ['ru' => 'Это заклинание чинит одно повреждение или разрыв на предмете, которого касаетесь, например, разорванное звено цепи, две половинки сломанного ключа, порванный плащ или протекающий бурдюк. Если повреждение или разрыв не больше 30 сантиметров в любом измерении, вы чините его, не оставляя следов. Это заклинание может физически починить магический предмет или конструкт, но не может восстановить их магию.'],
                'level' => 0,
                'school' => 'transmutation',
                'casting_time' => '1 минута',
                'range' => 'Касание',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'два магнитных камня',
                ],
                'classes' => ['wizard', 'sorcerer', 'cleric', 'druid', 'bard', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 9,
            ],

            // POISON SPRAY
            [
                'slug' => 'poison-spray',
                'name' => ['ru' => 'Ядовитые брызги'],
                'description' => ['ru' => 'Вы простираете руку к существу, которое видите в пределах дистанции, и выпускаете из ладони струю ядовитого газа. Существо должно преуспеть в спасброске Телосложения, иначе получит 1d12 урона ядом.'],
                'level' => 0,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '3 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'druid', 'warlock', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => [
                    '5' => '2d12',
                    '11' => '3d12',
                    '17' => '4d12',
                ],
                'effects' => [
                    'damage' => ['dice' => '1d12', 'type' => 'poison'],
                    'save' => ['ability' => 'constitution', 'on_success' => 'none'],
                ],
                'is_system' => true,
                'sort_order' => 10,
            ],

            // PRODUCE FLAME
            [
                'slug' => 'produce-flame',
                'name' => ['ru' => 'Сотворение пламени'],
                'description' => ['ru' => 'В вашей ладони появляется мерцающее пламя. Оно остаётся там, пока заклинание активно, и не вредит ни вам, ни вашему снаряжению. Пламя испускает яркий свет в радиусе 3 метров и тусклый свет в радиусе ещё 3 метров. Заклинание оканчивается, если вы оканчиваете его действием или накладываете ещё раз. Вы можете атаковать этим пламенем, хотя это тоже оканчивает заклинание. Когда вы накладываете это заклинание, или другим действием в последующих ходах, вы можете метнуть пламя в существо в пределах 9 метров. Совершите дальнобойную атаку заклинанием. При попадании цель получает 1d8 урона огнём.'],
                'level' => 0,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => '10 минут',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['druid'],
                'higher_levels' => null,
                'cantrip_scaling' => [
                    '5' => '2d8',
                    '11' => '3d8',
                    '17' => '4d8',
                ],
                'effects' => [
                    'damage' => ['dice' => '1d8', 'type' => 'fire'],
                ],
                'is_system' => true,
                'sort_order' => 11,
            ],

            // RESISTANCE
            [
                'slug' => 'resistance',
                'name' => ['ru' => 'Сопротивление'],
                'description' => ['ru' => 'Вы касаетесь одного согласного существа. Пока заклинание активно, цель может один раз бросить d4 и добавить выпавшее число к одному спасброску на свой выбор. Она может бросить эту кость до или после совершения спасброска. После этого заклинание оканчивается.'],
                'level' => 0,
                'school' => 'abjuration',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'миниатюрный плащ',
                ],
                'classes' => ['cleric', 'druid', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 12,
            ],

            // SHILLELAGH
            [
                'slug' => 'shillelagh',
                'name' => ['ru' => 'Дубинка'],
                'description' => ['ru' => 'Дерево дубинки или боевого посоха, который вы держите, наделяется силой природы. Пока заклинание активно, вы можете использовать базовую характеристику заклинаний вместо Силы для бросков атаки и урона рукопашным оружием, использующих это оружие, и кость урона оружия становится d8. Оружие также становится магическим, если ещё не является таковым. Заклинание оканчивается, если вы накладываете его ещё раз, или выпускаете оружие из рук.'],
                'level' => 0,
                'school' => 'transmutation',
                'casting_time' => '1 бонусное действие',
                'range' => 'Касание',
                'duration' => '1 минута',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'омела, лист клевера и дубинка или боевой посох',
                ],
                'classes' => ['druid'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 13,
            ],

            // THORN WHIP
            [
                'slug' => 'thorn-whip',
                'name' => ['ru' => 'Терновый кнут'],
                'description' => ['ru' => 'Вы создаёте длинную лозу, похожую на кнут, покрытую шипами, бьющую по вашей команде существо в пределах дистанции. Совершите рукопашную атаку заклинанием по цели. Если атака попадает, существо получает 1d6 колющего урона, и если существо имеет размер не больше Большого, вы подтягиваете его на 3 метра ближе к себе.'],
                'level' => 0,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'стебель растения с шипами',
                ],
                'classes' => ['druid', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => [
                    '5' => '2d6',
                    '11' => '3d6',
                    '17' => '4d6',
                ],
                'effects' => [
                    'damage' => ['dice' => '1d6', 'type' => 'piercing'],
                ],
                'is_system' => true,
                'sort_order' => 14,
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
                    'scaling' => [
                        'type' => 'targets',
                        'dice_per_level' => '1d4+1',
                        'base_level' => 1,
                    ],
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
                    'scaling' => [
                        'type' => 'healing',
                        'dice_per_level' => '1d8',
                        'base_level' => 1,
                    ],
                ],
                'cantrip_scaling' => null,
                'effects' => [
                    'healing' => ['dice' => '1d8'],
                ],
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

            // ENTANGLE
            [
                'slug' => 'entangle',
                'name' => ['ru' => 'Опутывание'],
                'description' => ['ru' => 'Из точки в пределах дистанции на площади в форме квадрата со стороной 6 метров вырастают хватающие сорняки и лозы. Эта местность становится труднопроходимой, пока заклинание активно. Существа в этой местности должны преуспеть в спасброске Силы, иначе станут опутанными, пока заклинание активно. Опутанное существо может действием совершить проверку Силы против Сл ваших заклинаний. При успехе оно освобождается.'],
                'level' => 1,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '27 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['druid'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => [
                    'save' => ['ability' => 'strength'],
                    'area' => ['shape' => 'square', 'size' => '6 м'],
                ],
                'is_system' => true,
                'sort_order' => 15,
            ],

            // FAERIE FIRE
            [
                'slug' => 'faerie-fire',
                'name' => ['ru' => 'Огонь фей'],
                'description' => ['ru' => 'Все предметы в кубе с длиной ребра 6 метров в пределах дистанции подсвечиваются синим, зелёным или фиолетовым светом (на ваш выбор). Все существа в этой области тоже подсвечиваются, если проваливают спасбросок Ловкости. Подсвеченные существа испускают тусклый свет в радиусе 3 метров, по ним нельзя получить преимущество от невидимости, и броски атаки по ним совершаются с преимуществом.'],
                'level' => 1,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => false,
                    'material' => false,
                ],
                'classes' => ['druid', 'bard', 'artificer'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => [
                    'save' => ['ability' => 'dexterity'],
                    'area' => ['shape' => 'cube', 'size' => '6 м'],
                ],
                'is_system' => true,
                'sort_order' => 16,
            ],

            // GOODBERRY
            [
                'slug' => 'goodberry',
                'name' => ['ru' => 'Чудо-ягоды'],
                'description' => ['ru' => 'В вашей руке появляется до десяти ягод, наполненных магией. Существо может действием съесть одну ягоду. Съеденная ягода восстанавливает 1 хит и обеспечивает едой на один день. Ягоды теряют свойства, если не были съедены в течение 24 часов после сотворения заклинания.'],
                'level' => 1,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => true,
                    'material_description' => 'веточка омелы',
                ],
                'classes' => ['druid', 'ranger'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 17,
            ],

            // HEALING WORD
            [
                'slug' => 'healing-word',
                'name' => ['ru' => 'Лечащее слово'],
                'description' => ['ru' => 'Существо на ваш выбор, которое вы видите в пределах дистанции, восстанавливает количество хитов, равное 1d4 + ваш модификатор базовой характеристики. Это заклинание не оказывает никакого эффекта на нежить и конструктов.'],
                'level' => 1,
                'school' => 'evocation',
                'casting_time' => '1 бонусное действие',
                'range' => '18 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => false,
                    'material' => false,
                ],
                'classes' => ['cleric', 'druid', 'bard'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 2 уровня или выше, лечение увеличивается на 1d4 за каждый уровень ячейки выше первого.',
                    'scaling' => [
                        'type' => 'healing',
                        'dice_per_level' => '1d4',
                        'base_level' => 1,
                    ],
                ],
                'cantrip_scaling' => null,
                'effects' => [
                    'healing' => ['dice' => '1d4'],
                ],
                'is_system' => true,
                'sort_order' => 18,
            ],

            // THUNDERWAVE
            [
                'slug' => 'thunderwave',
                'name' => ['ru' => 'Волна грома'],
                'description' => ['ru' => 'От вас исходит волна громовой силы. Все существа в кубе с длиной ребра 4,5 метра, исходящем от вас, должны совершить спасбросок Телосложения. При провале существо получает 2d8 урона звуком и толкается на 3 метра от вас. При успехе существо получает половину урона и не толкается.'],
                'level' => 1,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => 'На себя (куб 4,5 м)',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['wizard', 'sorcerer', 'druid', 'bard'],
                'higher_levels' => [
                    'description' => 'Если вы накладываете это заклинание, используя ячейку 2 уровня или выше, урон увеличивается на 1d8 за каждый уровень ячейки выше первого.',
                    'scaling' => [
                        'type' => 'damage',
                        'dice_per_level' => '1d8',
                        'base_level' => 1,
                    ],
                ],
                'cantrip_scaling' => null,
                'effects' => [
                    'damage' => ['dice' => '2d8', 'type' => 'thunder'],
                    'save' => ['ability' => 'constitution', 'on_success' => 'half'],
                ],
                'is_system' => true,
                'sort_order' => 19,
            ],

            // SPEAK WITH ANIMALS
            [
                'slug' => 'speak-with-animals',
                'name' => ['ru' => 'Разговор с животными'],
                'description' => ['ru' => 'Вы получаете способность понимать зверей и устно общаться с ними, пока заклинание активно. Знания и сознание зверей ограничены их интеллектом, но они как минимум могут сообщить вам о ближайших местах и чудовищах, включая всех, кого они видели за последний день.'],
                'level' => 1,
                'school' => 'divination',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => '10 минут',
                'concentration' => false,
                'ritual' => true,
                'components' => [
                    'verbal' => true,
                    'somatic' => true,
                    'material' => false,
                ],
                'classes' => ['druid', 'ranger', 'bard'],
                'higher_levels' => null,
                'cantrip_scaling' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 20,
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
                    'scaling' => [
                        'type' => 'targets',
                        'base_level' => 2,
                        'description' => '+1 цель за уровень выше 2',
                    ],
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
                    'scaling' => [
                        'type' => 'targets',
                        'base_level' => 2,
                        'description' => '+1 цель за уровень выше 2',
                    ],
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
                    'scaling' => [
                        'type' => 'damage',
                        'dice_per_level' => '1d6',
                        'base_level' => 3,
                    ],
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
                    'scaling' => [
                        'type' => 'damage',
                        'dice_per_level' => '1d6',
                        'base_level' => 3,
                    ],
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
                    'scaling' => [
                        'type' => 'damage',
                        'dice_per_level' => '1d8',
                        'base_level' => 5,
                    ],
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
                    'scaling' => [
                        'type' => 'damage',
                        'dice_per_level' => '3d6',
                        'base_level' => 6,
                    ],
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

            // ==========================================
            // CIRCLE SPELLS (for Circle of the Land druids)
            // ==========================================

            // 2ND LEVEL - CIRCLE SPELLS

            // SPIKE GROWTH
            [
                'slug' => 'spike-growth',
                'name' => ['ru' => 'Шипы'],
                'description' => ['ru' => 'Земля в пределах 6-метрового радиуса с центром в точке в пределах дистанции покрывается шипами и колючками. Эта местность становится труднопроходимой. Когда существо перемещается по этой области, оно получает 2d4 колющего урона за каждые 1,5 метра перемещения. Превращение замаскировано, чтобы местность выглядела естественно.'],
                'level' => 2,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '45 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'семь острых шипов или семь заострённых веток'],
                'classes' => ['druid', 'ranger'],
                'higher_levels' => null,
                'effects' => ['damage' => ['dice' => '2d4', 'type' => 'piercing'], 'area' => ['shape' => 'sphere', 'radius' => '6 м']],
                'is_system' => true,
                'sort_order' => 100,
            ],

            // BARKSKIN
            [
                'slug' => 'barkskin',
                'name' => ['ru' => 'Дубовая кора'],
                'description' => ['ru' => 'Вы касаетесь согласного существа. Пока заклинание активно, кожа цели становится грубой, как кора, и КД цели не может быть меньше 16, вне зависимости от того, какие доспехи она носит.'],
                'level' => 2,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'горсть дубовой коры'],
                'classes' => ['druid', 'ranger'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 101,
            ],

            // SPIDER CLIMB
            [
                'slug' => 'spider-climb',
                'name' => ['ru' => 'Паучье лазание'],
                'description' => ['ru' => 'Пока заклинание активно, одно согласное существо, которого вы касаетесь, получает возможность перемещаться вверх, вниз и по вертикальным поверхностям, а также по потолкам, оставляя руки свободными. Цель также получает скорость лазания, равную её скорости ходьбы.'],
                'level' => 2,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'капля битума и паук'],
                'classes' => ['wizard', 'sorcerer', 'warlock'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 102,
            ],

            // PASS WITHOUT TRACE
            [
                'slug' => 'pass-without-trace',
                'name' => ['ru' => 'Бесследное передвижение'],
                'description' => ['ru' => 'Аура теней и тишины исходит от вас, укрывая вас и ваших спутников от обнаружения. Пока заклинание активно, все существа в пределах 9 метров от вас (включая вас) получают бонус +10 к проверкам Скрытности и не могут выслеживаться немагическими способами, если только не оставляют следов намеренно.'],
                'level' => 2,
                'school' => 'abjuration',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'пепел от сожжённого листа омелы и веточка ели'],
                'classes' => ['druid', 'ranger'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 103,
            ],

            // DARKNESS
            [
                'slug' => 'darkness',
                'name' => ['ru' => 'Тьма'],
                'description' => ['ru' => 'Из точки, выбранной вами в пределах дистанции, расползается магическая тьма, заполняя сферу с радиусом 4,5 метра. Тьма огибает углы. Существа с тёмным зрением не могут видеть сквозь эту тьму, и немагический свет не может её осветить.'],
                'level' => 2,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => false, 'material' => true, 'material_description' => 'шерсть летучей мыши и капля дёгтя или кусок угля'],
                'classes' => ['wizard', 'sorcerer', 'warlock'],
                'higher_levels' => null,
                'effects' => ['area' => ['shape' => 'sphere', 'radius' => '4,5 м']],
                'is_system' => true,
                'sort_order' => 104,
            ],

            // BLUR
            [
                'slug' => 'blur',
                'name' => ['ru' => 'Размытый образ'],
                'description' => ['ru' => 'Ваше тело становится размытым, мерцающим для всех, кто видит вас. Пока заклинание активно, все существа совершают броски атаки по вам с помехой. Атакующий получает иммунитет к этому эффекту, если не полагается на зрение, имеет истинное зрение или может видеть сквозь иллюзии.'],
                'level' => 2,
                'school' => 'illusion',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => false, 'material' => false],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 105,
            ],

            // SILENCE
            [
                'slug' => 'silence',
                'name' => ['ru' => 'Тишина'],
                'description' => ['ru' => 'Пока заклинание активно, никакой звук не может ни создаваться внутри сферы с радиусом 6 метров с центром в точке, выбранной вами в пределах дистанции, ни проходить сквозь неё. Все существа и предметы внутри сферы получают иммунитет к урону звуком, и существа внутри неё становятся глухими. Там невозможно произнести заклинание с вербальным компонентом.'],
                'level' => 2,
                'school' => 'illusion',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => true,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['cleric', 'bard', 'ranger'],
                'higher_levels' => null,
                'effects' => ['area' => ['shape' => 'sphere', 'radius' => '6 м']],
                'is_system' => true,
                'sort_order' => 106,
            ],

            // MIRROR IMAGE
            [
                'slug' => 'mirror-image',
                'name' => ['ru' => 'Отражения'],
                'description' => ['ru' => 'Вокруг вас появляются три ваших иллюзорных копии. Пока заклинание активно, копии перемещаются вместе с вами и имитируют ваши действия, мерцая так, что невозможно определить, где настоящий вы. Каждый раз, когда существо нацеливается на вас атакой, бросьте d20, чтобы определить, попала ли атака по одной из ваших копий.'],
                'level' => 2,
                'school' => 'illusion',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => '1 минута',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['wizard', 'sorcerer', 'warlock'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 107,
            ],

            // WEB
            [
                'slug' => 'web',
                'name' => ['ru' => 'Паутина'],
                'description' => ['ru' => 'Вы создаёте массу толстой и липкой паутины в точке, выбранной вами в пределах дистанции. Паутина заполняет куб с длиной ребра 6 метров на время действия заклинания. Паутина является труднопроходимой местностью и слегка заслоняет свою область. Каждое существо, начинающее ход в паутине или входящее в неё во время хода, должно преуспеть в спасброске Ловкости. При провале существо становится опутанным.'],
                'level' => 2,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'немного паутины'],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => null,
                'effects' => ['save' => ['ability' => 'dexterity'], 'area' => ['shape' => 'cube', 'size' => '6 м']],
                'is_system' => true,
                'sort_order' => 108,
            ],

            // MELF'S ACID ARROW
            [
                'slug' => 'melfs-acid-arrow',
                'name' => ['ru' => 'Кислотная стрела Мельфа'],
                'description' => ['ru' => 'Мерцающая зелёная стрела устремляется к цели в пределах дистанции и взрывается брызгами кислоты. Совершите дальнобойную атаку заклинанием по цели. При попадании цель получает 4d4 урона кислотой немедленно и 2d4 урона кислотой в конце своего следующего хода. При промахе стрела обдаёт цель кислотой, нанося половину начального урона и не нанося урона в конце следующего хода цели.'],
                'level' => 2,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '27 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'порошок из листа ревеня и желудок гадюки'],
                'classes' => ['wizard'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 3 уровня или выше, урон увеличивается на 1d4 за каждый уровень ячейки выше 2.', 'scaling' => ['type' => 'damage', 'dice_per_level' => '1d4', 'base_level' => 2]],
                'effects' => ['damage' => ['dice' => '4d4', 'type' => 'acid']],
                'is_system' => true,
                'sort_order' => 109,
            ],

            // 3RD LEVEL - CIRCLE SPELLS

            // CALL LIGHTNING
            [
                'slug' => 'call-lightning',
                'name' => ['ru' => 'Призыв молнии'],
                'description' => ['ru' => 'Грозовая туча появляется в форме цилиндра высотой 3 метра и радиусом 18 метров с центром прямо над вами. Заклинание проваливается, если вы не видите точку в воздухе, где должна появиться туча. Когда вы накладываете заклинание, выберите точку, которую видите в пределах дистанции. Молния бьёт из тучи в эту точку. Все существа в пределах 1,5 метра от этой точки должны совершить спасбросок Ловкости, получая 3d10 урона электричеством при провале или половину при успехе. В каждый последующий ход вы можете действием вызвать молнию таким образом снова.'],
                'level' => 3,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['druid'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 4 уровня или выше, урон увеличивается на 1d10 за каждый уровень ячейки выше 3.', 'scaling' => ['type' => 'damage', 'dice_per_level' => '1d10', 'base_level' => 3]],
                'effects' => ['damage' => ['dice' => '3d10', 'type' => 'lightning'], 'save' => ['ability' => 'dexterity', 'on_success' => 'half']],
                'is_system' => true,
                'sort_order' => 110,
            ],

            // PLANT GROWTH
            [
                'slug' => 'plant-growth',
                'name' => ['ru' => 'Рост растений'],
                'description' => ['ru' => 'Это заклинание направляет жизненную силу в растения в определённой местности. Есть два варианта применения: немедленный или в течение 8 часов. Немедленно: все обычные растения в пределах сферы с радиусом 30 метров разрастаются. Область становится труднопроходимой местностью. 8 часов: все растения в пределах полумили обогащаются на один год.'],
                'level' => 3,
                'school' => 'transmutation',
                'casting_time' => '1 действие или 8 часов',
                'range' => '45 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['druid', 'bard', 'ranger'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 111,
            ],

            // SLEET STORM
            [
                'slug' => 'sleet-storm',
                'name' => ['ru' => 'Метель'],
                'description' => ['ru' => 'Пока заклинание активно, ледяной дождь и мокрый снег падают в цилиндре с радиусом 12 метров и высотой 6 метров с центром в точке, выбранной вами в пределах дистанции. Область становится сильно заслонённой, и открытое пламя там тушится. Земля в этой области покрывается скользким льдом, становясь труднопроходимой местностью. Существо, входящее в область или начинающее там ход, должно преуспеть в спасброске Ловкости, иначе упадёт ничком.'],
                'level' => 3,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '45 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'щепотка пыли и несколько капель воды'],
                'classes' => ['wizard', 'sorcerer', 'druid'],
                'higher_levels' => null,
                'effects' => ['save' => ['ability' => 'dexterity'], 'area' => ['shape' => 'cylinder', 'radius' => '12 м', 'height' => '6 м']],
                'is_system' => true,
                'sort_order' => 112,
            ],

            // SLOW
            [
                'slug' => 'slow',
                'name' => ['ru' => 'Замедление'],
                'description' => ['ru' => 'Вы изменяете время для шести существ на ваш выбор в кубе с длиной ребра 12 метров в пределах дистанции. Каждая цель должна преуспеть в спасброске Мудрости, иначе станет подвержена эффекту заклинания. Скорость затронутой цели уменьшается вдвое, она получает штраф −2 к КД и спасброскам Ловкости, и она не может использовать реакции. В свой ход она может использовать либо действие, либо бонусное действие, но не то и другое.'],
                'level' => 3,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'капля патоки'],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => null,
                'effects' => ['save' => ['ability' => 'wisdom'], 'area' => ['shape' => 'cube', 'size' => '12 м']],
                'is_system' => true,
                'sort_order' => 113,
            ],

            // WATER BREATHING
            [
                'slug' => 'water-breathing',
                'name' => ['ru' => 'Подводное дыхание'],
                'description' => ['ru' => 'Это заклинание даёт до десяти согласным существам, которых вы видите в пределах дистанции, способность дышать под водой, пока заклинание активно. Затронутые существа также сохраняют свой обычный способ дыхания.'],
                'level' => 3,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => '24 часа',
                'concentration' => false,
                'ritual' => true,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'короткая трость или кусочек соломы'],
                'classes' => ['wizard', 'sorcerer', 'druid', 'ranger'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 114,
            ],

            // WATER WALK
            [
                'slug' => 'water-walk',
                'name' => ['ru' => 'Хождение по воде'],
                'description' => ['ru' => 'Это заклинание даёт способность перемещаться по любой жидкой поверхности — воде, кислоте, грязи, снегу, зыбучим пескам, лаве — как если бы это была безвредная твёрдая поверхность (существа, идущие по расплавленной лаве, всё равно получают урон от жара). До десяти согласных существ, которых вы можете видеть в пределах дистанции, получают эту способность, пока заклинание активно.'],
                'level' => 3,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => '1 час',
                'concentration' => false,
                'ritual' => true,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'кусочек пробки'],
                'classes' => ['cleric', 'druid', 'ranger', 'sorcerer'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 115,
            ],

            // PROTECTION FROM ENERGY
            [
                'slug' => 'protection-from-energy',
                'name' => ['ru' => 'Защита от энергии'],
                'description' => ['ru' => 'Пока заклинание активно, согласное существо, которого вы касаетесь, получает сопротивление к одному виду урона на ваш выбор: звуку, кислоте, огню, холоду или электричеству.'],
                'level' => 3,
                'school' => 'abjuration',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['wizard', 'sorcerer', 'cleric', 'druid', 'ranger'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 116,
            ],

            // DAYLIGHT
            [
                'slug' => 'daylight',
                'name' => ['ru' => 'Дневной свет'],
                'description' => ['ru' => 'Сфера света с радиусом 18 метров расползается от точки, выбранной вами в пределах дистанции. Сфера является ярким светом и излучает тусклый свет ещё на 18 метров. Если выбранная вами точка находится на предмете, который вы несёте или который никто не несёт и не носит, свет исходит из предмета и перемещается с ним. Полное покрытие источника света непрозрачным предметом блокирует свет.'],
                'level' => 3,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => '1 час',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['cleric', 'druid', 'paladin', 'ranger', 'sorcerer'],
                'higher_levels' => null,
                'effects' => ['area' => ['shape' => 'sphere', 'radius' => '18 м']],
                'is_system' => true,
                'sort_order' => 117,
            ],

            // HASTE
            [
                'slug' => 'haste',
                'name' => ['ru' => 'Ускорение'],
                'description' => ['ru' => 'Выберите согласное существо, которое видите в пределах дистанции. Пока заклинание активно, скорость цели удваивается, она получает бонус +2 к КД, совершает с преимуществом спасброски Ловкости и получает дополнительное действие в каждый свой ход. Это действие можно использовать только для Атаки (только одна атака), Рывка, Отхода, Засады или Использования предмета.'],
                'level' => 3,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'стружка из корня солодки'],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 118,
            ],

            // STINKING CLOUD
            [
                'slug' => 'stinking-cloud',
                'name' => ['ru' => 'Зловонное облако'],
                'description' => ['ru' => 'Вы создаёте сферу жёлтого тошнотворного газа с радиусом 6 метров с центром в точке в пределах дистанции. Облако огибает углы и сильно заслоняет область. Облако висит в воздухе, пока заклинание активно. Все существа, находящиеся в облаке в начале своего хода, должны преуспеть в спасброске Телосложения от яда. При провале существо тратит своё действие в этом ходу на рвоту.'],
                'level' => 3,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '27 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'тухлое яйцо или несколько листьев капусты'],
                'classes' => ['wizard', 'sorcerer', 'bard'],
                'higher_levels' => null,
                'effects' => ['save' => ['ability' => 'constitution'], 'area' => ['shape' => 'sphere', 'radius' => '6 м']],
                'is_system' => true,
                'sort_order' => 119,
            ],

            // MELD INTO STONE
            [
                'slug' => 'meld-into-stone',
                'name' => ['ru' => 'Слияние с камнем'],
                'description' => ['ru' => 'Вы входите в каменный предмет или поверхность, достаточно большую, чтобы полностью вместить ваше тело, сливаясь вместе со всем несомым снаряжением с камнем, пока заклинание активно. Вы можете использовать своё перемещение, чтобы выйти из камня туда, откуда вошли, что оканчивает заклинание. В остальном вы не можете перемещаться.'],
                'level' => 3,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => '8 часов',
                'concentration' => false,
                'ritual' => true,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['cleric', 'druid'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 120,
            ],

            // GASEOUS FORM
            [
                'slug' => 'gaseous-form',
                'name' => ['ru' => 'Газообразная форма'],
                'description' => ['ru' => 'Вы превращаете согласное существо, которого касаетесь, вместе со всем, что оно несёт и носит, в туманное облако, пока заклинание активно. Заклинание оканчивается, если хиты существа опускаются до 0. Бестелесное существо не подвержено этому заклинанию. В этой форме скорость цели равна 3 метрам, и она может парить. Цель может входить и занимать пространства других существ.'],
                'level' => 3,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'кусочек марли и клочок дыма'],
                'classes' => ['wizard', 'sorcerer', 'warlock'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 121,
            ],

            // 4TH LEVEL - CIRCLE SPELLS

            // FREEDOM OF MOVEMENT
            [
                'slug' => 'freedom-of-movement',
                'name' => ['ru' => 'Свобода перемещения'],
                'description' => ['ru' => 'Вы касаетесь согласного существа. Пока заклинание активно, на перемещение цели не влияет труднопроходимая местность, и заклинания и другие магические эффекты не могут ни уменьшить скорость цели, ни сделать её парализованной или опутанной. Цель также может потратить 1,5 метра перемещения, чтобы автоматически высвободиться из немагических оков, таких как кандалы или захват существа.'],
                'level' => 4,
                'school' => 'abjuration',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => '1 час',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'кожаный ремешок, обёрнутый вокруг руки или подобной конечности'],
                'classes' => ['cleric', 'druid', 'ranger', 'bard'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 130,
            ],

            // ICE STORM
            [
                'slug' => 'ice-storm',
                'name' => ['ru' => 'Град'],
                'description' => ['ru' => 'Град из твёрдого льда обрушивается на землю в цилиндре с радиусом 6 метров и высотой 12 метров с центром в точке в пределах дистанции. Все существа в цилиндре должны совершить спасбросок Ловкости. Существо получает 2d8 дробящего урона и 4d6 урона холодом при провале или половину этого урона при успехе. Градом область превращается в труднопроходимую местность до конца вашего следующего хода.'],
                'level' => 4,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '90 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'щепотка пыли и несколько капель воды'],
                'classes' => ['wizard', 'sorcerer', 'druid'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 5 уровня или выше, дробящий урон увеличивается на 1d8 за каждый уровень ячейки выше 4.', 'scaling' => ['type' => 'damage', 'dice_per_level' => '1d8', 'base_level' => 4]],
                'effects' => ['damage' => ['dice' => '2d8+4d6', 'type' => 'bludgeoning, cold'], 'save' => ['ability' => 'dexterity', 'on_success' => 'half']],
                'is_system' => true,
                'sort_order' => 131,
            ],

            // CONTROL WATER
            [
                'slug' => 'control-water',
                'name' => ['ru' => 'Власть над водой'],
                'description' => ['ru' => 'Пока заклинание активно, вы контролируете свободно стоящую воду в кубической области со стороной 30 метров. Вы можете выбрать из нескольких эффектов при накладывании: Наводнение, Разделение воды, Перенаправление потока или Водоворот. В каждый свой ход вы можете использовать действие, чтобы повторить тот же эффект или выбрать другой.'],
                'level' => 4,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '90 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'капля воды и щепотка пыли'],
                'classes' => ['wizard', 'cleric', 'druid'],
                'higher_levels' => null,
                'effects' => ['area' => ['shape' => 'cube', 'size' => '30 м']],
                'is_system' => true,
                'sort_order' => 132,
            ],

            // BLIGHT
            [
                'slug' => 'blight',
                'name' => ['ru' => 'Усыхание'],
                'description' => ['ru' => 'Некротическая энергия омывает существо на ваш выбор, которое вы видите в пределах дистанции, истощая в нём влагу и жизненную силу. Цель должна совершить спасбросок Телосложения. Цель получает 8d8 некротического урона при провале или половину этого урона при успехе. Это заклинание не действует на нежить и конструктов. Растение совершает спасбросок с помехой и получает максимальный урон от заклинания.'],
                'level' => 4,
                'school' => 'necromancy',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['wizard', 'sorcerer', 'druid', 'warlock'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 5 уровня или выше, урон увеличивается на 1d8 за каждый уровень ячейки выше 4.', 'scaling' => ['type' => 'damage', 'dice_per_level' => '1d8', 'base_level' => 4]],
                'effects' => ['damage' => ['dice' => '8d8', 'type' => 'necrotic'], 'save' => ['ability' => 'constitution', 'on_success' => 'half']],
                'is_system' => true,
                'sort_order' => 133,
            ],

            // HALLUCINATORY TERRAIN
            [
                'slug' => 'hallucinatory-terrain',
                'name' => ['ru' => 'Мираж'],
                'description' => ['ru' => 'Вы заставляете природную местность в кубе со стороной 45 метров выглядеть, звучать и пахнуть, как другой вид природной местности. Открытое поле или дорога может выглядеть как болото, холм, трещина или другая труднопроходимая или непроходимая местность. Пруд может выглядеть как травянистый луг, обрыв — как пологий склон, а скалистое ущелье — как широкая ровная дорога.'],
                'level' => 4,
                'school' => 'illusion',
                'casting_time' => '10 минут',
                'range' => '90 м',
                'duration' => '24 часа',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'камень, веточка и кусочек зелёного растения'],
                'classes' => ['wizard', 'bard', 'druid', 'warlock'],
                'higher_levels' => null,
                'effects' => ['area' => ['shape' => 'cube', 'size' => '45 м']],
                'is_system' => true,
                'sort_order' => 134,
            ],

            // DIVINATION
            [
                'slug' => 'divination',
                'name' => ['ru' => 'Предсказание'],
                'description' => ['ru' => 'Ваша магия и приношение помещают вас в контакт с богом или его слугами. Вы задаёте один вопрос, касающийся определённой цели, события или активности, которые произойдут в пределах 7 дней. Мастер даёт правдивый ответ. Ответ может быть короткой фразой, загадкой или знамением.'],
                'level' => 4,
                'school' => 'divination',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => true,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'благовония и жертвенное приношение, уместное для вашей религии, стоящие вместе как минимум 25 зм, расходуемые заклинанием', 'material_cost' => 25, 'material_consumed' => true],
                'classes' => ['cleric', 'druid'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 135,
            ],

            // STONE SHAPE
            [
                'slug' => 'stone-shape',
                'name' => ['ru' => 'Изменение формы камня'],
                'description' => ['ru' => 'Вы касаетесь каменного предмета среднего размера или меньше, или каменной секции размерами не больше 1,5 метра в каждом измерении, и придаёте ему любую угодную вам форму. Так, например, вы можете превратить большой камень в оружие, идола или сундук, или создать небольшой проход через стену, если стена тоньше 1,5 метра.'],
                'level' => 4,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'мягкая глина, которую нужно приблизительно обработать в нужную форму'],
                'classes' => ['wizard', 'cleric', 'druid'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 136,
            ],

            // STONESKIN
            [
                'slug' => 'stoneskin',
                'name' => ['ru' => 'Каменная кожа'],
                'description' => ['ru' => 'Это заклинание превращает плоть согласного существа, которого вы касаетесь, в камень. Пока заклинание активно, цель получает сопротивление немагическому дробящему, колющему и рубящему урону.'],
                'level' => 4,
                'school' => 'abjuration',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'алмазная пыль стоимостью 100 зм, расходуемая заклинанием', 'material_cost' => 100, 'material_consumed' => true],
                'classes' => ['wizard', 'sorcerer', 'druid', 'ranger'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 137,
            ],

            // LOCATE CREATURE
            [
                'slug' => 'locate-creature',
                'name' => ['ru' => 'Поиск существа'],
                'description' => ['ru' => 'Опишите или назовите существо, знакомое вам. Вы чувствуете направление к местонахождению существа, пока оно находится в пределах 300 метров от вас. Если существо перемещается, вы знаете направление его движения. Заклинание может найти конкретное знакомое вам существо или ближайшее существо определённого вида, если вы видели такое хотя бы раз.'],
                'level' => 4,
                'school' => 'divination',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'кусочек меха ищейки'],
                'classes' => ['wizard', 'cleric', 'druid', 'bard', 'paladin', 'ranger'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 138,
            ],

            // 5TH LEVEL - CIRCLE SPELLS

            // COMMUNE WITH NATURE
            [
                'slug' => 'commune-with-nature',
                'name' => ['ru' => 'Общение с природой'],
                'description' => ['ru' => 'Вы на короткое время становитесь единым целым с природой и получаете знания об окружающей территории. На открытом воздухе заклинание даёт вам знания о местности в пределах 4,5 километров. В пещерах и других подземных местах радиус ограничен 90 метрами. Вы мгновенно получаете знания о трёх фактах на ваш выбор: местности и водоёмах, преобладающих растениях, животных или народах, могущественных элементалях и т.д.'],
                'level' => 5,
                'school' => 'divination',
                'casting_time' => '1 минута',
                'range' => 'На себя',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => true,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['druid', 'ranger'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 140,
            ],

            // TREE STRIDE
            [
                'slug' => 'tree-stride',
                'name' => ['ru' => 'Древесный путь'],
                'description' => ['ru' => 'Вы получаете способность входить в дерево и перемещаться изнутри него к другому дереву того же вида в пределах 150 метров. Оба дерева должны быть живыми и как минимум такого же размера, как и вы. Вы должны использовать 1,5 метра перемещения, чтобы войти в дерево. Вы мгновенно узнаёте местонахождение всех остальных деревьев того же вида в пределах 150 метров и можете либо выйти в том же дереве, либо переместиться в другое.'],
                'level' => 5,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['druid', 'ranger'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 141,
            ],

            // INSECT PLAGUE
            [
                'slug' => 'insect-plague',
                'name' => ['ru' => 'Нашествие насекомых'],
                'description' => ['ru' => 'Роящиеся кусающие саранча заполняет сферу с радиусом 6 метров с центром в точке, выбранной вами в пределах дистанции. Сфера огибает углы. Сфера существует, пока заклинание активно, и её область является слегка заслонённой. Область сферы является труднопроходимой местностью. Когда область появляется, все находящиеся в ней существа должны совершить спасбросок Телосложения. Существо получает 4d10 колющего урона при провале или половину при успехе.'],
                'level' => 5,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '90 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'несколько кусочков сахара, зёрен или жира'],
                'classes' => ['cleric', 'druid', 'sorcerer'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 6 уровня или выше, урон увеличивается на 1d10 за каждый уровень ячейки выше 5.', 'scaling' => ['type' => 'damage', 'dice_per_level' => '1d10', 'base_level' => 5]],
                'effects' => ['damage' => ['dice' => '4d10', 'type' => 'piercing'], 'save' => ['ability' => 'constitution', 'on_success' => 'half'], 'area' => ['shape' => 'sphere', 'radius' => '6 м']],
                'is_system' => true,
                'sort_order' => 142,
            ],

            // WALL OF STONE
            [
                'slug' => 'wall-of-stone',
                'name' => ['ru' => 'Каменная стена'],
                'description' => ['ru' => 'В точке, выбранной вами в пределах дистанции, из твёрдой поверхности появляется немагическая каменная стена. Стена состоит из десяти панелей 3×3 метра. Каждая панель должна граничить как минимум с одной другой панелью. Если стена пересекает пространство существа, когда появляется, существо выталкивается на одну сторону стены по вашему выбору. Существо может совершить спасбросок Ловкости, находясь на выбранной им стороне.'],
                'level' => 5,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'небольшой блок гранита'],
                'classes' => ['wizard', 'sorcerer', 'druid'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 143,
            ],

            // DREAM
            [
                'slug' => 'dream',
                'name' => ['ru' => 'Сон'],
                'description' => ['ru' => 'Это заклинание формирует сон существа. Выберите существо, известное вам, в качестве цели. Цель должна быть на том же плане существования, что и вы. Вы можете формировать образ посланника, который выглядит и звучит как угодно. Посланник может передать сообщение любой длины цели и может слышать её ответы, которые она посылает во сне.'],
                'level' => 5,
                'school' => 'illusion',
                'casting_time' => '1 минута',
                'range' => 'Особая',
                'duration' => '8 часов',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'горсть песка, капля чернил и перо, выдернутое из крыла спящей птицы'],
                'classes' => ['wizard', 'bard', 'warlock'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 144,
            ],

            // PASSWALL
            [
                'slug' => 'passwall',
                'name' => ['ru' => 'Проход'],
                'description' => ['ru' => 'В точке, выбранной вами в пределах дистанции, на деревянной, гипсовой или каменной поверхности (такой как стена, потолок или пол) появляется проход, существующий, пока заклинание активно. Вы выбираете размер прохода: до 1,5 метра в ширину, 2,4 метра в высоту и 6 метров в глубину. Проход не создаёт нестабильности в окружающей конструкции. Когда проход исчезает, существа внутри него безопасно выталкиваются.'],
                'level' => 5,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => '1 час',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'щепотка кунжутных семян'],
                'classes' => ['wizard'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 145,
            ],

            // CLOUDKILL
            [
                'slug' => 'cloudkill',
                'name' => ['ru' => 'Облако смерти'],
                'description' => ['ru' => 'Вы создаёте сферу ядовитого жёлто-зелёного тумана с радиусом 6 метров с центром в точке, выбранной вами в пределах дистанции. Туман огибает углы. Он существует, пока заклинание активно, или пока сильный ветер не развеет его. Его область сильно заслонена. Когда существо впервые за ход входит в область заклинания или начинает там ход, оно должно совершить спасбросок Телосложения. Существо получает 5d8 урона ядом при провале или половину при успехе.'],
                'level' => 5,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['wizard', 'sorcerer'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 6 уровня или выше, урон увеличивается на 1d8 за каждый уровень ячейки выше 5.', 'scaling' => ['type' => 'damage', 'dice_per_level' => '1d8', 'base_level' => 5]],
                'effects' => ['damage' => ['dice' => '5d8', 'type' => 'poison'], 'save' => ['ability' => 'constitution', 'on_success' => 'half'], 'area' => ['shape' => 'sphere', 'radius' => '6 м']],
                'is_system' => true,
                'sort_order' => 146,
            ],

            // CONJURE ELEMENTAL
            [
                'slug' => 'conjure-elemental',
                'name' => ['ru' => 'Призыв элементаля'],
                'description' => ['ru' => 'Вы призываете прислужника-элементаля. Выберите область воздуха, земли, огня или воды, заполняющую куб с длиной ребра 3 метра в пределах дистанции. В незанятом пространстве в пределах 3 метров от этой области появляется элементаль с показателем опасности 5 или ниже, подходящий для выбранной области. Элементаль исчезает, когда его хиты опускаются до 0 или когда заклинание оканчивается. Элементаль дружественен к вам и вашим спутникам.'],
                'level' => 5,
                'school' => 'conjuration',
                'casting_time' => '1 минута',
                'range' => '27 м',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'горящие благовония для воздуха, мягкая глина для земли, сера и фосфор для огня, или вода и песок для воды'],
                'classes' => ['wizard', 'druid'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 6 уровня или выше, показатель опасности увеличивается на 1 за каждый уровень ячейки выше 5.'],
                'effects' => null,
                'is_system' => true,
                'sort_order' => 147,
            ],

            // SCRYING
            [
                'slug' => 'scrying',
                'name' => ['ru' => 'Наблюдение'],
                'description' => ['ru' => 'Вы можете видеть и слышать конкретное существо, выбранное вами, которое находится на том же плане существования. Цель должна совершить спасбросок Мудрости, модифицируемый тем, насколько хорошо вы знаете цель и какая связь у вас с ней есть. При успехе цель не подвергается воздействию, и вы не можете использовать это заклинание против неё в течение 24 часов.'],
                'level' => 5,
                'school' => 'divination',
                'casting_time' => '10 минут',
                'range' => 'На себя',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'фокусировка стоимостью как минимум 1000 зм, такая как хрустальный шар, серебряное зеркало или чаша со святой водой', 'material_cost' => 1000],
                'classes' => ['wizard', 'cleric', 'druid', 'bard', 'warlock'],
                'higher_levels' => null,
                'effects' => ['save' => ['ability' => 'wisdom']],
                'is_system' => true,
                'sort_order' => 148,
            ],

            // ==========================================
            // CIRCLE OF WILDFIRE SPELLS
            // ==========================================

            // BURNING HANDS (1st level)
            [
                'slug' => 'burning-hands',
                'name' => ['ru' => 'Огненные ладони'],
                'description' => ['ru' => 'Когда вы складываете руки с соприкасающимися большими пальцами и разведёнными пальцами, из ваших вытянутых кончиков пальцев вырывается тонкий слой пламени. Все существа в 4,5-метровом конусе должны совершить спасбросок Ловкости. Существо получает 3d6 урона огнём при провале, или половину этого урона при успехе. Огонь поджигает все легковоспламеняющиеся предметы в области, которые никто не несёт и не носит.'],
                'level' => 1,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => 'На себя (конус 4,5 м)',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['sorcerer', 'wizard'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 2 уровня или выше, урон увеличивается на 1d6 за каждый уровень ячейки выше 1.', 'scaling' => ['type' => 'damage', 'dice_per_level' => '1d6', 'base_level' => 1]],
                'effects' => ['damage' => ['dice' => '3d6', 'type' => 'fire'], 'save' => ['ability' => 'dexterity', 'on_success' => 'half'], 'area' => ['shape' => 'cone', 'length' => '4,5 м']],
                'is_system' => true,
                'sort_order' => 149,
            ],

            // FLAMING SPHERE (2nd level)
            [
                'slug' => 'flaming-sphere',
                'name' => ['ru' => 'Пылающий шар'],
                'description' => ['ru' => 'Сфера огня диаметром 1,5 метра появляется в незанятом пространстве на ваш выбор в пределах дистанции и существует, пока заклинание активно. Все существа, оканчивающие ход в пределах 1,5 метра от сферы, должны совершить спасбросок Ловкости. Существо получает 2d6 урона огнём при провале, или половину этого урона при успехе. Бонусным действием вы можете переместить сферу на 9 метров. Если вы наталкиваете её на существо, оно должно совершить спасбросок и получает урон от сферы.'],
                'level' => 2,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'кусочек сала, щепотка серы и пыль железного порошка'],
                'classes' => ['druid', 'wizard'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 3 уровня или выше, урон увеличивается на 1d6 за каждый уровень ячейки выше 2.', 'scaling' => ['type' => 'damage', 'dice_per_level' => '1d6', 'base_level' => 2]],
                'effects' => ['damage' => ['dice' => '2d6', 'type' => 'fire'], 'save' => ['ability' => 'dexterity', 'on_success' => 'half']],
                'is_system' => true,
                'sort_order' => 150,
            ],

            // SCORCHING RAY (2nd level)
            [
                'slug' => 'scorching-ray',
                'name' => ['ru' => 'Палящий луч'],
                'description' => ['ru' => 'Вы создаёте три огненных луча и направляете их на цели в пределах дистанции. Это может быть одна или несколько целей. Совершите для каждого луча дальнобойную атаку заклинанием. При попадании цель получает 2d6 урона огнём.'],
                'level' => 2,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['sorcerer', 'wizard'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 3 уровня или выше, вы создаёте один дополнительный луч за каждый уровень ячейки выше 2.', 'scaling' => ['type' => 'targets', 'per_level' => 1, 'base_level' => 2]],
                'effects' => ['damage' => ['dice' => '2d6', 'type' => 'fire']],
                'is_system' => true,
                'sort_order' => 151,
            ],

            // REVIVIFY (3rd level)
            [
                'slug' => 'revivify',
                'name' => ['ru' => 'Возрождение'],
                'description' => ['ru' => 'Вы касаетесь существа, которое умерло в течение последней минуты. Это существо возвращается к жизни с 1 хитом. Это заклинание не может оживлять существ, умерших от старости, а также не восстанавливает отсутствующие части тела.'],
                'level' => 3,
                'school' => 'necromancy',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'бриллианты стоимостью 300 зм, расходуемые заклинанием', 'material_cost' => 300, 'material_consumed' => true],
                'classes' => ['cleric', 'paladin'],
                'higher_levels' => null,
                'effects' => ['healing' => ['dice' => '1']],
                'is_system' => true,
                'sort_order' => 152,
            ],

            // AURA OF LIFE (4th level)
            [
                'slug' => 'aura-of-life',
                'name' => ['ru' => 'Аура жизни'],
                'description' => ['ru' => 'Исходящая от вас живительная энергия исходит аурой с радиусом 9 метров. Пока заклинание активно, аура перемещается вместе с вами. Все не враждебные существа в ауре (включая вас) имеют сопротивление к некротическому урону, и их максимум хитов нельзя уменьшить. Кроме того, не враждебное живое существо восстанавливает 1 хит, когда начинает ход в ауре с 0 хитов.'],
                'level' => 4,
                'school' => 'abjuration',
                'casting_time' => '1 действие',
                'range' => 'На себя (радиус 9 м)',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => false, 'material' => false],
                'classes' => ['paladin'],
                'higher_levels' => null,
                'effects' => ['area' => ['shape' => 'sphere', 'radius' => '9 м']],
                'is_system' => true,
                'sort_order' => 153,
            ],

            // FIRE SHIELD (4th level)
            [
                'slug' => 'fire-shield',
                'name' => ['ru' => 'Огненный щит'],
                'description' => ['ru' => 'Тонкое покрывало из пламени окутывает ваше тело, пока заклинание активно, излучая яркий свет в радиусе 3 метров и тусклый свет в пределах ещё 3 метров. Вы можете досрочно окончить заклинание действием. Пламя даёт вам тёплый или холодный щит, на ваш выбор. Тёплый щит даёт сопротивление к урону холодом. Холодный щит даёт сопротивление к урону огнём. Кроме того, когда существо в пределах 1,5 метра от вас попадает по вам рукопашной атакой, щит извергает пламя. Атакующий получает 2d8 урона огнём от тёплого щита или холодом от холодного щита.'],
                'level' => 4,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => '10 минут',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'немного фосфора или светлячок'],
                'classes' => ['wizard'],
                'higher_levels' => null,
                'effects' => ['damage' => ['dice' => '2d8', 'type' => 'fire']],
                'is_system' => true,
                'sort_order' => 154,
            ],

            // FLAME STRIKE (5th level)
            [
                'slug' => 'flame-strike',
                'name' => ['ru' => 'Огненный столп'],
                'description' => ['ru' => 'Вертикальный столб божественного огня обрушивается с небес в указанное вами место. Все существа в цилиндре с радиусом 3 метра и высотой 12 метров с центром в точке в пределах дистанции должны совершить спасбросок Ловкости. Существо получает 4d6 урона огнём и 4d6 урона излучением при провале, или половину этого урона при успехе.'],
                'level' => 5,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'щепотка серы'],
                'classes' => ['cleric'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 6 уровня или выше, урон огнём или урон излучением (на ваш выбор) увеличивается на 1d6 за каждый уровень ячейки выше 5.', 'scaling' => ['type' => 'damage', 'dice_per_level' => '1d6', 'base_level' => 5]],
                'effects' => ['damage' => ['dice' => '4d6+4d6', 'type' => 'fire, radiant'], 'save' => ['ability' => 'dexterity', 'on_success' => 'half'], 'area' => ['shape' => 'cylinder', 'radius' => '3 м', 'height' => '12 м']],
                'is_system' => true,
                'sort_order' => 155,
            ],

            // MASS CURE WOUNDS (5th level)
            [
                'slug' => 'mass-cure-wounds',
                'name' => ['ru' => 'Массовое лечение ран'],
                'description' => ['ru' => 'Волна целительной энергии исходит из точки по вашему выбору в пределах дистанции. Выберите до шести существ в сфере с радиусом 9 метров с центром в этой точке. Каждая цель восстанавливает количество хитов, равное 3d8 + ваш модификатор базовой характеристики. Это заклинание не оказывает эффекта на нежить и конструктов.'],
                'level' => 5,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['bard', 'cleric', 'druid'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 6 уровня или выше, лечение увеличивается на 1d8 за каждый уровень ячейки выше 5.', 'scaling' => ['type' => 'healing', 'dice_per_level' => '1d8', 'base_level' => 5]],
                'effects' => ['healing' => ['dice' => '3d8'], 'area' => ['shape' => 'sphere', 'radius' => '9 м']],
                'is_system' => true,
                'sort_order' => 156,
            ],

            // ==================== CIRCLE OF SPORES SPELLS ====================

            // CHILL TOUCH (Cantrip) - for Circle of Spores
            [
                'slug' => 'chill-touch',
                'name' => ['ru' => 'Леденящее прикосновение'],
                'description' => ['ru' => 'Вы создаёте призрачную руку скелета в пространстве существа, находящегося в пределах дистанции. Совершите дальнобойную атаку заклинанием по существу, чтобы окутать его могильным холодом. При попадании цель получает 1d8 некротического урона и не может восстанавливать хиты до начала вашего следующего хода. Если вы попадаете по нежити, она также совершает с помехой броски атаки по вам до конца вашего следующего хода.'],
                'level' => 0,
                'school' => 'necromancy',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => '1 раунд',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['sorcerer', 'warlock', 'wizard'],
                'higher_levels' => null,
                'cantrip_scaling' => ['5' => '2d8', '11' => '3d8', '17' => '4d8'],
                'effects' => ['damage' => ['dice' => '1d8', 'type' => 'necrotic'], 'attack' => ['type' => 'ranged']],
                'is_system' => true,
                'sort_order' => 157,
            ],

            // BLINDNESS/DEAFNESS (2nd level) - for Circle of Spores
            [
                'slug' => 'blindness-deafness',
                'name' => ['ru' => 'Слепота/Глухота'],
                'description' => ['ru' => 'Вы можете ослепить или оглушить противника. Выберите одно существо, которое вы можете видеть в пределах дистанции, чтобы оно совершило спасбросок Телосложения. При провале цель становится ослеплённой или оглушённой (на ваш выбор) на время действия заклинания. В конце каждого своего хода цель может совершать спасбросок Телосложения. При успехе заклинание оканчивается.'],
                'level' => 2,
                'school' => 'necromancy',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => '1 минута',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => false, 'material' => false],
                'classes' => ['bard', 'cleric', 'sorcerer', 'wizard'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 3 уровня или выше, вы можете нацелить одно дополнительное существо за каждый уровень ячейки выше 2.', 'scaling' => ['type' => 'targets', 'targets_per_level' => 1, 'base_level' => 2]],
                'effects' => ['save' => ['ability' => 'constitution', 'on_success' => 'none']],
                'is_system' => true,
                'sort_order' => 158,
            ],

            // GENTLE REPOSE (2nd level) - for Circle of Spores
            [
                'slug' => 'gentle-repose',
                'name' => ['ru' => 'Нетленные останки'],
                'description' => ['ru' => 'Вы касаетесь трупа или другого останка. На время действия заклинания цель защищена от разложения и не может стать нежитью. Заклинание также увеличивает время на оживление цели, так как дни, проведённые под действием этого заклинания, не учитываются при определении времени, прошедшего со смерти.'],
                'level' => 2,
                'school' => 'necromancy',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => '10 дней',
                'concentration' => false,
                'ritual' => true,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'щепотка соли и по одной медной монете на каждый глаз трупа, которые должны лежать на глазах на время действия заклинания'],
                'classes' => ['cleric', 'wizard'],
                'higher_levels' => null,
                'effects' => null,
                'is_system' => true,
                'sort_order' => 159,
            ],

            // ANIMATE DEAD (3rd level) - for Circle of Spores
            [
                'slug' => 'animate-dead',
                'name' => ['ru' => 'Оживление мертвеца'],
                'description' => ['ru' => 'Это заклинание создаёт слугу нежить. Выберите груду костей или труп гуманоида Среднего или Маленького размера в пределах дистанции. Ваше заклинание наделяет цель подобием жизни, поднимая её как существо-нежить. Цель становится скелетом, если вы выбрали кости, или зомби, если вы выбрали труп. В каждый ваш ход вы можете бонусным действием мысленно командовать любым существом, которое вы создали этим заклинанием.'],
                'level' => 3,
                'school' => 'necromancy',
                'casting_time' => '1 минута',
                'range' => '3 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'капля крови, кусок плоти и щепотка костной пыли'],
                'classes' => ['cleric', 'wizard'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 4 уровня или выше, вы оживляете или восстанавливаете контроль над двумя дополнительными существами за каждый уровень ячейки выше 3.', 'scaling' => ['type' => 'targets', 'targets_per_level' => 2, 'base_level' => 3]],
                'effects' => ['summon' => ['type' => 'undead']],
                'is_system' => true,
                'sort_order' => 160,
            ],

            // CONFUSION (4th level) - for Circle of Spores
            [
                'slug' => 'confusion',
                'name' => ['ru' => 'Смятение'],
                'description' => ['ru' => 'Это заклинание обрушивает на разум атакующих психические образы, заставляя их действовать нерационально. Все существа в сфере с радиусом 3 метра с центром в точке, выбранной вами в пределах дистанции, должны совершить спасбросок Мудрости. Существо, провалившее спасбросок, подвергается действию этого заклинания. Находящаяся под воздействием цель не может совершать реакции и должна в начале каждого своего хода бросать d10, чтобы определить своё поведение на этот ход.'],
                'level' => 4,
                'school' => 'enchantment',
                'casting_time' => '1 действие',
                'range' => '27 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'три ореховые скорлупы'],
                'classes' => ['bard', 'druid', 'sorcerer', 'wizard'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 5 уровня или выше, радиус сферы увеличивается на 1,5 метра за каждый уровень ячейки выше 4.', 'scaling' => ['type' => 'area', 'radius_per_level' => '1.5 м', 'base_level' => 4]],
                'effects' => ['save' => ['ability' => 'wisdom', 'on_success' => 'none'], 'area' => ['shape' => 'sphere', 'radius' => '3 м']],
                'is_system' => true,
                'sort_order' => 161,
            ],

            // CONTAGION (5th level) - for Circle of Spores
            [
                'slug' => 'contagion',
                'name' => ['ru' => 'Заражение'],
                'description' => ['ru' => 'Ваше прикосновение насылает болезнь. Совершите рукопашную атаку заклинанием по существу в пределах досягаемости. При попадании вы насылаете на существо одну болезнь на ваш выбор. В конце каждого своего хода цель должна совершать спасбросок Телосложения. После трёх провалов болезнь действует весь период, и существо прекращает совершать спасброски. После трёх успехов существо выздоравливает и заклинание оканчивается.'],
                'level' => 5,
                'school' => 'necromancy',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => '7 дней',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['cleric', 'druid'],
                'higher_levels' => null,
                'effects' => ['attack' => ['type' => 'melee'], 'save' => ['ability' => 'constitution', 'on_success' => 'none']],
                'is_system' => true,
                'sort_order' => 162,
            ],
        ];
    }
}
