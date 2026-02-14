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
            RuleSystemsSeeder::class,
            SettingsSeeder::class,
            // TODO: Add these seeders as content is created
            // RacesSeeder::class,
            // ClassesSeeder::class,
            // SpellsSeeder::class,
            // ItemsSeeder::class,
            // MonstersSeeder::class,
            // RulesSeeder::class,
        ]);

        // Development seeders (only in local environment)
        if (app()->environment('local')) {
            $this->call([
                DevSeeder::class,
            ]);
        }
    }
}
