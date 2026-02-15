<?php

namespace Tests\Feature\CampaignControl;

use App\Models\Act;
use App\Models\Campaign;
use App\Models\GameSession;
use App\Models\RuleSystem;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class GameSessionControlTest extends TestCase
{
    use RefreshDatabase;

    private User $dm;
    private Campaign $campaign;
    private Act $act;

    protected function setUp(): void
    {
        parent::setUp();

        // Reset Spatie permission cache and seed roles
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        $this->seed(RolesAndPermissionsSeeder::class);

        // Create Passport personal access client
        Client::create([
            'name' => 'Test Personal Access Client',
            'secret' => 'test-secret',
            'redirect' => 'http://localhost',
            'personal_access_client' => true,
            'password_client' => false,
            'revoked' => false,
        ]);

        // Create DM with appropriate role
        $this->dm = User::factory()->create([
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $this->dm->assignRole('dm');

        // Create rule system and setting
        $ruleSystem = RuleSystem::factory()->create();
        $setting = Setting::factory()->forRuleSystem($ruleSystem)->create();

        // Create campaign owned by DM
        $this->campaign = Campaign::factory()->forOwner($this->dm)->forSetting($setting)->create();

        // Create an act
        $this->act = Act::factory()->forCampaign($this->campaign)->number(1)->active()->create();
    }

    // =========================================================================
    // List Sessions
    // =========================================================================

    public function test_dm_can_list_sessions(): void
    {
        // Create some sessions
        GameSession::factory()->forAct($this->act)->number(1)->completed()->create();
        GameSession::factory()->forAct($this->act)->number(2)->active()->create();
        GameSession::factory()->forAct($this->act)->number(3)->planned()->create();

        Passport::actingAs($this->dm);

        $response = $this->getJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.number', 1)
            ->assertJsonPath('data.1.number', 2)
            ->assertJsonPath('data.2.number', 3);
    }

    public function test_list_sessions_returns_empty_for_new_act(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->getJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions");

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    // =========================================================================
    // Create Session
    // =========================================================================

    public function test_dm_can_create_session(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions", [
            'name' => 'Поезд молний',
            'summary' => 'Приключенцы путешествуют на поезде',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.number', 1)
            ->assertJsonPath('data.name', 'Поезд молний')
            ->assertJsonPath('data.status', 'planned');

        $this->assertDatabaseHas('game_sessions', [
            'act_id' => $this->act->id,
            'number' => 1,
        ]);
    }

    public function test_created_session_gets_correct_number(): void
    {
        GameSession::factory()->forAct($this->act)->number(1)->create();

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions", [
            'name' => 'Вторая сессия',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.number', 2);
    }

    public function test_create_session_with_played_date(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions", [
            'name' => 'Прошедшая сессия',
            'status' => 'completed',
            'played_at' => '2026-01-15',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.played_at', '2026-01-15');
    }

    // =========================================================================
    // Update Session
    // =========================================================================

    public function test_dm_can_update_session(): void
    {
        $session = GameSession::factory()->forAct($this->act)->number(1)->create();

        Passport::actingAs($this->dm);

        $response = $this->patchJson(
            "/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions/{$session->id}",
            [
                'name' => 'Обновлённая сессия',
                'summary' => 'Новое описание',
            ]
        );

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Обновлённая сессия')
            ->assertJsonPath('data.summary', 'Новое описание');
    }

    public function test_dm_can_update_session_status(): void
    {
        $session = GameSession::factory()->forAct($this->act)->planned()->create();

        Passport::actingAs($this->dm);

        $response = $this->postJson(
            "/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions/{$session->id}/status",
            ['status' => 'completed']
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.is_completed', true);

        // Should set played_at automatically
        $session->refresh();
        $this->assertNotNull($session->played_at);
    }

    // =========================================================================
    // Delete Session
    // =========================================================================

    public function test_dm_can_delete_session(): void
    {
        $session = GameSession::factory()->forAct($this->act)->number(1)->create();

        Passport::actingAs($this->dm);

        $response = $this->deleteJson(
            "/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions/{$session->id}"
        );

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('game_sessions', ['id' => $session->id]);
    }

    public function test_deleting_session_renumbers_remaining_sessions(): void
    {
        $session1 = GameSession::factory()->forAct($this->act)->number(1)->create(['sort_order' => 0]);
        $session2 = GameSession::factory()->forAct($this->act)->number(2)->create(['sort_order' => 1]);
        $session3 = GameSession::factory()->forAct($this->act)->number(3)->create(['sort_order' => 2]);

        Passport::actingAs($this->dm);

        $this->deleteJson(
            "/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions/{$session2->id}"
        );

        $this->assertDatabaseHas('game_sessions', ['id' => $session1->id, 'number' => 1]);
        $this->assertDatabaseHas('game_sessions', ['id' => $session3->id, 'number' => 2]);
    }

    // =========================================================================
    // Reorder Sessions
    // =========================================================================

    public function test_dm_can_reorder_sessions(): void
    {
        $session1 = GameSession::factory()->forAct($this->act)->number(1)->create(['sort_order' => 0]);
        $session2 = GameSession::factory()->forAct($this->act)->number(2)->create(['sort_order' => 1]);
        $session3 = GameSession::factory()->forAct($this->act)->number(3)->create(['sort_order' => 2]);

        Passport::actingAs($this->dm);

        $response = $this->postJson(
            "/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions/reorder",
            ['session_ids' => [$session3->id, $session1->id, $session2->id]]
        );

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('game_sessions', ['id' => $session3->id, 'number' => 1, 'sort_order' => 0]);
        $this->assertDatabaseHas('game_sessions', ['id' => $session1->id, 'number' => 2, 'sort_order' => 1]);
        $this->assertDatabaseHas('game_sessions', ['id' => $session2->id, 'number' => 3, 'sort_order' => 2]);
    }

    // =========================================================================
    // Move Session Between Acts
    // =========================================================================

    public function test_dm_can_move_session_to_another_act(): void
    {
        $session = GameSession::factory()->forAct($this->act)->number(1)->create();
        $act2 = Act::factory()->forCampaign($this->campaign)->number(2)->create();

        Passport::actingAs($this->dm);

        $response = $this->postJson(
            "/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions/{$session->id}/move",
            ['target_act_id' => $act2->id]
        );

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.act_id', $act2->id);

        $session->refresh();
        $this->assertEquals($act2->id, $session->act_id);
    }

    public function test_cannot_move_session_to_act_from_another_campaign(): void
    {
        $session = GameSession::factory()->forAct($this->act)->number(1)->create();

        // Create another campaign's act
        $otherCampaign = Campaign::factory()->create();
        $otherAct = Act::factory()->forCampaign($otherCampaign)->create();

        Passport::actingAs($this->dm);

        $response = $this->postJson(
            "/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$this->act->id}/sessions/{$session->id}/move",
            ['target_act_id' => $otherAct->id]
        );

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    // =========================================================================
    // Global Session Number
    // =========================================================================

    public function test_session_has_correct_global_number(): void
    {
        // Create sessions in first act
        GameSession::factory()->forAct($this->act)->number(1)->create(['sort_order' => 0]);
        GameSession::factory()->forAct($this->act)->number(2)->create(['sort_order' => 1]);

        // Create second act
        $act2 = Act::factory()->forCampaign($this->campaign)->number(2)->create(['sort_order' => 1]);
        $session3 = GameSession::factory()->forAct($act2)->number(1)->create(['sort_order' => 0]);

        Passport::actingAs($this->dm);

        $response = $this->getJson(
            "/api/v1/backoffice/campaigns/{$this->campaign->id}/acts/{$act2->id}/sessions/{$session3->id}"
        );

        $response->assertStatus(200)
            ->assertJsonPath('data.number', 1)
            ->assertJsonPath('data.global_number', 3);
    }
}
