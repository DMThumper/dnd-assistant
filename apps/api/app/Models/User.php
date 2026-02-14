<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, LogsActivity;

    protected $guard_name = 'api';

    protected $fillable = [
        'name',
        'email',
        'password',
        'is_active',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Check if user account is active
     */
    public function isActive(): bool
    {
        return $this->is_active ?? false;
    }

    /**
     * Activity log configuration
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /**
     * Get campaigns owned by this user (as DM)
     */
    public function ownedCampaigns(): HasMany
    {
        return $this->hasMany(Campaign::class, 'user_id');
    }

    /**
     * Get characters owned by this user
     */
    public function characters(): HasMany
    {
        return $this->hasMany(Character::class, 'user_id');
    }

    /**
     * Get campaigns where user is a player (many-to-many)
     */
    public function campaigns(): BelongsToMany
    {
        return $this->belongsToMany(Campaign::class, 'campaign_player')
            ->withPivot('joined_at')
            ->withTimestamps();
    }

    /**
     * Get all campaigns user has access to (owned + player)
     */
    public function accessibleCampaigns()
    {
        return Campaign::where('user_id', $this->id)
            ->orWhereHas('players', fn ($query) => $query->where('users.id', $this->id));
    }

    /**
     * Send the email verification notification.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new \App\Notifications\VerifyEmailNotification());
    }

    /**
     * Check if user has backoffice access (owner or dm)
     */
    public function hasBackofficeAccess(): bool
    {
        return $this->hasAnyRole(['owner', 'dm']);
    }

    /**
     * Check if user can manage other users' roles
     */
    public function canManageRoles(): bool
    {
        return $this->hasRole('owner');
    }
}
