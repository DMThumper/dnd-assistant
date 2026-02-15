<?php

use App\Models\Campaign;
use App\Models\Character;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

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
    $campaign = Campaign::find($campaignId);

    if (!$campaign) {
        return false;
    }

    // DM of the campaign
    if ($campaign->user_id === $user->id) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'role' => 'dm',
        ];
    }

    // Player in the campaign
    if ($campaign->players()->where('user_id', $user->id)->exists()) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'role' => 'player',
        ];
    }

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
        || $campaign->players()->where('user_id', $user->id)->exists();
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
    $character = Character::with('campaign')->find($characterId);

    if (!$character) {
        return false;
    }

    // Character owner
    if ($character->user_id === $user->id) {
        return true;
    }

    // DM of the campaign this character belongs to
    if ($character->campaign && $character->campaign->user_id === $user->id) {
        return true;
    }

    return false;
});
