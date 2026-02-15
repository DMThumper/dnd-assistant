<?php

namespace App\Http\Controllers\Api\V1\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\CharacterClass;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ClassController extends Controller
{
    /**
     * List all classes with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        $query = CharacterClass::query();

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

        // Filter by spellcaster
        if ($request->has('is_spellcaster')) {
            $query->where('is_spellcaster', $request->boolean('is_spellcaster'));
        }

        // Sorting
        $sortField = $request->input('sort', 'sort_order');
        $sortDir = $request->input('dir', 'asc');
        $allowedSorts = ['name', 'slug', 'hit_die', 'sort_order', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        // Pagination
        $perPage = min($request->input('per_page', 20), 100);
        $classes = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'classes' => collect($classes->items())->map(fn ($c) => $c->formatForApi()),
            ],
            'meta' => [
                'current_page' => $classes->currentPage(),
                'last_page' => $classes->lastPage(),
                'per_page' => $classes->perPage(),
                'total' => $classes->total(),
            ],
        ]);
    }

    /**
     * Get a single class
     */
    public function show(CharacterClass $class): JsonResponse
    {
        // Load attached settings
        $class->load('settings:id,name,slug');

        return response()->json([
            'success' => true,
            'data' => [
                'class' => $class->formatForApi(),
                'settings' => $class->settings->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->getTranslation('name', 'ru'),
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Create a new class
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:2000',
            'slug' => 'nullable|string|max:50|unique:character_classes,slug',
            'hit_die' => 'required|string|in:d4,d6,d8,d10,d12',
            'primary_abilities' => 'required|array|min:1',
            'primary_abilities.*' => 'string|in:strength,dexterity,constitution,intelligence,wisdom,charisma',
            'saving_throws' => 'required|array|size:2',
            'saving_throws.*' => 'string|in:strength,dexterity,constitution,intelligence,wisdom,charisma',
            'armor_proficiencies' => 'nullable|array',
            'armor_proficiencies.*' => 'string',
            'weapon_proficiencies' => 'nullable|array',
            'weapon_proficiencies.*' => 'string',
            'tool_proficiencies' => 'nullable|array',
            'tool_proficiencies.*' => 'string',
            'skill_choices' => 'required|integer|min:1|max:6',
            'skill_options' => 'required|array|min:2',
            'skill_options.*' => 'string',
            'starting_equipment' => 'nullable|array',
            'starting_gold_formula' => 'nullable|string|max:50',
            'level_features' => 'nullable|array',
            'progression' => 'nullable|array',
            'is_spellcaster' => 'boolean',
            'spellcasting_ability' => 'nullable|string|in:strength,dexterity,constitution,intelligence,wisdom,charisma',
            'spell_slots' => 'nullable|array',
            'spells_known' => 'nullable|array',
            'subclass_level' => 'nullable|integer|min:1|max:20',
            'subclass_name' => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer|min:0',
            'setting_ids' => 'nullable|array',
            'setting_ids.*' => 'integer|exists:settings,id',
        ]);

        // Generate slug if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Create class
        $class = CharacterClass::create([
            'name' => ['ru' => $validated['name']],
            'description' => $validated['description'] ? ['ru' => $validated['description']] : null,
            'slug' => $validated['slug'],
            'hit_die' => $validated['hit_die'],
            'primary_abilities' => $validated['primary_abilities'],
            'saving_throws' => $validated['saving_throws'],
            'armor_proficiencies' => $validated['armor_proficiencies'] ?? [],
            'weapon_proficiencies' => $validated['weapon_proficiencies'] ?? [],
            'tool_proficiencies' => $validated['tool_proficiencies'] ?? [],
            'skill_choices' => $validated['skill_choices'],
            'skill_options' => $validated['skill_options'],
            'starting_equipment' => $validated['starting_equipment'] ?? [],
            'starting_gold_formula' => $validated['starting_gold_formula'] ?? null,
            'level_features' => $validated['level_features'] ?? [],
            'progression' => $validated['progression'] ?? [],
            'is_spellcaster' => $validated['is_spellcaster'] ?? false,
            'spellcasting_ability' => $validated['spellcasting_ability'] ?? null,
            'spell_slots' => $validated['spell_slots'] ?? null,
            'spells_known' => $validated['spells_known'] ?? null,
            'subclass_level' => $validated['subclass_level'] ?? null,
            'subclass_name' => isset($validated['subclass_name']) ? ['ru' => $validated['subclass_name']] : null,
            'is_system' => false,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        // Attach to settings
        if (!empty($validated['setting_ids'])) {
            $class->settings()->attach($validated['setting_ids']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Класс создан',
            'data' => [
                'class' => $class->formatForApi(),
            ],
        ], 201);
    }

    /**
     * Update a class
     */
    public function update(Request $request, CharacterClass $class): JsonResponse
    {
        // Prevent editing system classes (optional, based on requirements)
        // if ($class->is_system) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Системные классы нельзя редактировать',
        //     ], 403);
        // }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:2000',
            'slug' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('character_classes')->ignore($class->id)],
            'hit_die' => 'sometimes|required|string|in:d4,d6,d8,d10,d12',
            'primary_abilities' => 'sometimes|required|array|min:1',
            'primary_abilities.*' => 'string|in:strength,dexterity,constitution,intelligence,wisdom,charisma',
            'saving_throws' => 'sometimes|required|array|size:2',
            'saving_throws.*' => 'string|in:strength,dexterity,constitution,intelligence,wisdom,charisma',
            'armor_proficiencies' => 'nullable|array',
            'armor_proficiencies.*' => 'string',
            'weapon_proficiencies' => 'nullable|array',
            'weapon_proficiencies.*' => 'string',
            'tool_proficiencies' => 'nullable|array',
            'tool_proficiencies.*' => 'string',
            'skill_choices' => 'sometimes|required|integer|min:1|max:6',
            'skill_options' => 'sometimes|required|array|min:2',
            'skill_options.*' => 'string',
            'starting_equipment' => 'nullable|array',
            'starting_gold_formula' => 'nullable|string|max:50',
            'level_features' => 'nullable|array',
            'progression' => 'nullable|array',
            'is_spellcaster' => 'boolean',
            'spellcasting_ability' => 'nullable|string|in:strength,dexterity,constitution,intelligence,wisdom,charisma',
            'spell_slots' => 'nullable|array',
            'spells_known' => 'nullable|array',
            'subclass_level' => 'nullable|integer|min:1|max:20',
            'subclass_name' => 'nullable|string|max:100',
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

        if (array_key_exists('subclass_name', $validated)) {
            $updateData['subclass_name'] = $validated['subclass_name'] ? ['ru' => $validated['subclass_name']] : null;
        }

        // Direct fields
        $directFields = [
            'slug', 'hit_die', 'primary_abilities', 'saving_throws',
            'armor_proficiencies', 'weapon_proficiencies', 'tool_proficiencies',
            'skill_choices', 'skill_options', 'starting_equipment', 'starting_gold_formula',
            'level_features', 'progression', 'is_spellcaster', 'spellcasting_ability',
            'spell_slots', 'spells_known', 'subclass_level', 'sort_order',
        ];

        foreach ($directFields as $field) {
            if (array_key_exists($field, $validated)) {
                $updateData[$field] = $validated[$field];
            }
        }

        $class->update($updateData);

        // Sync settings if provided
        if (array_key_exists('setting_ids', $validated)) {
            $class->settings()->sync($validated['setting_ids'] ?? []);
        }

        $class->load('settings:id,name,slug');

        return response()->json([
            'success' => true,
            'message' => 'Класс обновлён',
            'data' => [
                'class' => $class->formatForApi(),
                'settings' => $class->settings->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->getTranslation('name', 'ru'),
                    'slug' => $s->slug,
                ]),
            ],
        ]);
    }

    /**
     * Delete a class
     */
    public function destroy(CharacterClass $class): JsonResponse
    {
        // Prevent deleting system classes
        if ($class->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Системные классы нельзя удалять',
            ], 403);
        }

        // TODO: Check if any characters are using this class
        // $charactersCount = Character::where('class_slug', $class->slug)->count();
        // if ($charactersCount > 0) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => "Этот класс используется {$charactersCount} персонажами",
        //     ], 422);
        // }

        $class->settings()->detach();
        $class->delete();

        return response()->json([
            'success' => true,
            'message' => 'Класс удалён',
        ]);
    }

    /**
     * Get all settings for attaching classes
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
}
