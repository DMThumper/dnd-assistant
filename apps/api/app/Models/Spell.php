<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Translatable\HasTranslations;

class Spell extends Model
{
    use HasFactory, HasTranslations;

    public array $translatable = ['name', 'description'];

    protected $fillable = [
        'name',
        'description',
        'slug',
        'level',
        'school',
        'casting_time',
        'range',
        'duration',
        'concentration',
        'ritual',
        'components',
        'classes',
        'higher_levels',
        'cantrip_scaling',
        'effects',
        'is_system',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'concentration' => 'boolean',
            'ritual' => 'boolean',
            'components' => 'array',
            'classes' => 'array',
            'higher_levels' => 'array',
            'cantrip_scaling' => 'array',
            'effects' => 'array',
            'is_system' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Settings that include this spell
     */
    public function settings(): BelongsToMany
    {
        return $this->belongsToMany(Setting::class, 'setting_spells')
            ->withPivot('overrides')
            ->withTimestamps();
    }

    /**
     * Get level string (0 = Заговор, 1-9 = уровень)
     */
    public function getLevelString(): string
    {
        if ($this->level === 0) {
            return 'Заговор';
        }
        return $this->level . ' уровень';
    }

    /**
     * Check if spell is a cantrip
     */
    public function isCantrip(): bool
    {
        return $this->level === 0;
    }

    /**
     * Get component string (В, С, М)
     */
    public function getComponentsString(): string
    {
        $parts = [];
        $components = $this->components ?? [];

        if ($components['verbal'] ?? false) {
            $parts[] = 'В';
        }
        if ($components['somatic'] ?? false) {
            $parts[] = 'С';
        }
        if ($components['material'] ?? false) {
            $parts[] = 'М';
        }

        return implode(', ', $parts);
    }

    /**
     * Get spell data with setting-specific overrides applied
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
            'level' => $this->level,
            'level_string' => $this->getLevelString(),
            'school' => $this->school,
            'casting_time' => $this->casting_time,
            'range' => $this->range,
            'duration' => $this->duration,
            'concentration' => $this->concentration,
            'ritual' => $this->ritual,
            'components' => $this->components,
            'components_string' => $this->getComponentsString(),
            'classes' => $this->classes,
            'higher_levels' => $this->higher_levels,
            'cantrip_scaling' => $this->cantrip_scaling,
            'effects' => $this->effects,
            'is_cantrip' => $this->isCantrip(),
            'is_system' => $this->is_system,
            'sort_order' => $this->sort_order,
        ];
    }
}
