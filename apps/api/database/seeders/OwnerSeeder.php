<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class OwnerSeeder extends Seeder
{
    public function run(): void
    {
        $name = env('OWNER_NAME', 'Dungeon Master');
        $email = env('OWNER_EMAIL', 'dm@dnd-assistant.local');
        $password = env('OWNER_PASSWORD', 'secret123');

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'is_active' => true,
            ]
        );

        // Ensure owner has both owner and dm roles
        if (!$user->hasRole('owner')) {
            $user->assignRole('owner');
        }
        if (!$user->hasRole('dm')) {
            $user->assignRole('dm');
        }
    }
}
