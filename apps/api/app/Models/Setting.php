<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

class Setting extends Model
{
    use HasFactory, HasTranslations;

    public array $translatable = ['name', 'description'];

    protected $fillable = [
        'rule_system_id',
        'name',
        'description',
        'slug',
        'is_system',
        'icon',
        'color',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Rule system this setting belongs to
     */
    public function ruleSystem(): BelongsTo
    {
        return $this->belongsTo(RuleSystem::class);
    }

    /**
     * Campaigns using this setting
     */
    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }

    /**
     * Races available in this setting
     */
    public function races(): BelongsToMany
    {
        return $this->belongsToMany(Race::class, 'setting_races')
            ->withPivot('overrides')
            ->withTimestamps()
            ->orderBy('sort_order');
    }

    /**
     * Character classes available in this setting
     */
    public function characterClasses(): BelongsToMany
    {
        return $this->belongsToMany(CharacterClass::class, 'setting_classes')
            ->withPivot('overrides')
            ->withTimestamps()
            ->orderBy('sort_order');
    }

    /**
     * Spells available in this setting
     */
    public function spells(): BelongsToMany
    {
        return $this->belongsToMany(Spell::class, 'setting_spells')
            ->withPivot('overrides')
            ->withTimestamps()
            ->orderBy('level')
            ->orderBy('name->ru');
    }

    /**
     * Feats available in this setting
     */
    public function feats(): BelongsToMany
    {
        return $this->belongsToMany(Feat::class, 'setting_feats')
            ->withPivot('overrides')
            ->withTimestamps()
            ->orderBy('sort_order');
    }

    /**
     * Get the rule system's abilities through this setting
     */
    public function getAbilities(): array
    {
        return $this->ruleSystem->abilities ?? [];
    }

    /**
     * Get the rule system's skills through this setting
     */
    public function getSkills(): array
    {
        return $this->ruleSystem->skills ?? [];
    }

    /**
     * Get races formatted for API with overrides applied
     */
    public function getRacesForApi(): array
    {
        return $this->races->map(fn (Race $race) => $race->getForSetting($this))->toArray();
    }

    /**
     * Get classes formatted for API with overrides applied
     */
    public function getClassesForApi(): array
    {
        return $this->characterClasses->map(fn (CharacterClass $class) => $class->getForSetting($this))->toArray();
    }
}
