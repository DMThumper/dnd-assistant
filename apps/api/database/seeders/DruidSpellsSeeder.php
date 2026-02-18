<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\Spell;
use Illuminate\Database\Seeder;

class DruidSpellsSeeder extends Seeder
{
    public function run(): void
    {
        $eberron = Setting::where('slug', 'eberron')->first();

        $spells = $this->getDruidSpells();

        foreach ($spells as $spellData) {
            $spell = Spell::updateOrCreate(
                ['slug' => $spellData['slug']],
                $spellData
            );

            if ($eberron) {
                $spell->settings()->syncWithoutDetaching([$eberron->id]);
            }
        }

        $this->command->info('Druid & Ranger spells seeded: ' . count($spells));
    }

    private function getDruidSpells(): array
    {
        return [
            // ==========================================
            // DRUID CANTRIPS
            // ==========================================
            [
                'slug' => 'druidcraft',
                'name' => ['ru' => 'Искусство друидов'],
                'description' => ['ru' => 'Шепча духам природы, вы создаёте один из следующих эффектов в пределах дистанции: создаёте крошечный безвредный сенсорный эффект, предсказывающий погоду на ближайшие 24 часа; заставляете цветок раскрыться, семя прорасти, бутон расцвести; создаёте мгновенный безвредный сенсорный эффект (падающие листья, порыв ветра, звуки животных); мгновенно зажигаете или тушите свечу, факел, небольшой костёр.'],
                'level' => 0,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['druid'],
                'is_system' => true,
            ],
            [
                'slug' => 'produce-flame',
                'name' => ['ru' => 'Сотворение пламени'],
                'description' => ['ru' => 'Мерцающее пламя появляется в вашей руке. Оно остаётся там, пока заклинание активно, не причиняя вам вреда. Пламя испускает яркий свет в радиусе 3 метров и тусклый свет в пределах ещё 3 метров. Заклинание оканчивается, если вы оканчиваете его действием или накладываете его повторно. Вы можете также атаковать пламенем. Совершите дальнобойную атаку заклинанием по цели в пределах 9 метров. При попадании цель получает 1d8 урона огнём.'],
                'level' => 0,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => '10 минут',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['druid'],
                'cantrip_scaling' => ['5' => '2d8', '11' => '3d8', '17' => '4d8'],
                'effects' => ['damage' => ['dice' => '1d8', 'type' => 'fire']],
                'is_system' => true,
            ],
            [
                'slug' => 'shillelagh',
                'name' => ['ru' => 'Дубинка'],
                'description' => ['ru' => 'Древесина дубинки или посоха, который вы держите, наполняется силой природы. Пока заклинание активно, вы можете использовать свою базовую характеристику вместо Силы для бросков атаки и урона рукопашными атаками этим оружием, и кость урона оружия становится d8. Оружие также становится магическим, если ещё не является таковым.'],
                'level' => 0,
                'school' => 'transmutation',
                'casting_time' => '1 бонусное действие',
                'range' => 'Касание',
                'duration' => '1 минута',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'омела и лист клевера'],
                'classes' => ['druid'],
                'is_system' => true,
            ],
            [
                'slug' => 'thorn-whip',
                'name' => ['ru' => 'Терновый кнут'],
                'description' => ['ru' => 'Вы создаёте длинный лозоподобный кнут, покрытый шипами, который хлещет по вашей команде по существу в пределах дистанции. Совершите рукопашную атаку заклинанием по цели. При попадании существо получает 1d6 колющего урона, и если существо имеет размер Большой или меньше, вы притягиваете его на 3 метра к себе.'],
                'level' => 0,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '9 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'стебель растения с шипами'],
                'classes' => ['druid', 'artificer'],
                'cantrip_scaling' => ['5' => '2d6', '11' => '3d6', '17' => '4d6'],
                'effects' => ['damage' => ['dice' => '1d6', 'type' => 'piercing']],
                'is_system' => true,
            ],
            [
                'slug' => 'guidance',
                'name' => ['ru' => 'Руководство'],
                'description' => ['ru' => 'Вы касаетесь одного согласного существа. Один раз до окончания заклинания цель может бросить d4 и добавить выпавшее число к одной проверке характеристики на свой выбор. Она может бросить эту кость до или после совершения проверки. После этого заклинание оканчивается.'],
                'level' => 0,
                'school' => 'divination',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['cleric', 'druid', 'artificer'],
                'is_system' => true,
            ],

            // ==========================================
            // 1ST LEVEL - DRUID/RANGER
            // ==========================================
            [
                'slug' => 'entangle',
                'name' => ['ru' => 'Опутывание'],
                'description' => ['ru' => 'Цепкие лозы и плети появляются из земли в квадрате со стороной 6 метров с центром в указанной вами точке в пределах дистанции. Эти растения на время действия заклинания превращают область в труднопроходимую местность. Существа, находящиеся в области при накладывании заклинания, должны преуспеть в спасброске Силы, иначе станут опутанными растениями до окончания заклинания.'],
                'level' => 1,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '27 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['druid', 'ranger'],
                'effects' => ['save' => ['ability' => 'strength'], 'area' => ['shape' => 'square', 'side' => '6 м']],
                'is_system' => true,
            ],
            [
                'slug' => 'goodberry',
                'name' => ['ru' => 'Чудо-ягоды'],
                'description' => ['ru' => 'В вашей руке появляется до десяти ягод, наполненных магией. Существо может действием съесть одну ягоду. Съедание ягоды восстанавливает 1 хит и обеспечивает достаточно пищи на весь день. Ягоды теряют свою силу, если их не съели в течение 24 часов после накладывания заклинания.'],
                'level' => 1,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'веточка омелы'],
                'classes' => ['druid', 'ranger'],
                'is_system' => true,
            ],
            [
                'slug' => 'speak-with-animals',
                'name' => ['ru' => 'Разговор с животными'],
                'description' => ['ru' => 'Вы получаете способность понимать зверей и общаться с ними на время действия заклинания. Знания и осознание многих зверей ограничены их разумом, но они как минимум могут дать вам информацию о ближайших местностях и монстрах, а также о том, что они ощущали в течение прошлого дня.'],
                'level' => 1,
                'school' => 'divination',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => '10 минут',
                'concentration' => false,
                'ritual' => true,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['bard', 'druid', 'ranger'],
                'is_system' => true,
            ],
            [
                'slug' => 'hunters-mark',
                'name' => ['ru' => 'Метка охотника'],
                'description' => ['ru' => 'Вы выбираете существо, которое видите в пределах дистанции, и мистически помечаете его как свою добычу. Пока заклинание активно, вы наносите цели дополнительный урон 1d6 каждый раз, когда попадаете по ней атакой оружием, и у вас есть преимущество на все проверки Мудрости (Выживание) и Мудрости (Внимательность) для поиска этого существа.'],
                'level' => 1,
                'school' => 'divination',
                'casting_time' => '1 бонусное действие',
                'range' => '27 м',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => false, 'material' => false],
                'classes' => ['ranger'],
                'higher_levels' => ['description' => 'При использовании ячейки 3-4 уровня концентрация до 8 часов. При использовании ячейки 5+ уровня — до 24 часов.'],
                'effects' => ['damage' => ['dice' => '1d6', 'type' => 'weapon']],
                'is_system' => true,
            ],
            [
                'slug' => 'healing-word',
                'name' => ['ru' => 'Лечащее слово'],
                'description' => ['ru' => 'Существо на ваш выбор, которое вы видите в пределах дистанции, восстанавливает количество хитов, равное 1d4 + ваш модификатор базовой характеристики. Это заклинание не оказывает эффекта на нежить и конструктов.'],
                'level' => 1,
                'school' => 'evocation',
                'casting_time' => '1 бонусное действие',
                'range' => '18 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => false, 'material' => false],
                'classes' => ['bard', 'cleric', 'druid'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 2 уровня или выше, лечение увеличивается на 1d4 за каждый уровень ячейки выше первого.'],
                'is_system' => true,
            ],

            // ==========================================
            // 2ND LEVEL - DRUID/RANGER
            // ==========================================
            [
                'slug' => 'moonbeam',
                'name' => ['ru' => 'Лунный луч'],
                'description' => ['ru' => 'Бледный серебристый луч сияет в цилиндре с радиусом 1,5 метра и высотой 12 метров с центром в указанной вами точке. Когда существо впервые за ход входит в область заклинания или начинает там ход, оно окутывается призрачным пламенем и должно совершить спасбросок Телосложения. Оно получает 2d10 урона излучением при провале или половину при успехе.'],
                'level' => 2,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Концентрация, до 1 минуты',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'несколько семян лунного растения и кусочек опалового минерала'],
                'classes' => ['druid'],
                'higher_levels' => ['description' => 'Если вы накладываете это заклинание, используя ячейку 3 уровня или выше, урон увеличивается на 1d10 за каждый уровень ячейки выше 2.'],
                'effects' => ['damage' => ['dice' => '2d10', 'type' => 'radiant'], 'save' => ['ability' => 'constitution', 'on_success' => 'half']],
                'is_system' => true,
            ],
            [
                'slug' => 'barkskin',
                'name' => ['ru' => 'Дубовая кора'],
                'description' => ['ru' => 'Вы касаетесь согласного существа. Пока заклинание активно, кожа существа приобретает грубую текстуру коры, и КД существа не может быть ниже 16, вне зависимости от надетых на него доспехов.'],
                'level' => 2,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => 'Касание',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'горсть дубовой коры'],
                'classes' => ['druid', 'ranger'],
                'is_system' => true,
            ],
            [
                'slug' => 'pass-without-trace',
                'name' => ['ru' => 'Бесследное передвижение'],
                'description' => ['ru' => 'Вас окутывает покров теней и тишины, скрывая вас и ваших спутников от обнаружения. Пока заклинание активно, все существа, выбранные вами в пределах 9 метров от вас (включая вас), получают бонус +10 к проверкам Ловкости (Скрытность) и не могут отслеживаться немагическими средствами.'],
                'level' => 2,
                'school' => 'abjuration',
                'casting_time' => '1 действие',
                'range' => 'На себя',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'пепел от сожжённого листа омелы и веточка ели'],
                'classes' => ['druid', 'ranger'],
                'is_system' => true,
            ],
            [
                'slug' => 'spike-growth',
                'name' => ['ru' => 'Шипы'],
                'description' => ['ru' => 'Земля в радиусе 6 метров с центром в точке в пределах дистанции покрывается шипами и колючками. Область становится труднопроходимой местностью на время действия заклинания. Когда существо входит или перемещается по области, оно получает 2d4 колющего урона за каждые 1,5 метра перемещения. Трансформация земли замаскирована и выглядит естественно.'],
                'level' => 2,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '45 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'семь острых шипов или семь заострённых веток'],
                'classes' => ['druid', 'ranger'],
                'effects' => ['damage' => ['dice' => '2d4', 'type' => 'piercing'], 'area' => ['shape' => 'circle', 'radius' => '6 м']],
                'is_system' => true,
            ],

            // ==========================================
            // 3RD LEVEL - DRUID/RANGER
            // ==========================================
            [
                'slug' => 'call-lightning',
                'name' => ['ru' => 'Призыв молнии'],
                'description' => ['ru' => 'Грозовое облако появляется в форме цилиндра высотой 3 метра и радиусом 18 метров с центром в точке прямо над вами. Заклинание проваливается, если вы не видите точку в воздухе, где должно появиться облако. Когда вы накладываете заклинание, выберите видимую точку под облаком. Молния бьёт в эту точку. Все существа в пределах 1,5 метра от неё должны совершить спасбросок Ловкости, получая 3d10 урона электричеством при провале, или половину при успехе.'],
                'level' => 3,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '36 м',
                'duration' => 'Концентрация, до 10 минут',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['druid'],
                'higher_levels' => ['description' => 'При использовании ячейки 4 уровня или выше урон увеличивается на 1d10 за каждый уровень выше 3.'],
                'effects' => ['damage' => ['dice' => '3d10', 'type' => 'lightning'], 'save' => ['ability' => 'dexterity', 'on_success' => 'half']],
                'is_system' => true,
            ],
            [
                'slug' => 'conjure-animals',
                'name' => ['ru' => 'Призыв зверей'],
                'description' => ['ru' => 'Вы призываете духов фей, принимающих форму зверей, которые появляются в свободных пространствах, видимых вами в пределах дистанции. Выберите один из вариантов: 1 зверь ОП 2 или ниже; 2 зверя ОП 1 или ниже; 4 зверя ОП 1/2 или ниже; 8 зверей ОП 1/4 или ниже. Каждый зверь также считается феей и исчезает, когда его хиты опускаются до 0 или заклинание заканчивается.'],
                'level' => 3,
                'school' => 'conjuration',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['druid', 'ranger'],
                'higher_levels' => ['description' => 'При использовании ячейки более высокого уровня вы призываете больше существ: на 5-6 уровне вдвое больше, на 7-8 уровне втрое, на 9 уровне вчетверо.'],
                'is_system' => true,
            ],
            [
                'slug' => 'plant-growth',
                'name' => ['ru' => 'Рост растений'],
                'description' => ['ru' => 'Это заклинание направляет жизненную силу в растения в определённой области. Существует два возможных применения: мгновенное или за 8 часов. Мгновенное: все нормальные растения в радиусе 30 метров разрастаются. Существо, перемещающееся по области, тратит 1,2 метра перемещения на каждые 30 см. 8 часов: обогащает землю. Урожай на следующий год удваивается.'],
                'level' => 3,
                'school' => 'transmutation',
                'casting_time' => '1 действие или 8 часов',
                'range' => '45 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['bard', 'druid', 'ranger'],
                'is_system' => true,
            ],

            // ==========================================
            // 4TH LEVEL - DRUID
            // ==========================================
            [
                'slug' => 'polymorph',
                'name' => ['ru' => 'Превращение'],
                'description' => ['ru' => 'Это заклинание превращает существо, которое вы видите в пределах дистанции, в новую форму. Несогласное существо должно совершить спасбросок Мудрости, чтобы избежать эффекта. Перевёртыши автоматически преуспевают в этом спасброске. Целью не может быть существо с 0 хитов. Превращение длится, пока активно заклинание, или пока хиты цели не опустятся до 0.'],
                'level' => 4,
                'school' => 'transmutation',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Концентрация, до 1 часа',
                'concentration' => true,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'кокон гусеницы'],
                'classes' => ['bard', 'druid', 'sorcerer', 'wizard'],
                'effects' => ['save' => ['ability' => 'wisdom']],
                'is_system' => true,
            ],
            [
                'slug' => 'ice-storm',
                'name' => ['ru' => 'Град'],
                'description' => ['ru' => 'Град из твёрдых ледяных глыб обрушивается на землю в цилиндре с радиусом 6 метров и высотой 12 метров с центром в точке в пределах дистанции. Все существа в цилиндре должны совершить спасбросок Ловкости. Существо получает 2d8 дробящего урона и 4d6 урона холодом при провале или половину этого урона при успехе.'],
                'level' => 4,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '90 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => true, 'material_description' => 'щепотка пыли и несколько капель воды'],
                'classes' => ['druid', 'sorcerer', 'wizard'],
                'higher_levels' => ['description' => 'При использовании ячейки 5 уровня или выше дробящий урон увеличивается на 1d8 за каждый уровень выше 4.'],
                'effects' => ['damage' => ['dice' => '2d8 bludgeoning + 4d6 cold'], 'save' => ['ability' => 'dexterity', 'on_success' => 'half']],
                'is_system' => true,
            ],

            // ==========================================
            // 5TH LEVEL - DRUID
            // ==========================================
            [
                'slug' => 'mass-cure-wounds',
                'name' => ['ru' => 'Массовое лечение ран'],
                'description' => ['ru' => 'Волна целительной энергии исходит от точки на ваш выбор в пределах дистанции. Выберите до шести существ в сфере с радиусом 9 метров с центром в этой точке. Каждая цель восстанавливает хиты, равные 3d8 + ваш модификатор базовой характеристики. Это заклинание не оказывает эффекта на нежить и конструктов.'],
                'level' => 5,
                'school' => 'evocation',
                'casting_time' => '1 действие',
                'range' => '18 м',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => false,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['bard', 'cleric', 'druid'],
                'higher_levels' => ['description' => 'При использовании ячейки 6 уровня или выше лечение увеличивается на 1d8 за каждый уровень выше 5.'],
                'is_system' => true,
            ],
            [
                'slug' => 'commune-with-nature',
                'name' => ['ru' => 'Общение с природой'],
                'description' => ['ru' => 'Вы на краткий миг становитесь единым целым с природой и получаете знания об окружающей территории. На открытом воздухе заклинание даёт знания о местности в радиусе 4,5 километра вокруг вас. В пещерах радиус ограничен 90 метрами. Вы немедленно получаете знания о трёх фактах об области.'],
                'level' => 5,
                'school' => 'divination',
                'casting_time' => '1 минута',
                'range' => 'На себя',
                'duration' => 'Мгновенная',
                'concentration' => false,
                'ritual' => true,
                'components' => ['verbal' => true, 'somatic' => true, 'material' => false],
                'classes' => ['druid', 'ranger'],
                'is_system' => true,
            ],
        ];
    }
}
