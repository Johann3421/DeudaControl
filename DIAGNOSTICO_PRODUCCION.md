# Diagnóstico para Error 404 en Producción

El error `POST https://deudas.sekaitech.com.pe/api/siaf/consultar 404` indica que el servidor no encuentra la ruta.

## Causas Posibles (en orden de probabilidad):

1. **Rutas cacheadas** ← MÁS PROBABLE EN PRODUCCIÓN
2. **Middleware auth bloqueando** (pero devolvería 401)
3. **mod_rewrite no habilitado** en Apache
4. **Public path incorrecto**

## Pasos para Diagnosticar

### 1. Verifica el health check (sin autenticación)
Abre en el navegador:
```
https://deudas.sekaitech.com.pe/api/health
```

**Resultado esperado:** 
```json
{"status":"ok","message":"API is working"}
```

Si da 404 → Problema de rutas/rewrite rules
Si funciona → Problema de autenticación en el endpoint SIAF

---

### 2. Limpia el caché de rutas en PRODUCCIÓN

```bash
# En el servidor de producción, ejecuta:
cd /ruta/a/Control_Deudas

php artisan route:clear
php artisan config:clear  
php artisan cache:clear
php artisan view:clear

# Luego, opcional (regenera caché optimizado):
php artisan route:cache
php artisan config:cache
```

---

### 3. Verifica que el .htaccess está correctamente copiado

En `public/.htaccess` debe tener:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.php [L]
```

Si el archivo no existe en producción:
```bash
cp public/.htaccess.example public/.htaccess
# O si no existe el .htaccess, créalo
```

---

### 4. Verifica que mod_rewrite está habilitado

En el servidor, ejecuta:
```bash
apache2ctl -M | grep rewrite
# Debe mostrar: rewrite_module (shared)

# Si no está, habilítalo:
a2enmod rewrite
systemctl restart apache2
```

---

### 5. Si el health check funciona pero SIAF da 404

Significa que el problema es **autenticación**. Verifica:

```bash
# Revisa si Auth está funcionando
curl -X POST https://deudas.sekaitech.com.pe/api/siaf/consultar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test":true}'
```

---

## Solución Rápida (prueba esto primero)

Ejecuta en producción:

```bash
cd /ruta/a/Control_Deudas
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

Luego recarga la página.

---

## Si Nada Funciona

Contáctate con el proveedor de hosting:
1. Pide que confirmen que **mod_rewrite está habilitado**
2. Pide que verifiquen el **error_log de Apache** cuando hagas la petición
3. Verifica que el **root path** está apuntando a `public/`

