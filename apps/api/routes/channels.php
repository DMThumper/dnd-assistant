<?php

use App\Models\Campaign;
use App\Models\Character;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

/**
 * Campaign presence channel - all participants (DM + players)
 * Used for: general campaign updates, who's online
 */
Broadcast::channel('campaign.{campaignId}', function (User $user, int $campaignId) {
    Log::info("[Broadcast] Campaign channel auth", [
        'channel' => "campaign.{$campaignId}",
        'user_id' => $user->id,
        'user_name' => $user->name,
    ]);

    $campaign = Campaign::find($campaignId);

    if (!$campaign) {
        Log::warning("[Broadcast] Campaign not found", ['campaign_id' => $campaignId]);
        return false;
    }

    // DM of the campaign
    if ($campaign->user_id === $user->id) {
        Log::info("[Broadcast] User is DM of campaign", [
            'campaign_id' => $campaignId,
            'user_id' => $user->id,
        ]);
        return [
            'id' => $user->id,
            'name' => $user->name,
            'role' => 'dm',
        ];
    }

    // Player in the campaign (use users.id to avoid ambiguity with pivot table)
    $isPlayer = $campaign->players()->where('users.id', $user->id)->exists();
    Log::info("[Broadcast] Checking if user is player", [
        'campaign_id' => $campaignId,
        'user_id' => $user->id,
        'is_player' => $isPlayer,
    ]);

    if ($isPlayer) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'role' => 'player',
        ];
    }

    Log::warning("[Broadcast] User denied access to campaign", [
        'campaign_id' => $campaignId,
        'user_id' => $user->id,
        'campaign_owner_id' => $campaign->user_id,
    ]);
    return false;
});

/**
 * Campaign battle channel - battle tracker updates
 * Used for: initiative order, HP changes during combat, turn tracking
 */
Broadcast::channel('campaign.{campaignId}.battle', function (User $user, int $campaignId) {
    $campaign = Campaign::find($campaignId);

    if (!$campaign) {
        return false;
    }

    return $campaign->user_id === $user->id
        || $campaign->players()->where('users.id', $user->id)->exists();
});

/**
 * Campaign display channel - DM to Display client only
 * Used for: scene changes, music, choice screens on TV
 */
Broadcast::channel('campaign.{campaignId}.display', function (User $user, int $campaignId) {
    $campaign = Campaign::find($campaignId);

    // Only DM can broadcast to display
    return $campaign && $campaign->user_id === $user->id;
});

/**
 * Private character channel - owner + DM only
 * Used for: HP changes, conditions, custom rules, XP, items, level up
 */
Broadcast::channel('character.{characterId}', function (User $user, int $characterId) {
    Log::info("[Broadcast] Character channel auth", [
        'channel' => "character.{$characterId}",
        'user_id' => $user->id,
        'user_name' => $user->name,
    ]);

    $character = Character::with('campaign')->find($characterId);

    if (!$character) {
        Log::warning("[Broadcast] Character not found", ['character_id' => $characterId]);
        return false;
    }

    // Character owner
    if ($character->user_id === $user->id) {
        Log::info("[Broadcast] User is character owner", [
            'character_id' => $characterId,
            'user_id' => $user->id,
        ]);
        return true;
    }

    // DM of the campaign this character belongs to
    if ($character->campaign && $character->campaign->user_id === $user->id) {
        Log::info("[Broadcast] User is DM of character's campaign", [
            'character_id' => $characterId,
            'user_id' => $user->id,
            'campaign_id' => $character->campaign->id,
        ]);
        return true;
    }

    Log::warning("[Broadcast] User denied access to character channel", [
        'character_id' => $characterId,
        'user_id' => $user->id,
        'character_owner_id' => $character->user_id,
        'campaign_id' => $character->campaign?->id,
        'campaign_owner_id' => $character->campaign?->user_id,
    ]);
    return false;
});
