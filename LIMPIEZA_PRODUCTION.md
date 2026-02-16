# 🧹 Guía de Limpieza de Caché en Producción (Sin SSH)

## ¿Para qué sirve?

Este script permite limpiar el caché de Laravel desde el navegador, sin necesidad de acceso SSH en cPanel.

---

## 📋 Pasos

### 1. **Obtén el token seguro**

El token se encuentra en:
```
Archivo: app/Http/Controllers/MaintenanceController.php
Línea: private const MAINTENANCE_TOKEN = 'cleanup_2026_02_16_securekey';
```

**Token predeterminado:**
```
cleanup_2026_02_16_securekey
```

### 2. ** Accede a la URL en tu navegador**

Reemplaza `TOKEN` con el token anterior y `DOMINIO` con tu dominio:

```
https://DOMINIO/maintenance/cleanup?token=TOKEN
```

**Ejemplo:**
```
https://deudas.sekaitech.com.pe/maintenance/cleanup?token=cleanup_2026_02_16_securekey
```

### 3. **Verifica los resultados**

Deberías ver una respuesta JSON:
```json
{
  "success": true,
  "message": "Mantenimiento completado exitosamente",
  "operations": {
    "route_clear": {"success": true, "message": "Rutas cacheadas eliminadas"},
    "config_clear": {"success": true, "message": "Configuración cacheada eliminada"},
    "cache_clear": {"success": true, "message": "Caché general eliminado"},
    "view_clear": {"success": true, "message": "Vistas compiladas eliminadas"},
    "event_clear": {"success": true, "message": "Eventos cacheados eliminados"}
  },
  "timestamp": "2026-02-16 14:30:00"
}
```

---

## 🔒 Seguridad

⚠️ **Antes de subir a producción:**

1. **Abre:** `app/Http/Controllers/MaintenanceController.php`
2. **Busca:** `private const MAINTENANCE_TOKEN = '...';`
3. **Cambia:** El token a algo más seguro:
   ```php
   private const MAINTENANCE_TOKEN = 'tu_token_muy_largo_y_aleatorio_aqui';
   ```

**Ejemplo seguro:**
```php
private const MAINTENANCE_TOKEN = 'maint_a9f8d7c6b5e4d3c2b1a0f9e8d7c6b5a4';
```

---

## ⚡ Verificar Estado del Sistema

Para ver el estado actual del sistema:

```
https://DOMINIO/maintenance/status?token=TOKEN
```

**Ejemplo:**
```
https://deudas.sekaitech.com.pe/maintenance/status?token=cleanup_2026_02_16_securekey
```

Respuesta esperada:
```json
{
  "app_name": "Control Deudas",
  "environment": "production",
  "debug": false,
  "timezone": "America/Lima",
  "php_version": "8.2.12",
  "laravel_version": "11.x"
}
```

---

## 🚨 Si los cambios no se ven

1. **Ejecuta el cleanup:**
   ```
   https://deudas.sekaitech.com.pe/maintenance/cleanup?token=cleanup_2026_02_16_securekey
   ```

2. **Recarga tu aplicación:**
   - Presiona `Ctrl + F5` (Windows) o `Cmd + Shift + R` (Mac)
   - O abre en navegador privado

3. **Verifica logs:**
   - Accede a cPanel
   - Archivos → `storage/logs/laravel.log`

---

## 🗑️ Eliminar Este Script Después de Usarlo

**Importante:** Por seguridad, elimina este script después de usarlo.

1. Entra a cPanel → Administrador de Archivos
2. Ve a: `public_html/deudas.sekaitech.com.pe/app/Http/Controllers/`
3. **Elimina:** `MaintenanceController.php`
4. En `routes/web.php` elimina estas líneas:
   ```php
   use App\Http\Controllers\MaintenanceController;
   
   // ... más abajo ...
   
   Route::prefix('maintenance')->group(function () {
       Route::get('/cleanup', [MaintenanceController::class, 'cleanup'])->name('maintenance.cleanup');
       Route::get('/status', [MaintenanceController::class, 'status'])->name('maintenance.status');
   });
   ```

---

## 📝 Checklist

- [ ] Cambié el token a uno seguro
- [ ] Subí los archivos a producción
- [ ] Ejecuté el cleanup desde el navegador
- [ ] Verifiqué que los cambios se vean
- [ ] Eliminé `MaintenanceController.php` después de usarlo
- [ ] Limpié las rutas en `web.php`

---

## ❓ Problemas Comunes

| Problema | Solución |
|----------|----------|
| **Error 404 en `/maintenance/cleanup`** | Las rutas no se limpiaron. Ejecuta cleanup nuevamente. |
| **Token inválido** | Verifica que copiaste correctamente el token. |
| **Los cambios no se ven** | Limpia el caché del navegador (Ctrl+F5) |
| **Error 500** | Revisa logs en `storage/logs/laravel.log` |

