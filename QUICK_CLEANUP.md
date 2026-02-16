# ⚡ INSTRUCCIONES RÁPIDAS - Limpieza en Producción (cPanel)

## 🎯 Comando Todo-en-Uno

El token predeterminado es: `cleanup_2026_02_16_securekey`

### Abre esta URL en tu navegador (reemplaza DOMINIO):

```
https://DOMINIO/maintenance/cleanup?token=cleanup_2026_02_16_securekey
```

**Ej:** 
```
https://deudas.sekaitech.com.pe/maintenance/cleanup?token=cleanup_2026_02_16_securekey
```

---

## ✅ Resultado Esperado

Verás en JSON:
```json
{
  "success": true,
  "message": "Mantenimiento completado exitosamente"
}
```

---

## 🚀 Después de Acceder

1. **Recarga tu app:** Ctrl + F5 (Windows) o Cmd + Shift + R (Mac)
2. **Verifica los cambios:** Accede a tu aplicación normalmente
3. **Elimina el script:** Ver instrucciones en LIMPIEZA_PRODUCTION.md

---

## 🔒 IMPORTANTE: Cambiar Token Antes de Subir

**Cambiar de:** 
```php
private const MAINTENANCE_TOKEN = 'cleanup_2026_02_16_securekey';
```

**A algo como:**
```php
private const MAINTENANCE_TOKEN = 'maint_abc123xyz456def789ghi';
```

Archivo: `app/Http/Controllers/MaintenanceController.php`

---

## 📋 Checklist

- [ ] Sube los archivos modificados a cPanel
- [ ] Accede a la URL de cleanup con el token
- [ ] Verifica que dice "success": true
- [ ] Recarga tu aplicación (Ctrl+F5)
- [ ] Si todo funciona, elimina MaintenanceController.php
- [ ] Elimina estas líneas de routes/web.php:
  ```php
  use App\Http\Controllers\MaintenanceController;
  Route::prefix('maintenance')->group(function () {
      Route::get('/cleanup', [MaintenanceController::class, 'cleanup'])->name('maintenance.cleanup');
      Route::get('/status', [MaintenanceController::class, 'status'])->name('maintenance.status');
  });
  ```

---

**Listo! El caché se limpió automáticamente al acceder a la URL.** 🎉
