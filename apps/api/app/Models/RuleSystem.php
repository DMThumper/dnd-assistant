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
        // Level progression
        'experience_table',
        'multiclass_prerequisites',
        'multiclass_proficiencies',
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
            // Level progression
            'experience_table' => 'array',
            'multiclass_prerequisites' => 'array',
            'multiclass_proficiencies' => 'array',
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

    /**
     * Get XP required for a specific level
     */
    public function getXpForLevel(int $level): int
    {
        $table = $this->experience_table ?? [];
        return $table[(string) $level] ?? 0;
    }

    /**
     * Get level for a given XP amount
     */
    public function getLevelForXp(int $xp): int
    {
        $table = $this->experience_table ?? [];
        $level = 1;

        foreach ($table as $lvl => $requiredXp) {
            if ($xp >= $requiredXp) {
                $level = (int) $lvl;
            } else {
                break;
            }
        }

        return $level;
    }

    /**
     * Check if XP allows for level up
     */
    public function canLevelUp(int $currentLevel, int $xp): bool
    {
        $maxLevel = $this->level_range['max'] ?? 20;
        if ($currentLevel >= $maxLevel) {
            return false;
        }

        $nextLevelXp = $this->getXpForLevel($currentLevel + 1);
        return $xp >= $nextLevelXp;
    }

    /**
     * Get multiclass prerequisites for a class
     */
    public function getMulticlassPrerequisites(string $classSlug): ?array
    {
        $prereqs = $this->multiclass_prerequisites ?? [];
        return $prereqs[$classSlug] ?? null;
    }

    /**
     * Get proficiencies gained when multiclassing into a class
     */
    public function getMulticlassProficiencies(string $classSlug): array
    {
        $profs = $this->multiclass_proficiencies ?? [];
        return $profs[$classSlug] ?? [];
    }
}
