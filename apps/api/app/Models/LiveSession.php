<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveSession extends Model
{
    protected $fillable = [
        'campaign_id',
        'game_session_id',
        'started_by',
        'started_at',
        'ended_at',
        'is_active',
        'participants',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'is_active' => 'boolean',
            'participants' => 'array',
            'metadata' => 'array',
        ];
    }

    /**
     * Campaign this live session belongs to
     */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Game session this is linked to (optional)
     */
    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    /**
     * User who started this session (DM)
     */
    public function startedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by');
    }

    /**
     * Scope for active sessions
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get active session for a campaign
     */
    public static function getActiveForCampaign(int $campaignId): ?self
    {
        return static::where('campaign_id', $campaignId)
            ->active()
            ->first();
    }

    /**
     * Add a participant to the session
     */
    public function addParticipant(int $userId, ?int $characterId = null): void
    {
        $participants = $this->participants ?? [];

        // Check if already participating
        foreach ($participants as $p) {
            if ($p['user_id'] === $userId) {
                return;
            }
        }

        $participants[] = [
            'user_id' => $userId,
            'character_id' => $characterId,
            'joined_at' => now()->toISOString(),
        ];

        $this->update(['participants' => $participants]);
    }

    /**
     * Remove a participant from the session
     */
    public function removeParticipant(int $userId): void
    {
        $participants = array_filter(
            $this->participants ?? [],
            fn ($p) => $p['user_id'] !== $userId
        );

        $this->update(['participants' => array_values($participants)]);
    }

    /**
     * End the session
     */
    public function end(): void
    {
        $this->update([
            'is_active' => false,
            'ended_at' => now(),
        ]);
    }

    /**
     * Format for API response
     */
    public function formatForApi(): array
    {
        return [
            'id' => $this->id,
            'campaign_id' => $this->campaign_id,
            'game_session_id' => $this->game_session_id,
            'started_by' => [
                'id' => $this->startedBy->id,
                'name' => $this->startedBy->name,
            ],
            'started_at' => $this->started_at?->toISOString(),
            'ended_at' => $this->ended_at?->toISOString(),
            'is_active' => $this->is_active,
            'participants' => $this->participants,
            'duration_minutes' => $this->is_active
                ? $this->started_at?->diffInMinutes(now())
                : $this->started_at?->diffInMinutes($this->ended_at),
        ];
    }
}
