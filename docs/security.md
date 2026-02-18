# Security

Безопасность — не фича, а фундамент.

## Authentication

- **Laravel Passport** OAuth2 с personal access tokens
- Email verification обязательна
- Аккаунт `is_active=false` по умолчанию → Owner/DM активирует
- Деактивация игрока → все токены отзываются (`tokens()->delete()`)
- Password hashing: bcrypt

## Authorization

### Middleware

```php
Route::middleware('auth:api')->group(function () {
    // Player routes
    Route::prefix('player')->group(function () { ... });

    // Backoffice — auth + роль
    Route::middleware('backoffice.access')->prefix('backoffice')->group(...);
});

// BackofficeAccess middleware
if (!$user->hasAnyRole(['owner', 'dm'])) {
    abort(403);
}
```

### Policies

```php
class CampaignPolicy {
    public function view(User $user, Campaign $campaign): bool {
        return $user->id === $campaign->user_id           // DM
            || $campaign->players->contains($user->id);    // Игрок
    }
}

class CharacterPolicy {
    public function update(User $user, Character $character): bool {
        return $user->id === $character->user_id           // Владелец
            || $user->id === $character->campaign->user_id; // DM
    }
}
```

### Правила

- Player видит ТОЛЬКО свои персонажи и кампании
- Player НЕ видит персонажей других игроков
- DM видит всё в своих кампаниях, но не в чужих
- Owner видит и управляет всем

## WebSocket Security

```php
// channels.php
Broadcast::channel('campaign.{id}', function (User $user, int $id) {
    $campaign = Campaign::findOrFail($id);
    return $campaign->user_id === $user->id
        || $campaign->players->contains($user->id);
});

// Приватный канал
Broadcast::channel('private-character.{id}', function (User $user, int $id) {
    $character = Character::findOrFail($id);
    return $user->id === $character->user_id
        || $user->id === $character->campaign->user_id;
});

// Display канал — только DM
Broadcast::channel('campaign.{id}.display', function (User $user, int $id) {
    return Campaign::where('id', $id)->where('user_id', $user->id)->exists();
});
```

## Input Validation & Protection

- **Form Requests** — валидация до контроллера
- **JSONB валидация** — кастомные правила
- **Mass assignment** — `$fillable` на всех моделях
- **SQL injection** — Eloquent ORM + parameter binding
- **XSS** — `strip_tags()` / `htmlspecialchars()`
- **Rate limiting** — auth: `60/min`, API: `120/min`
- **File uploads** — валидация MIME, размеров
- **CORS** — только frontend домен

## Принцип наименьших привилегий

```
guest     → GET  /                        (лендинг)
player    → GET  /api/v1/player/*         (свои данные)
           → PUT  /api/v1/player/character/*
dm        → *    /api/v1/backoffice/*     (свои кампании)
owner     → *    /api/v1/backoffice/*     (всё + пользователи)
```
