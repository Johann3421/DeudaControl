#!/bin/sh
set -e

cd /var/www/html

echo "==> Starting deployment..."

# Ensure .env exists — key:generate needs a writable file to update.
# In Dokploy/Docker the real config comes from environment variables injected
# by the container runtime; the .env file just needs to exist.
if [ ! -f ".env" ]; then
    echo "==> Creating .env from environment..."
    # Use PHP to write properly quoted values so Laravel dotenv parser
    # never chokes on values containing spaces (e.g. APP_NAME="Control de Deudas")
    php -r '
foreach ($_SERVER as $k => $v) {
    if (preg_match("/^(APP|DB|SESSION|CACHE|QUEUE|MAIL|SIAF|LOG|BROADCAST)_/", $k)) {
        $v = str_replace(["\\", "\"", "\n", "\r"], ["\\\\", "\\\"", "\\n", "\\r"], (string)$v);
        echo $k . "=\"" . $v . "\"\n";
    }
}' > .env
fi

# Skip key:generate — APP_KEY is already injected by Dokploy as a Docker env var.
# key:generate requires writing to .env which is unnecessary when the key
# is already available in the process environment.
if [ -z "$APP_KEY" ]; then
    echo "==> WARNING: APP_KEY is not set. Set it in Dokploy environment variables."
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
