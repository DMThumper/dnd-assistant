<?php

namespace Database\Seeders;

use App\Models\Act;
use App\Models\Campaign;
use App\Models\GameSession;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;

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

        $this->seedSampleCampaign();
    }

    private function seedSampleCampaign(): void
    {
        $owner = User::whereHas('roles', fn($q) => $q->where('name', 'owner'))->first();
        if (!$owner) {
            $this->command->warn('Owner not found, skipping sample campaign.');
            return;
        }

        $eberron = Setting::where('slug', 'eberron')->first();
        if (!$eberron) {
            $this->command->warn('Eberron setting not found, skipping sample campaign.');
            return;
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
    }
}
