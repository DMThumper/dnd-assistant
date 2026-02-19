<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PassportSeeder::class,
            RolesAndPermissionsSeeder::class,
            OwnerSeeder::class,
            RuleSystemsSeeder::class,
            SettingsSeeder::class,
            RacesSeeder::class,
            ClassesSeeder::class,
            // Individual class seeders with complete data + subclasses
            DruidClassSeeder::class,
            MonkClassSeeder::class,
            RogueClassSeeder::class,
            MonstersSeeder::class,
            SpellsSeeder::class,
            FeatsSeeder::class,
            // TODO: Add these seeders as content is created
            // ItemsSeeder::class,
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
