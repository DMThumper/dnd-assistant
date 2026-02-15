<?php

namespace Tests\Feature\CampaignControl;

use App\Models\Campaign;
use App\Models\Character;
use App\Models\RuleSystem;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;
use Tests\TestCase;

class CharacterControlTest extends TestCase
{
    use RefreshDatabase;

    protected User $dm;
    protected User $player;
    protected Campaign $campaign;
    protected Character $character;

    protected function setUp(): void
    {
        parent::setUp();

        // Reset Spatie permission cache
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        // Create Passport personal access client
        Client::create([
            'name' => 'Test Personal Access Client',
            'secret' => 'test-secret',
            'redirect' => 'http://localhost',
            'personal_access_client' => true,
            'password_client' => false,
            'revoked' => false,
        ]);

        // Create DM user
        $this->dm = User::factory()->create([
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $this->dm->assignRole('dm');

        // Create player user
        $this->player = User::factory()->create([
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $this->player->assignRole('player');

        // Create rule system and setting
        $ruleSystem = RuleSystem::factory()->create();
        $setting = Setting::factory()->forRuleSystem($ruleSystem)->create();

        // Create campaign owned by DM
        $this->campaign = Campaign::factory()
            ->forOwner($this->dm)
            ->forSetting($setting)
            ->create();

        // Create character owned by player in DM's campaign
        $this->character = Character::factory()
            ->forOwner($this->player)
            ->forCampaign($this->campaign)
            ->withHp(30, 40, 0)
            ->create();
    }

    // ==========================================
    // List Characters Tests
    // ==========================================

    public function test_dm_can_list_campaign_characters(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->getJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'characters' => [
                        '*' => [
                            'id',
                            'name',
                            'level',
                            'current_hp',
                            'max_hp',
                            'is_alive',
                            'is_active',
                        ],
                    ],
                ],
            ])
            ->assertJson(['success' => true]);
    }

    public function test_non_dm_cannot_list_campaign_characters(): void
    {
        Passport::actingAs($this->player);

        $response = $this->getJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters");

        $response->assertStatus(403);
    }

    public function test_dm_can_filter_characters_by_status(): void
    {
        // Create an inactive character
        Character::factory()
            ->forOwner($this->player)
            ->forCampaign($this->campaign)
            ->inactive()
            ->create();

        Passport::actingAs($this->dm);

        $response = $this->getJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters?is_active=true");

        $response->assertStatus(200);
        $characters = $response->json('data.characters');

        foreach ($characters as $character) {
            $this->assertTrue($character['is_active']);
        }
    }

    // ==========================================
    // HP Control Tests
    // ==========================================

    public function test_dm_can_deal_damage_to_character(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-hp", [
            'amount' => 10,
            'type' => 'damage',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'character' => [
                        'current_hp' => 20, // 30 - 10 = 20
                        'max_hp' => 40,
                    ],
                ],
            ]);

        $this->character->refresh();
        $this->assertEquals(20, $this->character->current_hp);
    }

    public function test_dm_can_heal_character(): void
    {
        // Set character to low HP first
        $this->character->update(['current_hp' => 15]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-hp", [
            'amount' => 10,
            'type' => 'healing',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'character' => [
                        'current_hp' => 25, // 15 + 10 = 25
                    ],
                ],
            ]);
    }

    public function test_healing_does_not_exceed_max_hp(): void
    {
        // Character at 30/40
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-hp", [
            'amount' => 50,
            'type' => 'healing',
        ]);

        $response->assertStatus(200);
        $this->character->refresh();
        $this->assertEquals(40, $this->character->current_hp); // Capped at max_hp
    }

    public function test_dm_can_add_temp_hp(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-hp", [
            'amount' => 15,
            'type' => 'temp_hp',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'character' => [
                        'temp_hp' => 15,
                    ],
                ],
            ]);
    }

    public function test_dm_can_set_hp_directly(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-hp", [
            'amount' => 25,
            'type' => 'set',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'character' => [
                        'current_hp' => 25,
                    ],
                ],
            ]);
    }

    public function test_damage_reduces_temp_hp_first(): void
    {
        // Set up character with temp HP
        $this->character->update(['temp_hp' => 10, 'current_hp' => 30]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-hp", [
            'amount' => 15,
            'type' => 'damage',
        ]);

        $response->assertStatus(200);
        $this->character->refresh();

        // 15 damage: 10 absorbed by temp HP, 5 goes to current HP
        $this->assertEquals(0, $this->character->temp_hp);
        $this->assertEquals(25, $this->character->current_hp); // 30 - 5 = 25
    }

    public function test_player_cannot_modify_hp(): void
    {
        Passport::actingAs($this->player);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-hp", [
            'amount' => 10,
            'type' => 'damage',
        ]);

        $response->assertStatus(403);
    }

    // ==========================================
    // Conditions Tests
    // ==========================================

    public function test_dm_can_add_condition(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-conditions", [
            'action' => 'add',
            'key' => 'poisoned',
            'name' => 'Отравлен',
            'source' => 'Яд паука',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->character->refresh();
        $conditions = collect($this->character->conditions);
        $this->assertTrue($conditions->contains('key', 'poisoned'));
    }

    public function test_dm_can_remove_condition(): void
    {
        // Add condition first
        $this->character->update([
            'conditions' => [
                ['key' => 'poisoned', 'name' => 'Отравлен', 'source' => null],
            ],
        ]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-conditions", [
            'action' => 'remove',
            'key' => 'poisoned',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->character->refresh();
        $conditions = collect($this->character->conditions);
        $this->assertFalse($conditions->contains('key', 'poisoned'));
    }

    public function test_player_cannot_modify_conditions(): void
    {
        Passport::actingAs($this->player);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-conditions", [
            'action' => 'add',
            'key' => 'poisoned',
        ]);

        $response->assertStatus(403);
    }

    // ==========================================
    // Custom Rules Tests
    // ==========================================

    public function test_dm_can_add_custom_rule(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/custom-rules", [
            'action' => 'add',
            'name' => 'Потеря глаза',
            'description' => 'Персонаж потерял глаз в бою',
            'permanent' => true,
            'effects' => [
                ['type' => 'penalty', 'category' => 'skill', 'target' => 'perception', 'value' => -2],
                ['type' => 'bonus', 'category' => 'skill', 'target' => 'intimidation', 'value' => 1],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->character->refresh();
        $rules = collect($this->character->custom_rules);
        $this->assertTrue($rules->contains('name', 'Потеря глаза'));
    }

    public function test_dm_can_remove_custom_rule(): void
    {
        // Add rule first
        $ruleId = 'rule_' . uniqid();
        $this->character->update([
            'custom_rules' => [
                [
                    'id' => $ruleId,
                    'name' => 'Тестовое правило',
                    'effects' => [],
                ],
            ],
        ]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/custom-rules", [
            'action' => 'remove',
            'rule_id' => $ruleId,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->character->refresh();
        $this->assertEmpty($this->character->custom_rules);
    }

    // ==========================================
    // XP Award Tests
    // ==========================================

    public function test_dm_can_award_xp_to_all_active_characters(): void
    {
        // Create another active character
        $character2 = Character::factory()
            ->forOwner($this->player)
            ->forCampaign($this->campaign)
            ->active()
            ->create(['experience_points' => 0]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/award-xp", [
            'amount' => 100,
            'all_active' => true,
            'reason' => 'Победа над гоблинами',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'characters_count' => 2,
                ],
            ]);

        $this->character->refresh();
        $character2->refresh();
        $this->assertEquals(100, $this->character->experience_points);
        $this->assertEquals(100, $character2->experience_points);
    }

    public function test_dm_can_award_xp_to_specific_characters(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/award-xp", [
            'amount' => 50,
            'character_ids' => [$this->character->id],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'characters_count' => 1,
                ],
            ]);

        $this->character->refresh();
        $this->assertEquals(50, $this->character->experience_points);
    }

    public function test_dead_characters_do_not_receive_xp(): void
    {
        // Make character dead
        $this->character->update(['is_alive' => false, 'is_active' => false]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/award-xp", [
            'amount' => 100,
            'character_ids' => [$this->character->id],
        ]);

        $response->assertStatus(422); // No valid characters
    }

    // ==========================================
    // Currency Tests
    // ==========================================

    public function test_dm_can_add_gold(): void
    {
        $this->character->update(['currency' => ['cp' => 0, 'sp' => 0, 'ep' => 0, 'gp' => 10, 'pp' => 0]]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-currency", [
            'type' => 'gp',
            'amount' => 50,
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->character->refresh();
        $this->assertEquals(60, $this->character->currency['gp']);
    }

    public function test_dm_can_remove_gold(): void
    {
        $this->character->update(['currency' => ['cp' => 0, 'sp' => 0, 'ep' => 0, 'gp' => 100, 'pp' => 0]]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-currency", [
            'type' => 'gp',
            'amount' => -30,
        ]);

        $response->assertStatus(200);
        $this->character->refresh();
        $this->assertEquals(70, $this->character->currency['gp']);
    }

    // ==========================================
    // Inspiration Tests
    // ==========================================

    public function test_dm_can_toggle_inspiration_on(): void
    {
        $this->character->update(['inspiration' => false]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/toggle-inspiration");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'character' => [
                        'inspiration' => true,
                    ],
                ],
            ]);
    }

    public function test_dm_can_toggle_inspiration_off(): void
    {
        $this->character->update(['inspiration' => true]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/toggle-inspiration");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'character' => [
                        'inspiration' => false,
                    ],
                ],
            ]);
    }

    // ==========================================
    // Give Item Tests
    // ==========================================

    public function test_dm_can_give_item(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/give-item", [
            'name' => 'Зелье лечения',
            'quantity' => 2,
            'source' => 'Награда за квест',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->character->refresh();
        $inventory = collect($this->character->inventory);
        $this->assertTrue($inventory->contains('name', 'Зелье лечения'));
    }

    // ==========================================
    // Kill / Activate / Deactivate Tests
    // ==========================================

    public function test_dm_can_kill_character(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/{$this->character->id}/kill", [
            'killed_by' => 'Красный дракон',
            'killing_blow' => 'Огненное дыхание',
            'cause' => 'combat',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'character' => [
                        'is_alive' => false,
                        'is_active' => false,
                        'current_hp' => 0,
                    ],
                ],
            ]);

        $this->character->refresh();
        $this->assertFalse($this->character->is_alive);
        $this->assertEquals('Красный дракон', $this->character->death_info['killed_by']);
    }

    public function test_cannot_kill_already_dead_character(): void
    {
        $this->character->update(['is_alive' => false]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/{$this->character->id}/kill", [
            'killed_by' => 'Гоблин',
        ]);

        $response->assertStatus(422);
    }

    public function test_dm_can_deactivate_character(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/{$this->character->id}/deactivate");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'character' => [
                        'is_active' => false,
                    ],
                ],
            ]);
    }

    public function test_dm_can_activate_character(): void
    {
        $this->character->update(['is_active' => false]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/{$this->character->id}/activate");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'character' => [
                        'is_active' => true,
                    ],
                ],
            ]);
    }

    public function test_cannot_activate_dead_character(): void
    {
        $this->character->update(['is_alive' => false, 'is_active' => false]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/{$this->character->id}/activate");

        $response->assertStatus(422);
    }

    public function test_activating_character_deactivates_others_for_same_player(): void
    {
        // Create second character for same player, make it active
        $character2 = Character::factory()
            ->forOwner($this->player)
            ->forCampaign($this->campaign)
            ->active()
            ->create();

        // Deactivate first character
        $this->character->update(['is_active' => false]);

        Passport::actingAs($this->dm);

        // Activate first character
        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/{$this->character->id}/activate");

        $response->assertStatus(200);

        // First character should be active, second should be inactive
        $this->character->refresh();
        $character2->refresh();
        $this->assertTrue($this->character->is_active);
        $this->assertFalse($character2->is_active);
    }

    // ==========================================
    // Owner Access Tests
    // ==========================================

    public function test_owner_can_manage_any_campaign(): void
    {
        $owner = User::factory()->create([
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $owner->assignRole('owner');

        Passport::actingAs($owner);

        $response = $this->getJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }
}
