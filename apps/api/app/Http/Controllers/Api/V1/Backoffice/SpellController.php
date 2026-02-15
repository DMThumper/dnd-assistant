<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Spell;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SpellController extends Controller
{
    /**
     * List all spells with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = Spell::query();

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

        // Filter by level
        if ($request->has('level')) {
            $query->where('level', $request->input('level'));
        }

        // Filter by school
        if ($request->has('school')) {
            $query->where('school', $request->input('school'));
        }

        // Filter by class
        if ($request->has('class')) {
            $query->whereJsonContains('classes', $request->input('class'));
        }

        // Filter by concentration
        if ($request->has('concentration')) {
            $query->where('concentration', $request->boolean('concentration'));
        }

        // Filter by ritual
        if ($request->has('ritual')) {
            $query->where('ritual', $request->boolean('ritual'));
        }

        // Sorting
        $sortField = $request->input('sort', 'level');
        $sortDir = $request->input('dir', 'asc');
        $allowedSorts = ['name', 'slug', 'level', 'school', 'sort_order', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        // Secondary sort by name
        if ($sortField !== 'name') {
            $query->orderBy('name->ru', 'asc');
        }

        // Pagination
        $perPage = min($request->input('per_page', 20), 100);
        $spells = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'spells' => collect($spells->items())->map(fn ($s) => $s->formatForApi()),
            ],
            'meta' => [
                'current_page' => $spells->currentPage(),
                'last_page' => $spells->lastPage(),
                'per_page' => $spells->perPage(),
                'total' => $spells->total(),
            ],
        ]);
    }

    /**
     * Get a single spell
     */
    public function show(Spell $spell): JsonResponse
    {
        $spell->load('settings:id,name,slug');

        return response()->json([
            'success' => true,
            'data' => [
                'spell' => $spell->formatForApi(),
                'settings' => $spell->settings->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->getTranslation('name', 'ru'),
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Create a new spell
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'description' => 'required|string|max:10000',
            'slug' => 'nullable|string|max:100|unique:spells,slug',
            'level' => 'required|integer|min:0|max:9',
            'school' => 'required|string|max:30',
            'casting_time' => 'required|string|max:100',
            'range' => 'required|string|max:100',
            'duration' => 'required|string|max:100',
            'concentration' => 'boolean',
            'ritual' => 'boolean',

            'components' => 'required|array',
            'components.verbal' => 'boolean',
            'components.somatic' => 'boolean',
            'components.material' => 'boolean',
            'components.material_description' => 'nullable|string|max:500',
            'components.material_cost' => 'nullable|string|max:100',

            'classes' => 'required|array|min:1',
            'classes.*' => 'string|max:50',

            'higher_levels' => 'nullable|array',
            'higher_levels.description' => 'nullable|string|max:2000',

            'cantrip_scaling' => 'nullable|array',
            'effects' => 'nullable|array',

            'sort_order' => 'nullable|integer|min:0',
            'setting_ids' => 'nullable|array',
            'setting_ids.*' => 'integer|exists:settings,id',
        ]);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Create spell
        $spell = Spell::create([
            'name' => ['ru' => $validated['name']],
            'description' => ['ru' => $validated['description']],
            'slug' => $validated['slug'],
            'level' => $validated['level'],
            'school' => $validated['school'],
            'casting_time' => $validated['casting_time'],
            'range' => $validated['range'],
            'duration' => $validated['duration'],
            'concentration' => $validated['concentration'] ?? false,
            'ritual' => $validated['ritual'] ?? false,
            'components' => $validated['components'],
            'classes' => $validated['classes'],
            'higher_levels' => $validated['higher_levels'] ?? null,
            'cantrip_scaling' => $validated['cantrip_scaling'] ?? null,
            'effects' => $validated['effects'] ?? null,
            'is_system' => false,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        // Attach to settings
        if (!empty($validated['setting_ids'])) {
            $spell->settings()->attach($validated['setting_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Заклинание создано',
            'data' => [
                'spell' => $spell->formatForApi(),
            ],
        ], 201);
    }

    /**
     * Update a spell
     */
    public function update(Request $request, Spell $spell): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:200',
            'description' => 'sometimes|required|string|max:10000',
            'slug' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('spells')->ignore($spell->id)],
            'level' => 'sometimes|required|integer|min:0|max:9',
            'school' => 'sometimes|required|string|max:30',
            'casting_time' => 'sometimes|required|string|max:100',
            'range' => 'sometimes|required|string|max:100',
            'duration' => 'sometimes|required|string|max:100',
            'concentration' => 'boolean',
            'ritual' => 'boolean',
            'components' => 'sometimes|required|array',
            'classes' => 'sometimes|required|array|min:1',
            'higher_levels' => 'nullable|array',
            'cantrip_scaling' => 'nullable|array',
            'effects' => 'nullable|array',
            'sort_order' => 'nullable|integer|min:0',
            'setting_ids' => 'nullable|array',
            'setting_ids.*' => 'integer|exists:settings,id',
        ]);

        // Build update data
        $updateData = [];

        if (isset($validated['name'])) {
            $updateData['name'] = ['ru' => $validated['name']];
        }

        if (isset($validated['description'])) {
            $updateData['description'] = ['ru' => $validated['description']];
        }

        // Direct fields
        $directFields = [
            'slug', 'level', 'school', 'casting_time', 'range', 'duration',
            'concentration', 'ritual', 'components', 'classes', 'higher_levels',
            'cantrip_scaling', 'effects', 'sort_order',
        ];

        foreach ($directFields as $field) {
            if (array_key_exists($field, $validated)) {
                $updateData[$field] = $validated[$field];
            }
        }

        $spell->update($updateData);

        // Sync settings if provided
        if (array_key_exists('setting_ids', $validated)) {
            $spell->settings()->sync($validated['setting_ids'] ?? []);
        }

        $spell->load('settings:id,name,slug');

        return response()->json([
            'success' => true,
            'message' => 'Заклинание обновлено',
            'data' => [
                'spell' => $spell->formatForApi(),
                'settings' => $spell->settings->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->getTranslation('name', 'ru'),
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Delete a spell
     */
    public function destroy(Spell $spell): JsonResponse
    {
        // Prevent deleting system spells
        if ($spell->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Системные заклинания нельзя удалять',
            ], 403);
        }

        $spell->settings()->detach();
        $spell->delete();

        return response()->json([
            'success' => true,
            'message' => 'Заклинание удалено',
        ]);
    }

    /**
     * Get all settings for attaching spells
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
     * Get unique spell schools for filtering
     */
    public function schools(): JsonResponse
    {
        $schools = Spell::select('school')
            ->distinct()
            ->orderBy('school')
            ->pluck('school');

        return response()->json([
            'success' => true,
            'data' => [
                'schools' => $schools,
            ],
        ]);
    }

    /**
     * Get unique classes for filtering
     */
    public function classes(): JsonResponse
    {
        // Get all unique classes from spells
        $spells = Spell::select('classes')->get();
        $allClasses = [];

        foreach ($spells as $spell) {
            foreach ($spell->classes as $class) {
                $allClasses[$class] = true;
            }
        }

        $classes = array_keys($allClasses);
        sort($classes);

        return response()->json([
            'success' => true,
            'data' => [
                'classes' => $classes,
            ],
        ]);
    }
}
