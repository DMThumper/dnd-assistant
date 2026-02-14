<?php

namespace Database\Seeders;

use App\Models\RuleSystem;
use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $dnd5e = RuleSystem::where('slug', 'dnd-5e')->firstOrFail();

        Setting::updateOrCreate(
            ['slug' => 'eberron'],
            [
                'rule_system_id' => $dnd5e->id,
                'name' => ['ru' => 'Эберрон'],
                'description' => ['ru' => 'Мир магического нуара и паровых технологий. Континент Кхорвер выходит из разрушительной Последней Войны. Драконьи Метки, поезда-молнии, живые конструкты-Кованые и интриги Домов.'],
                'is_system' => true,
                'icon' => 'lightning-bolt',
                'color' => '#8B0000',
                'sort_order' => 1,
            ]
        );

        Setting::updateOrCreate(
            ['slug' => 'forgotten-realms'],
            [
                'rule_system_id' => $dnd5e->id,
                'name' => ['ru' => 'Забытые Королевства'],
                'description' => ['ru' => 'Классический мир высокого фэнтези. Фаэрун с его магами, драконами, подземельями и легендарными героями. Балдурс Гейт, Уотердип, Невервинтер.'],
                'is_system' => true,
                'icon' => 'castle',
                'color' => '#1E3A5F',
                'sort_order' => 2,
            ]
        );

        $this->command->info('Settings "Eberron" and "Forgotten Realms" seeded successfully.');
    }
}
