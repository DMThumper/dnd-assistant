<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Translatable\HasTranslations;

class Character extends Model
{
    use HasFactory, HasTranslations;

    public array $translatable = ['name', 'backstory'];

    protected $fillable = [
        'user_id',
        'campaign_id',
        'name',
        'backstory',
        'race_slug',
        'class_slug',
        'level',
        'experience_points',
        'abilities',
        'current_hp',
        'max_hp',
        'temp_hp',
        'armor_class',
        'speed',
        'inspiration',
        'skill_proficiencies',
        'skill_expertise',
        'saving_throw_proficiencies',
        'proficiencies',
        'death_saves',
        'hit_dice_remaining',
        'features',
        'class_resources',
        'currency',
        'is_alive',
        'is_active',
        'death_info',
        'stats',
        // Game state fields for real-time sync
        'conditions',
        'custom_rules',
        'inventory',
        'equipment',
        'prepared_spells',
        'known_spells',
        'always_prepared_spells',
        'spell_slots_remaining',
        'short_rest_recovery_used',
        'concentration_spell',
        'class_levels',
        'subclasses',
        'asi_choices',
        'feat_bonuses',
        'player_notes',
        'summoned_creatures',
        'wild_shape_charges',
        'wild_shape_form',
    ];

    protected function casts(): array
    {
        return [
            'abilities' => 'array',
            'speed' => 'array',
            'skill_proficiencies' => 'array',
            'skill_expertise' => 'array',
            'saving_throw_proficiencies' => 'array',
            'proficiencies' => 'array',
            'death_saves' => 'array',
            'hit_dice_remaining' => 'array',
            'features' => 'array',
            'class_resources' => 'array',
            'currency' => 'array',
            'death_info' => 'array',
            'stats' => 'array',
            'is_alive' => 'boolean',
            'is_active' => 'boolean',
            'inspiration' => 'boolean',
            // Game state fields for real-time sync
            'conditions' => 'array',
            'custom_rules' => 'array',
            'inventory' => 'array',
            'equipment' => 'array',
            'prepared_spells' => 'array',
            'known_spells' => 'array',
            'always_prepared_spells' => 'array',
            'spell_slots_remaining' => 'array',
            'short_rest_recovery_used' => 'array',
            'concentration_spell' => 'array',
            'class_levels' => 'array',
            'subclasses' => 'array',
            'asi_choices' => 'array',
            'feat_bonuses' => 'array',
            'summoned_creatures' => 'array',
            'wild_shape_charges' => 'integer',
            'wild_shape_form' => 'array',
        ];
    }

    /**
     * User who owns this character
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Campaign this character belongs to
     */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Check if character is alive
     */
    public function isAlive(): bool
    {
        return $this->is_alive;
    }

    /**
     * Check if character is dead
     */
    public function isDead(): bool
    {
        return !$this->is_alive;
    }

    /**
     * Get ability modifier
     */
    public function getAbilityModifier(string $ability): int
    {
        $score = $this->abilities[$ability] ?? 10;
        return (int) floor(($score - 10) / 2);
    }

    /**
     * Get proficiency bonus based on level
     */
    public function getProficiencyBonus(): int
    {
        return (int) floor(($this->level - 1) / 4) + 2;
    }

    /**
     * Calculate HP percentage
     */
    public function getHpPercentage(): float
    {
        if ($this->max_hp <= 0) {
            return 0;
        }
        return ($this->current_hp / $this->max_hp) * 100;
    }

    /**
     * Check if character is active (the currently playing character)
     */
    public function isActive(): bool
    {
        return $this->is_active;
    }

    /**
     * Check if character can be deleted.
     * Dead characters cannot be deleted - they are part of campaign history (graveyard).
     * Active characters cannot be deleted - must be deactivated first by DM.
     * Characters that have participated in sessions cannot be deleted.
     * This preserves campaign history and prevents accidental deletion.
     */
    public function canBeDeleted(): bool
    {
        // Dead characters are part of history - cannot be deleted
        if (!$this->is_alive) {
            return false;
        }

        // Active characters cannot be deleted - only DM can deactivate
        if ($this->is_active) {
            return false;
        }

        // Characters that played sessions are part of history
        $sessionsPlayed = $this->stats['sessions_played'] ?? 0;
        return $sessionsPlayed === 0;
    }

    /**
     * Get sessions played count
     */
    public function getSessionsPlayed(): int
    {
        return $this->stats['sessions_played'] ?? 0;
    }

    /**
     * Format for API response
     */
    public function formatForApi(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->getTranslation('name', 'ru'),
            'backstory' => $this->getTranslation('backstory', 'ru'),
            'race_slug' => $this->race_slug,
            'class_slug' => $this->class_slug,
            'level' => $this->level,
            'experience_points' => $this->experience_points,
            'abilities' => $this->abilities,
            'current_hp' => $this->current_hp,
            'max_hp' => $this->max_hp,
            'temp_hp' => $this->temp_hp,
            'armor_class' => $this->armor_class,
            'speed' => $this->speed,
            'inspiration' => $this->inspiration,
            'proficiency_bonus' => $this->getProficiencyBonus(),
            'skill_proficiencies' => $this->skill_proficiencies,
            'skill_expertise' => $this->skill_expertise,
            'saving_throw_proficiencies' => $this->saving_throw_proficiencies,
            'proficiencies' => $this->proficiencies,
            'death_saves' => $this->death_saves,
            'hit_dice_remaining' => $this->hit_dice_remaining,
            'features' => $this->features,
            'class_resources' => $this->class_resources,
            'currency' => $this->currency,
            'is_alive' => $this->is_alive,
            'is_active' => $this->is_active,
            'death_info' => $this->death_info,
            'stats' => $this->stats,
            'can_be_deleted' => $this->canBeDeleted(),
            'campaign_id' => $this->campaign_id,
            // Game state fields
            'conditions' => $this->conditions ?? [],
            'custom_rules' => $this->custom_rules ?? [],
            'inventory' => $this->inventory ?? [],
            'equipment' => $this->equipment ?? [],
            'prepared_spells' => $this->prepared_spells ?? [],
            'known_spells' => $this->known_spells ?? [],
            'always_prepared_spells' => $this->always_prepared_spells ?? [],
            'spell_slots_remaining' => $this->spell_slots_remaining ?? [],
            'short_rest_recovery_used' => $this->short_rest_recovery_used ?? [],
            'concentration_spell' => $this->concentration_spell,
            'class_levels' => $this->class_levels ?? [],
            'subclasses' => $this->subclasses ?? [],
            'asi_choices' => $this->asi_choices ?? [],
            'feat_bonuses' => $this->feat_bonuses ?? [],
            'player_notes' => $this->player_notes ?? '',
            'summoned_creatures' => $this->summoned_creatures ?? [],
            'wild_shape_charges' => $this->wild_shape_charges ?? 2,
            'wild_shape_form' => $this->wild_shape_form,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
