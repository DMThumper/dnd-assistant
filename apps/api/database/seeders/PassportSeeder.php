<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Laravel\Passport\Client;

class PassportSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure Passport keys exist
        if (! file_exists(storage_path('oauth-private.key'))) {
            Artisan::call('passport:keys', ['--force' => true]);
            $this->command->info('Passport keys generated.');
        }

        // Create personal access client if not exists
        $personalClient = Client::where('personal_access_client', true)
            ->where('provider', 'users')
            ->first();

        if (! $personalClient) {
            Artisan::call('passport:client', [
                '--personal' => true,
                '--name' => 'DnD Assistant Personal Access Client',
                '--no-interaction' => true,
            ]);
            $this->command->info('Personal access client created.');
        } else {
            $this->command->info('Personal access client already exists.');
        }
    }
}