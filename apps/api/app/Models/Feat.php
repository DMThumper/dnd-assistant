<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Translatable\HasTranslations;

class Feat extends Model
{
    use HasFactory, HasTranslations;

    public array $translatable = ['name', 'description'];

    protected $fillable = [
        'name',
        'description',
        'slug',
        'prerequisites',
        'benefits',
        'repeatable',
        'is_system',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'prerequisites' => 'array',
            'benefits' => 'array',
            'repeatable' => 'boolean',
            'is_system' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Settings that include this feat
     */
    public function settings(): BelongsToMany
    {
        return $this->belongsToMany(Setting::class, 'setting_feats')
            ->withPivot('overrides')
            ->withTimestamps();
    }

    /**
     * Check if a character meets prerequisites
     */
    public function meetsPrerequisites(array $characterData): bool
    {
        if (empty($this->prerequisites)) {
            return true;
        }

        // Check ability score requirements
        if (isset($this->prerequisites['ability'])) {
            foreach ($this->prerequisites['ability'] as $ability => $minScore) {
                if (($characterData['abilities'][$ability] ?? 0) < $minScore) {
                    return false;
                }
            }
        }

        // Check proficiency requirements
        if (isset($this->prerequisites['proficiency'])) {
            $proficiency = $this->prerequisites['proficiency'];
            $characterProficiencies = $characterData['proficiencies'] ?? [];
            if (!in_array($proficiency, $characterProficiencies)) {
                return false;
            }
        }

        // Check spellcasting requirement
        if (isset($this->prerequisites['spellcasting']) && $this->prerequisites['spellcasting']) {
            if (!($characterData['is_spellcaster'] ?? false)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get feat data with setting-specific overrides applied
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
            'prerequisites' => $this->prerequisites,
            'benefits' => $this->benefits,
            'repeatable' => $this->repeatable,
            'is_system' => $this->is_system,
            'sort_order' => $this->sort_order,
        ];
    }
}
