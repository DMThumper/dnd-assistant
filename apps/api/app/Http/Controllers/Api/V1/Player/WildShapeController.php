<?php

namespace App\Http\Controllers\Api\V1\Player;

use App\Events\CharacterUpdated;
use App\Http\Controllers\Controller;
use App\Models\Character;
use App\Models\Monster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WildShapeController extends Controller
{
    /**
     * Get Wild Shape status and available beasts
     */
    public function status(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        // Only druids can use Wild Shape
        if ($character->class_slug !== 'druid') {
            return response()->json([
                'success' => false,
                'message' => 'Только друиды могут использовать Дикий облик',
            ], 422);
        }

        $limits = $this->getWildShapeLimits($character);

        return response()->json([
            'success' => true,
            'data' => [
                'charges' => $character->wild_shape_charges ?? 2,
                'max_charges' => 2,
                'current_form' => $character->wild_shape_form,
                'limits' => $limits,
            ],
        ]);
    }

    /**
     * Get available beasts for Wild Shape
     */
    public function availableBeasts(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        $limits = $this->getWildShapeLimits($character);

        $query = Monster::where('type', 'beast')
            ->where('challenge_rating', '<=', $limits['max_cr'])
            ->orderBy('challenge_rating')
            ->orderBy('name');

        // Filter by swim/fly restrictions
        if (!$limits['can_swim']) {
            $query->where('has_swim', false);
        }
        if (!$limits['can_fly']) {
            $query->where('has_fly', false);
        }

        // Only common beasts by default (DM can unlock rare ones)
        $query->where('is_common', true);

        $beasts = $query->limit(50)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'beasts' => $beasts->map(fn (Monster $m) => $m->formatForApi()),
                'limits' => $limits,
            ],
        ]);
    }

    /**
     * Transform into a beast
     */
    public function transform(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        // Check if already transformed
        if ($character->wild_shape_form) {
            return response()->json([
                'success' => false,
                'message' => 'Вы уже в форме зверя. Сначала выйдите из неё.',
            ], 422);
        }

        // Check charges
        $charges = $character->wild_shape_charges ?? 2;
        if ($charges <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'Нет доступных использований Дикого облика. Отдохните для восстановления.',
            ], 422);
        }

        $validated = $request->validate([
            'monster_id' => 'required|integer|exists:monsters,id',
        ]);

        $monster = Monster::findOrFail($validated['monster_id']);

        // Validate beast restrictions
        $limits = $this->getWildShapeLimits($character);

        if ($monster->challenge_rating > $limits['max_cr']) {
            return response()->json([
                'success' => false,
                'message' => "ПО зверя ({$monster->getChallengeRatingString()}) превышает ваш лимит ({$this->formatCr($limits['max_cr'])})",
            ], 422);
        }

        if ($monster->has_swim && !$limits['can_swim']) {
            return response()->json([
                'success' => false,
                'message' => 'Вы ещё не можете превращаться в существ со скоростью плавания (требуется 4 уровень)',
            ], 422);
        }

        if ($monster->has_fly && !$limits['can_fly']) {
            return response()->json([
                'success' => false,
                'message' => 'Вы ещё не можете превращаться в существ со скоростью полёта (требуется 8 уровень)',
            ], 422);
        }

        // Create wild shape form
        $wildShapeForm = [
            'beast_slug' => $monster->slug,
            'beast_name' => $monster->getTranslation('name', 'ru'),
            'monster_id' => $monster->id,
            'max_hp' => $monster->hit_points,
            'current_hp' => $monster->hit_points,
            'temp_hp' => 0,
            'armor_class' => $monster->armor_class,
            'speed' => $monster->speed,
            'abilities' => $monster->abilities,
            'traits' => $monster->traits ?? [],
            'actions' => $monster->actions ?? [],
            'senses' => $monster->senses ?? [],
            'skills' => $monster->skills ?? [],
            'transformed_at' => now()->toISOString(),
        ];

        $character->update([
            'wild_shape_charges' => $charges - 1,
            'wild_shape_form' => $wildShapeForm,
        ]);

        // Broadcast to DM
        broadcast(new CharacterUpdated($character->fresh(), 'wild_shape_transform', [
            'beast' => $monster->formatForApi(),
        ]))->toOthers();

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->fresh()->formatForApi(),
                'beast' => $monster->formatForApi(),
            ],
            'message' => "Вы превратились в {$monster->getTranslation('name', 'ru')}!",
        ]);
    }

    /**
     * Take damage in beast form
     */
    public function damage(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        if (!$character->wild_shape_form) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не в форме зверя',
            ], 422);
        }

        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
        ]);

        $form = $character->wild_shape_form;
        $damage = $validated['amount'];

        // Apply damage to temp HP first
        if ($form['temp_hp'] > 0) {
            $tempDamage = min($damage, $form['temp_hp']);
            $form['temp_hp'] -= $tempDamage;
            $damage -= $tempDamage;
        }

        // Apply remaining damage to beast HP
        $form['current_hp'] = max(0, $form['current_hp'] - $damage);

        // Check if beast form drops to 0
        if ($form['current_hp'] <= 0) {
            // Revert to normal form, excess damage carries over
            $excessDamage = abs($form['current_hp']);
            $newHp = max(0, $character->current_hp - $excessDamage);

            $character->update([
                'wild_shape_form' => null,
                'current_hp' => $newHp,
            ]);

            broadcast(new CharacterUpdated($character->fresh(), 'wild_shape_revert', [
                'reason' => 'damage',
                'excess_damage' => $excessDamage,
            ]))->toOthers();

            return response()->json([
                'success' => true,
                'data' => [
                    'character' => $character->fresh()->formatForApi(),
                    'reverted' => true,
                    'excess_damage' => $excessDamage,
                ],
                'message' => "Форма зверя потеряна! Избыточный урон: {$excessDamage}",
            ]);
        }

        $character->update(['wild_shape_form' => $form]);

        broadcast(new CharacterUpdated($character->fresh(), 'wild_shape_damage', [
            'amount' => $validated['amount'],
            'beast_hp' => $form['current_hp'],
        ]))->toOthers();

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->fresh()->formatForApi(),
            ],
        ]);
    }

    /**
     * Heal in beast form
     */
    public function heal(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        if (!$character->wild_shape_form) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не в форме зверя',
            ], 422);
        }

        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
        ]);

        $form = $character->wild_shape_form;
        $form['current_hp'] = min($form['max_hp'], $form['current_hp'] + $validated['amount']);

        $character->update(['wild_shape_form' => $form]);

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->fresh()->formatForApi(),
            ],
        ]);
    }

    /**
     * Revert from beast form voluntarily
     */
    public function revert(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        if (!$character->wild_shape_form) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не в форме зверя',
            ], 422);
        }

        $beastName = $character->wild_shape_form['beast_name'];

        $character->update(['wild_shape_form' => null]);

        broadcast(new CharacterUpdated($character->fresh(), 'wild_shape_revert', [
            'reason' => 'voluntary',
        ]))->toOthers();

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->fresh()->formatForApi(),
            ],
            'message' => "Вы вернулись из формы {$beastName}",
        ]);
    }

    /**
     * Get Wild Shape limits based on druid level and circle
     */
    private function getWildShapeLimits(Character $character): array
    {
        $level = $character->level;
        $subclass = $character->subclasses['druid']['subclass'] ?? null;
        $isMoonDruid = $subclass === 'circle-of-the-moon';

        // Base CR limits
        if ($isMoonDruid) {
            // Moon druids have higher CR limits
            if ($level >= 6) {
                $maxCr = floor($level / 3);
            } else {
                $maxCr = 1;
            }
        } else {
            // Other druids
            if ($level >= 8) {
                $maxCr = 1;
            } elseif ($level >= 4) {
                $maxCr = 0.5;
            } else {
                $maxCr = 0.25;
            }
        }

        return [
            'max_cr' => $maxCr,
            'can_swim' => $level >= 4,
            'can_fly' => $level >= 8,
            'duration_hours' => max(1, floor($level / 2)),
            'is_moon_druid' => $isMoonDruid,
        ];
    }

    private function formatCr(float $cr): string
    {
        if ($cr == 0.125) return '1/8';
        if ($cr == 0.25) return '1/4';
        if ($cr == 0.5) return '1/2';
        return (string) (int) $cr;
    }
}
