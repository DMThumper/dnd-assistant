<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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

    /**
     * Players in this campaign (many-to-many)
     */
    public function players(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'campaign_player')
            ->withPivot('joined_at')
            ->withTimestamps();
    }

    /**
     * Characters in this campaign
     */
    public function characters(): HasMany
    {
        return $this->hasMany(Character::class);
    }

    /**
     * Live sessions for this campaign
     */
    public function liveSessions(): HasMany
    {
        return $this->hasMany(LiveSession::class);
    }

    /**
     * Get currently active live session
     */
    public function getActiveLiveSession(): ?LiveSession
    {
        return $this->liveSessions()->active()->first();
    }

    /**
     * Check if campaign has an active live session
     */
    public function hasActiveLiveSession(): bool
    {
        return $this->liveSessions()->active()->exists();
    }

    /**
     * Check if a user is a player in this campaign
     */
    public function hasPlayer(User $user): bool
    {
        return $this->players()->where('users.id', $user->id)->exists();
    }

    /**
     * Check if a user has access to this campaign (DM or player)
     */
    public function userHasAccess(User $user): bool
    {
        return $this->user_id === $user->id || $this->hasPlayer($user);
    }

    /**
     * Format for API response
     */
    public function formatForApi(): array
    {
        $liveSession = $this->getActiveLiveSession();

        return [
            'id' => $this->id,
            'name' => $this->getTranslation('name', 'ru'),
            'description' => $this->getTranslation('description', 'ru'),
            'slug' => $this->slug,
            'status' => $this->status,
            'settings' => $this->settings,
            'setting' => $this->setting ? [
                'id' => $this->setting->id,
                'name' => $this->setting->getTranslation('name', 'ru'),
                'slug' => $this->setting->slug,
            ] : null,
            'owner' => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ],
            'players_count' => $this->players()->count(),
            'characters_count' => $this->characters()->where('is_alive', true)->count(),
            'has_active_live_session' => $liveSession !== null,
            'live_session' => $liveSession?->formatForApi(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    /**
     * Format for player API (includes user's characters)
     */
    public function formatForPlayerApi(User $user): array
    {
        $data = $this->formatForApi();
        $data['my_characters'] = $this->characters()
            ->where('user_id', $user->id)
            ->get()
            ->map(fn (Character $character) => $character->formatForApi())
            ->toArray();
        $data['my_alive_characters_count'] = $this->characters()
            ->where('user_id', $user->id)
            ->where('is_alive', true)
            ->count();
        return $data;
    }
}
