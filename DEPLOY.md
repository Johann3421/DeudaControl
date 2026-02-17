# Despliegue en Dokploy — Control de Deudas

## Arquitectura

**Un solo contenedor** con Nginx + PHP-FPM + React (Vite build).  
Laravel maneja frontend (Inertia.js) y backend en el mismo proceso.  
Base de datos MySQL como servicio separado en Dokploy.

```
┌─────────────────────────────────┐
│  Contenedor App (Puerto 80)     │
│  ┌───────────┐  ┌────────────┐  │
│  │   Nginx   │→ │  PHP-FPM   │  │
│  │ (assets + │  │ (Laravel)  │  │
│  │  proxy)   │  │            │  │
│  └───────────┘  └────────────┘  │
│       ↑ Vite build (estático)   │
└─────────────┬───────────────────┘
              │
     ┌────────▼────────┐
     │  MySQL 8.0      │
     │  (Servicio DB)  │
     └─────────────────┘
```

## Estructura de archivos Docker

```
├── Dockerfile              ← Multi-stage build
├── .dockerignore
├── docker-compose.yml      ← Solo para pruebas locales
└── docker/
    ├── entrypoint.sh       ← Migraciones + cache + inicio
    ├── nginx/
    │   ├── nginx.conf
    │   └── default.conf
    ├── php/
    │   ├── opcache.ini
    │   └── www.conf
    └── supervisor/
        └── supervisord.conf
```

---

## Pasos para desplegar en Dokploy

### Paso 1: Subir código a Git

Asegúrate de que tu repositorio tiene todos los archivos Docker:

```bash
git add Dockerfile .dockerignore docker/ docker-compose.yml
git commit -m "Add Docker production setup for Dokploy"
git push
```

### Paso 2: Crear servicio MySQL en Dokploy

1. En Dokploy, ve a **Services** → **Create Service** → **Database**
2. Selecciona **MySQL 8.0**
3. Configura:
   - **Database Name:** `control_deudas`
   - **Username:** `deudas_user`
   - **Password:** *(genera una contraseña segura, anótala)*
4. Click **Deploy**
5. Anota el **Host interno** que Dokploy asigna (algo como `mysql-xxxxx` o el nombre del servicio)

### Paso 3: Crear la aplicación en Dokploy

1. Ve a **Services** → **Create Service** → **Application**
2. Conecta tu repositorio Git
3. Configura el **Build**:
   - **Build Type:** `Dockerfile`
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Context:** `.`

### Paso 4: Configurar variables de entorno

En la sección **Environment Variables** de tu aplicación en Dokploy, agrega:

```env
APP_NAME="Control de Deudas"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://tu-dominio.com
APP_KEY=

DB_CONNECTION=mysql
DB_HOST=nombre-del-servicio-mysql
DB_PORT=3306
DB_DATABASE=control_deudas
DB_USERNAME=deudas_user
DB_PASSWORD=tu-contraseña-segura

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=tu-dominio.com

CACHE_STORE=database
QUEUE_CONNECTION=database

SIAF_PROXY_URL=https://siaf-proxy.loritox3421.workers.dev
SIAF_PROXY_SECRET=tu-secret
```

**Notas:**
- `APP_KEY` se genera automáticamente en el primer arranque si lo dejas vacío.
- `DB_HOST` es el nombre interno del servicio MySQL en Dokploy (no `localhost`).
- `SESSION_DOMAIN` debe ser tu dominio sin `https://`.

### Paso 5: Configurar puerto y dominio

1. En **Ports**: exponer puerto **80**
2. En **Domains**: agrega tu dominio personalizado (ej: `deudas.tudominio.com`)
3. Traefik (integrado en Dokploy) genera HTTPS automáticamente con Let's Encrypt

### Paso 6: Deploy

1. Click **Deploy**
2. Espera a que el build termine (puede tomar 2-5 minutos la primera vez)
3. El entrypoint ejecuta automáticamente:
   - `php artisan migrate --force`
   - `php artisan config:cache`
   - `php artisan route:cache`
   - `php artisan view:cache`

### Paso 7: Verificar

1. Abre `https://tu-dominio.com` → debe cargar el login
2. Abre `https://tu-dominio.com/up` → debe responder `200 OK`
3. Si necesitas crear el primer usuario, accede por terminal al contenedor:

```bash
# Desde Dokploy terminal o SSH al servidor:
docker exec -it <container_id> php artisan tinker
```

```php
App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@tudominio.com',
    'password' => bcrypt('tu-password-seguro'),
    'rol' => 'superadmin',
]);
```

---

## Pruebas locales (opcional)

```bash
docker compose up --build
```

Abre `http://localhost` en tu navegador.

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| Error 502 Bad Gateway | Revisar logs de PHP-FPM en Dokploy → container logs |
| Error 500 | `APP_KEY` no generado. Eliminar contenedor y redesplegar |
| Login no funciona | Verificar `SESSION_DRIVER=database` y que migraciones corrieron |
| Assets no cargan | Verificar que el build de Vite completó (buscar en build logs) |
| SIAF timeout | Normal si el Worker/SIAF es lento; revisa `SIAF_PROXY_URL` |
| DB connection refused | `DB_HOST` debe ser el nombre del servicio MySQL en Dokploy, no `localhost` |
