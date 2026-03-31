#!/bin/sh
set -e

cd /var/www/html

echo "==> Starting deployment..."

# Ensure .env exists — key:generate needs a writable file to update.
# In Dokploy/Docker the real config comes from environment variables injected
# by the container runtime; the .env file just needs to exist.
if [ ! -f ".env" ]; then
    echo "==> Creating .env from environment..."
    printenv \
        | grep -E '^(APP_|DB_|SESSION_|CACHE_|QUEUE_|MAIL_|SIAF_|LOG_|BROADCAST_)' \
        | sort > .env
fi

# Generate APP_KEY only if it is truly absent from both env and .env
if [ -z "$APP_KEY" ] && ! grep -q 'APP_KEY=' .env 2>/dev/null; then
    echo "==> Generating APP_KEY..."
    php artisan key:generate --force
fi

# Create storage link
php artisan storage:link --force 2>/dev/null || true

# Run migrations
echo "==> Running migrations..."
php artisan migrate --force

# Cache config, routes, views for production
echo "==> Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Set permissions (again, after caching)
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Create supervisor log directory
mkdir -p /var/log/supervisor /var/log/nginx

echo "==> Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
