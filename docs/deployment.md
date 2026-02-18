# Deployment

## Environment Files

### Local Development

- `apps/api/.env` — Laravel config (copy from `.env.example`)
- `apps/web/.env.local` — Next.js config (copy from `.env.local.example`)

### Production

- `apps/api/.env.prod` — Non-secret API settings (committed)
- `apps/web/.env.prod` — Non-secret Web settings for Coolify

## Coolify Deployment

Platform: **Coolify** with Git integration (Caddy proxy) on AWS.

### CORS

Handled by Caddy proxy (Coolify), NOT Laravel:
```php
// config/cors.php → paths => []
```

### Applications

| App | Domain | Dockerfile | Port |
|-----|--------|-----------|------|
| DnD API | api.dnd.yourdomain.com | apps/api/Dockerfile | 8000 |
| DnD Web | dnd.yourdomain.com | apps/web/Dockerfile | 3000 |

### Coolify Secrets

```
APP_KEY, DB_HOST, DB_USERNAME, DB_PASSWORD
REDIS_HOST, REDIS_PASSWORD
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
PASSPORT_PRIVATE_KEY_BASE64, PASSPORT_PUBLIC_KEY_BASE64
OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD
```

## Media Handling

### Upload Limits

| Type | Limit | Formats |
|------|-------|---------|
| Character portraits | 10MB | JPG, JPEG, WebP, PNG |
| Scene backgrounds | 20MB | JPG, JPEG, WebP, PNG |
| Scene ambient video | 500MB | MP4 |
| Soundtrack audio | 50MB | MP3, OGG, WAV |

### Media Collections (Spatie)

- Character: `portrait` (conversions: thumb 200x200, large 600x600)
- Scene: `background` (conversions: thumb 400x225, large 1920x1080)
- Scene: `ambient_video` (no conversions)
- Monster: `portrait`
- Npc: `portrait`
- Soundtrack: `audio_file`

## Code Quality

### PHP Standards (PHP 8.4)

- Typed class constants
- Readonly properties
- Arrow functions for simple closures

### TypeScript/React Standards

- Import React types explicitly
- Handle ignored promises with `void`
- React 19 ref pattern (no `forwardRef`)
- `readonly` for immutable class fields

### Pre-Commit Checks

```bash
npm run lint && npm run build && docker exec dnd_api php artisan test
```

## Gotchas & Solutions

Refer to XStream project's CLAUDE.md for known issues with:
- Docker & local development
- AWS S3 & CloudFront
- Coolify & production
- Laravel API patterns
- Next.js patterns
- Media handling
- CI/CD
