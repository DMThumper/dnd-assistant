<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DisplayToken extends Model
{
    use HasFactory;

    public const STATUS_WAITING = 'waiting';
    public const STATUS_PAIRED = 'paired';
    public const STATUS_DISCONNECTED = 'disconnected';

    public const CODE_LENGTH = 4;
    public const CODE_TTL_MINUTES = 5;
    public const HEARTBEAT_TIMEOUT_SECONDS = 60;

    protected $fillable = [
        'token',
        'code',
        'campaign_id',
        'user_id',
        'name',
        'status',
        'code_expires_at',
        'last_heartbeat_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'code_expires_at' => 'datetime',
            'last_heartbeat_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Campaign this display is paired to
     */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * User (DM) who paired this display
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate a new display token with code
     */
    public static function createNew(array $metadata = []): self
    {
        return self::create([
            'token' => Str::uuid()->toString(),
            'code' => self::generateCode(),
            'status' => self::STATUS_WAITING,
            'code_expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
            'metadata' => $metadata,
        ]);
    }

    /**
     * Generate a random 4-digit code
     */
    public static function generateCode(): string
    {
        return str_pad((string) random_int(0, 9999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    /**
     * Refresh the pairing code
     */
    public function refreshCode(): self
    {
        $this->update([
            'code' => self::generateCode(),
            'code_expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
        ]);

        return $this;
    }

    /**
     * Pair display with campaign and DM
     */
    public function pair(Campaign $campaign, User $user, ?string $name = null): self
    {
        $this->update([
            'campaign_id' => $campaign->id,
            'user_id' => $user->id,
            'name' => $name ?? "Display #{$this->id}",
            'status' => self::STATUS_PAIRED,
            'last_heartbeat_at' => now(),
        ]);

        return $this;
    }

    /**
     * Disconnect display
     */
    public function disconnect(): self
    {
        $this->update([
            'campaign_id' => null,
            'user_id' => null,
            'status' => self::STATUS_DISCONNECTED,
        ]);

        return $this;
    }

    /**
     * Update heartbeat timestamp
     */
    public function heartbeat(): self
    {
        $this->update(['last_heartbeat_at' => now()]);
        return $this;
    }

    /**
     * Check if code is expired
     */
    public function isCodeExpired(): bool
    {
        return $this->code_expires_at->isPast();
    }

    /**
     * Check if display is paired
     */
    public function isPaired(): bool
    {
        return $this->status === self::STATUS_PAIRED;
    }

    /**
     * Check if display is waiting for pairing
     */
    public function isWaiting(): bool
    {
        return $this->status === self::STATUS_WAITING;
    }

    /**
     * Check if display is alive (recent heartbeat)
     */
    public function isAlive(): bool
    {
        if (!$this->last_heartbeat_at) {
            return false;
        }

        return $this->last_heartbeat_at->diffInSeconds(now()) < self::HEARTBEAT_TIMEOUT_SECONDS;
    }

    /**
     * Find display by valid code (not expired, waiting status)
     */
    public static function findByCode(string $code): ?self
    {
        return self::where('code', $code)
            ->where('status', self::STATUS_WAITING)
            ->where('code_expires_at', '>', now())
            ->first();
    }

    /**
     * Get time remaining until code expires (in seconds)
     */
    public function getCodeTtl(): int
    {
        return (int) max(0, now()->diffInSeconds($this->code_expires_at, false));
    }
}
