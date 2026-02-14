<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Client;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Reset Spatie permission cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Run roles and permissions seeder
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        // Create Passport personal access client manually (no interactive prompt)
        Client::create([
            'name' => 'Test Personal Access Client',
            'secret' => 'test-secret',
            'redirect' => 'http://localhost',
            'personal_access_client' => true,
            'password_client' => false,
            'revoked' => false,
        ]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('Password123'),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $user->assignRole('player');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'access_token',
                    'token_type',
                    'expires_at',
                    'user' => ['id', 'name', 'email', 'roles'],
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
            ]);

        $this->assertNotEmpty($response->json('data.access_token'));
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('Password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_login_fails_for_unverified_email(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('Password123'),
            'email_verified_at' => null,
            'is_active' => false,
        ]);
        $user->assignRole('player');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'requires_verification' => true,
            ]);
    }

    public function test_login_fails_for_inactive_user(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('Password123'),
            'email_verified_at' => now(),
            'is_active' => false,
        ]);
        $user->assignRole('player');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_login_fails_with_missing_email(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'password' => 'Password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_login_fails_with_missing_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_login_returns_correct_roles_and_permissions(): void
    {
        $user = User::factory()->create([
            'email' => 'dm@example.com',
            'password' => bcrypt('Password123'),
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $user->assignRole('dm');

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'dm@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200);

        $data = $response->json('data.user');
        $this->assertContains('dm', $data['roles']);
        $this->assertTrue($data['backoffice_access']);
    }
}
