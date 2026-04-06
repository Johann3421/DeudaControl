# Despliegue en Dokploy con PostgreSQL

## Requisitos previos
- Servidor con Dokploy instalado
- Dominio apuntando a la IP del servidor (registro A en tu DNS)
- Acceso al panel de Dokploy

---

## 1. Crear la aplicación en Dokploy

1. En el panel de Dokploy → **Applications** → **New Application**
2. Selecciona **Docker Compose**
3. Conecta con tu repositorio GitHub (o pega la URL del repo)
4. Branch: `main`
5. **Build Path**: `/` (raíz del repositorio)
6. **Docker Compose File**: `docker-compose.yml`

---

## 2. Variables de entorno

En Dokploy → pestaña **Environment** de tu aplicación, copia y pega el bloque de abajo.  
Cambia **SOLO** los valores marcados con `← CAMBIAR`:

```env
APP_NAME="Control de Deudas"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://TU_DOMINIO.com           # ← CAMBIAR

# Genera una key segura en: https://generate-random.org/laravel-key-generator
APP_KEY=base64:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX   # ← CAMBIAR

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=control_deudas
DB_USERNAME=deudas_user
DB_PASSWORD=SecurePassword123!           # ← CAMBIAR (usa una contraseña fuerte)

SESSION_DRIVER=database
SESSION_LIFETIME=480
CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@TU_DOMINIO.com  # ← CAMBIAR
MAIL_FROM_NAME="Control de Deudas"

SIAF_PROXY_URL=
SIAF_PROXY_SECRET=
```

> **Sobre APP_KEY**: Si Dokploy no genera la key automáticamente (el entrypoint.sh lo hace), puedes generarla manualmente:
> ```bash
> php artisan key:generate --show
> ```

---

## 3. Configurar el dominio

1. En Dokploy → tu aplicación → pestaña **Domains**
2. Haz clic en **Add Domain**
3. Rellena:
   - **Domain**: `tu-dominio.com` (sin https://)
   - **HTTPS**: activado ✓ (Dokploy gestiona el certificado Let's Encrypt automáticamente)
   - **Port**: `80`
   - **Service**: `app`
4. Guarda y espera ~2 minutos para que se propague el SSL

---

## 4. Primer despliegue

1. En Dokploy → tu aplicación → haz clic en **Deploy**
2. Sigue los logs en la pestaña **Logs**; deberías ver algo como:
   ```
   ==> Starting deployment...
   ==> Generating APP_KEY...
   ==> Running migrations...
   Nothing to migrate.        ← correcto, la BD ya viene importada
   ==> Caching configuration...
   ==> Starting services...
   ```
3. Si ves **Nothing to migrate** → la importación de la BD funcionó correctamente.
4. Abre `https://tu-dominio.com` en el navegador.

---

## 5. Crear superadmin (primer uso)

Después del primer deploy, ejecuta en la terminal del contenedor desde Dokploy (**Terminal** tab):

```bash
php artisan tinker
```

```php
$u = \App\Models\User::where('email', 'TU_EMAIL')->first();
$u->rol = 'superadmin';
$u->save();
```

O para crear un usuario nuevo directamente:

```php
\App\Models\User::create([
    'name'     => 'Administrador',
    'email'    => 'admin@tudominio.com',
    'password' => \Illuminate\Support\Facades\Hash::make('TuContraseña'),
    'rol'      => 'superadmin',
]);
```

---

## 6. Actualizar la aplicación (deploys futuros)

1. Haz `git push` al branch `main`
2. En Dokploy → **Deploy** (o activa auto-deploy en la configuración del repositorio)
3. El entrypoint ejecuta `php artisan migrate --force` automáticamente en cada deploy

> **¿Los datos se borran al hacer deploy?**  
> **No.** Un redeploy normal solo reconstruye la imagen de `app`. El contenedor `db` sigue corriendo con su volumen `postgres_data_v2` intacto. Las migraciones solo agregan columnas/tablas, nunca borran datos.

---

## 7. Base de datos — notas importantes

| Detalle | Valor |
|---|---|
| Motor | PostgreSQL 16 |
| Base de datos | `control_deudas` |
| Usuario | `deudas_user` |
| Datos importados | Sí — `docker/postgres/init.sql` se aplica en el **primer** arranque del contenedor |
| Volumen persistente | `postgres_data_v2` — los datos **NO** se borran en redeploys |
| Volumen de backups | `db_backups` — independiente, contiene los últimos 7 días de respaldos |

> **Si necesitas reimportar la BD desde cero:**
> 1. En Dokploy → Volumes → eliminar `postgres_data_v2`
> 2. Subir el nuevo `docker/postgres/init.sql` al repositorio
> 3. Hacer redeploy

---

## 8. Backups automáticos

El servicio `backup` de docker-compose ejecuta `pg_dump` cada 24 horas al arrancar y guarda los dumps en el volumen `db_backups`. Se conservan los últimos 7 backups (≈ 1 semana).

### Ver los backups disponibles

En Dokploy → Terminal del servicio **backup**:

```bash
ls -lh /backups/
```

Verás archivos como `backup_20260406_030000.sql`.

### Restaurar un backup

1. En Dokploy → Terminal del servicio **db**:

```bash
# Listar los backups disponibles (el volumen db_backups está montado en /backups en el servicio backup,
# necesitas acceder desde ahí o copiar el archivo)
```

2. La forma más sencilla: **desde el terminal del servicio `backup`**, restaurar directamente:

```bash
# Restaurar un backup específico (reemplaza el nombre del archivo)
psql -h db -U deudas_user -d control_deudas < /backups/backup_YYYYMMDD_HHMMSS.sql
```

> `PGPASSWORD` ya está configurado en el entorno del servicio `backup`, así que no pedirá contraseña.

3. Si el volumen `postgres_data_v2` fue eliminado accidentalmente:
   - Haz redeploy (init.sql recreará la estructura vacía)
   - Luego restaura el backup desde el terminal del servicio `backup`

### Forzar un backup manual ahora mismo

En Dokploy → Terminal del servicio **backup**:

```bash
pg_dump -h db -U deudas_user -d control_deudas --no-owner --no-acl > /backups/backup_manual_$(date +%Y%m%d_%H%M%S).sql
```

---

## 8. Acceso directo a la BD (opcional)

Desde el Terminal de Dokploy en el servicio `db`:

```bash
psql -U deudas_user -d control_deudas
```

---

## Troubleshooting rápido

| Síntoma | Causa probable | Solución |
|---|---|---|
| `502 Bad Gateway` | App no arrancó | Revisa logs del servicio `app` |
| `SQLSTATE[08006]` | App no conecta con DB | Verifica que `DB_HOST=db` y que el servicio `db` levantó antes |
| `No application encryption key` | APP_KEY vacía | Añade la variable de entorno APP_KEY |
| Migraciones corren y fallan | init.sql no se cargó | El volumen ya existía sin datos; elimina el volumen y redeploy |
| Error de permisos en storage | — | En terminal: `chmod -R 775 storage bootstrap/cache` |
