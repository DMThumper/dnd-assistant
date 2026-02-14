<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Users
            'view users',
            'create users',
            'edit users',
            'delete users',

            // Campaigns
            'view campaigns',
            'create campaigns',
            'edit campaigns',
            'delete campaigns',

            // Content (spells, monsters, items, races, classes)
            'view content',
            'create content',
            'edit content',
            'delete content',

            // Rule Systems
            'view rule-systems',
            'create rule-systems',
            'edit rule-systems',
            'delete rule-systems',

            // Settings (game worlds)
            'view settings',
            'create settings',
            'edit settings',
            'delete settings',

            // Characters
            'view characters',
            'create characters',
            'edit characters',
            'delete characters',

            // Media
            'view media',
            'create media',
            'delete media',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'api']
            );
        }

        // Create roles and assign permissions

        // Owner - full access, can manage users and assign DM role
        $owner = Role::firstOrCreate(
            ['name' => 'owner', 'guard_name' => 'api']
        );
        $owner->givePermissionTo(Permission::all());

        // DM - can manage campaigns, content, and game sessions
        $dm = Role::firstOrCreate(
            ['name' => 'dm', 'guard_name' => 'api']
        );
        $dm->givePermissionTo([
            'view campaigns', 'create campaigns', 'edit campaigns', 'delete campaigns',
            'view content', 'create content', 'edit content', 'delete content',
            'view rule-systems', 'create rule-systems', 'edit rule-systems', 'delete rule-systems',
            'view settings', 'create settings', 'edit settings', 'delete settings',
            'view characters', 'create characters', 'edit characters', 'delete characters',
            'view media', 'create media', 'delete media',
        ]);

        // Player - can view campaigns they're in and manage their own characters
        $player = Role::firstOrCreate(
            ['name' => 'player', 'guard_name' => 'api']
        );
        $player->givePermissionTo([
            'view campaigns',
            'view content',
            'view characters', 'create characters', 'edit characters',
        ]);
    }
}
