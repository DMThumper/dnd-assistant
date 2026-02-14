<?php

namespace App\Http\Controllers\Api\V1\Player;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Character;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CharacterController extends Controller
{
    /**
     * Get characters for a campaign
     */
    public function index(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        // Check if user is a player in this campaign
        if (!$campaign->hasPlayer($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не являетесь участником этой кампании',
            ], 403);
        }

        // Get only user's characters in this campaign
        $characters = $campaign->characters()
            ->where('user_id', $user->id)
            ->orderByDesc('is_alive')
            ->orderByDesc('updated_at')
            ->get();

        $alive = $characters->where('is_alive', true)->values();
        $dead = $characters->where('is_alive', false)->values();

        return response()->json([
            'success' => true,
            'data' => [
                'alive' => $alive->map(fn (Character $c) => $c->formatForApi()),
                'dead' => $dead->map(fn (Character $c) => $c->formatForApi()),
            ],
        ]);
    }

    /**
     * Get a single character
     */
    public function show(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        // Check if user owns this character
        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->formatForApi(),
            ],
        ]);
    }

    /**
     * Update character (HP, resources, etc.)
     */
    public function update(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        // Check if user owns this character
        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        $validated = $request->validate([
            'current_hp' => 'sometimes|integer|min:0',
            'temp_hp' => 'sometimes|integer|min:0',
            'inspiration' => 'sometimes|boolean',
            'death_saves' => 'sometimes|array',
            'class_resources' => 'sometimes|array',
            'currency' => 'sometimes|array',
        ]);

        // Prevent HP from exceeding max
        if (isset($validated['current_hp'])) {
            $validated['current_hp'] = min($validated['current_hp'], $character->max_hp);
        }

        $character->update($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->fresh()->formatForApi(),
            ],
            'message' => 'Персонаж обновлён',
        ]);
    }

    /**
     * Get active character for this campaign (localStorage preference)
     * Returns the character or null if none selected/available
     */
    public function active(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        // Check if user is a player in this campaign
        if (!$campaign->hasPlayer($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не являетесь участником этой кампании',
            ], 403);
        }

        // Get user's alive characters in this campaign
        $characters = $campaign->characters()
            ->where('user_id', $user->id)
            ->where('is_alive', true)
            ->orderByDesc('updated_at')
            ->get();

        // If only one character, return it
        if ($characters->count() === 1) {
            return response()->json([
                'success' => true,
                'data' => [
                    'character' => $characters->first()->formatForApi(),
                    'auto_selected' => true,
                ],
            ]);
        }

        // If no characters, indicate creation needed
        if ($characters->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'character' => null,
                    'needs_creation' => true,
                ],
            ]);
        }

        // Multiple characters - client needs to select
        return response()->json([
            'success' => true,
            'data' => [
                'character' => null,
                'needs_selection' => true,
                'available' => $characters->map(fn (Character $c) => $c->formatForApi()),
            ],
        ]);
    }
}
