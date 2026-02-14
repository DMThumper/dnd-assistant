<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

class RuleSystem extends Model
{
    use HasFactory, HasTranslations;

    public array $translatable = ['name', 'description'];

    protected $fillable = [
        'name',
        'description',
        'slug',
        'is_system',
        'abilities',
        'skills',
        'dice',
        'formulas',
        'conditions',
        'damage_types',
        'magic_schools',
        'level_range',
        'combat_rules',
        'character_creation',
        'currency',
        'units',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'abilities' => 'array',
            'skills' => 'array',
            'dice' => 'array',
            'formulas' => 'array',
            'conditions' => 'array',
            'damage_types' => 'array',
            'magic_schools' => 'array',
            'level_range' => 'array',
            'combat_rules' => 'array',
            'character_creation' => 'array',
            'currency' => 'array',
            'units' => 'array',
        ];
    }

    /**
     * Settings using this rule system
     */
    public function settings(): HasMany
    {
        return $this->hasMany(Setting::class);
    }

    /**
     * Get ability modifier formula
     */
    public function getAbilityModifierFormula(): string
    {
        return $this->formulas['ability_modifier'] ?? 'floor((score - 10) / 2)';
    }

    /**
     * Get proficiency bonus formula
     */
    public function getProficiencyBonusFormula(): string
    {
        return $this->formulas['proficiency_bonus'] ?? 'floor((level - 1) / 4) + 2';
    }

    /**
     * Check if system uses metric units
     */
    public function isMetric(): bool
    {
        return ($this->units['system'] ?? 'metric') === 'metric';
    }
}
