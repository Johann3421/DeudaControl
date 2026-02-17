# Diagnóstico: Error al Cargar el CAPTCHA en Producción

## Problema
En producción, el CAPTCHA no carga y muestra: "Error al cargar el CAPTCHA"

## Cambios Realizados

### 1. **SiafService.php** - Almacenamiento de cookies
**Problema anterior:** Las cookies se guardaban en `/tmp` que en producción puede no tener permisos de escritura.

**Solución:** Ahora se guardan en `storage/app/siaf/` (dentro de la aplicación).

```php
// ANTES:
return sys_get_temp_dir() . '/siaf_session_cookies.txt';

// AHORA:
$storageDir = storage_path('app/siaf');
if (!is_dir($storageDir)) {
    @mkdir($storageDir, 0755, true);
}
return $storageDir . '/siaf_session_cookies.txt';
```

### 2. **SiafService.php** - Logging detallado
**Problema anterior:** No había suficiente información sobre qué paso fallaba.

**Solución:** Ahora se registra:
- Validación de permisos del directorio
- Cada paso de la conexión a SIAF
- Errores específicos de cURL
- Códigos HTTP devueltos
- Tamaño de la imagen obtenida

### 3. **Create.jsx** - Mejor manejo de errores
**Problema anterior:** El error era genérico sin detalles sobre qué falló.

**Solución:** Ahora muestra:
- Código HTTP si la respuesta falla
- Mensajes específicos del servidor
- Instructions para revisar la consola del navegador

---

## Cómo Diagnosticar el Problema

### Paso 1: Verificar Logs del Servidor

```bash
# En producción, revisar los logs:
tail -f storage/logs/laravel.log | grep "SIAF CAPTCHA"
```

Busca líneas como:
```
[2026-02-17 10:30:15] local.INFO: SIAF CAPTCHA - Using cookie file: /var/www/app/storage/app/siaf/siaf_session_cookies.txt
[2026-02-17 10:30:15] local.INFO: SIAF CAPTCHA - Step 1: Establishing session
[2026-02-17 10:30:16] local.INFO: SIAF CAPTCHA - Step 2: Retrieving CAPTCHA image
[2026-02-17 10:30:16] local.INFO: SIAF CAPTCHA obtained successfully
```

### Paso 2: Verificar Permisos en Producción

```bash
# Verificar que storage/app existe y es escribible:
ls -la /var/www/app/storage/app/
chmod 755 /var/www/app/storage/app/
chmod 777 /var/www/app/storage/app/  # Si es necesario

# Crear el directorio siaf:
mkdir -p /var/www/app/storage/app/siaf
chmod 755 /var/www/app/storage/app/siaf
```

### Paso 3: Probar el Endpoint Directamente

```bash
# Autenticarse primero, luego probar:
curl -X GET "https://tuapp.com/api/captcha" \
  -H "Accept: application/json" \
  -H "Cookie: PHPSESSID=tu_session_id" \
  -H "X-Requested-With: XMLHttpRequest"
```

### Paso 4: Verificar Consola del Navegador

En el navegador (F12 → Consola):
1. Abre cualquier formulario que cargue CAPTCHA
2. Mira los mensajes de error detallados
3. Mira el tab "Network" → busca la petición `/api/captcha`
4. Revisa el response para ver el error exacto

---

## Problemas Comunes y Soluciones

### Problema: "Cookie directory not writable"
**Causa:** El directorio storage/app no tiene permisos de escritura.

**Solución:**
```bash
chmod -R 755 /var/www/app/storage/
chmod -R 777 /var/www/app/storage/app/  # Si es necesario
chown -R www-data:www-data /var/www/app/storage/  # Cambiar propietario
```

### Problema: "No se pudo conectar con el servidor SIAF (Error 1)"
**Causa:** El servidor de producción no puede hacer conexiones HTTPS salientes.

**Solución:**
1. Verificar que cURL está habilitado: `php -m | grep curl`
2. Verificar que OpenSSL está habilitado: `php -m | grep openssl`
3. Verificar configuración de firewall en el servidor
4. Contactar con el proveedor de hosting

### Problema: "El servidor SIAF respondió con error (HTTP 403/500)"
**Causa:** El servidor SIAF rechaza las conexiones.

**Solución:**
1. El servidor SIAF puede estar bloqueando conexiones automatizadas
2. Verificar que el User-Agent es realista (ya está configurado)
3. Esperar unos segundos y reintentar (el servidor SIAF puede estar ocupado)

---

## Código de Diagnóstico Rápido

Crea un archivo `test_siaf.php` en la raíz del proyecto:

```php
<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\SiafService;

$siafService = new SiafService();
$result = $siafService->obtenerCaptchaSiaf();

if ($result['success']) {
    echo "✅ CAPTCHA obtenido correctamente" . PHP_EOL;
    echo "Tamaño: " . strlen($result['captcha']) . " bytes" . PHP_EOL;
} else {
    echo "❌ Error:" . PHP_EOL;
    echo $result['message'] . PHP_EOL;
}
```

Ejecuta:
```bash
php test_siaf.php
```

---

## Pasos Siguientes

Si después de estos cambios sigue sin funcionar:

1. **Revisar logs** (`storage/logs/laravel.log`) para el error específico
2. **Probar desde CLI**:
   ```bash
   php artisan tinker
   $service = new App\Services\SiafService();
   $result = $service->obtenerCaptchaSiaf();
   dd($result);
   ```
3. **Contactar con MEF** si el servidor SIAF está rechazando conexiones
4. **Configurar firewall** si el servidor de producción bloquea conexiones salientes

---

## Verificación de Éxito

El CAPTCHA funciona correctamente cuando:

1. ✅ Los logs muestran "SIAF CAPTCHA obtained successfully"
2. ✅ El archivo `storage/app/siaf/siaf_session_cookies.txt` existe
3. ✅ La consola del navegador muestra la imagen en base64
4. ✅ El formulario permite ingresar el código CAPTCHA
5. ✅ La consulta a SIAF se procesa correctamente
