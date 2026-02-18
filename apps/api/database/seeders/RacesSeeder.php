<?php

namespace Database\Seeders;

use App\Models\Race;
use App\Models\Setting;
use Illuminate\Database\Seeder;

class RacesSeeder extends Seeder
{
    public function run(): void
    {
        $eberron = Setting::where('slug', 'eberron')->first();
        $forgottenRealms = Setting::where('slug', 'forgotten-realms')->first();

        // Core SRD races (available in both settings)
        $coreRaces = $this->getCoreRaces();
        foreach ($coreRaces as $raceData) {
            $race = Race::updateOrCreate(
                ['slug' => $raceData['slug']],
                $raceData
            );

            // Attach to both settings
            if ($eberron) {
                $race->settings()->syncWithoutDetaching([$eberron->id]);
            }
            if ($forgottenRealms) {
                $race->settings()->syncWithoutDetaching([$forgottenRealms->id]);
            }
        }

        // Eberron-exclusive races
        $eberronRaces = $this->getEberronExclusiveRaces();
        foreach ($eberronRaces as $raceData) {
            $race = Race::updateOrCreate(
                ['slug' => $raceData['slug']],
                $raceData
            );

            // Only attach to Eberron
            if ($eberron) {
                $race->settings()->syncWithoutDetaching([$eberron->id]);
            }
        }

        $this->command->info('Races seeded successfully.');
    }

