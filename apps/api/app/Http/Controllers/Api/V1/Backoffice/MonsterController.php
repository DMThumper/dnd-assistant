<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\Monster;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MonsterController extends Controller
{
    /**
     * List all monsters with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = Monster::query();

        // Search by name or slug
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name->ru', 'ILIKE', "%{$search}%")
                  ->orWhere('slug', 'ILIKE', "%{$search}%");
            });
        }

        // Filter by setting
        if ($request->has('setting_id')) {
            $query->whereHas('settings', function ($q) use ($request) {
                $q->where('settings.id', $request->input('setting_id'));
            });
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter by size
        if ($request->has('size')) {
            $query->where('size', $request->input('size'));
        }

        // Filter by CR range
        if ($request->has('cr_min')) {
            $query->where('challenge_rating', '>=', $request->input('cr_min'));
        }
        if ($request->has('cr_max')) {
            $query->where('challenge_rating', '<=', $request->input('cr_max'));
        }

        // Sorting
        $sortField = $request->input('sort', 'challenge_rating');
        $sortDir = $request->input('dir', 'asc');
        $allowedSorts = ['name', 'slug', 'size', 'type', 'challenge_rating', 'hit_points', 'armor_class', 'sort_order', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        // Pagination
        $perPage = min($request->input('per_page', 20), 100);
        $monsters = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'monsters' => collect($monsters->items())->map(fn ($m) => $m->formatForApi()),
            ],
            'meta' => [
                'current_page' => $monsters->currentPage(),
                'last_page' => $monsters->lastPage(),
                'per_page' => $monsters->perPage(),
                'total' => $monsters->total(),
            ],
        ]);
    }

    /**
     * Get a single monster
     */
    public function show(Monster $monster): JsonResponse
    {
        // Load attached settings
        $monster->load('settings:id,name,slug');

        return response()->json([
            'success' => true,
            'data' => [
                'monster' => $monster->formatForApi(),
                'settings' => $monster->settings->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->getTranslation('name', 'ru'),
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Create a new monster
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'description' => 'nullable|string|max:5000',
            'slug' => 'nullable|string|max:100|unique:monsters,slug',
            'size' => 'required|string|in:tiny,small,medium,large,huge,gargantuan',
            'type' => 'required|string|max:50',
            'alignment' => 'nullable|string|max:50',
            'armor_class' => 'required|integer|min:1|max:30',
            'armor_type' => 'nullable|string|max:100',
            'hit_points' => 'required|integer|min:1',
            'hit_dice' => 'nullable|string|max:20',
            'challenge_rating' => 'nullable|numeric|min:0|max:30',
            'experience_points' => 'nullable|integer|min:0',

            // Abilities
            'abilities' => 'required|array',
            'abilities.strength' => 'required|integer|min:1|max:30',
            'abilities.dexterity' => 'required|integer|min:1|max:30',
            'abilities.constitution' => 'required|integer|min:1|max:30',
            'abilities.intelligence' => 'required|integer|min:1|max:30',
            'abilities.wisdom' => 'required|integer|min:1|max:30',
            'abilities.charisma' => 'required|integer|min:1|max:30',

            // Speed
            'speed' => 'required|array',
            'speed.walk' => 'required|integer|min:0|max:50',
            'speed.fly' => 'nullable|integer|min:0|max:50',
            'speed.swim' => 'nullable|integer|min:0|max:50',
            'speed.climb' => 'nullable|integer|min:0|max:50',
            'speed.burrow' => 'nullable|integer|min:0|max:50',

            // Saves and skills
            'saving_throws' => 'nullable|array',
            'skills' => 'nullable|array',
            'senses' => 'nullable|array',
            'languages' => 'nullable|array',
            'languages.*' => 'string|max:50',

            // Resistances and immunities
            'damage_resistances' => 'nullable|array',
            'damage_resistances.*' => 'string|max:50',
            'damage_immunities' => 'nullable|array',
            'damage_immunities.*' => 'string|max:50',
            'damage_vulnerabilities' => 'nullable|array',
            'damage_vulnerabilities.*' => 'string|max:50',
            'condition_immunities' => 'nullable|array',
            'condition_immunities.*' => 'string|max:50',

            // Traits and actions
            'traits' => 'nullable|array',
            'traits.*.name' => 'required|string|max:100',
            'traits.*.description' => 'required|string|max:2000',
            'actions' => 'nullable|array',
            'actions.*.name' => 'required|string|max:100',
            'actions.*.description' => 'required|string|max:2000',
            'actions.*.type' => 'nullable|string|in:melee,ranged,special',
            'actions.*.attack_bonus' => 'nullable|integer',
            'actions.*.damage' => 'nullable|string|max:100',
            'actions.*.reach' => 'nullable|string|max:20',
            'actions.*.range' => 'nullable|string|max:50',
            'actions.*.recharge' => 'nullable|string|max:20',

            // Legendary and lair
            'legendary_actions' => 'nullable|array',
            'legendary_actions.per_round' => 'nullable|integer|min:1|max:5',
            'legendary_actions.actions' => 'nullable|array',
            'lair_actions' => 'nullable|array',
            'regional_effects' => 'nullable|array',

            'sort_order' => 'nullable|integer|min:0',
            'setting_ids' => 'nullable|array',
            'setting_ids.*' => 'integer|exists:settings,id',
        ]);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Clean up speed (remove nulls/zeros)
        $speed = array_filter($validated['speed'], fn($v) => $v !== null && $v > 0);
        $speed['walk'] = $validated['speed']['walk']; // Always keep walk

        // Create monster
        $monster = Monster::create([
            'name' => ['ru' => $validated['name']],
            'description' => $validated['description'] ? ['ru' => $validated['description']] : null,
            'slug' => $validated['slug'],
            'size' => $validated['size'],
            'type' => $validated['type'],
            'alignment' => $validated['alignment'] ?? null,
            'armor_class' => $validated['armor_class'],
            'armor_type' => $validated['armor_type'] ?? null,
            'hit_points' => $validated['hit_points'],
            'hit_dice' => $validated['hit_dice'] ?? null,
            'challenge_rating' => $validated['challenge_rating'] ?? null,
            'experience_points' => $validated['experience_points'] ?? null,
            'abilities' => $validated['abilities'],
            'speed' => $speed,
            'saving_throws' => $validated['saving_throws'] ?? [],
            'skills' => $validated['skills'] ?? [],
            'senses' => $validated['senses'] ?? [],
            'languages' => $validated['languages'] ?? [],
            'damage_resistances' => $validated['damage_resistances'] ?? [],
            'damage_immunities' => $validated['damage_immunities'] ?? [],
            'damage_vulnerabilities' => $validated['damage_vulnerabilities'] ?? [],
            'condition_immunities' => $validated['condition_immunities'] ?? [],
            'traits' => $validated['traits'] ?? [],
            'actions' => $validated['actions'] ?? [],
            'legendary_actions' => $validated['legendary_actions'] ?? null,
            'lair_actions' => $validated['lair_actions'] ?? null,
            'regional_effects' => $validated['regional_effects'] ?? null,
            'is_system' => false,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        // Attach to settings
        if (!empty($validated['setting_ids'])) {
            $monster->settings()->attach($validated['setting_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Монстр создан',
            'data' => [
                'monster' => $monster->formatForApi(),
            ],
        ], 201);
    }

    /**
     * Update a monster
     */
    public function update(Request $request, Monster $monster): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:200',
            'description' => 'nullable|string|max:5000',
            'slug' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('monsters')->ignore($monster->id)],
            'size' => 'sometimes|required|string|in:tiny,small,medium,large,huge,gargantuan',
            'type' => 'sometimes|required|string|max:50',
            'alignment' => 'nullable|string|max:50',
            'armor_class' => 'sometimes|required|integer|min:1|max:30',
            'armor_type' => 'nullable|string|max:100',
            'hit_points' => 'sometimes|required|integer|min:1',
            'hit_dice' => 'nullable|string|max:20',
            'challenge_rating' => 'nullable|numeric|min:0|max:30',
            'experience_points' => 'nullable|integer|min:0',

            'abilities' => 'sometimes|required|array',
            'speed' => 'sometimes|required|array',
            'speed.walk' => 'required_with:speed|integer|min:0|max:50',

            'saving_throws' => 'nullable|array',
            'skills' => 'nullable|array',
            'senses' => 'nullable|array',
            'languages' => 'nullable|array',
            'damage_resistances' => 'nullable|array',
            'damage_immunities' => 'nullable|array',
            'damage_vulnerabilities' => 'nullable|array',
            'condition_immunities' => 'nullable|array',
            'traits' => 'nullable|array',
            'actions' => 'nullable|array',
            'legendary_actions' => 'nullable|array',
            'lair_actions' => 'nullable|array',
            'regional_effects' => 'nullable|array',

            'sort_order' => 'nullable|integer|min:0',
            'setting_ids' => 'nullable|array',
            'setting_ids.*' => 'integer|exists:settings,id',
        ]);

        // Build update data
        $updateData = [];

        if (isset($validated['name'])) {
            $updateData['name'] = ['ru' => $validated['name']];
        }

        if (array_key_exists('description', $validated)) {
            $updateData['description'] = $validated['description'] ? ['ru' => $validated['description']] : null;
        }

        // Handle speed
        if (isset($validated['speed'])) {
            $speed = array_filter($validated['speed'], fn($v) => $v !== null && $v > 0);
            $speed['walk'] = $validated['speed']['walk'];
            $updateData['speed'] = $speed;
        }

        // Direct fields
        $directFields = [
            'slug', 'size', 'type', 'alignment', 'armor_class', 'armor_type',
            'hit_points', 'hit_dice', 'challenge_rating', 'experience_points',
            'abilities', 'saving_throws', 'skills', 'senses', 'languages',
            'damage_resistances', 'damage_immunities', 'damage_vulnerabilities',
            'condition_immunities', 'traits', 'actions', 'legendary_actions',
            'lair_actions', 'regional_effects', 'sort_order',
        ];

        foreach ($directFields as $field) {
            if (array_key_exists($field, $validated)) {
                $updateData[$field] = $validated[$field];
            }
        }

        $monster->update($updateData);

        // Sync settings if provided
        if (array_key_exists('setting_ids', $validated)) {
            $monster->settings()->sync($validated['setting_ids'] ?? []);
        }

        $monster->load('settings:id,name,slug');

        return response()->json([
            'success' => true,
            'message' => 'Монстр обновлён',
            'data' => [
                'monster' => $monster->formatForApi(),
                'settings' => $monster->settings->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->getTranslation('name', 'ru'),
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Delete a monster
     */
    public function destroy(Monster $monster): JsonResponse
    {
        // Prevent deleting system monsters
        if ($monster->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Системных монстров нельзя удалять',
            ], 403);
        }

        $monster->settings()->detach();
        $monster->delete();

        return response()->json([
            'success' => true,
            'message' => 'Монстр удалён',
        ]);
    }

    /**
     * Get all settings for attaching monsters
     */
    public function settings(): JsonResponse
    {
        $settings = Setting::select('id', 'name', 'slug')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->getTranslation('name', 'ru'),
                'slug' => $s->slug,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'settings' => $settings,
            ],
        ]);
    }

    /**
     * Get unique monster types for filtering
     */
    public function types(): JsonResponse
    {
        $types = Monster::select('type')
            ->distinct()
            ->orderBy('type')
            ->pluck('type');

        return response()->json([
            'success' => true,
            'data' => [
                'types' => $types,
            ],
        ]);
    }
}
