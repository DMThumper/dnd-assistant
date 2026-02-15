<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

class Race extends Model
{
    use HasFactory, HasTranslations;

    public array $translatable = ['name', 'description'];

    protected $fillable = [
        'name',
        'description',
        'slug',
        'size',
        'ability_bonuses',
        'speed',
        'traits',
        'languages',
        'proficiencies',
        'skill_proficiencies',
        'parent_slug',
        'age_info',
        'size_info',
        'is_system',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'ability_bonuses' => 'array',
            'speed' => 'array',
            'traits' => 'array',
            'languages' => 'array',
            'proficiencies' => 'array',
            'skill_proficiencies' => 'array',
            'age_info' => 'array',
            'size_info' => 'array',
            'is_system' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Settings that include this race
     */
    public function settings(): BelongsToMany
    {
        return $this->belongsToMany(Setting::class, 'setting_races')
            ->withPivot('overrides')
            ->withTimestamps();
    }

    /**
     * Parent race (if this is a subrace)
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Race::class, 'parent_slug', 'slug');
    }

    /**
     * Subraces of this race
     */
    public function subraces(): HasMany
    {
        return $this->hasMany(Race::class, 'parent_slug', 'slug');
    }

    /**
     * Check if this is a subrace
     */
    public function isSubrace(): bool
    {
        return $this->parent_slug !== null;
    }

    /**
     * Get walking speed in meters
     */
    public function getWalkSpeed(): int
    {
        return $this->speed['walk'] ?? 9;
    }

    /**
     * Get ability bonus for a specific ability
     */
    public function getAbilityBonus(string $ability): int
    {
        return $this->ability_bonuses[$ability] ?? 0;
    }

    /**
     * Check if race has flexible ability score assignment
     */
    public function hasFlexibleAbilities(): bool
    {
        return isset($this->ability_bonuses['choice']);
    }

    /**
     * Get race data with setting-specific overrides applied
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
            'ability_bonuses' => $this->ability_bonuses,
            'speed' => $this->speed,
            'traits' => $this->traits,
            'languages' => $this->languages,
            'proficiencies' => $this->proficiencies,
            'skill_proficiencies' => $this->skill_proficiencies,
            'parent_slug' => $this->parent_slug,
            'is_subrace' => $this->isSubrace(),
            'age_info' => $this->age_info,
            'size_info' => $this->size_info,
            'is_system' => $this->is_system,
            'sort_order' => $this->sort_order,
        ];
    }
}
