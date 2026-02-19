<?php

namespace App\Http\Controllers\Api\V1\Player;

use App\Events\CharacterUpdated;
use App\Http\Controllers\Controller;
use App\Models\Character;
use App\Models\Monster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SummonController extends Controller
{
    /**
     * Get all summoned creatures for a character
     */
    public function index(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        $summons = $character->summoned_creatures ?? [];

        // Enrich summons with monster data if they reference a monster
        $enrichedSummons = array_map(function ($summon) {
            if (!empty($summon['monster_id'])) {
                $monster = Monster::find($summon['monster_id']);
                if ($monster) {
                    $summon['monster'] = $monster->formatForApi();
                }
            }
            return $summon;
        }, $summons);

        return response()->json([
            'success' => true,
            'data' => [
                'summons' => $enrichedSummons,
            ],
        ]);
    }

    /**
     * Add a new summoned creature
     */
    public function store(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|string|in:familiar,spirit,beast,conjured,animated,other',
            'monster_id' => 'sometimes|nullable|integer|exists:monsters,id',
            'max_hp' => 'sometimes|integer|min:1',
            'current_hp' => 'sometimes|integer|min:0',
            'temp_hp' => 'sometimes|integer|min:0',
            'custom_stats' => 'sometimes|array',
            'source_spell' => 'sometimes|nullable|string|max:100',
            'duration' => 'sometimes|nullable|string|max:50',
            'uses_wild_shape' => 'sometimes|boolean',
        ]);

        // Check if this summon uses Wild Shape charges (e.g., Wildfire Spirit)
        if (!empty($validated['uses_wild_shape']) && $character->class_slug === 'druid') {
            $charges = $character->wild_shape_charges ?? 2;
            if ($charges <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Нет доступных использований Дикого облика',
                ], 422);
            }
            $character->wild_shape_charges = $charges - 1;
        }

        // If monster_id provided, get monster stats
        $monster = null;
        if (!empty($validated['monster_id'])) {
            $monster = Monster::find($validated['monster_id']);
        }

        // Build summon data
        $summon = [
            'id' => Str::uuid()->toString(),
            'name' => $validated['name'],
            'type' => $validated['type'],
            'monster_id' => $validated['monster_id'] ?? null,
            'max_hp' => $validated['max_hp'] ?? ($monster?->hit_points ?? 10),
            'current_hp' => $validated['current_hp'] ?? ($validated['max_hp'] ?? ($monster?->hit_points ?? 10)),
            'temp_hp' => $validated['temp_hp'] ?? 0,
            'conditions' => [],
            'custom_stats' => $validated['custom_stats'] ?? [],
            'source_spell' => $validated['source_spell'] ?? null,
            'duration' => $validated['duration'] ?? null,
            'summoned_at' => now()->toISOString(),
        ];

        $summons = $character->summoned_creatures ?? [];
        $summons[] = $summon;

        $updateData = ['summoned_creatures' => $summons];

        // Save wild_shape_charges if it was modified
        if (!empty($validated['uses_wild_shape']) && $character->class_slug === 'druid') {
            $updateData['wild_shape_charges'] = $character->wild_shape_charges;
        }

        $character->update($updateData);

        // Broadcast to DM
        broadcast(new CharacterUpdated($character->fresh(), 'summon_added', [
            'summon' => $summon,
        ]))->toOthers();

        // Enrich with monster data for response
        if ($monster) {
            $summon['monster'] = $monster->formatForApi();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summon' => $summon,
            ],
            'message' => "Существо {$summon['name']} призвано",
        ], 201);
    }

    /**
     * Update a summoned creature (HP, conditions, etc.)
     */
    public function update(Request $request, Character $character, string $summonId): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        $validated = $request->validate([
            'current_hp' => 'sometimes|integer|min:0',
            'temp_hp' => 'sometimes|integer|min:0',
            'conditions' => 'sometimes|array',
            'custom_stats' => 'sometimes|array',
        ]);

        $summons = $character->summoned_creatures ?? [];
        $found = false;

        foreach ($summons as $index => $summon) {
            if ($summon['id'] === $summonId) {
                $summons[$index] = array_merge($summon, $validated);
                $found = true;
                break;
            }
        }

        if (!$found) {
            return response()->json([
                'success' => false,
                'message' => 'Призванное существо не найдено',
            ], 404);
        }

        $character->update(['summoned_creatures' => $summons]);

        // Broadcast to DM
        broadcast(new CharacterUpdated($character->fresh(), 'summon_updated', [
            'summon_id' => $summonId,
            'changes' => $validated,
        ]))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Существо обновлено',
        ]);
    }

    /**
     * Dismiss a summoned creature
     */
    public function destroy(Request $request, Character $character, string $summonId): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        $summons = $character->summoned_creatures ?? [];
        $dismissedSummon = null;

        foreach ($summons as $index => $summon) {
            if ($summon['id'] === $summonId) {
                $dismissedSummon = $summon;
                unset($summons[$index]);
                break;
            }
        }

        if (!$dismissedSummon) {
            return response()->json([
                'success' => false,
                'message' => 'Призванное существо не найдено',
            ], 404);
        }

        $character->update(['summoned_creatures' => array_values($summons)]);

        // Broadcast to DM
        broadcast(new CharacterUpdated($character->fresh(), 'summon_dismissed', [
            'summon' => $dismissedSummon,
        ]))->toOthers();

        return response()->json([
            'success' => true,
            'message' => "Существо {$dismissedSummon['name']} отпущено",
        ]);
    }

    /**
     * Get available monsters for summoning (beasts, spirits, etc.)
     * Filters by type and CR based on character level and class
     */
    public function available(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        $type = $request->query('type', 'beast');
        $maxCr = $request->query('max_cr');

        $query = Monster::where('type', $type)
            ->orderBy('challenge_rating')
            ->orderBy('name');

        if ($maxCr !== null) {
            $query->where('challenge_rating', '<=', floatval($maxCr));
        }

        // For beasts (Wild Shape), filter by common availability
        if ($type === 'beast') {
            $query->where('is_common', true);
        }

        $monsters = $query->limit(100)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'monsters' => $monsters->map(fn (Monster $m) => $m->formatForApi()),
            ],
        ]);
    }
}
