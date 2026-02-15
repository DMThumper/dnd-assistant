<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\Race;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RaceController extends Controller
{
    /**
     * List all races with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = Race::query();

        // Search by name
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

        // Filter by parent (subraces only)
        if ($request->has('parent_slug')) {
            $query->where('parent_slug', $request->input('parent_slug'));
        }

        // Filter main races only (no subraces)
        if ($request->boolean('main_only')) {
            $query->whereNull('parent_slug');
        }

        // Filter subraces only
        if ($request->boolean('subraces_only')) {
            $query->whereNotNull('parent_slug');
        }

        // Sorting
        $sortField = $request->input('sort', 'sort_order');
        $sortDir = $request->input('dir', 'asc');
        $allowedSorts = ['name', 'slug', 'size', 'sort_order', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        // Pagination
        $perPage = min($request->input('per_page', 20), 100);
        $races = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'races' => collect($races->items())->map(fn ($r) => $r->formatForApi()),
            ],
            'meta' => [
                'current_page' => $races->currentPage(),
                'last_page' => $races->lastPage(),
                'per_page' => $races->perPage(),
                'total' => $races->total(),
            ],
        ]);
    }

    /**
     * Get a single race
     */
    public function show(Race $race): JsonResponse
    {
        // Load attached settings and subraces
        $race->load(['settings:id,name,slug', 'subraces']);

        return response()->json([
            'success' => true,
            'data' => [
                'race' => $race->formatForApi(),
                'settings' => $race->settings->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->getTranslation('name', 'ru'),
                    'slug' => $s->slug,
                ]),
                'subraces' => $race->subraces->map(fn ($sr) => $sr->formatForApi()),
            ],
        ]);
    }

    /**
     * Create a new race
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:2000',
            'slug' => 'nullable|string|max:50|unique:races,slug',
            'size' => 'required|string|in:tiny,small,medium,large,huge,gargantuan',
            'ability_bonuses' => 'required|array',
            'ability_bonuses.strength' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.dexterity' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.constitution' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.intelligence' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.wisdom' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.charisma' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.choice' => 'nullable|array',
            'ability_bonuses.choice.count' => 'required_with:ability_bonuses.choice|integer|min:1|max:6',
            'ability_bonuses.choice.amount' => 'required_with:ability_bonuses.choice|integer|min:1|max:3',
            'speed' => 'required|array',
            'speed.walk' => 'required|integer|min:0|max:30',
            'speed.fly' => 'nullable|integer|min:0|max:30',
            'speed.swim' => 'nullable|integer|min:0|max:30',
            'speed.climb' => 'nullable|integer|min:0|max:30',
            'speed.burrow' => 'nullable|integer|min:0|max:30',
            'traits' => 'nullable|array',
            'traits.*.key' => 'required|string|max:50',
            'traits.*.name' => 'required|string|max:100',
            'traits.*.description' => 'required|string|max:1000',
            'languages' => 'nullable|array',
            'languages.*' => 'string|max:50',
            'proficiencies' => 'nullable|array',
            'proficiencies.weapons' => 'nullable|array',
            'proficiencies.armor' => 'nullable|array',
            'proficiencies.tools' => 'nullable|array',
            'skill_proficiencies' => 'nullable|array',
            'skill_proficiencies.*' => 'string|max:50',
            'parent_slug' => 'nullable|string|exists:races,slug',
            'age_info' => 'nullable|array',
            'age_info.maturity' => 'nullable|integer|min:1',
            'age_info.lifespan' => 'nullable|integer|min:1',
            'size_info' => 'nullable|array',
            'size_info.height_range' => 'nullable|string|max:50',
            'size_info.weight_range' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer|min:0',
            'setting_ids' => 'nullable|array',
            'setting_ids.*' => 'integer|exists:settings,id',
        ]);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Clean up ability bonuses (remove nulls/zeros)
        $abilityBonuses = array_filter($validated['ability_bonuses'], function ($value, $key) {
            if ($key === 'choice') return !empty($value);
            return $value !== null && $value !== 0;
        }, ARRAY_FILTER_USE_BOTH);

        // Create race
        $race = Race::create([
            'name' => ['ru' => $validated['name']],
            'description' => $validated['description'] ? ['ru' => $validated['description']] : null,
            'slug' => $validated['slug'],
            'size' => $validated['size'],
            'ability_bonuses' => $abilityBonuses,
            'speed' => array_filter($validated['speed'], fn($v) => $v !== null),
            'traits' => $validated['traits'] ?? [],
            'languages' => $validated['languages'] ?? [],
            'proficiencies' => $validated['proficiencies'] ?? ['weapons' => [], 'armor' => [], 'tools' => []],
            'skill_proficiencies' => $validated['skill_proficiencies'] ?? [],
            'parent_slug' => $validated['parent_slug'] ?? null,
            'age_info' => $validated['age_info'] ?? null,
            'size_info' => $validated['size_info'] ?? null,
            'is_system' => false,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        // Attach to settings
        if (!empty($validated['setting_ids'])) {
            $race->settings()->attach($validated['setting_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Раса создана',
            'data' => [
                'race' => $race->formatForApi(),
            ],
        ], 201);
    }

    /**
     * Update a race
     */
    public function update(Request $request, Race $race): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:2000',
            'slug' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('races')->ignore($race->id)],
            'size' => 'sometimes|required|string|in:tiny,small,medium,large,huge,gargantuan',
            'ability_bonuses' => 'sometimes|required|array',
            'ability_bonuses.strength' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.dexterity' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.constitution' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.intelligence' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.wisdom' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.charisma' => 'nullable|integer|min:-5|max:5',
            'ability_bonuses.choice' => 'nullable|array',
            'speed' => 'sometimes|required|array',
            'speed.walk' => 'required_with:speed|integer|min:0|max:30',
            'traits' => 'nullable|array',
            'traits.*.key' => 'required|string|max:50',
            'traits.*.name' => 'required|string|max:100',
            'traits.*.description' => 'required|string|max:1000',
            'languages' => 'nullable|array',
            'proficiencies' => 'nullable|array',
            'skill_proficiencies' => 'nullable|array',
            'parent_slug' => 'nullable|string|exists:races,slug',
            'age_info' => 'nullable|array',
            'size_info' => 'nullable|array',
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

        // Handle ability bonuses
        if (isset($validated['ability_bonuses'])) {
            $abilityBonuses = array_filter($validated['ability_bonuses'], function ($value, $key) {
                if ($key === 'choice') return !empty($value);
                return $value !== null && $value !== 0;
            }, ARRAY_FILTER_USE_BOTH);
            $updateData['ability_bonuses'] = $abilityBonuses;
        }

        // Handle speed
        if (isset($validated['speed'])) {
            $updateData['speed'] = array_filter($validated['speed'], fn($v) => $v !== null);
        }

        // Direct fields
        $directFields = [
            'slug', 'size', 'traits', 'languages', 'proficiencies',
            'skill_proficiencies', 'parent_slug', 'age_info', 'size_info', 'sort_order',
        ];

        foreach ($directFields as $field) {
            if (array_key_exists($field, $validated)) {
                $updateData[$field] = $validated[$field];
            }
        }

        $race->update($updateData);

        // Sync settings if provided
        if (array_key_exists('setting_ids', $validated)) {
            $race->settings()->sync($validated['setting_ids'] ?? []);
        }

        $race->load(['settings:id,name,slug', 'subraces']);

        return response()->json([
            'success' => true,
            'message' => 'Раса обновлена',
            'data' => [
                'race' => $race->formatForApi(),
                'settings' => $race->settings->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->getTranslation('name', 'ru'),
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Delete a race
     */
    public function destroy(Race $race): JsonResponse
    {
        // Prevent deleting system races
        if ($race->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Системные расы нельзя удалять',
            ], 403);
        }

        // Check if race has subraces
        if ($race->subraces()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Сначала удалите все подрасы этой расы',
            ], 422);
        }

        $race->settings()->detach();
        $race->delete();

        return response()->json([
            'success' => true,
            'message' => 'Раса удалена',
        ]);
    }

    /**
     * Get all settings for attaching races
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
     * Get parent races for subrace creation
     */
    public function parents(): JsonResponse
    {
        $parents = Race::whereNull('parent_slug')
            ->select('id', 'name', 'slug')
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->getTranslation('name', 'ru'),
                'slug' => $r->slug,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'parents' => $parents,
            ],
        ]);
    }
}
