<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
}
