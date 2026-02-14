<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Spatie\Translatable\HasTranslations;

class GameSession extends Model
{
    use HasFactory, HasTranslations;

    /**
     * The table associated with the model.
     * Named game_sessions to avoid conflict with Laravel's sessions table.
     */
    protected $table = 'game_sessions';

    public array $translatable = ['name', 'summary'];

    public const STATUS_PLANNED = 'planned';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'act_id',
        'number',
        'name',
        'summary',
        'status',
        'played_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'number' => 'integer',
            'played_at' => 'date',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Act this session belongs to
     */
    public function act(): BelongsTo
    {
        return $this->belongsTo(Act::class);
    }

    /**
     * Get campaign through act
     */
    public function getCampaign(): ?Campaign
    {
        return $this->act?->campaign;
    }

    /**
     * Check if session is planned
     */
    public function isPlanned(): bool
    {
        return $this->status === self::STATUS_PLANNED;
    }

    /**
     * Check if session is active
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if session is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Get formatted title (e.g., "Session #1: Name")
     */
    public function getFormattedTitle(?string $locale = null): string
    {
        $name = $this->getTranslation('name', $locale ?? app()->getLocale());
        return "Сессия #{$this->number}: {$name}";
    }

    /**
     * Get global session number across the campaign
     */
    public function getGlobalNumber(): int
    {
        $campaign = $this->getCampaign();
        if (!$campaign) {
            return $this->number;
        }

        $previousSessionsCount = GameSession::query()
            ->whereHas('act', function ($query) use ($campaign) {
                $query->where('campaign_id', $campaign->id)
                    ->where('sort_order', '<', $this->act->sort_order);
            })
            ->count();

        $sessionsInActBefore = GameSession::query()
            ->where('act_id', $this->act_id)
            ->where('sort_order', '<', $this->sort_order)
            ->count();

        return $previousSessionsCount + $sessionsInActBefore + 1;
    }
}
