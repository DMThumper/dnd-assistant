<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignPlayerController extends Controller
{
    /**
     * Get all players in a campaign
     */
    public function index(Campaign $campaign): JsonResponse
    {
        $players = $campaign->players()
            ->select('users.id', 'users.name', 'users.email', 'users.is_active')
            ->withPivot('joined_at')
            ->get()
            ->map(function (User $user) use ($campaign) {
                $charactersCount = $campaign->characters()
                    ->where('user_id', $user->id)
                    ->where('is_alive', true)
                    ->count();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'joined_at' => $user->pivot->joined_at,
                    'characters_count' => $charactersCount,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'players' => $players,
            ],
        ]);
    }

    /**
     * Get users available to invite (active, not already in campaign, role: player)
     */
    public function available(Campaign $campaign): JsonResponse
    {
        $existingPlayerIds = $campaign->players()->pluck('users.id');

        $availableUsers = User::where('is_active', true)
            ->whereNotNull('email_verified_at')
            ->whereNotIn('id', $existingPlayerIds)
            ->where('id', '!=', $campaign->user_id) // Exclude campaign owner
            ->role('player')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $availableUsers,
            ],
        ]);
    }

    /**
     * Invite a player to the campaign
     */
    public function invite(Request $request, Campaign $campaign, User $user): JsonResponse
    {
        // Check if user is already in campaign
        if ($campaign->hasPlayer($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Этот игрок уже в кампании',
            ], 422);
        }

        // Check if user is active
        if (!$user->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Этот пользователь неактивен',
            ], 422);
        }

        // Check if user has player role
        if (!$user->hasRole('player')) {
            return response()->json([
                'success' => false,
                'message' => 'Этот пользователь не является игроком',
            ], 422);
        }

        // Add player to campaign
        $campaign->players()->attach($user->id, ['joined_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Игрок добавлен в кампанию',
            'data' => [
                'player' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'joined_at' => now()->toISOString(),
                    'characters_count' => 0,
                ],
            ],
        ]);
    }

    /**
     * Remove a player from the campaign
     */
    public function remove(Campaign $campaign, User $user): JsonResponse
    {
        // Check if user is in campaign
        if (!$campaign->hasPlayer($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Этот игрок не в кампании',
            ], 404);
        }

        // Remove player from campaign (characters remain but become "orphaned")
        $campaign->players()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Игрок удалён из кампании',
        ]);
    }
}
