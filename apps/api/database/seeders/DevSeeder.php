<?php

namespace Database\Seeders;

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

        // TODO: Add development seeders as models are created
        // $this->call([
        //     DevCampaignsSeeder::class,
        //     DevCharactersSeeder::class,
        //     DevEncountersSeeder::class,
        // ]);
    }
}
