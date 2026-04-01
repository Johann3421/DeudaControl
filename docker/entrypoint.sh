#!/bin/sh
set -e

cd /var/www/html

echo "==> Starting deployment..."

# ── 1. Write .env from Docker environment variables ────────────────────────────
echo "==> Creating .env from environment..."
php -r '
foreach ($_SERVER as $k => $v) {
    if (preg_match("/^(APP|DB|SESSION|CACHE|QUEUE|MAIL|SIAF|LOG|BROADCAST|ALERTAS)_/", $k)) {
        $v = str_replace(["\\", "\"", "\n", "\r"], ["\\\\", "\\\"", "\\n", "\\r"], (string)$v);
        echo $k . "=\"" . $v . "\"\n";
    }
}' > .env

# ── 2. Auto-generate APP_KEY if missing or empty ───────────────────────────────
APP_KEY_VALUE=$(grep -E "^APP_KEY=" .env | cut -d= -f2- | tr -d '"' | tr -d "'")
if [ -z "$APP_KEY_VALUE" ]; then
    echo "==> APP_KEY not set — generating a new one..."
    NEW_KEY=$(php -r "echo 'base64:' . base64_encode(random_bytes(32));")
    if grep -q "^APP_KEY=" .env; then
        # Replace existing empty value
        sed -i "s|^APP_KEY=.*|APP_KEY=\"${NEW_KEY}\"|" .env
    else
        echo "APP_KEY=\"${NEW_KEY}\"" >> .env
    fi
    echo "==> APP_KEY generated OK."
else
    echo "==> APP_KEY is set."
fi

# ── 3. Create storage symlink ──────────────────────────────────────────────────
php artisan storage:link --force 2>/dev/null || true

# ── 4. Run migrations ──────────────────────────────────────────────────────────
echo "==> Running migrations..."
php artisan migrate --force

# ── 5. Seed initial data if DB is empty ───────────────────────────────────────
# This recovers the case where the Postgres volume already existed (so
# /docker-entrypoint-initdb.d/init.sql was skipped) but tables are empty.
SEED_FILE="/var/www/html/docker/postgres/seed_data.sql"
if [ -f "$SEED_FILE" ]; then
    echo "==> Checking if initial data seeding is needed..."
    USER_COUNT=$(php -r "
try {
    \$dsn = 'pgsql:host=' . (getenv('DB_HOST') ?: 'db')
          . ';port='      . (getenv('DB_PORT') ?: '5432')
          . ';dbname='    . (getenv('DB_DATABASE') ?: 'control_deudas');
    \$pdo = new PDO(\$dsn,
        getenv('DB_USERNAME') ?: 'deudas_user',
        getenv('DB_PASSWORD') ?: '');
    echo (int)\$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
} catch (Exception \$e) { echo 0; }
")
    if [ "$USER_COUNT" = "0" ]; then
        echo "==> DB is empty — seeding initial data from dump..."
        php -r "
try {
    \$dsn = 'pgsql:host=' . (getenv('DB_HOST') ?: 'db')
          . ';port='      . (getenv('DB_PORT') ?: '5432')
          . ';dbname='    . (getenv('DB_DATABASE') ?: 'control_deudas');
    \$pdo = new PDO(\$dsn,
        getenv('DB_USERNAME') ?: 'deudas_user',
        getenv('DB_PASSWORD') ?: '');
    \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    \$sql = file_get_contents('/var/www/html/docker/postgres/seed_data.sql');
    \$pdo->exec(\$sql);
    echo '==> Data seeded successfully.' . PHP_EOL;
} catch (Exception \$e) {
    echo '==> WARNING: Data seeding failed: ' . \$e->getMessage() . PHP_EOL;
}
"
    else
        echo "==> DB already has ${USER_COUNT} user(s) — skipping seed."
    fi
fi

# ── 6. Cache config / routes / views for production ───────────────────────────
echo "==> Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# ── 7. Permissions ────────────────────────────────────────────────────────────
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

mkdir -p /var/log/supervisor /var/log/nginx

echo "==> Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
