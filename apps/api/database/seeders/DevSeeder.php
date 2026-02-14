<?php

namespace Database\Seeders;

use App\Models\Act;
use App\Models\Campaign;
use App\Models\Character;
use App\Models\GameSession;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

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
                'experience_points' => 900,
                'abilities' => [
                    'strength' => 16,
                    'dexterity' => 12,
                    'constitution' => 16,
                    'intelligence' => 10,
                    'wisdom' => 13,
                    'charisma' => 8,
                ],
                'current_hp' => 31,
                'max_hp' => 31,
                'temp_hp' => 0,
                'armor_class' => 18,
                'speed' => ['walk' => 7.5], // 25 ft in meters
                'inspiration' => false,
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
                    ['name' => 'Второе дыхание', 'current' => 1, 'max' => 1, 'recharge' => 'short_rest'],
                    ['name' => 'Всплеск действий', 'current' => 1, 'max' => 1, 'recharge' => 'short_rest'],
                ],
                'currency' => ['cp' => 0, 'sp' => 15, 'ep' => 0, 'gp' => 42, 'pp' => 0],
                'is_alive' => true,
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

        // Alive character for player 2
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
                'current_hp' => 18,
                'max_hp' => 18,
                'armor_class' => 12,
                'speed' => ['walk' => 9],
                'skill_proficiencies' => ['arcana', 'history', 'investigation'],
                'saving_throw_proficiencies' => ['intelligence', 'wisdom'],
                'features' => [
                    ['source' => 'class', 'name' => 'Магия', 'description' => 'Подготовка и использование заклинаний волшебника'],
                    ['source' => 'class', 'name' => 'Магическое восстановление', 'description' => 'Восстановление ячеек на коротком отдыхе'],
                    ['source' => 'class', 'name' => 'Школа Воплощения', 'description' => 'Специализация в школе Воплощения'],
                ],
                'currency' => ['cp' => 0, 'sp' => 5, 'ep' => 0, 'gp' => 28, 'pp' => 0],
                'is_alive' => true,
            ]
        );

        $this->command->info("Test player '{$player2->name}' created with 2 characters (1 alive, 1 dead).");
    }
}
