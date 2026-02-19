<?php

namespace App\Http\Controllers\Api\V1\Player;

use App\Events\CharacterUpdated;
use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Character;
use App\Models\CharacterClass;
use App\Models\Race;
use App\Models\Spell;
use App\Services\CharacterService;
use App\Services\LevelUpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CharacterController extends Controller
{
    public function __construct(
        private readonly LevelUpService $levelUpService,
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
                'message' => 'Изменения активных персонажей возможны только во время активной сессии. Вне сессии можно экспериментировать с неактивными персонажами.',
            ], 422);
        }

        return null;
    }

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
     * Broadcasts changes to DM via WebSocket
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

        // Check if modification is allowed (active characters need active session)
        if ($errorResponse = $this->checkModificationAllowed($character)) {
            return $errorResponse;
        }

        $validated = $request->validate([
            'current_hp' => 'sometimes|integer|min:0',
            'temp_hp' => 'sometimes|integer|min:0',
            'inspiration' => 'sometimes|boolean',
            'death_saves' => 'sometimes|array',
            'class_resources' => 'sometimes|array',
            'currency' => 'sometimes|array',
            'player_notes' => 'sometimes|nullable|string|max:10000',
        ]);

        // Handle HP changes via CharacterService (triggers broadcast)
        if (isset($validated['current_hp'])) {
            $targetHp = min($validated['current_hp'], $character->max_hp);
            $delta = $targetHp - $character->current_hp;

            if ($delta !== 0) {
                $type = $delta > 0 ? 'healing' : 'damage';
                $this->characterService->modifyHp($character, abs($delta), $type);
            }

            unset($validated['current_hp']);
        }

        // Handle other fields with generic broadcast
        if (! empty($validated)) {
            $changes = [];
            foreach ($validated as $key => $value) {
                $changes[$key] = ['from' => $character->{$key}, 'to' => $value];
            }

            $character->update($validated);

            // Broadcast to DM (toOthers prevents echo back to player)
            broadcast(new CharacterUpdated($character->fresh(), 'player_update', $changes))->toOthers();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->fresh()->formatForApi(),
            ],
            'message' => 'Персонаж обновлён',
        ]);
    }

    /**
     * Get active character for this campaign
     * Returns the active character or available characters if none is active
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
            ->orderByDesc('is_active')
            ->orderByDesc('updated_at')
            ->get();

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

        // Check if there's an active character
        $activeCharacter = $characters->firstWhere('is_active', true);
        if ($activeCharacter) {
            return response()->json([
                'success' => true,
                'data' => [
                    'character' => $activeCharacter->formatForApi(),
                ],
            ]);
        }

        // If only one character, return it (but not active yet)
        if ($characters->count() === 1) {
            return response()->json([
                'success' => true,
                'data' => [
                    'character' => $characters->first()->formatForApi(),
                    'auto_selected' => true,
                ],
            ]);
        }

        // Multiple characters - client needs to select and activate one
        return response()->json([
            'success' => true,
            'data' => [
                'character' => null,
                'needs_selection' => true,
                'available' => $characters->map(fn (Character $c) => $c->formatForApi()),
            ],
        ]);
    }

    /**
     * Activate a character (set as the currently playing character)
     * Player can activate, but only DM can deactivate
     */
    public function activate(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        // Check if user owns this character
        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
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
        Character::where('user_id', $user->id)
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
     * Delete a character
     * Cannot delete active characters - only DM can deactivate first
     */
    public function destroy(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        // Check if user owns this character
        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        // Cannot delete active characters
        if ($character->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Нельзя удалить активного персонажа. Обратитесь к Мастеру для деактивации.',
            ], 422);
        }

        // Check if character can be deleted (hasn't played sessions)
        if (!$character->canBeDeleted()) {
            return response()->json([
                'success' => false,
                'message' => 'Персонаж уже участвовал в сессиях и не может быть удалён',
            ], 422);
        }

        $character->delete();

        return response()->json([
            'success' => true,
            'message' => 'Персонаж удалён',
        ]);
    }

    /**
     * Get data needed for character creation wizard
     * Returns races, classes, and rules from campaign's setting
     */
    public function creationData(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        // Check if user is a player in this campaign
        if (!$campaign->hasPlayer($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не являетесь участником этой кампании',
            ], 403);
        }

        $setting = $campaign->setting;
        $ruleSystem = $setting->ruleSystem;

        // Get races available in this setting (with setting-specific overrides)
        $races = $setting->races()
            ->whereNull('parent_slug') // Only base races, not subraces
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Race $race) => $race->getForSetting($setting));

        // Get subraces grouped by parent
        $subraces = $setting->races()
            ->whereNotNull('parent_slug')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('parent_slug')
            ->map(fn ($group) => $group->map(fn (Race $race) => $race->getForSetting($setting)));

        // Get classes available in this setting (only base classes, not subclasses)
        $classes = $setting->characterClasses()
            ->whereNull('parent_slug')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (CharacterClass $class) => $class->getForSetting($setting));

        // Get spells available in this setting (cantrips and level 1 for starting characters)
        $spells = $setting->spells()
            ->whereIn('level', [0, 1])
            ->get()
            ->map(fn (Spell $spell) => $spell->getForSetting($setting));

        // Get character creation rules from rule system
        $creationRules = $ruleSystem->character_creation ?? [];
        $abilities = $ruleSystem->abilities ?? [];
        $skills = $ruleSystem->skills ?? [];

        // Get campaign-specific restrictions
        $campaignSettings = $campaign->settings ?? [];

        return response()->json([
            'success' => true,
            'data' => [
                'campaign' => [
                    'id' => $campaign->id,
                    'name' => $campaign->getTranslation('name', 'ru'),
                    'starting_level' => $campaignSettings['starting_level'] ?? 1,
                    'ability_method' => $campaignSettings['ability_method'] ?? $creationRules['methods'][0] ?? 'point_buy',
                    'allowed_races' => $campaignSettings['allowed_races'] ?? null,
                    'allowed_classes' => $campaignSettings['allowed_classes'] ?? null,
                ],
                'setting' => [
                    'id' => $setting->id,
                    'name' => $setting->getTranslation('name', 'ru'),
                    'slug' => $setting->slug,
                ],
                'rules' => [
                    'abilities' => $abilities,
                    'skills' => $skills,
                    'creation' => $creationRules,
                ],
                'races' => $races,
                'subraces' => $subraces,
                'classes' => $classes,
                'spells' => $spells,
            ],
        ]);
    }

    /**
     * Create a new character
     */
    public function store(Request $request, Campaign $campaign): JsonResponse
    {
        $user = $request->user();

        // Check if user is a player in this campaign
        if (!$campaign->hasPlayer($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Вы не являетесь участником этой кампании',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'race_slug' => 'required|string|exists:races,slug',
            'class_slug' => 'required|string|exists:character_classes,slug',
            'abilities' => 'required|array',
            'abilities.strength' => 'required|integer|min:1|max:30',
            'abilities.dexterity' => 'required|integer|min:1|max:30',
            'abilities.constitution' => 'required|integer|min:1|max:30',
            'abilities.intelligence' => 'required|integer|min:1|max:30',
            'abilities.wisdom' => 'required|integer|min:1|max:30',
            'abilities.charisma' => 'required|integer|min:1|max:30',
            'skill_proficiencies' => 'sometimes|array',
            'backstory' => 'sometimes|nullable|string|max:5000',
            'selected_spells' => 'sometimes|array',
            'selected_spells.*' => 'string|exists:spells,slug',
        ]);

        // Get race and class
        $race = Race::where('slug', $validated['race_slug'])->firstOrFail();
        $class = CharacterClass::where('slug', $validated['class_slug'])->firstOrFail();

        // Validate race and class are available in this campaign's setting
        $setting = $campaign->setting;
        if (!$setting->races()->where('races.id', $race->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Эта раса недоступна в данном сеттинге',
            ], 422);
        }
        if (!$setting->characterClasses()->where('character_classes.id', $class->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Этот класс недоступен в данном сеттинге',
            ], 422);
        }

        // Calculate starting HP: max hit die + CON modifier
        $conModifier = (int) floor(($validated['abilities']['constitution'] - 10) / 2);
        $startingLevel = $campaign->settings['starting_level'] ?? 1;
        $maxHp = $class->getFirstLevelHp($conModifier);

        // Add HP for levels beyond 1
        for ($i = 2; $i <= $startingLevel; $i++) {
            $maxHp += $class->getLevelUpHp($conModifier);
        }

        // Calculate proficiency bonus
        $proficiencyBonus = (int) floor(($startingLevel - 1) / 4) + 2;

        // Combine proficiencies from race and class
        $proficiencies = [
            'armor' => array_merge(
                $race->proficiencies['armor'] ?? [],
                $class->armor_proficiencies ?? []
            ),
            'weapons' => array_merge(
                $race->proficiencies['weapons'] ?? [],
                $class->weapon_proficiencies ?? []
            ),
            'tools' => array_merge(
                $race->proficiencies['tools'] ?? [],
                $class->tool_proficiencies ?? []
            ),
            'languages' => $race->languages ?? [],
        ];

        // Get racial skill proficiencies
        $skillProficiencies = array_merge(
            $race->skill_proficiencies ?? [],
            $validated['skill_proficiencies'] ?? []
        );

        // Get saving throw proficiencies from class
        $savingThrowProficiencies = $class->saving_throws ?? [];

        // Get racial speed
        $speed = $race->speed ?? ['walk' => 9];

        // Get features from race and class
        $features = [];
        foreach ($race->traits ?? [] as $trait) {
            $features[] = [
                'source' => 'race',
                'name' => $trait['name'],
                'description' => $trait['description'],
            ];
        }
        foreach ($class->getAllFeaturesUpToLevel($startingLevel) as $feature) {
            if ($feature['type'] !== 'asi' && $feature['type'] !== 'subclass') {
                $features[] = [
                    'source' => 'class',
                    'name' => $feature['name'],
                    'description' => $feature['description'],
                ];
            }
        }

        // Build known spells array from selected_spells
        $knownSpells = [];
        if (!empty($validated['selected_spells'])) {
            $selectedSpellSlugs = $validated['selected_spells'];
            $spells = Spell::whereIn('slug', $selectedSpellSlugs)->get();
            foreach ($spells as $spell) {
                $knownSpells[] = [
                    'slug' => $spell->slug,
                    'name' => $spell->getTranslation('name', 'ru'),
                    'level' => $spell->level,
                    'is_cantrip' => $spell->isCantrip(),
                ];
            }
        }

        // Build prepared spells (for prepared casters, initially all known spells are prepared)
        $preparedSpells = $knownSpells;

        // Create the character
        $character = Character::create([
            'user_id' => $user->id,
            'campaign_id' => $campaign->id,
            'name' => ['ru' => $validated['name']],
            'backstory' => $validated['backstory'] ? ['ru' => $validated['backstory']] : null,
            'race_slug' => $validated['race_slug'],
            'class_slug' => $validated['class_slug'],
            'level' => $startingLevel,
            'experience_points' => 0,
            'abilities' => $validated['abilities'],
            'current_hp' => $maxHp,
            'max_hp' => $maxHp,
            'temp_hp' => 0,
            'armor_class' => 10 + (int) floor(($validated['abilities']['dexterity'] - 10) / 2),
            'speed' => $speed,
            'inspiration' => false,
            'skill_proficiencies' => $skillProficiencies,
            'skill_expertise' => [],
            'saving_throw_proficiencies' => $savingThrowProficiencies,
            'proficiencies' => $proficiencies,
            'death_saves' => ['successes' => 0, 'failures' => 0],
            'hit_dice_remaining' => [$class->hit_die => $startingLevel],
            'features' => $features,
            'class_resources' => [],
            'currency' => ['cp' => 0, 'sp' => 0, 'ep' => 0, 'gp' => 0, 'pp' => 0],
            'known_spells' => $knownSpells,
            'prepared_spells' => $preparedSpells,
            'is_alive' => true,
            'stats' => ['sessions_played' => 0],
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'character' => $character->formatForApi(),
            ],
            'message' => 'Персонаж создан!',
        ], 201);
    }

    /**
     * Check if character can level up
     */
    public function checkLevelUp(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        $result = $this->levelUpService->canLevelUp($character);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Get level up options (HP, ASI, features, etc.)
     */
    public function levelUpOptions(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        // Check if can level up
        $canLevelUp = $this->levelUpService->canLevelUp($character);
        if (!$canLevelUp['can_level_up']) {
            return response()->json([
                'success' => false,
                'message' => $canLevelUp['reason'] ?? 'Недостаточно опыта для повышения уровня',
                'data' => $canLevelUp,
            ], 422);
        }

        $options = $this->levelUpService->getLevelUpOptions($character);

        return response()->json([
            'success' => true,
            'data' => $options,
        ]);
    }

    /**
     * Apply level up choices
     */
    public function levelUp(Request $request, Character $character): JsonResponse
    {
        $user = $request->user();

        if ($character->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Это не ваш персонаж',
            ], 403);
        }

        // Check if modification is allowed (active characters need active session)
        if ($errorResponse = $this->checkModificationAllowed($character)) {
            return $errorResponse;
        }

        $validated = $request->validate([
            'class' => 'sometimes|string|exists:character_classes,slug',
            'hp_roll' => 'sometimes|integer|min:1',
            'asi' => 'sometimes|array',
            'asi.type' => 'required_with:asi|string|in:asi,feat',
            'asi.choices' => 'sometimes|array',
            'subclass' => 'sometimes|string|max:100',
            'subclass_terrain' => 'sometimes|string|max:50',
            'subclass_bonus_cantrip' => 'sometimes|string|max:100',
            'features' => 'sometimes|array',
        ]);

        try {
            $character = $this->levelUpService->processLevelUp($character, $validated);

            return response()->json([
                'success' => true,
                'data' => [
                    'character' => $character->formatForApi(),
                ],
                'message' => "Поздравляем! Теперь вы {$character->level} уровня!",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
