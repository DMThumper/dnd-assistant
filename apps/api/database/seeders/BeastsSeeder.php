<?php

namespace Database\Seeders;

use App\Models\Monster;
use App\Models\Setting;
use Illuminate\Database\Seeder;

/**
 * Seeds beasts for Wild Shape transformation
 * CR ranges for druids:
 * - Level 2: CR 1/4 (no swim/fly)
 * - Level 4: CR 1/2 (no fly)
 * - Level 8: CR 1
 *
 * Moon Circle druids:
 * - Level 2: CR 1
 * - Level 6: CR = druid level / 3
 */
class BeastsSeeder extends Seeder
{
    public function run(): void
    {
        $eberron = Setting::where('slug', 'eberron')->first();

        $beasts = $this->getBeasts();

        foreach ($beasts as $beastData) {
            $beast = Monster::updateOrCreate(
                ['slug' => $beastData['slug']],
                $beastData
            );

            if ($eberron) {
                $beast->settings()->syncWithoutDetaching([$eberron->id]);
            }
        }

        $this->command->info('Beasts for Wild Shape seeded: ' . count($beasts));
    }

    private function getBeasts(): array
    {
        return [
            // ==========================================
            // CR 0
            // ==========================================
            [
                'slug' => 'cat',
                'name' => ['ru' => 'Кошка'],
                'description' => ['ru' => 'Кошки ценятся за ловкость и острые чувства, особенно ночное зрение.'],
                'size' => 'tiny',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 2,
                'hit_dice' => '1d4',
                'speed' => ['walk' => 12, 'climb' => 9],
                'abilities' => [
                    'strength' => 3, 'dexterity' => 15, 'constitution' => 10,
                    'intelligence' => 3, 'wisdom' => 12, 'charisma' => 7,
                ],
                'skills' => ['perception' => 3, 'stealth' => 4],
                'senses' => ['darkvision' => '9 м', 'passive_perception' => 13],
                'challenge_rating' => 0,
                'experience_points' => 10,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Кошка совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                ],
                'actions' => [
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 0, 'reach' => '1,5 м', 'damage' => '1 рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'rat',
                'name' => ['ru' => 'Крыса'],
                'description' => ['ru' => 'Обычная крыса, обитающая в городах и подземельях.'],
                'size' => 'tiny',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 10,
                'hit_points' => 1,
                'hit_dice' => '1d4-1',
                'speed' => ['walk' => 6],
                'abilities' => [
                    'strength' => 2, 'dexterity' => 11, 'constitution' => 9,
                    'intelligence' => 2, 'wisdom' => 10, 'charisma' => 4,
                ],
                'senses' => ['darkvision' => '9 м', 'passive_perception' => 10],
                'challenge_rating' => 0,
                'experience_points' => 10,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Крыса совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 0, 'reach' => '1,5 м', 'damage' => '1 колющего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'raven',
                'name' => ['ru' => 'Ворон'],
                'description' => ['ru' => 'Умная птица, часто используемая как фамильяр или посланник.'],
                'size' => 'tiny',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 1,
                'hit_dice' => '1d4-1',
                'speed' => ['walk' => 3, 'fly' => 15],
                'abilities' => [
                    'strength' => 2, 'dexterity' => 14, 'constitution' => 8,
                    'intelligence' => 2, 'wisdom' => 12, 'charisma' => 6,
                ],
                'skills' => ['perception' => 3],
                'senses' => ['passive_perception' => 13],
                'challenge_rating' => 0,
                'experience_points' => 10,
                'traits' => [
                    ['name' => 'Подражание', 'description' => 'Ворон может имитировать простые звуки, которые слышал. Существо, слышащее звук, может распознать имитацию, преуспев в проверке Мудрости (Проницательность) Сл 10.'],
                ],
                'actions' => [
                    ['name' => 'Клюв', 'type' => 'melee', 'attack_bonus' => 4, 'reach' => '1,5 м', 'damage' => '1 колющего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'owl',
                'name' => ['ru' => 'Сова'],
                'description' => ['ru' => 'Ночной хищник с острым зрением и бесшумным полётом.'],
                'size' => 'tiny',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 11,
                'hit_points' => 1,
                'hit_dice' => '1d4-1',
                'speed' => ['walk' => 1.5, 'fly' => 18],
                'abilities' => [
                    'strength' => 3, 'dexterity' => 13, 'constitution' => 8,
                    'intelligence' => 2, 'wisdom' => 12, 'charisma' => 7,
                ],
                'skills' => ['perception' => 3, 'stealth' => 3],
                'senses' => ['darkvision' => '36 м', 'passive_perception' => 13],
                'challenge_rating' => 0,
                'experience_points' => 10,
                'traits' => [
                    ['name' => 'Пролёт', 'description' => 'Сова не провоцирует атаки, когда вылетает из досягаемости врага.'],
                    ['name' => 'Острый слух и зрение', 'description' => 'Сова совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на слух или зрение.'],
                ],
                'actions' => [
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 3, 'reach' => '1,5 м', 'damage' => '1 рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'spider',
                'name' => ['ru' => 'Паук'],
                'description' => ['ru' => 'Маленький паук, плетущий сети в тёмных углах.'],
                'size' => 'tiny',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 1,
                'hit_dice' => '1d4-1',
                'speed' => ['walk' => 6, 'climb' => 6],
                'abilities' => [
                    'strength' => 2, 'dexterity' => 14, 'constitution' => 8,
                    'intelligence' => 1, 'wisdom' => 10, 'charisma' => 2,
                ],
                'skills' => ['stealth' => 4],
                'senses' => ['darkvision' => '9 м', 'passive_perception' => 10],
                'challenge_rating' => 0,
                'experience_points' => 10,
                'traits' => [
                    ['name' => 'Паучье лазание', 'description' => 'Паук может лазать по сложным поверхностям, включая потолки, без проверки характеристик.'],
                    ['name' => 'Чувство паутины', 'description' => 'Находясь в контакте с паутиной, паук знает точное местоположение всех существ, касающихся той же паутины.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 4, 'reach' => '1,5 м', 'damage' => '1 колющего урона, цель должна преуспеть в спасброске Телосложения Сл 9 или получить 2 (1d4) урона ядом'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'badger',
                'name' => ['ru' => 'Барсук'],
                'description' => ['ru' => 'Небольшое, но агрессивное животное, живущее в норах.'],
                'size' => 'tiny',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 10,
                'hit_points' => 3,
                'hit_dice' => '1d4+1',
                'speed' => ['walk' => 6, 'burrow' => 1.5],
                'abilities' => [
                    'strength' => 4, 'dexterity' => 11, 'constitution' => 12,
                    'intelligence' => 2, 'wisdom' => 12, 'charisma' => 5,
                ],
                'senses' => ['darkvision' => '9 м', 'passive_perception' => 11],
                'challenge_rating' => 0,
                'experience_points' => 10,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Барсук совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 2, 'reach' => '1,5 м', 'damage' => '1 колющего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'frog',
                'name' => ['ru' => 'Лягушка'],
                'description' => ['ru' => 'Маленькое земноводное, обитающее у водоёмов.'],
                'size' => 'tiny',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 11,
                'hit_points' => 1,
                'hit_dice' => '1d4-1',
                'speed' => ['walk' => 6, 'swim' => 6],
                'abilities' => [
                    'strength' => 1, 'dexterity' => 13, 'constitution' => 8,
                    'intelligence' => 1, 'wisdom' => 8, 'charisma' => 3,
                ],
                'skills' => ['perception' => 1, 'stealth' => 3],
                'senses' => ['darkvision' => '9 м', 'passive_perception' => 11],
                'challenge_rating' => 0,
                'experience_points' => 0,
                'traits' => [
                    ['name' => 'Амфибия', 'description' => 'Лягушка может дышать воздухом и под водой.'],
                    ['name' => 'Прыжок с места', 'description' => 'Прыжок лягушки в длину составляет 3 м, а в высоту — 1,5 м, с разбегом или без.'],
                ],
                'actions' => [],
                'is_system' => true,
            ],

            // ==========================================
            // CR 1/8
            // ==========================================
            [
                'slug' => 'mastiff',
                'name' => ['ru' => 'Мастиф'],
                'description' => ['ru' => 'Крупная сторожевая собака, верная и свирепая.'],
                'size' => 'medium',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 5,
                'hit_dice' => '1d8+1',
                'speed' => ['walk' => 12],
                'abilities' => [
                    'strength' => 13, 'dexterity' => 14, 'constitution' => 12,
                    'intelligence' => 3, 'wisdom' => 12, 'charisma' => 7,
                ],
                'skills' => ['perception' => 3],
                'senses' => ['passive_perception' => 13],
                'challenge_rating' => 0.125,
                'experience_points' => 25,
                'traits' => [
                    ['name' => 'Острый слух и обоняние', 'description' => 'Мастиф совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на слух или обоняние.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 3, 'reach' => '1,5 м', 'damage' => '4 (1d6+1) колющего урона. Если цель — существо, она должна преуспеть в спасброске Силы Сл 11, иначе будет сбита с ног.'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'poisonous-snake',
                'name' => ['ru' => 'Ядовитая змея'],
                'description' => ['ru' => 'Небольшая ядовитая змея, опасная для неосторожных.'],
                'size' => 'tiny',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 13,
                'hit_points' => 2,
                'hit_dice' => '1d4',
                'speed' => ['walk' => 9, 'swim' => 9],
                'abilities' => [
                    'strength' => 2, 'dexterity' => 16, 'constitution' => 11,
                    'intelligence' => 1, 'wisdom' => 10, 'charisma' => 3,
                ],
                'senses' => ['blindsight' => '3 м', 'passive_perception' => 10],
                'challenge_rating' => 0.125,
                'experience_points' => 25,
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '1 колющего урона, и цель должна совершить спасбросок Телосложения Сл 10, получая 5 (2d4) урона ядом при провале или половину при успехе.'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'giant-rat',
                'name' => ['ru' => 'Гигантская крыса'],
                'description' => ['ru' => 'Крыса размером с собаку, обитающая в подземельях и канализации.'],
                'size' => 'small',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 7,
                'hit_dice' => '2d6',
                'speed' => ['walk' => 9],
                'abilities' => [
                    'strength' => 7, 'dexterity' => 15, 'constitution' => 11,
                    'intelligence' => 2, 'wisdom' => 10, 'charisma' => 4,
                ],
                'senses' => ['darkvision' => '18 м', 'passive_perception' => 10],
                'challenge_rating' => 0.125,
                'experience_points' => 25,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Крыса совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                    ['name' => 'Тактика стаи', 'description' => 'Крыса совершает с преимуществом броски атаки по существу, если в пределах 1,5 м от него находится дееспособный союзник крысы.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 4, 'reach' => '1,5 м', 'damage' => '4 (1d4+2) колющего урона'],
                ],
                'is_system' => true,
            ],

            // ==========================================
            // CR 1/4
            // ==========================================
            [
                'slug' => 'boar',
                'name' => ['ru' => 'Кабан'],
                'description' => ['ru' => 'Дикий кабан с острыми клыками, агрессивный когда загнан в угол.'],
                'size' => 'medium',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 11,
                'hit_points' => 11,
                'hit_dice' => '2d8+2',
                'speed' => ['walk' => 12],
                'abilities' => [
                    'strength' => 13, 'dexterity' => 11, 'constitution' => 12,
                    'intelligence' => 2, 'wisdom' => 9, 'charisma' => 5,
                ],
                'senses' => ['passive_perception' => 9],
                'challenge_rating' => 0.25,
                'experience_points' => 50,
                'traits' => [
                    ['name' => 'Атака с разбега', 'description' => 'Если кабан переместится как минимум на 6 м по прямой к цели, а затем в тот же ход попадёт по ней клыками, цель получает дополнительно 3 (1d6) рубящего урона. Если цель — существо, она должна преуспеть в спасброске Силы Сл 11, иначе будет сбита с ног.'],
                    ['name' => 'Безжалостность', 'description' => 'Если кабан в свой ход опускает хиты до 0, но не был убит сразу, он может совершить спасбросок Телосложения Сл 10. При успехе хиты кабана опускаются до 1.'],
                ],
                'actions' => [
                    ['name' => 'Клыки', 'type' => 'melee', 'attack_bonus' => 3, 'reach' => '1,5 м', 'damage' => '4 (1d6+1) рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'panther',
                'name' => ['ru' => 'Пантера'],
                'description' => ['ru' => 'Грациозная и смертоносная большая кошка, мастер засад.'],
                'size' => 'medium',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 13,
                'hit_dice' => '3d8',
                'speed' => ['walk' => 15, 'climb' => 12],
                'abilities' => [
                    'strength' => 14, 'dexterity' => 15, 'constitution' => 10,
                    'intelligence' => 3, 'wisdom' => 14, 'charisma' => 7,
                ],
                'skills' => ['perception' => 4, 'stealth' => 6],
                'senses' => ['passive_perception' => 14],
                'challenge_rating' => 0.25,
                'experience_points' => 50,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Пантера совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                    ['name' => 'Прыжок', 'description' => 'Если пантера переместится как минимум на 6 м по прямой к существу, а затем в тот же ход попадёт по нему атакой когтями, цель должна преуспеть в спасброске Силы Сл 12, иначе будет сбита с ног. Если цель сбита с ног, пантера может бонусным действием совершить по ней атаку укусом.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 4, 'reach' => '1,5 м', 'damage' => '5 (1d6+2) колющего урона'],
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 4, 'reach' => '1,5 м', 'damage' => '4 (1d4+2) рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'elk',
                'name' => ['ru' => 'Лось'],
                'description' => ['ru' => 'Величественный лесной зверь с могучими рогами.'],
                'size' => 'large',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 10,
                'hit_points' => 13,
                'hit_dice' => '2d10+2',
                'speed' => ['walk' => 15],
                'abilities' => [
                    'strength' => 16, 'dexterity' => 10, 'constitution' => 12,
                    'intelligence' => 2, 'wisdom' => 10, 'charisma' => 6,
                ],
                'senses' => ['passive_perception' => 10],
                'challenge_rating' => 0.25,
                'experience_points' => 50,
                'traits' => [
                    ['name' => 'Атака с разбега', 'description' => 'Если лось переместится как минимум на 6 м по прямой к цели, а затем в тот же ход попадёт по ней рогами, цель получает дополнительно 7 (2d6) урона. Если цель — существо, она должна преуспеть в спасброске Силы Сл 13, иначе будет сбита с ног.'],
                ],
                'actions' => [
                    ['name' => 'Рога', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '6 (1d6+3) дробящего урона'],
                    ['name' => 'Копыта', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '8 (2d4+3) дробящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'giant-badger',
                'name' => ['ru' => 'Гигантский барсук'],
                'description' => ['ru' => 'Огромный и свирепый барсук, способный прорывать туннели.'],
                'size' => 'medium',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 10,
                'hit_points' => 13,
                'hit_dice' => '2d8+4',
                'speed' => ['walk' => 9, 'burrow' => 3],
                'abilities' => [
                    'strength' => 13, 'dexterity' => 10, 'constitution' => 15,
                    'intelligence' => 2, 'wisdom' => 12, 'charisma' => 5,
                ],
                'senses' => ['darkvision' => '9 м', 'passive_perception' => 11],
                'challenge_rating' => 0.25,
                'experience_points' => 50,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Барсук совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                ],
                'actions' => [
                    ['name' => 'Мультиатака', 'description' => 'Барсук совершает две атаки: одну укусом и одну когтями.'],
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 3, 'reach' => '1,5 м', 'damage' => '4 (1d6+1) колющего урона'],
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 3, 'reach' => '1,5 м', 'damage' => '6 (2d4+1) рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'giant-frog',
                'name' => ['ru' => 'Гигантская лягушка'],
                'description' => ['ru' => 'Огромная амфибия, способная проглотить добычу целиком.'],
                'size' => 'medium',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 11,
                'hit_points' => 18,
                'hit_dice' => '4d8',
                'speed' => ['walk' => 9, 'swim' => 9],
                'abilities' => [
                    'strength' => 12, 'dexterity' => 13, 'constitution' => 11,
                    'intelligence' => 2, 'wisdom' => 10, 'charisma' => 3,
                ],
                'skills' => ['perception' => 2, 'stealth' => 3],
                'senses' => ['darkvision' => '9 м', 'passive_perception' => 12],
                'challenge_rating' => 0.25,
                'experience_points' => 50,
                'traits' => [
                    ['name' => 'Амфибия', 'description' => 'Лягушка может дышать воздухом и под водой.'],
                    ['name' => 'Прыжок с места', 'description' => 'Прыжок лягушки в длину составляет 6 м, а в высоту — 3 м, с разбегом или без.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 3, 'reach' => '1,5 м', 'damage' => '4 (1d6+1) колющего урона, и цель становится схваченной (Сл высвобождения 11). Пока цель схвачена, она опутана, и лягушка не может кусать другую цель.'],
                    ['name' => 'Проглатывание', 'description' => 'Лягушка совершает атаку укусом по Маленькой или меньшей цели, которую держит схваченной. При попадании цель проглатывается, и захват оканчивается. Проглоченная цель ослеплена и опутана, имеет полное укрытие от атак и эффектов снаружи, и получает 5 (2d4) урона кислотой в начале каждого хода лягушки. Если лягушка умирает, проглоченное существо освобождается.'],
                ],
                'is_system' => true,
            ],

            // ==========================================
            // CR 1/2
            // ==========================================
            [
                'slug' => 'black-bear',
                'name' => ['ru' => 'Чёрный медведь'],
                'description' => ['ru' => 'Медведь средних размеров, обитающий в лесах.'],
                'size' => 'medium',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 11,
                'hit_points' => 19,
                'hit_dice' => '3d8+6',
                'speed' => ['walk' => 12, 'climb' => 9],
                'abilities' => [
                    'strength' => 15, 'dexterity' => 10, 'constitution' => 14,
                    'intelligence' => 2, 'wisdom' => 12, 'charisma' => 7,
                ],
                'skills' => ['perception' => 3],
                'senses' => ['passive_perception' => 13],
                'challenge_rating' => 0.5,
                'experience_points' => 100,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Медведь совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                ],
                'actions' => [
                    ['name' => 'Мультиатака', 'description' => 'Медведь совершает две атаки: одну укусом и одну когтями.'],
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 4, 'reach' => '1,5 м', 'damage' => '5 (1d6+2) колющего урона'],
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 4, 'reach' => '1,5 м', 'damage' => '7 (2d4+2) рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'ape',
                'name' => ['ru' => 'Обезьяна'],
                'description' => ['ru' => 'Крупная человекообразная обезьяна с мощными руками.'],
                'size' => 'medium',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 19,
                'hit_dice' => '3d8+6',
                'speed' => ['walk' => 9, 'climb' => 9],
                'abilities' => [
                    'strength' => 16, 'dexterity' => 14, 'constitution' => 14,
                    'intelligence' => 6, 'wisdom' => 12, 'charisma' => 7,
                ],
                'skills' => ['athletics' => 5, 'perception' => 3],
                'senses' => ['passive_perception' => 13],
                'challenge_rating' => 0.5,
                'experience_points' => 100,
                'actions' => [
                    ['name' => 'Мультиатака', 'description' => 'Обезьяна совершает две атаки кулаками.'],
                    ['name' => 'Кулак', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '6 (1d6+3) дробящего урона'],
                    ['name' => 'Камень', 'type' => 'ranged', 'attack_bonus' => 5, 'range' => '7,5/15 м', 'damage' => '6 (1d6+3) дробящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'crocodile',
                'name' => ['ru' => 'Крокодил'],
                'description' => ['ru' => 'Смертоносный водный хищник с мощными челюстями.'],
                'size' => 'large',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 19,
                'hit_dice' => '3d10+3',
                'speed' => ['walk' => 6, 'swim' => 9],
                'abilities' => [
                    'strength' => 15, 'dexterity' => 10, 'constitution' => 13,
                    'intelligence' => 2, 'wisdom' => 10, 'charisma' => 5,
                ],
                'skills' => ['stealth' => 2],
                'senses' => ['passive_perception' => 10],
                'challenge_rating' => 0.5,
                'experience_points' => 100,
                'traits' => [
                    ['name' => 'Задержка дыхания', 'description' => 'Крокодил может задерживать дыхание на 15 минут.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 4, 'reach' => '1,5 м', 'damage' => '7 (1d10+2) колющего урона, и цель становится схваченной (Сл высвобождения 12). Пока цель схвачена, она опутана, и крокодил не может кусать другую цель.'],
                ],
                'is_system' => true,
            ],

            // ==========================================
            // CR 1
            // ==========================================
            [
                'slug' => 'brown-bear',
                'name' => ['ru' => 'Бурый медведь'],
                'description' => ['ru' => 'Крупный и мощный медведь, обитающий в лесах и горах.'],
                'size' => 'large',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 11,
                'hit_points' => 34,
                'hit_dice' => '4d10+12',
                'speed' => ['walk' => 12, 'climb' => 9],
                'abilities' => [
                    'strength' => 19, 'dexterity' => 10, 'constitution' => 16,
                    'intelligence' => 2, 'wisdom' => 13, 'charisma' => 7,
                ],
                'skills' => ['perception' => 3],
                'senses' => ['passive_perception' => 13],
                'challenge_rating' => 1,
                'experience_points' => 200,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Медведь совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                ],
                'actions' => [
                    ['name' => 'Мультиатака', 'description' => 'Медведь совершает две атаки: одну укусом и одну когтями.'],
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 6, 'reach' => '1,5 м', 'damage' => '8 (1d8+4) колющего урона'],
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 6, 'reach' => '1,5 м', 'damage' => '11 (2d6+4) рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'dire-wolf',
                'name' => ['ru' => 'Лютоволк'],
                'description' => ['ru' => 'Огромный и свирепый волк, охотящийся большими стаями.'],
                'size' => 'large',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 14,
                'hit_points' => 37,
                'hit_dice' => '5d10+10',
                'speed' => ['walk' => 15],
                'abilities' => [
                    'strength' => 17, 'dexterity' => 15, 'constitution' => 15,
                    'intelligence' => 3, 'wisdom' => 12, 'charisma' => 7,
                ],
                'skills' => ['perception' => 3, 'stealth' => 4],
                'senses' => ['passive_perception' => 13],
                'challenge_rating' => 1,
                'experience_points' => 200,
                'traits' => [
                    ['name' => 'Острый слух и обоняние', 'description' => 'Волк совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на слух или обоняние.'],
                    ['name' => 'Тактика стаи', 'description' => 'Волк совершает с преимуществом броски атаки по существу, если в пределах 1,5 м от него находится дееспособный союзник волка.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '10 (2d6+3) колющего урона. Если цель — существо, она должна преуспеть в спасброске Силы Сл 13, иначе будет сбита с ног.'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'lion',
                'name' => ['ru' => 'Лев'],
                'description' => ['ru' => 'Величественный хищник саванн, охотящийся группами.'],
                'size' => 'large',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 26,
                'hit_dice' => '4d10+4',
                'speed' => ['walk' => 15],
                'abilities' => [
                    'strength' => 17, 'dexterity' => 15, 'constitution' => 13,
                    'intelligence' => 3, 'wisdom' => 12, 'charisma' => 8,
                ],
                'skills' => ['perception' => 3, 'stealth' => 6],
                'senses' => ['passive_perception' => 13],
                'challenge_rating' => 1,
                'experience_points' => 200,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Лев совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                    ['name' => 'Тактика стаи', 'description' => 'Лев совершает с преимуществом броски атаки по существу, если в пределах 1,5 м от него находится дееспособный союзник льва.'],
                    ['name' => 'Прыжок', 'description' => 'Если лев переместится как минимум на 6 м по прямой к существу, а затем в тот же ход попадёт по нему атакой когтями, цель должна преуспеть в спасброске Силы Сл 13, иначе будет сбита с ног. Если цель сбита с ног, лев может бонусным действием совершить по ней атаку укусом.'],
                    ['name' => 'Рывок', 'description' => 'Если лев переместится как минимум на 6 м по прямой, он может действием Рывок совершить одну дополнительную атаку когтями.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '7 (1d8+3) колющего урона'],
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '6 (1d6+3) рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'tiger',
                'name' => ['ru' => 'Тигр'],
                'description' => ['ru' => 'Смертоносный полосатый хищник джунглей.'],
                'size' => 'large',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 37,
                'hit_dice' => '5d10+10',
                'speed' => ['walk' => 12],
                'abilities' => [
                    'strength' => 17, 'dexterity' => 15, 'constitution' => 14,
                    'intelligence' => 3, 'wisdom' => 12, 'charisma' => 8,
                ],
                'skills' => ['perception' => 3, 'stealth' => 6],
                'senses' => ['darkvision' => '18 м', 'passive_perception' => 13],
                'challenge_rating' => 1,
                'experience_points' => 200,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Тигр совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                    ['name' => 'Прыжок', 'description' => 'Если тигр переместится как минимум на 6 м по прямой к существу, а затем в тот же ход попадёт по нему атакой когтями, цель должна преуспеть в спасброске Силы Сл 13, иначе будет сбита с ног. Если цель сбита с ног, тигр может бонусным действием совершить по ней атаку укусом.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '8 (1d10+3) колющего урона'],
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '7 (1d8+3) рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'giant-eagle',
                'name' => ['ru' => 'Гигантский орёл'],
                'description' => ['ru' => 'Огромная благородная птица с размахом крыльев более 6 метров. Гигантские орлы разумны и часто дружественны к добрым существам.'],
                'size' => 'large',
                'type' => 'beast',
                'alignment' => 'нейтральный добрый',
                'armor_class' => 13,
                'hit_points' => 26,
                'hit_dice' => '4d10+4',
                'speed' => ['walk' => 3, 'fly' => 24],
                'abilities' => [
                    'strength' => 16, 'dexterity' => 17, 'constitution' => 13,
                    'intelligence' => 8, 'wisdom' => 14, 'charisma' => 10,
                ],
                'skills' => ['perception' => 4],
                'senses' => ['passive_perception' => 14],
                'languages' => ['Гигантский орлиный', 'понимает Общий и Ауран, но не говорит'],
                'challenge_rating' => 1,
                'experience_points' => 200,
                'traits' => [
                    ['name' => 'Острое зрение', 'description' => 'Орёл совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на зрение.'],
                ],
                'actions' => [
                    ['name' => 'Мультиатака', 'description' => 'Орёл совершает две атаки: одну клювом и одну когтями.'],
                    ['name' => 'Клюв', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '6 (1d6+3) колющего урона'],
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '10 (2d6+3) рубящего урона'],
                ],
                'is_system' => true,
            ],

            // ==========================================
            // CR 2
            // ==========================================
            [
                'slug' => 'giant-boar',
                'name' => ['ru' => 'Гигантский кабан'],
                'description' => ['ru' => 'Массивный свирепый кабан с огромными клыками.'],
                'size' => 'large',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 42,
                'hit_dice' => '5d10+15',
                'speed' => ['walk' => 12],
                'abilities' => [
                    'strength' => 17, 'dexterity' => 10, 'constitution' => 16,
                    'intelligence' => 2, 'wisdom' => 7, 'charisma' => 5,
                ],
                'senses' => ['passive_perception' => 8],
                'challenge_rating' => 2,
                'experience_points' => 450,
                'traits' => [
                    ['name' => 'Атака с разбега', 'description' => 'Если кабан переместится как минимум на 6 м по прямой к цели, а затем в тот же ход попадёт по ней клыками, цель получает дополнительно 7 (2d6) рубящего урона. Если цель — существо, она должна преуспеть в спасброске Силы Сл 13, иначе будет сбита с ног.'],
                    ['name' => 'Безжалостность', 'description' => 'Если кабан в свой ход опускает хиты до 0, но не был убит сразу, он может совершить спасбросок Телосложения Сл 10. При успехе хиты кабана опускаются до 1.'],
                ],
                'actions' => [
                    ['name' => 'Клыки', 'type' => 'melee', 'attack_bonus' => 5, 'reach' => '1,5 м', 'damage' => '10 (2d6+3) рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'polar-bear',
                'name' => ['ru' => 'Белый медведь'],
                'description' => ['ru' => 'Огромный хищник арктических земель.'],
                'size' => 'large',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 42,
                'hit_dice' => '5d10+15',
                'speed' => ['walk' => 12, 'swim' => 9],
                'abilities' => [
                    'strength' => 20, 'dexterity' => 10, 'constitution' => 16,
                    'intelligence' => 2, 'wisdom' => 13, 'charisma' => 7,
                ],
                'skills' => ['perception' => 3],
                'senses' => ['passive_perception' => 13],
                'challenge_rating' => 2,
                'experience_points' => 450,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Медведь совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                ],
                'actions' => [
                    ['name' => 'Мультиатака', 'description' => 'Медведь совершает две атаки: одну укусом и одну когтями.'],
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 7, 'reach' => '1,5 м', 'damage' => '9 (1d8+5) колющего урона'],
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 7, 'reach' => '1,5 м', 'damage' => '12 (2d6+5) рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'saber-toothed-tiger',
                'name' => ['ru' => 'Саблезубый тигр'],
                'description' => ['ru' => 'Древний хищник с огромными клыками.'],
                'size' => 'large',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 52,
                'hit_dice' => '7d10+14',
                'speed' => ['walk' => 12],
                'abilities' => [
                    'strength' => 18, 'dexterity' => 14, 'constitution' => 15,
                    'intelligence' => 3, 'wisdom' => 12, 'charisma' => 8,
                ],
                'skills' => ['perception' => 3, 'stealth' => 6],
                'senses' => ['passive_perception' => 13],
                'challenge_rating' => 2,
                'experience_points' => 450,
                'traits' => [
                    ['name' => 'Острое обоняние', 'description' => 'Тигр совершает с преимуществом проверки Мудрости (Внимательность), полагающиеся на обоняние.'],
                    ['name' => 'Прыжок', 'description' => 'Если тигр переместится как минимум на 6 м по прямой к существу, а затем в тот же ход попадёт по нему атакой когтями, цель должна преуспеть в спасброске Силы Сл 14, иначе будет сбита с ног. Если цель сбита с ног, тигр может бонусным действием совершить по ней атаку укусом.'],
                ],
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 6, 'reach' => '1,5 м', 'damage' => '10 (1d10+5) колющего урона'],
                    ['name' => 'Когти', 'type' => 'melee', 'attack_bonus' => 6, 'reach' => '1,5 м', 'damage' => '12 (2d6+5) рубящего урона'],
                ],
                'is_system' => true,
            ],
            [
                'slug' => 'giant-constrictor-snake',
                'name' => ['ru' => 'Гигантский удав'],
                'description' => ['ru' => 'Огромная змея, убивающая добычу удушением.'],
                'size' => 'huge',
                'type' => 'beast',
                'alignment' => 'без мировоззрения',
                'armor_class' => 12,
                'hit_points' => 60,
                'hit_dice' => '8d12+8',
                'speed' => ['walk' => 9, 'swim' => 9],
                'abilities' => [
                    'strength' => 19, 'dexterity' => 14, 'constitution' => 12,
                    'intelligence' => 1, 'wisdom' => 10, 'charisma' => 3,
                ],
                'skills' => ['perception' => 2],
                'senses' => ['blindsight' => '3 м', 'passive_perception' => 12],
                'challenge_rating' => 2,
                'experience_points' => 450,
                'actions' => [
                    ['name' => 'Укус', 'type' => 'melee', 'attack_bonus' => 6, 'reach' => '3 м', 'damage' => '11 (2d6+4) колющего урона'],
                    ['name' => 'Сдавливание', 'type' => 'melee', 'attack_bonus' => 6, 'reach' => '1,5 м', 'damage' => '13 (2d8+4) дробящего урона, и цель становится схваченной (Сл высвобождения 16). Пока цель схвачена, она опутана, и змея не может сдавливать другую цель.'],
                ],
                'is_system' => true,
            ],
        ];
    }
}
