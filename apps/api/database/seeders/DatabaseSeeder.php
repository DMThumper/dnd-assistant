<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            OwnerSeeder::class,
            // TODO: Add these seeders as content is created
            // RuleSystemsSeeder::class,      // D&D 5e rule system
            // SettingsSeeder::class,         // Eberron setting
            // RacesSeeder::class,
            // ClassesSeeder::class,
            // SpellsSeeder::class,
            // ItemsSeeder::class,
            // MonstersSeeder::class,
            // RulesSeeder::class,
        ]);
    }
}
