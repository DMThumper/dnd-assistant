<?php

namespace Tests\Feature\Broadcasting;

use App\Events\CharacterUpdated;
use App\Events\ConditionChanged;
use App\Events\XPAwarded;
use App\Models\Campaign;
use App\Models\Character;
use App\Models\RuleSystem;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;
use Tests\TestCase;

class CharacterBroadcastTest extends TestCase
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
    // HP Change Broadcasting Tests
    // ==========================================

    public function test_modifying_hp_broadcasts_character_updated_event(): void
    {
        Event::fake([CharacterUpdated::class]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-hp", [
            'amount' => 10,
            'type' => 'damage',
        ]);

        $response->assertStatus(200);

        Event::assertDispatched(CharacterUpdated::class, function ($event) {
            return $event->character->id === $this->character->id
                && $event->updateType === 'hp'
                && $event->changes['type'] === 'damage';
        });
    }

    public function test_healing_broadcasts_character_updated_event(): void
    {
        Event::fake([CharacterUpdated::class]);

        $this->character->update(['current_hp' => 15]);
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-hp", [
            'amount' => 10,
            'type' => 'healing',
        ]);

        $response->assertStatus(200);

        Event::assertDispatched(CharacterUpdated::class, function ($event) {
            return $event->updateType === 'hp'
                && $event->changes['type'] === 'healing';
        });
    }

    public function test_temp_hp_broadcasts_character_updated_event(): void
    {
        Event::fake([CharacterUpdated::class]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-hp", [
            'amount' => 15,
            'type' => 'temp_hp',
        ]);

        $response->assertStatus(200);

        Event::assertDispatched(CharacterUpdated::class, function ($event) {
            return $event->updateType === 'hp'
                && $event->changes['type'] === 'temp_hp';
        });
    }

    // ==========================================
    // Condition Broadcasting Tests
    // ==========================================

    public function test_adding_condition_broadcasts_condition_changed_event(): void
    {
        Event::fake([ConditionChanged::class]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-conditions", [
            'action' => 'add',
            'key' => 'poisoned',
            'name' => 'Отравлен',
            'source' => 'Яд паука',
        ]);

        $response->assertStatus(200);

        Event::assertDispatched(ConditionChanged::class, function ($event) {
            return $event->character->id === $this->character->id
                && $event->action === 'added'
                && $event->condition['key'] === 'poisoned';
        });
    }

    public function test_removing_condition_broadcasts_condition_changed_event(): void
    {
        // Add condition first
        $this->character->update([
            'conditions' => [
                ['key' => 'poisoned', 'name' => 'Отравлен', 'source' => null],
            ],
        ]);

        Event::fake([ConditionChanged::class]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-conditions", [
            'action' => 'remove',
            'key' => 'poisoned',
        ]);

        $response->assertStatus(200);

        Event::assertDispatched(ConditionChanged::class, function ($event) {
            return $event->action === 'removed'
                && $event->condition['key'] === 'poisoned';
        });
    }

    // ==========================================
    // XP Broadcasting Tests
    // ==========================================

    public function test_awarding_xp_broadcasts_xp_awarded_event(): void
    {
        Event::fake([XPAwarded::class]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/award-xp", [
            'amount' => 100,
            'character_ids' => [$this->character->id],
            'reason' => 'Победа над гоблинами',
        ]);

        $response->assertStatus(200);

        Event::assertDispatched(XPAwarded::class, function ($event) {
            return $event->character->id === $this->character->id
                && $event->xpAmount === 100
                && $event->reason === 'Победа над гоблинами';
        });
    }

    public function test_awarding_xp_to_multiple_characters_broadcasts_multiple_events(): void
    {
        // Create another character
        $character2 = Character::factory()
            ->forOwner($this->player)
            ->forCampaign($this->campaign)
            ->active()
            ->create(['experience_points' => 0]);

        Event::fake([XPAwarded::class]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/award-xp", [
            'amount' => 50,
            'all_active' => true,
        ]);

        $response->assertStatus(200);

        // Should broadcast to both characters
        Event::assertDispatched(XPAwarded::class, 2);
    }

    // ==========================================
    // Inspiration Broadcasting Tests
    // ==========================================

    public function test_toggling_inspiration_broadcasts_character_updated_event(): void
    {
        Event::fake([CharacterUpdated::class]);

        $this->character->update(['inspiration' => false]);
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/toggle-inspiration");

        $response->assertStatus(200);

        Event::assertDispatched(CharacterUpdated::class, function ($event) {
            return $event->updateType === 'inspiration';
        });
    }

    // ==========================================
    // Currency Broadcasting Tests
    // ==========================================

    public function test_modifying_currency_broadcasts_character_updated_event(): void
    {
        Event::fake([CharacterUpdated::class]);

        $this->character->update(['currency' => ['cp' => 0, 'sp' => 0, 'ep' => 0, 'gp' => 10, 'pp' => 0]]);
        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/characters/{$this->character->id}/modify-currency", [
            'type' => 'gp',
            'amount' => 50,
        ]);

        $response->assertStatus(200);

        Event::assertDispatched(CharacterUpdated::class, function ($event) {
            return $event->updateType === 'currency';
        });
    }

    // ==========================================
    // Kill Character Broadcasting Tests
    // ==========================================

    public function test_killing_character_broadcasts_character_updated_event(): void
    {
        Event::fake([CharacterUpdated::class]);

        Passport::actingAs($this->dm);

        $response = $this->postJson("/api/v1/backoffice/campaigns/{$this->campaign->id}/characters/{$this->character->id}/kill", [
            'killed_by' => 'Красный дракон',
            'killing_blow' => 'Огненное дыхание',
            'cause' => 'combat',
        ]);

        $response->assertStatus(200);

        Event::assertDispatched(CharacterUpdated::class, function ($event) {
            return $event->updateType === 'death'
                && $event->changes['killed_by'] === 'Красный дракон';
        });
    }

    // ==========================================
    // Channel Authorization Tests
    // ==========================================

    public function test_character_owner_can_subscribe_to_character_channel(): void
    {
        Passport::actingAs($this->player);

        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => "private-character.{$this->character->id}",
            'socket_id' => '123456.789012',
        ]);

        $response->assertStatus(200);
    }

    public function test_dm_can_subscribe_to_character_channel(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => "private-character.{$this->character->id}",
            'socket_id' => '123456.789012',
        ]);

        $response->assertStatus(200);
    }

    public function test_other_player_cannot_subscribe_to_character_channel(): void
    {
        $otherPlayer = User::factory()->create([
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $otherPlayer->assignRole('player');

        Passport::actingAs($otherPlayer);

        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => "private-character.{$this->character->id}",
            'socket_id' => '123456.789012',
        ]);

        $response->assertStatus(403);
    }

    public function test_campaign_member_can_subscribe_to_campaign_channel(): void
    {
        // Add player to campaign
        $this->campaign->players()->attach($this->player->id);

        Passport::actingAs($this->player);

        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => "presence-campaign.{$this->campaign->id}",
            'socket_id' => '123456.789012',
        ]);

        $response->assertStatus(200);
    }

    public function test_dm_can_subscribe_to_campaign_channel(): void
    {
        Passport::actingAs($this->dm);

        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => "presence-campaign.{$this->campaign->id}",
            'socket_id' => '123456.789012',
        ]);

        $response->assertStatus(200);
    }

    public function test_non_member_cannot_subscribe_to_campaign_channel(): void
    {
        $otherPlayer = User::factory()->create([
            'email_verified_at' => now(),
            'is_active' => true,
        ]);
        $otherPlayer->assignRole('player');

        Passport::actingAs($otherPlayer);

        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => "presence-campaign.{$this->campaign->id}",
            'socket_id' => '123456.789012',
        ]);

        $response->assertStatus(403);
    }
}
