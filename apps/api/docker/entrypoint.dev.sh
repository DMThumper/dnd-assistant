#!/bin/bash
set -e

echo "Installing/updating composer dependencies..."
composer install --no-interaction --prefer-dist

# Create .env from .env.example if not exists
echo "Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env created from .env.example"
fi

# Update .env with Docker environment variables
echo "Configuring environment for Docker..."
sed -i "s/DB_HOST=.*/DB_HOST=${DB_HOST:-postgres}/" .env
sed -i "s/REDIS_HOST=.*/REDIS_HOST=${REDIS_HOST:-redis}/" .env
sed -i "s/MAIL_HOST=.*/MAIL_HOST=${MAIL_HOST:-mailpit}/" .env

echo "Generating application key if not set..."
if grep -q "APP_KEY=$" .env || grep -q "APP_KEY=base64" .env; then
    php artisan key:generate --no-interaction
fi

echo "Creating storage link..."
php artisan storage:link --force || true

# ===========================================
# Database setup (idempotent)
# ===========================================

echo "Running migrations..."
php artisan migrate --force

echo "Running seeders (includes Passport setup)..."
php artisan db:seed --force

echo "============================================"
echo "D&D Assistant API ready!"
echo "============================================"

# If command is passed, execute it; otherwise start dev server
if [ $# -gt 0 ]; then
    echo "Executing command: $@"
    exec "$@"
else
    echo "Starting Laravel development server..."
    exec php artisan serve --host=0.0.0.0 --port=8000
fi
