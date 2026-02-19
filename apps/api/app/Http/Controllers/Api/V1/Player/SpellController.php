<?php

namespace App\Http\Controllers\Api\V1\Player;

use App\Http\Controllers\Controller;
use App\Models\Character;
use App\Services\CharacterSpellService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpellController extends Controller
{
    public function __construct(
        private readonly CharacterSpellService $spellService
    ) {}

    /**
     * Check if character modification is allowed.
     *
     * Rules:
     * - Inactive characters (is_active=false) can always be modified (experimentation mode)
     * - Active characters (is_active=true) require an active live session
     *
     * @return JsonResponse|null Returns error response if not allowed, null if allowed
     */
    private function checkModificationAllowed(Character $character): ?JsonResponse
    {
        // Inactive characters can always be modified (experimentation mode)
        if (!$character->is_active) {
            return null;
        }

        // Active characters require an active live session
        $campaign = $character->campaign;
        if (!$campaign->hasActiveLiveSession()) {
            return response()->json([
                'success' => false,
                'message' => 'Изменения активных персонажей возможны только во время активной сессии. Вне сессии можно экспериментировать с неактивными персонажами.',
            ], 422);
        }

        return null;
    }

    /**
     * Check if user owns this character.
     */
    private function checkOwnership(Request $request, Character $character): ?JsonResponse
    {
        if ($character->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        return null;
    }

    /**
     * Get spellbook for a character
     *
     * Returns full spellbook data: cantrips, known spells, prepared spells,
     * spell slots, concentration status, spellcasting stats
     */
    public function spellbook(Request $request, Character $character): JsonResponse
    {
        if ($error = $this->checkOwnership($request, $character)) {
            return $error;
        }

        $spellbook = $this->spellService->getSpellbook($character);

        return response()->json([
            'success' => true,
            'data' => $spellbook,
        ]);
    }

    /**
     * Get available spells for preparation
     *
     * Returns all spells the character's class can access at their level
     * (for prepared casters to choose from)
     */
    public function available(Request $request, Character $character): JsonResponse
    {
        if ($error = $this->checkOwnership($request, $character)) {
            return $error;
        }

        try {
            $spells = $this->spellService->getAvailableSpells($character);

            return response()->json([
                'success' => true,
                'data' => $spells,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Use a spell slot
     *
     * Decrements remaining slots for the given level
     */
    public function useSlot(Request $request, Character $character): JsonResponse
    {
        if ($error = $this->checkOwnership($request, $character)) {
            return $error;
        }

        if ($error = $this->checkModificationAllowed($character)) {
            return $error;
        }

        $validated = $request->validate([
            'level' => 'required|integer|min:1|max:9',
        ]);

        try {
            $character = $this->spellService->useSlot($character, $validated['level']);

            return response()->json([
                'success' => true,
                'data' => [
                    'spell_slots_remaining' => $character->spell_slots_remaining,
                ],
                'message' => "Использован слот {$validated['level']} уровня",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Restore spell slot(s)
     *
     * Increments remaining slots for the given level (up to max)
     * Used for Arcane Recovery, Sorcery Points conversion, etc.
     */
    public function restoreSlot(Request $request, Character $character): JsonResponse
    {
        if ($error = $this->checkOwnership($request, $character)) {
            return $error;
        }

        if ($error = $this->checkModificationAllowed($character)) {
            return $error;
        }

        $validated = $request->validate([
            'level' => 'required|integer|min:1|max:9',
            'count' => 'sometimes|integer|min:1|max:4',
        ]);

        try {
            $character = $this->spellService->restoreSlot(
                $character,
                $validated['level'],
                $validated['count'] ?? 1
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'spell_slots_remaining' => $character->spell_slots_remaining,
                ],
                'message' => "Восстановлен слот {$validated['level']} уровня",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Take a rest
     *
     * Short rest: class-specific recovery (Wizard Arcane Recovery, Warlock Pact Magic)
     * Long rest: restore all spell slots, clear concentration
     */
    public function rest(Request $request, Character $character): JsonResponse
    {
        if ($error = $this->checkOwnership($request, $character)) {
            return $error;
        }

        if ($error = $this->checkModificationAllowed($character)) {
            return $error;
        }

        $validated = $request->validate([
            'type' => 'required|string|in:short,long',
        ]);

        try {
            $result = $this->spellService->takeRest($character, $validated['type']);

            $durationLabel = $result['duration']['label'] ?? ($validated['type'] === 'long' ? '8 часов' : '1 час');
            $reason = isset($result['duration']['reason']) ? " ({$result['duration']['reason']})" : '';

            $message = $validated['type'] === 'long'
                ? "Продолжительный отдых завершён ({$durationLabel}{$reason})"
                : "Короткий отдых завершён ({$durationLabel})";

            return response()->json([
                'success' => true,
                'data' => [
                    'character' => $result['character']->formatForApi(),
                    'restored' => $result['restored'],
                    'duration' => $result['duration'],
                    'messages' => $result['messages'],
                ],
                'message' => $message,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Update prepared spells
     *
     * For prepared casters (Cleric, Druid, Paladin, Wizard)
     * Validates spell count against max prepared limit
     */
    public function updatePrepared(Request $request, Character $character): JsonResponse
    {
        if ($error = $this->checkOwnership($request, $character)) {
            return $error;
        }

        if ($error = $this->checkModificationAllowed($character)) {
            return $error;
        }

        $validated = $request->validate([
            'prepared_spells' => 'required|array',
            'prepared_spells.*' => 'string',
        ]);

        try {
            $character = $this->spellService->updatePreparedSpells(
                $character,
                $validated['prepared_spells']
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'prepared_spells' => $character->prepared_spells,
                ],
                'message' => 'Подготовленные заклинания обновлены',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Start concentration on a spell
     *
     * Replaces any existing concentration
     * Tracks spell name, duration, and start time
     */
    public function startConcentration(Request $request, Character $character): JsonResponse
    {
        if ($error = $this->checkOwnership($request, $character)) {
            return $error;
        }

        if ($error = $this->checkModificationAllowed($character)) {
            return $error;
        }

        $validated = $request->validate([
            'spell_slug' => 'required|string|exists:spells,slug',
        ]);

        try {
            $character = $this->spellService->startConcentration(
                $character,
                $validated['spell_slug']
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'concentration_spell' => $character->concentration_spell,
                ],
                'message' => "Концентрация на заклинании: {$character->concentration_spell['spell_name']}",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * End concentration
     *
     * Called when concentration is broken (damage, incapacitation, or voluntary)
     */
    public function endConcentration(Request $request, Character $character): JsonResponse
    {
        if ($error = $this->checkOwnership($request, $character)) {
            return $error;
        }

        if ($error = $this->checkModificationAllowed($character)) {
            return $error;
        }

        $character = $this->spellService->endConcentration($character);

        return response()->json([
            'success' => true,
            'data' => [
                'concentration_spell' => null,
            ],
            'message' => 'Концентрация прервана',
        ]);
    }

    /**
     * Get available recovery options for short rest
     *
     * Returns features that can restore spell slots (Natural Recovery, Arcane Recovery, etc.)
     */
    public function recoveryOptions(Request $request, Character $character): JsonResponse
    {
        if ($error = $this->checkOwnership($request, $character)) {
            return $error;
        }

        $options = $this->spellService->getShortRestRecoveryOptions($character);

        return response()->json([
            'success' => true,
            'data' => $options,
        ]);
    }

    /**
     * Use a short rest recovery ability
     *
     * Restores spell slots using abilities like Natural Recovery, Arcane Recovery, etc.
     * Total slot levels restored must not exceed the ability's limit.
     */
    public function useRecovery(Request $request, Character $character): JsonResponse
    {
        if ($error = $this->checkOwnership($request, $character)) {
            return $error;
        }

        if ($error = $this->checkModificationAllowed($character)) {
            return $error;
        }

        $validated = $request->validate([
            'recovery_key' => 'required|string',
            'slots' => 'required|array|min:1',
            'slots.*' => 'integer|min:1|max:5', // Only slots 1-5 can be recovered (no 6th+)
        ]);

        try {
            $character = $this->spellService->useShortRestRecovery(
                $character,
                $validated['recovery_key'],
                $validated['slots']
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'spell_slots_remaining' => $character->spell_slots_remaining,
                    'short_rest_recovery_used' => $character->short_rest_recovery_used,
                ],
                'message' => 'Ячейки заклинаний восстановлены',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
