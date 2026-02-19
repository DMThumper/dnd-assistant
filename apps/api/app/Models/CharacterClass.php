<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Translatable\HasTranslations;

class CharacterClass extends Model
{
    use HasFactory, HasTranslations;

    protected $table = 'character_classes';

    public array $translatable = ['name', 'description', 'subclass_name'];

    protected $fillable = [
        'name',
        'description',
        'slug',
        'parent_slug',
        'hit_die',
        'primary_abilities',
        'saving_throws',
        'armor_proficiencies',
        'weapon_proficiencies',
        'tool_proficiencies',
        'skill_choices',
        'skill_options',
        'starting_equipment',
        'starting_gold_formula',
        'level_features',
        'progression',
        'is_spellcaster',
        'spellcasting_ability',
        'spell_slots',
        'spells_known',
        'subclass_level',
        'subclass_name',
        'circle_spells',
        'is_system',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'primary_abilities' => 'array',
            'saving_throws' => 'array',
            'armor_proficiencies' => 'array',
            'weapon_proficiencies' => 'array',
            'tool_proficiencies' => 'array',
            'skill_choices' => 'integer',
            'skill_options' => 'array',
            'starting_equipment' => 'array',
            'level_features' => 'array',
            'progression' => 'array',
            'is_spellcaster' => 'boolean',
            'spell_slots' => 'array',
            'spells_known' => 'array',
            'circle_spells' => 'array',
            'is_system' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Settings that include this class
     */
    public function settings(): BelongsToMany
    {
        return $this->belongsToMany(Setting::class, 'setting_classes')
            ->withPivot('overrides')
            ->withTimestamps();
    }

    /**
     * Parent class (for subclasses)
     */
    public function parent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_slug', 'slug');
    }

    /**
     * Subclasses of this class
     */
    public function subclasses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(self::class, 'parent_slug', 'slug');
    }

    /**
     * Check if this is a subclass
     */
    public function isSubclass(): bool
    {
        return $this->parent_slug !== null;
    }

    /**
     * Get hit die number (e.g., 10 from "d10")
     */
    public function getHitDieNumber(): int
    {
        return (int) str_replace('d', '', $this->hit_die);
    }

    /**
     * Calculate HP at first level (max hit die + CON modifier)
     */
    public function getFirstLevelHp(int $constitutionModifier): int
    {
        return $this->getHitDieNumber() + $constitutionModifier;
    }

    /**
     * Calculate HP on level up (average: die/2 + 1 + CON modifier)
     */
    public function getLevelUpHp(int $constitutionModifier): int
    {
        return (int) floor($this->getHitDieNumber() / 2) + 1 + $constitutionModifier;
    }

    /**
     * Get features for a specific level
     */
    public function getFeaturesAtLevel(int $level): array
    {
        return $this->level_features[(string) $level] ?? [];
    }

    /**
     * Get all features up to and including a specific level
     */
    public function getAllFeaturesUpToLevel(int $level): array
    {
        $features = [];
        for ($i = 1; $i <= $level; $i++) {
            $levelFeatures = $this->getFeaturesAtLevel($i);
            foreach ($levelFeatures as $feature) {
                $features[] = array_merge($feature, ['level' => $i]);
            }
        }
        return $features;
    }

    /**
     * Get spell slots at a specific level
     */
    public function getSpellSlotsAtLevel(int $level): array
    {
        if (!$this->is_spellcaster || !$this->spell_slots) {
            return [];
        }
        return $this->spell_slots[(string) $level] ?? [];
    }

    /**
     * Get class data with setting-specific overrides applied
     */
    public function getForSetting(Setting $setting): array
    {
        $pivot = $this->settings()->where('setting_id', $setting->id)->first()?->pivot;
        $overrides = $pivot?->overrides ?? [];

        $data = $this->formatForApi();

        if (!empty($overrides)) {
            foreach ($overrides as $key => $value) {
                if (is_array($value) && isset($data[$key]) && is_array($data[$key])) {
                    $data[$key] = array_merge($data[$key], $value);
                } else {
                    $data[$key] = $value;
                }
            }
        }

        return $data;
    }

    /**
     * Format for API response
     */
    public function formatForApi(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->getTranslation('name', 'ru'),
            'description' => $this->getTranslation('description', 'ru'),
            'slug' => $this->slug,
            'parent_slug' => $this->parent_slug,
            'hit_die' => $this->hit_die,
            'primary_abilities' => $this->primary_abilities,
            'saving_throws' => $this->saving_throws,
            'armor_proficiencies' => $this->armor_proficiencies,
            'weapon_proficiencies' => $this->weapon_proficiencies,
            'tool_proficiencies' => $this->tool_proficiencies,
            'skill_choices' => $this->skill_choices,
            'skill_options' => $this->skill_options,
            'starting_equipment' => $this->starting_equipment,
            'starting_gold_formula' => $this->starting_gold_formula,
            'level_features' => $this->level_features,
            'progression' => $this->progression,
            'is_spellcaster' => $this->is_spellcaster,
            'spellcasting_ability' => $this->spellcasting_ability,
            'spell_slots' => $this->spell_slots,
            'spells_known' => $this->spells_known,
            'subclass_level' => $this->subclass_level,
            'subclass_name' => $this->subclass_name ? $this->getTranslation('subclass_name', 'ru') : null,
            'is_system' => $this->is_system,
            'sort_order' => $this->sort_order,
        ];
    }
}
