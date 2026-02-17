#!/bin/sh
set -e

cd /var/www/html

echo "==> Starting deployment..."

# Generate APP_KEY if not set
if [ -z "$APP_KEY" ]; then
    echo "==> Generating APP_KEY..."
    php artisan key:generate --force
fi

# Create storage link
php artisan storage:link --force 2>/dev/null || true
# Wait for DB to be reachable (retry) then run migrations
echo "==> Waiting for DB to be reachable..."
MAX_RETRIES=30
RETRY_COUNT=0
until php -r 'try { new PDO("mysql:host=" . getenv("DB_HOST") . ";port=" . getenv("DB_PORT") . ";dbname=" . getenv("DB_DATABASE"), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); exit(0);} catch (Exception $e) { exit(1); }'; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "DB not reachable after $((MAX_RETRIES * 5)) seconds. Aborting."
        exit 1
    fi
    echo "DB not reachable yet, retrying in 5s... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

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
