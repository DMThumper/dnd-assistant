<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Events\CharacterUpdated;
use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Character;
use App\Services\CharacterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CharacterController extends Controller
{
    public function __construct(
        private readonly CharacterService $characterService
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
                'message' => 'Изменения активных персонажей возможны только во время активной сессии. Деактивируйте персонажа для экспериментов.',
            ], 422);
        }

        return null;
    }

    /**
     * List all characters in a campaign
     */
    public function index(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        // DM must own the campaign
        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'У вас нет доступа к этой кампании',
            ], 403);
        }

        $query = $campaign->characters()->with('owner:id,name,email');

        // Filter by alive/dead
        if ($request->has('is_alive')) {
            $query->where('is_alive', $request->boolean('is_alive'));
        }

        // Filter by active
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        $characters = $query
            ->orderByDesc('is_active')
            ->orderByDesc('is_alive')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'characters' => $characters->map(function (Character $c) {
                    $data = $c->formatForApi();
                    $data['owner'] = [
                        'id' => $c->owner->id,
                        'name' => $c->owner->name,
                        'email' => $c->owner->email,
                    ];
                    return $data;
                }),
            ],
        ]);
    }

    /**
     * Deactivate a character (only DM can do this)
     */
    public function deactivate(Request $request, Campaign $campaign, Character $character): JsonResponse
    {
        $user = $request->user();

        // Must be DM of the campaign or owner
        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'Только Мастер может деактивировать персонажа',
            ], 403);
        }

        // Cannot deactivate already inactive character
        if (!$character->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Персонаж уже деактивирован',
            ], 422);
        }

        $character->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->fresh()->formatForApi(),
            ],
            'message' => 'Персонаж деактивирован',
        ]);
    }

    /**
     * Activate a character (DM can also activate for players)
     */
    public function activate(Request $request, Campaign $campaign, Character $character): JsonResponse
    {
        $user = $request->user();

        // Must be DM of the campaign or owner
        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'У вас нет доступа к этой кампании',
            ], 403);
        }

        // Cannot activate a dead character
        if (!$character->is_alive) {
            return response()->json([
                'success' => false,
                'message' => 'Нельзя активировать мёртвого персонажа',
            ], 422);
        }

        // Deactivate any other active characters for this user in this campaign
        Character::where('user_id', $character->user_id)
            ->where('campaign_id', $character->campaign_id)
            ->where('is_active', true)
            ->where('id', '!=', $character->id)
            ->update(['is_active' => false]);

        // Activate this character
        $character->update(['is_active' => true]);

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->fresh()->formatForApi(),
            ],
            'message' => 'Персонаж активирован',
        ]);
    }

    /**
     * Mark character as dead (DM only)
     */
    public function kill(Request $request, Campaign $campaign, Character $character): JsonResponse
    {
        $user = $request->user();

        // Must be DM of the campaign or owner
        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'Только Мастер может убить персонажа',
            ], 403);
        }

        if (!$character->is_alive) {
            return response()->json([
                'success' => false,
                'message' => 'Персонаж уже мёртв',
            ], 422);
        }

        $validated = $request->validate([
            'killed_by' => 'sometimes|string|max:200',
            'killing_blow' => 'sometimes|string|max:500',
            'cause' => 'sometimes|string|in:combat,trap,fall,spell,other',
            'session_number' => 'sometimes|integer|min:1',
            'last_words' => 'sometimes|nullable|string|max:500',
        ]);

        $deathInfo = [
            'killed_by' => $validated['killed_by'] ?? 'Неизвестно',
            'killing_blow' => $validated['killing_blow'] ?? null,
            'cause' => $validated['cause'] ?? 'other',
            'session_number' => $validated['session_number'] ?? null,
            'death_date' => now()->toDateString(),
            'last_words' => $validated['last_words'] ?? null,
            'revived' => false,
        ];

        $character->update([
            'is_alive' => false,
            'is_active' => false, // Dead characters cannot be active
            'death_info' => $deathInfo,
            'current_hp' => 0,
        ]);

        // Broadcast death event
        broadcast(new CharacterUpdated($character->fresh(), 'death', $deathInfo));

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->fresh()->formatForApi(),
            ],
            'message' => 'Персонаж погиб',
        ]);
    }

    /**
     * Modify character HP (damage, healing, temp HP, or set directly)
     */
    public function modifyHp(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();
        $campaign = $character->campaign;

        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'Только Мастер может изменять ОЗ персонажа',
            ], 403);
        }

        // Check if modification is allowed (active characters need active session)
        if ($errorResponse = $this->checkModificationAllowed($character)) {
            return $errorResponse;
        }

        $validated = $request->validate([
            'amount' => 'required|integer|min:0',
            'type' => 'required|string|in:damage,healing,temp_hp,set',
        ]);

        $character = $this->characterService->modifyHp(
            $character,
            $validated['amount'],
            $validated['type']
        );

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->formatForApi(),
            ],
            'message' => match($validated['type']) {
                'damage' => "Нанесено {$validated['amount']} урона",
                'healing' => "Исцелено {$validated['amount']} ОЗ",
                'temp_hp' => "Временные ОЗ: {$validated['amount']}",
                'set' => "ОЗ установлено на {$validated['amount']}",
            },
        ]);
    }

    /**
     * Award XP to characters in a campaign
     */
    public function awardXp(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'Только Мастер может выдавать опыт',
            ], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|integer|min:1',
            'reason' => 'sometimes|string|max:500',
            'character_ids' => 'sometimes|array',
            'character_ids.*' => 'integer|exists:characters,id',
            'all_active' => 'sometimes|boolean',
        ]);

        $hasActiveSession = $campaign->hasActiveLiveSession();

        // Determine which characters to award XP to
        if ($request->boolean('all_active')) {
            // all_active only works during active sessions
            if (!$hasActiveSession) {
                return response()->json([
                    'success' => false,
                    'message' => 'Выдача опыта всем активным персонажам возможна только во время активной сессии',
                ], 422);
            }
            $characters = $campaign->characters()
                ->where('is_alive', true)
                ->where('is_active', true)
                ->get();
        } elseif (!empty($validated['character_ids'])) {
            $characters = $campaign->characters()
                ->whereIn('id', $validated['character_ids'])
                ->where('is_alive', true)
                ->get();

            // Filter: active characters need active session, inactive can always receive XP
            $characters = $characters->filter(function ($character) use ($hasActiveSession) {
                // Inactive characters can always receive XP (experimentation mode)
                if (!$character->is_active) {
                    return true;
                }
                // Active characters need active session
                return $hasActiveSession;
            });
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Укажите character_ids или all_active=true',
            ], 422);
        }

        if ($characters->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Нет подходящих персонажей для получения опыта. Активным персонажам нужна активная сессия.',
            ], 422);
        }

        $results = [];
        foreach ($characters as $character) {
            $result = $this->characterService->awardXp(
                $character,
                $validated['amount'],
                $validated['reason'] ?? ''
            );
            $results[] = [
                'character_id' => $character->id,
                'character_name' => $character->name,
                ...$result,
            ];
        }

        $levelUps = collect($results)->where('can_level_up', true)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'results' => $results,
                'characters_count' => count($results),
                'level_ups_available' => $levelUps,
            ],
            'message' => "Выдано {$validated['amount']} ОО для {$characters->count()} персонажей",
        ]);
    }

    /**
     * Add or remove a condition
     */
    public function modifyConditions(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();
        $campaign = $character->campaign;

        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'Только Мастер может изменять состояния персонажа',
            ], 403);
        }

        // Check if modification is allowed (active characters need active session)
        if ($errorResponse = $this->checkModificationAllowed($character)) {
            return $errorResponse;
        }

        $validated = $request->validate([
            'action' => 'required|string|in:add,remove',
            'key' => 'required|string|max:50',
            'name' => 'sometimes|string|max:100',
            'source' => 'sometimes|string|max:200',
            'duration' => 'sometimes|integer|min:1',
        ]);

        if ($validated['action'] === 'add') {
            $condition = [
                'key' => $validated['key'],
                'name' => $validated['name'] ?? null,
                'source' => $validated['source'] ?? null,
                'duration' => $validated['duration'] ?? null,
            ];
            $character = $this->characterService->addCondition($character, $condition);
            $message = 'Состояние добавлено';
        } else {
            $character = $this->characterService->removeCondition($character, $validated['key']);
            $message = 'Состояние снято';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->formatForApi(),
            ],
            'message' => $message,
        ]);
    }

    /**
     * Manage custom rules (perks, afflictions, curses, blessings)
     */
    public function customRules(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();
        $campaign = $character->campaign;

        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'Только Мастер может управлять кастомными правилами',
            ], 403);
        }

        // Check if modification is allowed (active characters need active session)
        if ($errorResponse = $this->checkModificationAllowed($character)) {
            return $errorResponse;
        }

        $validated = $request->validate([
            'action' => 'required|string|in:add,update,remove',
            'rule_id' => 'required_if:action,update,remove|string',
            'name' => 'required_if:action,add|string|max:200',
            'description' => 'sometimes|string|max:1000',
            'icon' => 'sometimes|string|max:50',
            'color' => 'sometimes|string|max:7',
            'effects' => 'sometimes|array',
            'effects.*.type' => 'required_with:effects|string|in:bonus,penalty',
            'effects.*.category' => 'required_with:effects|string|in:skill,ability,saving_throw,attack,damage,ac,hp,speed,custom',
            'effects.*.target' => 'sometimes|string|max:50',
            'effects.*.value' => 'sometimes|integer',
            'effects.*.description' => 'sometimes|string|max:500',
            'effects.*.condition' => 'sometimes|string|max:200',
            'permanent' => 'sometimes|boolean',
            'duration' => 'sometimes|string|max:100',
            'source' => 'sometimes|string|max:200',
            'notes' => 'sometimes|string|max:1000',
        ]);

        switch ($validated['action']) {
            case 'add':
                $ruleData = [
                    'name' => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'icon' => $validated['icon'] ?? null,
                    'color' => $validated['color'] ?? null,
                    'effects' => $validated['effects'] ?? [],
                    'permanent' => $validated['permanent'] ?? false,
                    'duration' => $validated['duration'] ?? null,
                    'source' => $validated['source'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ];
                $character = $this->characterService->addCustomRule($character, $ruleData);
                $message = 'Кастомное правило добавлено';
                break;

            case 'update':
                $updates = array_filter([
                    'name' => $validated['name'] ?? null,
                    'description' => $validated['description'] ?? null,
                    'icon' => $validated['icon'] ?? null,
                    'color' => $validated['color'] ?? null,
                    'effects' => $validated['effects'] ?? null,
                    'permanent' => $validated['permanent'] ?? null,
                    'duration' => $validated['duration'] ?? null,
                    'source' => $validated['source'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ], fn($v) => $v !== null);
                $character = $this->characterService->updateCustomRule($character, $validated['rule_id'], $updates);
                $message = 'Кастомное правило обновлено';
                break;

            case 'remove':
                $character = $this->characterService->removeCustomRule($character, $validated['rule_id']);
                $message = 'Кастомное правило удалено';
                break;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->formatForApi(),
            ],
            'message' => $message,
        ]);
    }

    /**
     * Give an item to a character
     */
    public function giveItem(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();
        $campaign = $character->campaign;

        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'Только Мастер может выдавать предметы',
            ], 403);
        }

        // Check if modification is allowed (active characters need active session)
        if ($errorResponse = $this->checkModificationAllowed($character)) {
            return $errorResponse;
        }

        $validated = $request->validate([
            'item_slug' => 'sometimes|string|max:100',
            'name' => 'required_without:item_slug|string|max:200',
            'custom' => 'sometimes|boolean',
            'quantity' => 'sometimes|integer|min:1',
            'notes' => 'sometimes|string|max:500',
            'source' => 'sometimes|string|max:200',
        ]);

        $itemData = [
            'item_slug' => $validated['item_slug'] ?? null,
            'name' => $validated['name'] ?? null,
            'custom' => $validated['custom'] ?? (!isset($validated['item_slug'])),
            'notes' => $validated['notes'] ?? null,
        ];

        $character = $this->characterService->giveItem(
            $character,
            $itemData,
            $validated['quantity'] ?? 1,
            $validated['source'] ?? ''
        );

        $itemName = $itemData['name'] ?? $itemData['item_slug'];

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->formatForApi(),
            ],
            'message' => "Предмет \"{$itemName}\" выдан",
        ]);
    }

    /**
     * Modify character currency
     */
    public function modifyCurrency(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();
        $campaign = $character->campaign;

        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'Только Мастер может изменять валюту',
            ], 403);
        }

        // Check if modification is allowed (active characters need active session)
        if ($errorResponse = $this->checkModificationAllowed($character)) {
            return $errorResponse;
        }

        $validated = $request->validate([
            'type' => 'required|string|in:cp,sp,ep,gp,pp',
            'amount' => 'required|integer',
        ]);

        $character = $this->characterService->modifyCurrency(
            $character,
            $validated['type'],
            $validated['amount']
        );

        $action = $validated['amount'] >= 0 ? 'добавлено' : 'снято';
        $absAmount = abs($validated['amount']);
        $typeNames = ['cp' => 'мм', 'sp' => 'см', 'ep' => 'эм', 'gp' => 'зм', 'pp' => 'пм'];

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->formatForApi(),
            ],
            'message' => "{$absAmount} {$typeNames[$validated['type']]} {$action}",
        ]);
    }

    /**
     * Update player notes (DM can edit player's personal notes)
     */
    public function updatePlayerNotes(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();
        $campaign = $character->campaign;

        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'У вас нет доступа к этому персонажу',
            ], 403);
        }

        $validated = $request->validate([
            'player_notes' => 'nullable|string|max:10000',
        ]);

        $character->update([
            'player_notes' => $validated['player_notes'] ?? '',
        ]);

        // Broadcast to player
        broadcast(new CharacterUpdated($character->fresh(), 'player_notes_update', [
            'player_notes' => $validated['player_notes'] ?? '',
        ]))->toOthers();

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->fresh()->formatForApi(),
            ],
            'message' => 'Заметки обновлены',
        ]);
    }

    /**
     * Toggle inspiration
     */
    public function toggleInspiration(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();
        $campaign = $character->campaign;

        if ($campaign->user_id !== $user->id && !$user->hasRole('owner')) {
            return response()->json([
                'success' => false,
                'message' => 'Только Мастер может изменять вдохновение',
            ], 403);
        }

        // Check if modification is allowed (active characters need active session)
        if ($errorResponse = $this->checkModificationAllowed($character)) {
            return $errorResponse;
        }

        $character = $this->characterService->toggleInspiration($character);

        $message = $character->inspiration
            ? 'Вдохновение получено'
            : 'Вдохновение использовано';

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->formatForApi(),
            ],
            'message' => $message,
        ]);
    }
}
