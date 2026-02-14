<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Translatable\HasTranslations;

class Act extends Model
{
    use HasFactory, HasTranslations;

    public array $translatable = ['name', 'description', 'intro', 'epilogue'];

    public const STATUS_PLANNED = 'planned';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';

    protected $fillable = [
        'campaign_id',
        'number',
        'name',
        'description',
        'intro',
        'epilogue',
        'status',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'number' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Campaign this act belongs to
     */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Game sessions in this act
     */
    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class)->orderBy('sort_order');
    }

    /**
     * Check if act is active
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if act is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Get formatted title (e.g., "Act 1: Name")
     */
    public function getFormattedTitle(?string $locale = null): string
    {
        $name = $this->getTranslation('name', $locale ?? app()->getLocale());
        return "Акт {$this->number}: {$name}";
    }

    /**
     * Get total session count
     */
    public function getSessionCount(): int
    {
        return $this->gameSessions()->count();
    }

    /**
     * Get completed session count
     */
    public function getCompletedSessionCount(): int
    {
        return $this->gameSessions()->where('status', GameSession::STATUS_COMPLETED)->count();
    }
}
