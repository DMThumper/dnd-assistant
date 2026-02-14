<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Spatie\Translatable\HasTranslations;

class Campaign extends Model
{
    use HasFactory, HasTranslations;

    public array $translatable = ['name', 'description'];

    public const STATUS_ACTIVE = 'active';
    public const STATUS_PAUSED = 'paused';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'setting_id',
        'user_id',
        'name',
        'description',
        'slug',
        'status',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    /**
     * Setting this campaign uses
     */
    public function setting(): BelongsTo
    {
        return $this->belongsTo(Setting::class);
    }

    /**
     * User who owns this campaign (DM)
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Acts in this campaign
     */
    public function acts(): HasMany
    {
        return $this->hasMany(Act::class)->orderBy('sort_order');
    }

    /**
     * Game sessions through acts
     */
    public function gameSessions(): HasManyThrough
    {
        return $this->hasManyThrough(GameSession::class, Act::class);
    }

    /**
     * Get the rule system through setting
     */
    public function getRuleSystem(): ?RuleSystem
    {
        return $this->setting?->ruleSystem;
    }

    /**
     * Check if campaign is active
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Get allowed races from campaign settings
     */
    public function getAllowedRaces(): ?array
    {
        return $this->settings['allowed_races'] ?? null;
    }

    /**
     * Get allowed classes from campaign settings
     */
    public function getAllowedClasses(): ?array
    {
        return $this->settings['allowed_classes'] ?? null;
    }

    /**
     * Get starting level for new characters
     */
    public function getStartingLevel(): int
    {
        return $this->settings['starting_level'] ?? 1;
    }

    /**
     * Get ability score method (point_buy, standard_array, roll)
     */
    public function getAbilityMethod(): string
    {
        return $this->settings['ability_method'] ?? 'point_buy';
    }
}
