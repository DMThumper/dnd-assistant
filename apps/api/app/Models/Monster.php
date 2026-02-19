<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Translatable\HasTranslations;

class Monster extends Model
{
    use HasFactory, HasTranslations;

    public array $translatable = ['name', 'description'];

    protected $fillable = [
        'name',
        'description',
        'slug',
        'size',
        'type',
        'alignment',
        'armor_class',
        'armor_type',
        'hit_points',
        'hit_dice',
        'challenge_rating',
        'experience_points',
        'abilities',
        'speed',
        'saving_throws',
        'skills',
        'senses',
        'languages',
        'damage_resistances',
        'damage_immunities',
        'damage_vulnerabilities',
        'condition_immunities',
        'traits',
        'actions',
        'legendary_actions',
        'lair_actions',
        'regional_effects',
        'is_system',
        'is_common',
        'has_swim',
        'has_fly',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'abilities' => 'array',
            'speed' => 'array',
            'saving_throws' => 'array',
            'skills' => 'array',
            'senses' => 'array',
            'languages' => 'array',
            'damage_resistances' => 'array',
            'damage_immunities' => 'array',
            'damage_vulnerabilities' => 'array',
            'condition_immunities' => 'array',
            'traits' => 'array',
            'actions' => 'array',
            'legendary_actions' => 'array',
            'lair_actions' => 'array',
            'regional_effects' => 'array',
            'challenge_rating' => 'decimal:2',
            'is_system' => 'boolean',
            'is_common' => 'boolean',
            'has_swim' => 'boolean',
            'has_fly' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Settings that include this monster
     */
    public function settings(): BelongsToMany
    {
        return $this->belongsToMany(Setting::class, 'setting_monsters')
            ->withPivot('overrides')
            ->withTimestamps();
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
     * Get walking speed in meters
     */
    public function getWalkSpeed(): int
    {
        return $this->speed['walk'] ?? 9;
    }

    /**
     * Check if monster has legendary actions
     */
    public function hasLegendaryActions(): bool
    {
        return !empty($this->legendary_actions);
    }

    /**
     * Check if monster has lair actions
     */
    public function hasLairActions(): bool
    {
        return !empty($this->lair_actions);
    }

    /**
     * Get formatted CR string
     */
    public function getChallengeRatingString(): string
    {
        $cr = $this->challenge_rating;

        if ($cr === null) {
            return '-';
        }

        if ($cr == 0.125) {
            return '1/8';
        }
        if ($cr == 0.25) {
            return '1/4';
        }
        if ($cr == 0.5) {
            return '1/2';
        }

        return (string) (int) $cr;
    }

    /**
     * Get monster data with setting-specific overrides applied
     */
    public function getForSetting(Setting $setting): array
    {
        $pivot = $this->settings()->where('setting_id', $setting->id)->first()?->pivot;
        $overrides = $pivot?->overrides ?? [];

        $data = $this->formatForApi();

        // Merge overrides
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
            'size' => $this->size,
            'type' => $this->type,
            'alignment' => $this->alignment,
            'armor_class' => $this->armor_class,
            'armor_type' => $this->armor_type,
            'hit_points' => $this->hit_points,
            'hit_dice' => $this->hit_dice,
            'challenge_rating' => $this->challenge_rating,
            'challenge_rating_string' => $this->getChallengeRatingString(),
            'experience_points' => $this->experience_points,
            'abilities' => $this->abilities,
            'speed' => $this->speed,
            'saving_throws' => $this->saving_throws,
            'skills' => $this->skills,
            'senses' => $this->senses,
            'languages' => $this->languages,
            'damage_resistances' => $this->damage_resistances,
            'damage_immunities' => $this->damage_immunities,
            'damage_vulnerabilities' => $this->damage_vulnerabilities,
            'condition_immunities' => $this->condition_immunities,
            'traits' => $this->traits,
            'actions' => $this->actions,
            'legendary_actions' => $this->legendary_actions,
            'lair_actions' => $this->lair_actions,
            'regional_effects' => $this->regional_effects,
            'has_legendary_actions' => $this->hasLegendaryActions(),
            'has_lair_actions' => $this->hasLairActions(),
            'is_system' => $this->is_system,
            'is_common' => $this->is_common,
            'has_swim' => $this->has_swim,
            'has_fly' => $this->has_fly,
            'sort_order' => $this->sort_order,
        ];
    }
}
