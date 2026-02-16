<?php

namespace Database\Seeders;

use App\Models\Act;
use App\Models\Campaign;
use App\Models\Character;
use App\Models\DisplayToken;
use App\Models\GameSession;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Development seeder - only runs in local environment
 * Creates sample data for testing
 */
class DevSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            $this->command->warn('DevSeeder should not run in production!');
            return;
        }

        $this->command->info('Running development seeders...');

        $campaign = $this->seedSampleCampaign();
        if ($campaign) {
            $this->seedTestPlayers($campaign);
            $this->seedTestDisplays($campaign);
        }
    }

    private function seedSampleCampaign(): ?Campaign
    {
        $owner = User::whereHas('roles', fn($q) => $q->where('name', 'owner'))->first();
        if (!$owner) {
            $this->command->warn('Owner not found, skipping sample campaign.');
            return null;
        }

        $eberron = Setting::where('slug', 'eberron')->first();
        if (!$eberron) {
            $this->command->warn('Eberron setting not found, skipping sample campaign.');
            return null;
        }

        // Create sample campaign
        $campaign = Campaign::updateOrCreate(
            ['slug' => 'tayny-sharna', 'user_id' => $owner->id],
            [
                'setting_id' => $eberron->id,
                'name' => ['ru' => 'Тайны Шарна'],
                'description' => ['ru' => 'Приключение в величайшем городе Кхорвера. Интриги Домов, тайны Калибернов и древние секреты глубин башен.'],
                'status' => Campaign::STATUS_ACTIVE,
                'settings' => [
                    'starting_level' => 1,
                    'ability_method' => 'point_buy',
                    'hp_method' => 'average',
                    'multiclassing' => true,
                    'feats' => true,
                ],
            ]
        );

        $this->command->info("Campaign '{$campaign->getTranslation('name', 'ru')}' created.");

        // Act 1
        $act1 = Act::updateOrCreate(
            ['campaign_id' => $campaign->id, 'number' => 1],
            [
                'name' => ['ru' => 'Прибытие в Шарн'],
                'description' => ['ru' => 'Герои прибывают в Город Башен и оказываются втянуты в первую интригу.'],
                'intro' => ['ru' => 'Поезд-молния Дома Орин мчится сквозь грозовые тучи к величайшему городу Кхорвера — Шарну. За окнами вагона мелькают бесконечные башни, уходящие в облака...'],
                'epilogue' => ['ru' => 'Первая загадка разгадана, но за ней скрывается нечто большее. Тени Шарна хранят древние тайны...'],
                'status' => Act::STATUS_COMPLETED,
                'sort_order' => 1,
            ]
        );

        // Act 1 Sessions
        GameSession::updateOrCreate(
            ['act_id' => $act1->id, 'number' => 1],
            [
                'name' => ['ru' => 'Поезд-молния'],
                'summary' => ['ru' => 'Герои познакомились в поезде и пережили нападение бандитов.'],
                'status' => GameSession::STATUS_COMPLETED,
                'played_at' => now()->subDays(14),
                'sort_order' => 1,
            ]
        );

        GameSession::updateOrCreate(
            ['act_id' => $act1->id, 'number' => 2],
            [
                'name' => ['ru' => 'Нижний город'],
                'summary' => ['ru' => 'Исследование трущоб и первая встреча с информатором.'],
                'status' => GameSession::STATUS_COMPLETED,
                'played_at' => now()->subDays(7),
                'sort_order' => 2,
            ]
        );

        GameSession::updateOrCreate(
            ['act_id' => $act1->id, 'number' => 3],
            [
                'name' => ['ru' => 'Тайный заказчик'],
                'summary' => ['ru' => 'Разоблачение первого злодея и выход на крупную организацию.'],
                'status' => GameSession::STATUS_COMPLETED,
                'played_at' => now()->subDays(1),
                'sort_order' => 3,
            ]
        );

        // Act 2
        $act2 = Act::updateOrCreate(
            ['campaign_id' => $campaign->id, 'number' => 2],
            [
                'name' => ['ru' => 'Заговор Изумрудного Когтя'],
                'description' => ['ru' => 'Герои расследуют деятельность террористической организации Изумрудный Коготь.'],
                'intro' => ['ru' => 'Следы преступлений ведут к организации, о которой шепчутся в тенях. Изумрудный Коготь — фанатики, мечтающие о возрождении древней империи...'],
                'status' => Act::STATUS_ACTIVE,
                'sort_order' => 2,
            ]
        );

        GameSession::updateOrCreate(
            ['act_id' => $act2->id, 'number' => 1],
            [
                'name' => ['ru' => 'Первые улики'],
                'status' => GameSession::STATUS_PLANNED,
                'sort_order' => 1,
            ]
        );

        GameSession::updateOrCreate(
            ['act_id' => $act2->id, 'number' => 2],
            [
                'name' => ['ru' => 'Логово культистов'],
                'status' => GameSession::STATUS_PLANNED,
                'sort_order' => 2,
            ]
        );

        // Act 3 (planned)
        Act::updateOrCreate(
            ['campaign_id' => $campaign->id, 'number' => 3],
            [
                'name' => ['ru' => 'Война Драконьих Меток'],
                'description' => ['ru' => 'Финальное противостояние с главным злодеем и раскрытие всех тайн.'],
                'status' => Act::STATUS_PLANNED,
                'sort_order' => 3,
            ]
        );

        $this->command->info('Sample campaign with acts and sessions seeded.');

        return $campaign;
    }

    private function seedTestPlayers(Campaign $campaign): void
    {
        // Create test player 1 - Torin (Dwarf Fighter)
        $player1 = User::updateOrCreate(
            ['email' => 'player@test.com'],
            [
                'name' => 'Тестовый Игрок',
                'password' => Hash::make('123'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $player1->assignRole('player');

        // Add player to campaign
        if (!$campaign->hasPlayer($player1)) {
            $campaign->players()->attach($player1->id, ['joined_at' => now()]);
        }

        // Create character for player 1
        Character::updateOrCreate(
            ['user_id' => $player1->id, 'campaign_id' => $campaign->id, 'name->ru' => 'Торин Дубощит'],
            [
                'name' => ['ru' => 'Торин Дубощит'],
                'backstory' => ['ru' => 'Бывший кузнец из клана Дубощитов. Покинул родные горы после нападения орков и теперь ищет приключений в Шарне.'],
                'race_slug' => 'dwarf',
                'class_slug' => 'fighter',
                'level' => 3,
                'experience_points' => 2700, // Enough to level up to 4
                'abilities' => [
                    'strength' => 16,
                    'dexterity' => 12,
                    'constitution' => 16,
                    'intelligence' => 10,
                    'wisdom' => 13,
                    'charisma' => 8,
                ],
                'current_hp' => 24, // Ранен в бою
                'max_hp' => 31,
                'temp_hp' => 5, // Временные ОЗ от барда
                'armor_class' => 18,
                'speed' => ['walk' => 7.5], // 25 ft in meters
                'inspiration' => true, // Имеет вдохновение
                'skill_proficiencies' => ['athletics', 'intimidation', 'perception'],
                'skill_expertise' => [],
                'saving_throw_proficiencies' => ['strength', 'constitution'],
                'proficiencies' => [
                    'armor' => ['light', 'medium', 'heavy', 'shields'],
                    'weapons' => ['simple', 'martial'],
                    'tools' => ['кузнечные инструменты'],
                    'languages' => ['Общий', 'Дварфский'],
                ],
                'features' => [
                    ['source' => 'race', 'name' => 'Тёмное зрение', 'description' => 'Видите в темноте на 18 м'],
                    ['source' => 'race', 'name' => 'Дварфская стойкость', 'description' => 'Преимущество на спасброски от яда'],
                    ['source' => 'class', 'name' => 'Боевой стиль: Защита', 'description' => '+1 КД в доспехах'],
                    ['source' => 'class', 'name' => 'Второе дыхание', 'description' => '1d10+3 ОЗ бонусным действием'],
                    ['source' => 'class', 'name' => 'Всплеск действий', 'description' => 'Дополнительное действие 1/отдых'],
                ],
                'class_resources' => [
                    ['name' => 'Второе дыхание', 'current' => 0, 'max' => 1, 'recharge' => 'short_rest'], // использовано
                    ['name' => 'Всплеск действий', 'current' => 1, 'max' => 1, 'recharge' => 'short_rest'],
                ],
                'currency' => ['cp' => 0, 'sp' => 15, 'ep' => 0, 'gp' => 42, 'pp' => 0],
                'is_alive' => true,
                'is_active' => true, // Активный персонаж игрока
                // Состояния D&D
                'conditions' => [
                    ['key' => 'frightened', 'name' => 'Испуган', 'source' => 'Драконий рык', 'duration' => 10, 'applied_at' => now()->toISOString()],
                ],
                // Кастомные правила (перки/увечья)
                'custom_rules' => [
                    [
                        'id' => 'lost-eye-1',
                        'name' => 'Потеря глаза',
                        'description' => 'Левый глаз выбит в бою с огром',
                        'icon' => '👁️',
                        'color' => '#ef4444',
                        'effects' => [
                            ['type' => 'penalty', 'category' => 'skill', 'target' => 'perception', 'value' => -2, 'description' => '-2 Внимательность'],
                            ['type' => 'bonus', 'category' => 'skill', 'target' => 'intimidation', 'value' => 1, 'description' => '+1 Запугивание'],
                        ],
                        'permanent' => true,
                        'source' => 'Сессия #2: Нижний город',
                        'applied_at' => now()->subDays(7)->toISOString(),
                        'notes' => 'Носит повязку на глазу',
                    ],
                ],
                // Инвентарь
                'inventory' => [
                    ['item_slug' => 'longsword', 'name' => 'Длинный меч', 'quantity' => 1],
                    ['item_slug' => 'shield', 'name' => 'Щит', 'quantity' => 1],
                    ['item_slug' => 'chain-mail', 'name' => 'Кольчуга', 'quantity' => 1],
                    ['item_slug' => 'health-potion', 'name' => 'Зелье лечения', 'quantity' => 2, 'notes' => '2d4+2 ОЗ'],
                    ['name' => 'Дварфский амулет', 'custom' => true, 'quantity' => 1, 'notes' => 'Семейная реликвия'],
                    ['item_slug' => 'torch', 'name' => 'Факел', 'quantity' => 5],
                    ['item_slug' => 'rations', 'name' => 'Рацион (дни)', 'quantity' => 3],
                ],
                // Экипировка
                'equipment' => [
                    'armor' => 'chain-mail',
                    'main_hand' => 'longsword',
                    'off_hand' => 'shield',
                    'amulet' => 'dwarf-amulet',
                ],
                // Статистика
                'stats' => [
                    'sessions_played' => 3,
                    'monsters_killed' => 12,
                    'damage_dealt' => 156,
                    'damage_taken' => 87,
                    'critical_hits' => 4,
                    'natural_ones' => 2,
                    'potions_used' => 1,
                    'gold_earned' => 95,
                    'gold_spent' => 53,
                ],
            ]
        );

        $this->command->info("Test player '{$player1->name}' created with character 'Торин Дубощит'.");

        // Create test player 2 with multiple characters (one dead)
        $player2 = User::updateOrCreate(
            ['email' => 'player2@test.com'],
            [
                'name' => 'Второй Игрок',
                'password' => Hash::make('123'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $player2->assignRole('player');

        if (!$campaign->hasPlayer($player2)) {
            $campaign->players()->attach($player2->id, ['joined_at' => now()]);
        }

        // Dead character (for graveyard)
        Character::updateOrCreate(
            ['user_id' => $player2->id, 'campaign_id' => $campaign->id, 'name->ru' => 'Гимли Каменнолобый'],
            [
                'name' => ['ru' => 'Гимли Каменнолобый'],
                'backstory' => ['ru' => 'Отважный воин, павший в бою с гоблинами.'],
                'race_slug' => 'dwarf',
                'class_slug' => 'barbarian',
                'level' => 2,
                'experience_points' => 450,
                'abilities' => [
                    'strength' => 17,
                    'dexterity' => 14,
                    'constitution' => 15,
                    'intelligence' => 8,
                    'wisdom' => 10,
                    'charisma' => 10,
                ],
                'current_hp' => 0,
                'max_hp' => 24,
                'armor_class' => 14,
                'speed' => ['walk' => 7.5],
                'is_alive' => false,
                'death_info' => [
                    'killed_by' => 'Гоблин-вожак',
                    'killing_blow' => '12 урона рубящего',
                    'cause' => 'combat',
                    'session_number' => 2,
                    'death_date' => now()->subDays(7)->toDateString(),
                    'last_words' => 'За Морию!',
                    'revived' => false,
                ],
                'stats' => [
                    'sessions_played' => 2,
                    'monsters_killed' => 5,
                    'damage_dealt' => 87,
                    'damage_taken' => 45,
                    'critical_hits' => 2,
                    'natural_ones' => 1,
                ],
            ]
        );

        // Alive character for player 2 (Wizard with spells)
        Character::updateOrCreate(
            ['user_id' => $player2->id, 'campaign_id' => $campaign->id, 'name->ru' => 'Эльминстер'],
            [
                'name' => ['ru' => 'Эльминстер'],
                'backstory' => ['ru' => 'Молодой волшебник из академии Аундэйра, ищущий древние знания в Шарне.'],
                'race_slug' => 'human',
                'class_slug' => 'wizard',
                'level' => 3,
                'experience_points' => 900,
                'abilities' => [
                    'strength' => 8,
                    'dexterity' => 14,
                    'constitution' => 13,
                    'intelligence' => 17,
                    'wisdom' => 12,
                    'charisma' => 10,
                ],
                'current_hp' => 14, // Слегка ранен
                'max_hp' => 18,
                'temp_hp' => 0,
                'armor_class' => 12, // Mage armor не активен
                'speed' => ['walk' => 9],
                'inspiration' => false,
                'skill_proficiencies' => ['arcana', 'history', 'investigation'],
                'skill_expertise' => [],
                'saving_throw_proficiencies' => ['intelligence', 'wisdom'],
                'proficiencies' => [
                    'armor' => [],
                    'weapons' => ['dagger', 'dart', 'sling', 'quarterstaff', 'light-crossbow'],
                    'tools' => [],
                    'languages' => ['Общий', 'Эльфийский', 'Драконий'],
                ],
                'features' => [
                    ['source' => 'race', 'name' => 'Бонусная черта', 'description' => 'Получаете одну черту по выбору на 1 уровне'],
                    ['source' => 'class', 'name' => 'Магия', 'description' => 'Подготовка и использование заклинаний волшебника'],
                    ['source' => 'class', 'name' => 'Магическое восстановление', 'description' => 'Восстановление ячеек на коротком отдыхе'],
                    ['source' => 'class', 'name' => 'Школа Воплощения', 'description' => 'Специализация в школе Воплощения'],
                    ['source' => 'class', 'name' => 'Лепка заклинаний', 'description' => 'Союзники автоматически проходят спасброски от ваших заклинаний школы Воплощения'],
                ],
                'class_resources' => [
                    ['name' => 'Магическое восстановление', 'current' => 0, 'max' => 1, 'recharge' => 'long_rest'],
                ],
                'currency' => ['cp' => 0, 'sp' => 5, 'ep' => 0, 'gp' => 28, 'pp' => 0],
                'is_alive' => true,
                'is_active' => true,
                // Состояния
                'conditions' => [
                    ['key' => 'poisoned', 'name' => 'Отравлен', 'source' => 'Яд паука', 'duration' => 60, 'applied_at' => now()->toISOString()],
                ],
                // Кастомные правила
                'custom_rules' => [
                    [
                        'id' => 'arcane-mark-1',
                        'name' => 'Печать Аундэйра',
                        'description' => 'Магическая печать академии на левой руке',
                        'icon' => '✨',
                        'color' => '#3b82f6',
                        'effects' => [
                            ['type' => 'bonus', 'category' => 'skill', 'target' => 'arcana', 'value' => 1, 'description' => '+1 Магия при проверках в библиотеках'],
                        ],
                        'permanent' => true,
                        'source' => 'Обучение в Академии',
                        'applied_at' => now()->subYears(1)->toISOString(),
                    ],
                ],
                // Инвентарь
                'inventory' => [
                    ['item_slug' => 'quarterstaff', 'name' => 'Боевой посох', 'quantity' => 1],
                    ['item_slug' => 'spellbook', 'name' => 'Книга заклинаний', 'quantity' => 1, 'notes' => '15 заклинаний записано'],
                    ['item_slug' => 'component-pouch', 'name' => 'Сумка с компонентами', 'quantity' => 1],
                    ['item_slug' => 'health-potion', 'name' => 'Зелье лечения', 'quantity' => 1],
                    ['item_slug' => 'scroll', 'name' => 'Свиток: Обнаружение магии', 'quantity' => 1],
                    ['name' => 'Кристалл-фокус', 'custom' => true, 'quantity' => 1, 'notes' => 'Аркановый фокус'],
                ],
                // Экипировка
                'equipment' => [
                    'main_hand' => 'quarterstaff',
                ],
                // Заклинания волшебника
                'known_spells' => [
                    // Заговоры
                    'fire-bolt', 'light', 'mage-hand', 'prestidigitation',
                    // 1 уровень
                    'magic-missile', 'shield', 'mage-armor', 'detect-magic', 'identify', 'sleep',
                    // 2 уровень
                    'scorching-ray', 'misty-step',
                ],
                'prepared_spells' => [
                    'fire-bolt', 'light', 'mage-hand', // заговоры всегда готовы
                    'magic-missile', 'shield', 'mage-armor', 'detect-magic', // 1 уровень
                    'scorching-ray', // 2 уровень
                ],
                'spell_slots_remaining' => [
                    '1' => 2, // из 4 слотов 1 уровня использовано 2
                    '2' => 1, // из 2 слотов 2 уровня использован 1
                ],
                // Мультикласс (для примера, что структура поддерживается)
                'class_levels' => [
                    'wizard' => 3,
                ],
                // Статистика
                'stats' => [
                    'sessions_played' => 3,
                    'monsters_killed' => 6,
                    'damage_dealt' => 78,
                    'damage_taken' => 34,
                    'critical_hits' => 1,
                    'natural_ones' => 3,
                    'potions_used' => 0,
                    'gold_earned' => 80,
                    'gold_spent' => 52,
                ],
            ]
        );

        $this->command->info("Test player '{$player2->name}' created with 2 characters (1 alive, 1 dead).");

        // Create test player 3 - Bard
        $player3 = User::updateOrCreate(
            ['email' => 'player3@test.com'],
            [
                'name' => 'Третий Игрок',
                'password' => Hash::make('123'),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );
        $player3->assignRole('player');

        if (!$campaign->hasPlayer($player3)) {
            $campaign->players()->attach($player3->id, ['joined_at' => now()]);
        }

        // Bard character (active)
        Character::updateOrCreate(
            ['user_id' => $player3->id, 'campaign_id' => $campaign->id, 'name->ru' => 'Лира Песнь'],
            [
                'name' => ['ru' => 'Лира Песнь'],
                'backstory' => ['ru' => 'Полуэльфийская бардесса, путешествующая по Кхорверу в поисках забытых легенд и древних песен.'],
                'race_slug' => 'half-elf',
                'class_slug' => 'bard',
                'level' => 3,
                'experience_points' => 900,
                'abilities' => [
                    'strength' => 10,
                    'dexterity' => 14,
                    'constitution' => 12,
                    'intelligence' => 13,
                    'wisdom' => 10,
                    'charisma' => 17,
                ],
                'current_hp' => 21, // Полное здоровье
                'max_hp' => 21,
                'temp_hp' => 0,
                'armor_class' => 14, // Кожаный + ЛОВ
                'speed' => ['walk' => 9],
                'inspiration' => false,
                'skill_proficiencies' => ['persuasion', 'performance', 'deception', 'insight', 'perception', 'acrobatics'],
                'skill_expertise' => ['persuasion', 'performance'], // Экспертиза барда
                'saving_throw_proficiencies' => ['dexterity', 'charisma'],
                'proficiencies' => [
                    'armor' => ['light'],
                    'weapons' => ['simple', 'hand-crossbow', 'longsword', 'rapier', 'shortsword'],
                    'tools' => ['лютня', 'флейта', 'барабан'],
                    'languages' => ['Общий', 'Эльфийский', 'Гномий'],
                ],
                'features' => [
                    ['source' => 'race', 'name' => 'Тёмное зрение', 'description' => 'Видите в темноте на 18 м'],
                    ['source' => 'race', 'name' => 'Наследие фей', 'description' => 'Преимущество на спасброски от очарования'],
                    ['source' => 'class', 'name' => 'Бардовское вдохновение', 'description' => 'd6 для союзника, ХАР раз за отдых'],
                    ['source' => 'class', 'name' => 'Мастер на все руки', 'description' => '+1 к проверкам навыков без владения'],
                    ['source' => 'class', 'name' => 'Песнь отдыха', 'description' => '+1d6 ОЗ при коротком отдыхе'],
                    ['source' => 'class', 'name' => 'Коллегия Знаний', 'description' => '3 дополнительных владения навыками'],
                ],
                'class_resources' => [
                    ['name' => 'Бардовское вдохновение', 'current' => 2, 'max' => 3, 'recharge' => 'long_rest'],
                ],
                'currency' => ['cp' => 10, 'sp' => 25, 'ep' => 0, 'gp' => 65, 'pp' => 0],
                'is_alive' => true,
                'is_active' => true,
                // Нет состояний - бард в порядке
                'conditions' => [],
                // Благословение за спасение NPC
                'custom_rules' => [
                    [
                        'id' => 'blessing-storyteller-1',
                        'name' => 'Благословение Рассказчика',
                        'description' => 'Благословение от спасённого летописца Дома Сивис',
                        'icon' => '📜',
                        'color' => '#22c55e',
                        'effects' => [
                            ['type' => 'bonus', 'category' => 'skill', 'target' => 'history', 'value' => 2, 'description' => '+2 История'],
                        ],
                        'permanent' => false,
                        'duration' => '30 дней',
                        'source' => 'Квест: Спасение летописца',
                        'applied_at' => now()->subDays(10)->toISOString(),
                    ],
                ],
                // Инвентарь барда
                'inventory' => [
                    ['item_slug' => 'rapier', 'name' => 'Рапира', 'quantity' => 1],
                    ['item_slug' => 'leather-armor', 'name' => 'Кожаный доспех', 'quantity' => 1],
                    ['name' => 'Лютня мастерской работы', 'custom' => true, 'quantity' => 1, 'notes' => 'Бардовский фокус'],
                    ['item_slug' => 'health-potion', 'name' => 'Зелье лечения', 'quantity' => 2],
                    ['name' => 'Записная книжка с легендами', 'custom' => true, 'quantity' => 1],
                    ['item_slug' => 'perfume', 'name' => 'Духи', 'quantity' => 1],
                ],
                // Экипировка
                'equipment' => [
                    'armor' => 'leather-armor',
                    'main_hand' => 'rapier',
                ],
                // Заклинания барда
                'known_spells' => [
                    // Заговоры
                    'vicious-mockery', 'minor-illusion',
                    // 1 уровень
                    'healing-word', 'faerie-fire', 'thunderwave', 'dissonant-whispers',
                    // 2 уровень
                    'suggestion', 'hold-person',
                ],
                'prepared_spells' => [], // Барды знают заклинания, не готовят
                'spell_slots_remaining' => [
                    '1' => 4, // Все слоты целы
                    '2' => 2,
                ],
                'class_levels' => [
                    'bard' => 3,
                ],
                // Статистика
                'stats' => [
                    'sessions_played' => 3,
                    'monsters_killed' => 3,
                    'damage_dealt' => 42,
                    'damage_taken' => 18,
                    'critical_hits' => 0,
                    'natural_ones' => 1,
                    'potions_used' => 0,
                    'gold_earned' => 90,
                    'gold_spent' => 25,
                ],
            ]
        );

        $this->command->info("Test player '{$player3->name}' created with character 'Лира Песнь'.");
    }

    private function seedTestDisplays(Campaign $campaign): void
    {
        $owner = User::whereHas('roles', fn($q) => $q->where('name', 'owner'))->first();

        // 1. Display waiting for pairing (fresh, with valid code)
        $waitingDisplay = DisplayToken::updateOrCreate(
            ['token' => 'test-waiting-display-token'],
            [
                'code' => '1234',
                'status' => DisplayToken::STATUS_WAITING,
                'code_expires_at' => now()->addMinutes(5),
                'metadata' => ['user_agent' => 'Test Browser', 'purpose' => 'testing'],
            ]
        );
        $this->command->info("Waiting display created with code: {$waitingDisplay->code}");

        // 2. Display already paired to campaign (online)
        $pairedDisplay = DisplayToken::updateOrCreate(
            ['token' => 'test-paired-display-token'],
            [
                'code' => '5678',
                'campaign_id' => $campaign->id,
                'user_id' => $owner->id,
                'name' => 'Гостиная ТВ',
                'status' => DisplayToken::STATUS_PAIRED,
                'code_expires_at' => now()->subMinutes(10), // expired, but paired
                'last_heartbeat_at' => now(), // alive
                'metadata' => ['user_agent' => 'Smart TV Browser', 'purpose' => 'testing'],
            ]
        );
        $this->command->info("Paired display '{$pairedDisplay->name}' created (online).");

        // 3. Display paired but offline (old heartbeat)
        $offlineDisplay = DisplayToken::updateOrCreate(
            ['token' => 'test-offline-display-token'],
            [
                'code' => '9999',
                'campaign_id' => $campaign->id,
                'user_id' => $owner->id,
                'name' => 'Спальня монитор',
                'status' => DisplayToken::STATUS_PAIRED,
                'code_expires_at' => now()->subMinutes(30),
                'last_heartbeat_at' => now()->subMinutes(5), // offline (>60 sec)
                'metadata' => ['user_agent' => 'Chrome', 'purpose' => 'testing'],
            ]
        );
        $this->command->info("Paired display '{$offlineDisplay->name}' created (offline).");

        $this->command->info('Test displays seeded.');
    }
}
