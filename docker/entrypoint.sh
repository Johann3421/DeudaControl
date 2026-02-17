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