    private function getCoreRaces(): array
    {
        return [
            // HUMAN
            [
                'slug' => 'human',
                'name' => ['ru' => 'Человек'],
                'description' => ['ru' => 'Люди — самая молодая и амбициозная из рас. Они невероятно разнообразны в своих вкусах, морали и привычках. Там, где эльфы или дварфы могут провести века в одном месте, человеческие нации строятся за одно поколение.'],
                'size' => 'medium',
                'ability_bonuses' => [
                    'strength' => 1,
                    'dexterity' => 1,
                    'constitution' => 1,
                    'intelligence' => 1,
                    'wisdom' => 1,
                    'charisma' => 1,
                ],
                'speed' => ['walk' => 9],
                'traits' => [],
                'languages' => ['common', 'choice'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => [],
                'age_info' => ['maturity' => 18, 'lifespan' => 100],
                'size_info' => ['height_range' => '1.5-1.9 м', 'weight_range' => '55-110 кг'],
                'is_system' => true,
                'sort_order' => 1,
            ],

            // VARIANT HUMAN (alternative)
            [
                'slug' => 'variant-human',
                'name' => ['ru' => 'Вариантный человек'],
                'description' => ['ru' => 'Вариантные люди отказываются от универсальности стандартного человека в пользу специализации. Они получают повышение только двух характеристик, но взамен осваивают дополнительный навык и получают черту на 1-м уровне.'],
                'parent_slug' => 'human',
                'size' => 'medium',
                'ability_bonuses' => [
                    'choice' => ['count' => 2, 'amount' => 1, 'unique' => true],
                ],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'skill_versatility', 'name' => 'Универсальность навыков', 'description' => 'Вы получаете владение одним навыком на ваш выбор.'],
                    ['key' => 'feat', 'name' => 'Черта', 'description' => 'Вы получаете одну черту на ваш выбор.'],
                ],
                'languages' => ['common', 'choice'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => ['choice:1'],
                'age_info' => ['maturity' => 18, 'lifespan' => 100],
                'size_info' => ['height_range' => '1.5-1.9 м', 'weight_range' => '55-110 кг'],
                'is_system' => true,
                'sort_order' => 2,
            ],

            // DWARF (base)
            [
                'slug' => 'dwarf',
                'name' => ['ru' => 'Дварф'],
                'description' => ['ru' => 'Дварфы — крепкие и выносливые воители, живущие в горных крепостях и подземных городах. Они известны своим мастерством в кузнечном деле и каменной кладке, а также своей стойкостью и упорством.'],
                'size' => 'medium',
                'ability_bonuses' => ['constitution' => 2],
                'speed' => ['walk' => 8], // 25 ft = ~7.5m, округляем до 8
                'traits' => [
                    ['key' => 'darkvision', 'name' => 'Тёмное зрение', 'description' => 'Вы видите в темноте на расстоянии 18 метров в оттенках серого.'],
                    ['key' => 'dwarven_resilience', 'name' => 'Дварфийская устойчивость', 'description' => 'Вы имеете преимущество на спасброски от яда и сопротивление урону ядом.'],
                    ['key' => 'stonecunning', 'name' => 'Знание камня', 'description' => 'При проверке Истории, связанной с камнем, вы считаетесь владеющим навыком и добавляете удвоенный бонус мастерства.'],
                ],
                'languages' => ['common', 'dwarvish'],
                'proficiencies' => [
                    'weapons' => ['battleaxe', 'handaxe', 'light_hammer', 'warhammer'],
                    'armor' => [],
                    'tools' => ['choice:smiths_tools,brewers_supplies,masons_tools'],
                ],
                'skill_proficiencies' => [],
                'age_info' => ['maturity' => 50, 'lifespan' => 350],
                'size_info' => ['height_range' => '1.2-1.5 м', 'weight_range' => '60-80 кг'],
                'is_system' => true,
                'sort_order' => 2,
            ],

            // HILL DWARF (subrace)
            [
                'slug' => 'hill-dwarf',
                'name' => ['ru' => 'Холмовой дварф'],
                'description' => ['ru' => 'Холмовые дварфы обладают острыми чувствами, глубокой интуицией и выдающейся стойкостью.'],
                'parent_slug' => 'dwarf',
                'size' => 'medium',
                'ability_bonuses' => ['wisdom' => 1],
                'speed' => ['walk' => 8],
                'traits' => [
                    ['key' => 'dwarven_toughness', 'name' => 'Дварфийская закалка', 'description' => 'Ваш максимум хитов увеличивается на 1, и вы получаете 1 дополнительный хит при каждом повышении уровня.'],
                ],
                'languages' => [],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => [],
                'is_system' => true,
                'sort_order' => 3,
            ],

            // ELF (base)
            [
                'slug' => 'elf',
                'name' => ['ru' => 'Эльф'],
                'description' => ['ru' => 'Эльфы — магический народ неземной грации, живущий в мире, но не являющийся его частью полностью. Они живут в местах эфирной красоты, среди древних лесов или в серебряных шпилях, пронизанных сверкающим светом фей.'],
                'size' => 'medium',
                'ability_bonuses' => ['dexterity' => 2],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'darkvision', 'name' => 'Тёмное зрение', 'description' => 'Вы видите в темноте на расстоянии 18 метров в оттенках серого.'],
                    ['key' => 'keen_senses', 'name' => 'Обострённые чувства', 'description' => 'Вы владеете навыком Внимательность.'],
                    ['key' => 'fey_ancestry', 'name' => 'Наследие фей', 'description' => 'Вы имеете преимущество на спасброски от очарования, и вас невозможно усыпить магией.'],
                    ['key' => 'trance', 'name' => 'Транс', 'description' => 'Эльфы не спят. Вместо этого они медитируют 4 часа в день, получая те же преимущества, что и человек после 8 часов сна.'],
                ],
                'languages' => ['common', 'elvish'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => ['perception'],
                'age_info' => ['maturity' => 100, 'lifespan' => 750],
                'size_info' => ['height_range' => '1.5-1.8 м', 'weight_range' => '45-70 кг'],
                'is_system' => true,
                'sort_order' => 4,
            ],

            // HIGH ELF (subrace)
            [
                'slug' => 'high-elf',
                'name' => ['ru' => 'Высший эльф'],
                'description' => ['ru' => 'Высшие эльфы обладают острым умом и знакомы с основами магии. Во многих мирах D&D существует два вида высших эльфов: один более надменный и замкнутый, другой более дружелюбный.'],
                'parent_slug' => 'elf',
                'size' => 'medium',
                'ability_bonuses' => ['intelligence' => 1],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'elf_weapon_training', 'name' => 'Эльфийское оружейное обучение', 'description' => 'Вы владеете длинным мечом, коротким мечом, коротким и длинным луками.'],
                    ['key' => 'cantrip', 'name' => 'Заговор', 'description' => 'Вы знаете один заговор на ваш выбор из списка заклинаний волшебника. Базовой характеристикой для него является Интеллект.'],
                    ['key' => 'extra_language', 'name' => 'Дополнительный язык', 'description' => 'Вы знаете один дополнительный язык на ваш выбор.'],
                ],
                'languages' => ['choice'],
                'proficiencies' => [
                    'weapons' => ['longsword', 'shortsword', 'shortbow', 'longbow'],
                    'armor' => [],
                    'tools' => [],
                ],
                'skill_proficiencies' => [],
                'is_system' => true,
                'sort_order' => 5,
            ],

            // WOOD ELF (subrace)
            [
                'slug' => 'wood-elf',
                'name' => ['ru' => 'Лесной эльф'],
                'description' => ['ru' => 'Лесные эльфы обладают обострёнными чувствами и интуицией. Их быстрые ноги несут их через родные леса. Лесные эльфы склонны к уединению и недоверчивы к не-эльфам, но в целом более дружелюбны, чем их высокомерные сородичи.'],
                'parent_slug' => 'elf',
                'size' => 'medium',
                'ability_bonuses' => ['wisdom' => 1],
                'speed' => ['walk' => 11], // 35 ft = 10.5m → 11m
                'traits' => [
                    ['key' => 'elf_weapon_training', 'name' => 'Эльфийское оружейное обучение', 'description' => 'Вы владеете длинным мечом, коротким мечом, коротким и длинным луками.'],
                    ['key' => 'fleet_of_foot', 'name' => 'Быстроногий', 'description' => 'Ваша базовая скорость передвижения увеличена до 11 метров.'],
                    ['key' => 'mask_of_the_wild', 'name' => 'Маскировка в дикой местности', 'description' => 'Вы можете попытаться спрятаться, даже если вы лишь слегка заслонены листвой, сильным дождём, снегопадом, туманом и другими природными явлениями.'],
                ],
                'languages' => [],
                'proficiencies' => [
                    'weapons' => ['longsword', 'shortsword', 'shortbow', 'longbow'],
                    'armor' => [],
                    'tools' => [],
                ],
                'skill_proficiencies' => [],
                'is_system' => true,
                'sort_order' => 6,
            ],

            // DROW / DARK ELF (subrace)
            [
                'slug' => 'drow',
                'name' => ['ru' => 'Дроу'],
                'description' => ['ru' => 'Дроу, также известные как тёмные эльфы, были изгнаны с поверхности мира за то, что следовали богине Лолс по пути зла и коррупции. Теперь они построили собственную цивилизацию в глубинах Подземья. Дроу коварны и опасны, хотя некоторые отвергают злой путь своего народа.'],
                'parent_slug' => 'elf',
                'size' => 'medium',
                'ability_bonuses' => ['charisma' => 1],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'superior_darkvision', 'name' => 'Превосходное тёмное зрение', 'description' => 'Ваше тёмное зрение имеет радиус 36 метров.'],
                    ['key' => 'sunlight_sensitivity', 'name' => 'Чувствительность к солнечному свету', 'description' => 'Вы совершаете с помехой броски атаки и проверки Мудрости (Внимательность), основанные на зрении, если вы, цель вашей атаки или рассматриваемый предмет находятся на прямом солнечном свету.'],
                    ['key' => 'drow_magic', 'name' => 'Магия дроу', 'description' => 'Вы знаете заговор Пляшущие огоньки. По достижении 3-го уровня вы можете один раз сотворить заклинание Огонь фей. По достижении 5-го уровня вы также можете один раз сотворить заклинание Тьма. Вы восстанавливаете способность сотворять эти заклинания после продолжительного отдыха. Харизма — ваша базовая характеристика для этих заклинаний.'],
                    ['key' => 'drow_weapon_training', 'name' => 'Оружейное обучение дроу', 'description' => 'Вы владеете рапирой, коротким мечом и ручным арбалетом.'],
                ],
                'languages' => [],
                'proficiencies' => [
                    'weapons' => ['rapier', 'shortsword', 'hand_crossbow'],
                    'armor' => [],
                    'tools' => [],
                ],
                'skill_proficiencies' => [],
                'is_system' => true,
                'sort_order' => 7,
            ],

            // HALFLING (base)
            [
                'slug' => 'halfling',
                'name' => ['ru' => 'Полурослик'],
                'description' => ['ru' => 'Полурослики — маленький народ, умеющий сливаться с толпой, собирая полезные сведения, или пробираться мимо противника. Их отличает неизменный оптимизм, любопытство и смелость.'],
                'size' => 'small',
                'ability_bonuses' => ['dexterity' => 2],
                'speed' => ['walk' => 8],
                'traits' => [
                    ['key' => 'lucky', 'name' => 'Везучий', 'description' => 'Когда вы выбрасываете 1 на d20 при броске атаки, проверке характеристики или спасброске, вы можете перебросить кость и обязаны использовать новый результат.'],
                    ['key' => 'brave', 'name' => 'Храбрый', 'description' => 'Вы имеете преимущество на спасброски от испуга.'],
                    ['key' => 'halfling_nimbleness', 'name' => 'Проворство полурослика', 'description' => 'Вы можете проходить сквозь пространство, занимаемое существом, размер которого больше вашего.'],
                ],
                'languages' => ['common', 'halfling'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => [],
                'age_info' => ['maturity' => 20, 'lifespan' => 150],
                'size_info' => ['height_range' => '0.9-1.1 м', 'weight_range' => '18-22 кг'],
                'is_system' => true,
                'sort_order' => 6,
            ],

            // LIGHTFOOT HALFLING (subrace)
            [
                'slug' => 'lightfoot-halfling',
                'name' => ['ru' => 'Легконогий полурослик'],
                'description' => ['ru' => 'Легконогие полурослики умеют прятаться за существами большего размера. Они склонны к странствиям и легко находят общий язык с представителями других рас.'],
                'parent_slug' => 'halfling',
                'size' => 'small',
                'ability_bonuses' => ['charisma' => 1],
                'speed' => ['walk' => 8],
                'traits' => [
                    ['key' => 'naturally_stealthy', 'name' => 'Естественная скрытность', 'description' => 'Вы можете попытаться спрятаться, даже если заслонены только существом, которое как минимум на один размер больше вас.'],
                ],
                'languages' => [],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => [],
                'is_system' => true,
                'sort_order' => 7,
            ],

            // DRAGONBORN
            [
                'slug' => 'dragonborn',
                'name' => ['ru' => 'Драконорождённый'],
                'description' => ['ru' => 'Драконорождённые выглядят как гуманоидные драконы, лишённые крыльев и хвоста. Они гордые воины, преданные своему клану и высоко ценящие честь.'],
                'size' => 'medium',
                'ability_bonuses' => ['strength' => 2, 'charisma' => 1],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'draconic_ancestry', 'name' => 'Драконье наследие', 'description' => 'Выберите тип дракона. Ваше оружие дыхания и сопротивление урону определяются типом дракона.'],
                    ['key' => 'breath_weapon', 'name' => 'Оружие дыхания', 'description' => 'Вы можете действием выдохнуть разрушительную энергию. Размер, форма и тип урона зависят от вашего драконьего наследия. Урон 2d6, увеличивается на 6, 11 и 16 уровнях.'],
                    ['key' => 'damage_resistance', 'name' => 'Сопротивление урону', 'description' => 'Вы имеете сопротивление типу урона, связанному с вашим драконьим наследием.'],
                ],
                'languages' => ['common', 'draconic'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => [],
                'age_info' => ['maturity' => 15, 'lifespan' => 80],
                'size_info' => ['height_range' => '1.8-2.1 м', 'weight_range' => '110-130 кг'],
                'is_system' => true,
                'sort_order' => 8,
            ],

            // GNOME (base)
            [
                'slug' => 'gnome',
                'name' => ['ru' => 'Гном'],
                'description' => ['ru' => 'Гномы — маленький народ изобретателей, учёных и иллюзионистов. Их любопытство не знает границ, а жизнь наполнена исследованиями, открытиями и весельем.'],
                'size' => 'small',
                'ability_bonuses' => ['intelligence' => 2],
                'speed' => ['walk' => 8],
                'traits' => [
                    ['key' => 'darkvision', 'name' => 'Тёмное зрение', 'description' => 'Вы видите в темноте на расстоянии 18 метров в оттенках серого.'],
                    ['key' => 'gnome_cunning', 'name' => 'Гномья хитрость', 'description' => 'Вы имеете преимущество на все спасброски Интеллекта, Мудрости и Харизмы против магии.'],
                ],
                'languages' => ['common', 'gnomish'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => [],
                'age_info' => ['maturity' => 40, 'lifespan' => 450],
                'size_info' => ['height_range' => '0.9-1.1 м', 'weight_range' => '18-22 кг'],
                'is_system' => true,
                'sort_order' => 9,
            ],

            // ROCK GNOME (subrace)
            [
                'slug' => 'rock-gnome',
                'name' => ['ru' => 'Скальный гном'],
                'description' => ['ru' => 'Скальные гномы — изобретатели и механики, создающие хитроумные устройства и механизмы.'],
                'parent_slug' => 'gnome',
                'size' => 'small',
                'ability_bonuses' => ['constitution' => 1],
                'speed' => ['walk' => 8],
                'traits' => [
                    ['key' => 'artificers_lore', 'name' => 'Знание ремесленника', 'description' => 'При проверке Истории, связанной с магическими предметами, алхимическими объектами или техническими устройствами, вы добавляете удвоенный бонус мастерства.'],
                    ['key' => 'tinker', 'name' => 'Механик', 'description' => 'Вы владеете инструментами ремесленника и можете создавать крошечные механические устройства.'],
                ],
                'languages' => [],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => ['tinkers_tools']],
                'skill_proficiencies' => [],
                'is_system' => true,
                'sort_order' => 10,
            ],

            // HALF-ELF
            [
                'slug' => 'half-elf',
                'name' => ['ru' => 'Полуэльф'],
                'description' => ['ru' => 'Полуэльфы сочетают лучшее от обоих родителей: человеческую любознательность и изобретательность с утончённостью и любовью к природе эльфов. Они часто становятся посредниками между двумя культурами.'],
                'size' => 'medium',
                'ability_bonuses' => [
                    'charisma' => 2,
                    'choice' => ['count' => 2, 'amount' => 1, 'exclude' => ['charisma']],
                ],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'darkvision', 'name' => 'Тёмное зрение', 'description' => 'Вы видите в темноте на расстоянии 18 метров в оттенках серого.'],
                    ['key' => 'fey_ancestry', 'name' => 'Наследие фей', 'description' => 'Вы имеете преимущество на спасброски от очарования, и вас невозможно усыпить магией.'],
                    ['key' => 'skill_versatility', 'name' => 'Универсальность навыков', 'description' => 'Вы получаете владение двумя навыками на ваш выбор.'],
                ],
                'languages' => ['common', 'elvish', 'choice'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => ['choice:2'],
                'age_info' => ['maturity' => 20, 'lifespan' => 180],
                'size_info' => ['height_range' => '1.5-1.8 м', 'weight_range' => '55-80 кг'],
                'is_system' => true,
                'sort_order' => 11,
            ],

            // HALF-ORC
            [
                'slug' => 'half-orc',
                'name' => ['ru' => 'Полуорк'],
                'description' => ['ru' => 'Полуорки наследуют серую кожу, выдающуюся нижнюю челюсть и выступающие зубы своих орочьих родителей. Многие полуорки становятся выдающимися воинами, чья дикая ярость и стойкость делают их грозными противниками.'],
                'size' => 'medium',
                'ability_bonuses' => ['strength' => 2, 'constitution' => 1],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'darkvision', 'name' => 'Тёмное зрение', 'description' => 'Вы видите в темноте на расстоянии 18 метров в оттенках серого.'],
                    ['key' => 'menacing', 'name' => 'Угрожающий', 'description' => 'Вы владеете навыком Запугивание.'],
                    ['key' => 'relentless_endurance', 'name' => 'Непоколебимая стойкость', 'description' => 'Когда ваши хиты опускаются до 0, но вы не убиты наповал, вы можете остаться с 1 хитом. Вы не можете использовать эту способность повторно, пока не завершите продолжительный отдых.'],
                    ['key' => 'savage_attacks', 'name' => 'Дикие атаки', 'description' => 'Когда вы наносите критический удар рукопашной атакой оружием, вы можете бросить одну из костей урона оружия ещё раз и добавить её к дополнительному урону критического удара.'],
                ],
                'languages' => ['common', 'orc'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => ['intimidation'],
                'age_info' => ['maturity' => 14, 'lifespan' => 75],
                'size_info' => ['height_range' => '1.7-2.0 м', 'weight_range' => '80-120 кг'],
                'is_system' => true,
                'sort_order' => 12,
            ],

            // TIEFLING
            [
                'slug' => 'tiefling',
                'name' => ['ru' => 'Тифлинг'],
                'description' => ['ru' => 'Тифлинги — потомки людей, заключивших договор с исчадиями. Инфернальное наследие наложило отпечаток на их внешность: рога, хвост, необычный цвет кожи и светящиеся глаза выдают их происхождение.'],
                'size' => 'medium',
                'ability_bonuses' => ['intelligence' => 1, 'charisma' => 2],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'darkvision', 'name' => 'Тёмное зрение', 'description' => 'Вы видите в темноте на расстоянии 18 метров в оттенках серого.'],
                    ['key' => 'hellish_resistance', 'name' => 'Адская сопротивляемость', 'description' => 'Вы имеете сопротивление урону огнём.'],
                    ['key' => 'infernal_legacy', 'name' => 'Инфернальное наследие', 'description' => 'Вы знаете заговор Фокусы. На 3-м уровне вы можете один раз сотворить Адское возмездие как заклинание 2-го уровня. На 5-м уровне вы можете один раз сотворить Тьму. Харизма — базовая характеристика для этих заклинаний.'],
                ],
                'languages' => ['common', 'infernal'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => [],
                'age_info' => ['maturity' => 18, 'lifespan' => 110],
                'size_info' => ['height_range' => '1.5-1.8 м', 'weight_range' => '55-80 кг'],
                'is_system' => true,
                'sort_order' => 13,
            ],

            // TABAXI (Volo's Guide to Monsters)
            [
                'slug' => 'tabaxi',
                'name' => ['ru' => 'Табакси'],
                'description' => ['ru' => 'Табакси — кошачий народ из далёких экзотических земель. Их вечное любопытство движет ими в поисках историй, артефактов и знаний. Они обладают кошачьей грацией и рефлексами, а их гибкие тела позволяют им карабкаться по любым поверхностям.'],
                'size' => 'medium',
                'ability_bonuses' => ['dexterity' => 2, 'charisma' => 1],
                'speed' => ['walk' => 9, 'climb' => 6],
                'traits' => [
                    ['key' => 'darkvision', 'name' => 'Тёмное зрение', 'description' => 'Вы видите в темноте на расстоянии 18 метров в оттенках серого.'],
                    ['key' => 'feline_agility', 'name' => 'Кошачья ловкость', 'description' => 'Ваши рефлексы и ловкость позволяют вам двигаться со взрывным рывком скорости. Когда вы перемещаетесь в свой ход в бою, вы можете удвоить свою скорость до конца хода. Использовав эту способность, вы не можете использовать её снова, пока не проведёте хотя бы один ход без передвижения.'],
                    ['key' => 'cats_claws', 'name' => 'Кошачьи когти', 'description' => 'Благодаря когтям вы обладаете скоростью лазания 6 метров. Кроме того, ваши когти — это природное оружие, которое вы можете использовать для безоружных ударов. Если вы попадаете ими, вы наносите рубящий урон, равный 1d4 + ваш модификатор Ловкости, вместо дробящего урона, обычного для безоружного удара.'],
                    ['key' => 'cats_talent', 'name' => 'Кошачий талант', 'description' => 'Вы владеете навыками Внимательность и Скрытность.'],
                ],
                'languages' => ['common', 'choice'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => ['perception', 'stealth'],
                'age_info' => ['maturity' => 10, 'lifespan' => 80],
                'size_info' => ['height_range' => '1.5-1.8 м', 'weight_range' => '45-70 кг'],
                'is_system' => true,
                'sort_order' => 14,
            ],
        ];
    }

    private function getEberronExclusiveRaces(): array
    {
        return [
            // WARFORGED (Eberron exclusive)
            [
                'slug' => 'warforged',
                'name' => ['ru' => 'Кованый'],
                'description' => ['ru' => 'Кованые — живые конструкты, созданные как солдаты для Последней Войны. Теперь, когда война окончена, они ищут своё место в мире и смысл своего существования за пределами поля боя.'],
                'size' => 'medium',
                'ability_bonuses' => [
                    'constitution' => 2,
                    'choice' => ['count' => 1, 'amount' => 1, 'exclude' => ['constitution']],
                ],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'constructed_resilience', 'name' => 'Устойчивость конструкта', 'description' => 'Вы имеете преимущество на спасброски от яда, сопротивление урону ядом, не нуждаетесь в еде, питье и дыхании, иммунны к болезням и не можете быть усыплены магией.'],
                    ['key' => 'sentry_rest', 'name' => 'Отдых часового', 'description' => 'Когда вы делаете продолжительный отдых, вы должны провести как минимум 6 часов в неподвижном состоянии, оставаясь в сознании.'],
                    ['key' => 'integrated_protection', 'name' => 'Встроенная защита', 'description' => 'Ваше тело имеет встроенные защитные слои. +1 к КД. Вы можете надевать только доспехи, с которыми вы владеете.'],
                    ['key' => 'specialized_design', 'name' => 'Специализированная конструкция', 'description' => 'Вы получаете владение одним навыком и одним инструментом на ваш выбор.'],
                ],
                'languages' => ['common', 'choice'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => ['choice:1']],
                'skill_proficiencies' => ['choice:1'],
                'age_info' => ['maturity' => 2, 'lifespan' => null],
                'size_info' => ['height_range' => '1.8-2.1 м', 'weight_range' => '120-150 кг'],
                'is_system' => true,
                'sort_order' => 20,
            ],

            // CHANGELING (Eberron exclusive)
            [
                'slug' => 'changeling',
                'name' => ['ru' => 'Перевёртыш'],
                'description' => ['ru' => 'Перевёртыши — потомки допельгангеров, способные менять свою внешность. Они мастера маскировки и обмана, хотя многие стремятся найти своё истинное «я» за множеством масок.'],
                'size' => 'medium',
                'ability_bonuses' => [
                    'charisma' => 2,
                    'choice' => ['count' => 1, 'amount' => 1, 'exclude' => ['charisma']],
                ],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'shapechanger', 'name' => 'Изменение облика', 'description' => 'Действием вы можете изменить свою внешность и голос. Вы определяете детали изменений, включая пол, рост (от Маленького до Среднего) и вес. Вы не можете менять форму так, чтобы получить дополнительные конечности.'],
                    ['key' => 'changeling_instincts', 'name' => 'Инстинкты перевёртыша', 'description' => 'Вы получаете владение двумя навыками на выбор из: Проницательность, Запугивание, Убеждение, Обман.'],
                ],
                'languages' => ['common', 'choice:2'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => ['choice:2:insight,intimidation,persuasion,deception'],
                'age_info' => ['maturity' => 15, 'lifespan' => 100],
                'size_info' => ['height_range' => '1.5-1.8 м', 'weight_range' => '55-80 кг'],
                'is_system' => true,
                'sort_order' => 21,
            ],

            // KALASHTAR (Eberron exclusive)
            [
                'slug' => 'kalashtar',
                'name' => ['ru' => 'Калаштар'],
                'description' => ['ru' => 'Калаштары — потомки людей, связавших свои души с духами из Плана Снов. Они отличаются спокойствием, сочувствием и часто обладают псионическими способностями.'],
                'size' => 'medium',
                'ability_bonuses' => [
                    'wisdom' => 2,
                    'charisma' => 1,
                ],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'dual_mind', 'name' => 'Двойной разум', 'description' => 'Вы имеете преимущество на все спасброски Мудрости.'],
                    ['key' => 'mental_discipline', 'name' => 'Ментальная дисциплина', 'description' => 'Вы имеете сопротивление психическому урону.'],
                    ['key' => 'mind_link', 'name' => 'Ментальная связь', 'description' => 'Вы можете телепатически говорить с любым существом, которое видите в пределах 18 метров. Существо понимает вас, только если вы говорите на известном ему языке.'],
                    ['key' => 'severed_from_dreams', 'name' => 'Отсечённые от снов', 'description' => 'Калаштары спят, но не видят снов. Они иммунны к заклинаниям и эффектам, которые требуют сновидений.'],
                ],
                'languages' => ['common', 'quori', 'choice'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => [],
                'age_info' => ['maturity' => 18, 'lifespan' => 120],
                'size_info' => ['height_range' => '1.6-1.9 м', 'weight_range' => '55-85 кг'],
                'is_system' => true,
                'sort_order' => 22,
            ],

            // SHIFTER (Eberron exclusive)
            [
                'slug' => 'shifter',
                'name' => ['ru' => 'Оборотень'],
                'description' => ['ru' => 'Оборотни — потомки людей и ликантропов, унаследовавшие часть звериной природы своих предков. Они могут временно усиливать свои звериные черты, входя в состояние «смещения».'],
                'size' => 'medium',
                'ability_bonuses' => [
                    'choice' => ['count' => 1, 'amount' => 2, 'options' => ['strength', 'dexterity', 'wisdom', 'constitution']],
                    'choice_2' => ['count' => 1, 'amount' => 1],
                ],
                'speed' => ['walk' => 9],
                'traits' => [
                    ['key' => 'darkvision', 'name' => 'Тёмное зрение', 'description' => 'Вы видите в темноте на расстоянии 18 метров в оттенках серого.'],
                    ['key' => 'shifting', 'name' => 'Смещение', 'description' => 'Бонусным действием вы можете принять более звериную форму. Это длится 1 минуту или пока вы не отмените эффект. Вы получаете временные хиты равные вашему уровню + бонус Телосложения. Дополнительные эффекты зависят от подвида.'],
                    ['key' => 'bestial_instincts', 'name' => 'Звериные инстинкты', 'description' => 'Вы владеете одним из навыков: Атлетика, Акробатика, Выживание или Запугивание.'],
                ],
                'languages' => ['common'],
                'proficiencies' => ['weapons' => [], 'armor' => [], 'tools' => []],
                'skill_proficiencies' => ['choice:1:athletics,acrobatics,survival,intimidation'],
                'age_info' => ['maturity' => 10, 'lifespan' => 70],
                'size_info' => ['height_range' => '1.5-1.8 м', 'weight_range' => '55-90 кг'],
                'is_system' => true,
                'sort_order' => 23,
            ],
        ];
    }
}
