# Panel de Diagnóstico SIAF - Guía de Uso

## ¿Qué es el Panel de Diagnóstico?

Es una página web integrada en tu aplicación que te permite diagnosticar automáticamente todos los problemas relacionados con la integración SIAF, sin necesidad de acceso SSH o terminal.

## Acceso

**URL:** `https://tuapp.com/admin/diagnostic/siaf`

**Requisitos:**
- ✅ Debes estar autenticado
- ✅ Debes tener rol de **superadmin**

## ¿Qué Verifica?

El panel revisa automáticamente:

### 1. **📁 Directorios**
- Existencia y permisos de `storage/app`
- Existencia y permisos de `storage/app/siaf` (se crea automáticamente si no existe)
- Existencia y permisos de `storage/logs`

### 2. **🔧 Extensiones PHP**
- `curl` - Para hacer conexiones HTTP/HTTPS
- `openssl` - Para SSL/TLS
- `json` - Para parsear JSON
- `fileinfo` - Para detectar tipos de archivo

### 3. **📡 Conectividad**
- Prueba que cURL puede conectarse a HTTPS (Google)
- Versión de cURL
- Versión de SSL

### 4. **🔐 CAPTCHA SIAF**
- Conectividad real con el servidor SIAF
- Obtención real del CAPTCHA
- Creación y persistencia del archivo de cookies
- Tamaño en KB de la imagen obtenida

### 5. **🖥️ Servidor**
- Versión de PHP
- Versión de Laravel
- Sistema operativo
- Rutas de directorios

### 6. **📝 Logs**
- Configuración de logging
- Nivel de log
- Últimas 20 líneas del archivo de logs

---

## Cómo Leer los Resultados

### Colores de Estado

| Color | Significado |
|-------|------------|
| 🟢 **Verde** | OK - Sin problemas |
| 🔴 **Rojo** | Error - Requiere acción |
| 🟡 **Amarillo** | Advertencia - Revisar |

### Ejemplos de Resultados

#### ✅ TODO CORRECTO
```
✓ storage/app exists: OK
✓ storage/app writable: OK
✓ cURL installed: OK
✓ HTTPS connectivity: OK
✓ CAPTCHA SIAF: Success
```

#### ❌ PROBLEMA: Permisos de storage/app
```
✗ storage/app writable: Error
📋 Acción: Los permisos no están correctamente configurados
```

#### ⚠️ ADVERTENCIA: Directorio siaf no existe
```
⚠ storage/app/siaf: No (se creará automáticamente)
✓ Acción: Se creará automáticamente en la próxima obtención de CAPTCHA
```

---

## Problemas Comunes y Soluciones

### Problema: "storage/app not writable"

**¿Qué significa?** El directorio `storage/app` no tiene permisos de escritura.

**Soluciones en Producción (sin SSH):**

1. **Contacta a tu proveedor de hosting**
   - Pide que asigne permisos 755 al directorio `storage/app`
   - O que asegure que el usuario del servidor (www-data) puede escribir

2. **Si tienes cPanel/WHM:**
   - Accede a File Manager
   - Ubica `public_html/storage/app`
   - Click derecho → Change Permissions
   - Cambia a `755`

3. **Si tienes Plesk:**
   - Files → storage/app
   - Rights → Change Permissions → 755

### Problema: "cURL not installed"

**¿Qué significa?** La extensión cURL no está disponible en PHP.

**Solución:** Contacta a tu proveedor de hosting - es una extensión estándar que debe estar instalada.

### Problema: "CAPTCHA SIAF: Error al obtener CAPTCHA"

**¿Qué significa?** No se puede conectar con el servidor SIAF de Perú.

**Posibles causas:**
1. El servidor SIAF está fuera de servicio
2. Tu servidor de hosting bloquea conexiones salientes
3. Problemas de red intermitentes

**Soluciones:**
1. Espera 5 minutos y recarga la página
2. Contacta a tu proveedor de hosting para habilitar conexiones HTTPS salientes
3. Si es blocking por firewall, pide que permita conexiones a `apps2.mef.gob.pe:443`

### Problema: "Cookie file does not exist"

**¿Qué significa?** El archivo de cookies de SIAF no se está creando correctamente.

**Causa más probable:** Permisos de `storage/app/siaf`

**Solución:** 
1. Asegúrate que `storage/app/siaf` existe
2. Verifica permisos (deben ser 755 o 775)
3. Intenta obtener un CAPTCHA nuevamente

---

## Próximos Pasos por Escenario

### Escenario 1: TODO ESTÁ EN VERDE ✓

**¡Felicidades!** Tu sistema está listo para producción.

- ✅ El CAPTCHA funcionará correctamente
- ✅ Puedes crear deudas de entidad sin problemas
- ✅ Las consultas a SIAF funcionarán

### Escenario 2: HAY ERRORES EN ROJO ✗

**Acciones necesarias:**

1. Lee el mensaje de error en cada sección roja
2. Busca la solución en la sección "Problemas Comunes" arriba
3. Implementa la solución (generalmente contactando al hosting)
4. Vuelve a ejecutar el diagnóstico para verificar
5. Si persiste el error de 24h, contacta al soporte del hosting

### Escenario 3: SOLO CAPTCHA FALLA

**Acción prioritaria:**

1. Verifica que todo lo demás está en verde
2. Espera 5-10 minutos (puede ser problema temporal de SIAF)
3. Recarga la página
4. Si sigue fallando:
   - Revisa el Log (abajo en la página)
   - Busca líneas con "SIAF CAPTCHA" o "Error"
   - Menciona exactamente qué error aparece

---

## Usando los Logs

Al final del Panel de Diagnóstico verás las **Últimas 20 Líneas del Log**.

Busca líneas que contengan:
- `SIAF CAPTCHA` - Información sobre intentos de obtener CAPTCHA
- `Error` - Errores generales
- `curl` - Problemas de conexión

**Ejemplo útil:**
```
[2026-02-17 10:30:15] local.ERROR: SIAF CAPTCHA - Cookie directory not writable: /var/www/app/storage/app/siaf
```

Este error te dice exactamente que el directorio de cookies no tiene permisos de escritura.

---

## Automatizar Verificaciones

Si quieres revisar regularmente que todo funciona:

1. **Agrega a tus tareas pendientes:**
   - Visita `/admin/diagnostic/siaf` cada semana
   - Verifica que todo sigue en verde
   - Si hay cambios, actúa inmediatamente

2. **CLI (si tienes acceso):**
   ```bash
   php artisan tinker
   $service = new App\Services\SiafService();
   $result = $service->obtenerCaptchaSiaf();
   echo $result['success'] ? 'OK' : 'ERROR: ' . $result['message'];
   ```

---

## Contactar a Soporte

Si después de revisar el Panel de Diagnóstico necesitas ayuda:

1. **Toma un screenshot** del Panel de Diagnóstico (muestra TODO en la pantalla)
2. **Copia el último error** del Log (abajo)
3. **Incluye:**
   - URL del Panel (`/admin/diagnostic/siaf`)
   - Versión de PHP (aparece en el panel)
   - Versión de Laravel (aparece en el panel)
   - Proveedor de hosting
   - Cualquier mensaje de error específico

4. **Contacta a:** soporte@tuapp.com

---

## Preguntas Frecuentes

**P: ¿Puedo compartir el link del diagnóstico con otros?**
A: No, solo superadmins pueden verlo. Es información sensible del servidor.

**P: ¿Se ejecuta el diagnóstico automáticamente?**
A: No, solo cuando accedes a la página. Es seguro visitarlo frecuentemente.

**P: ¿Afecta el diagnóstico la performance?**
A: No, solo toma algunos segundos y no afecta usuarios reales.

**P: ¿Se guardan historiales del diagnóstico?**
A: No, pero puedes tomar screenshots para comparar cambios en el tiempo.

**P: ¿Funciona el diagnóstico en desarrollo?**
A: Sí, funciona igual que en producción. Es útil para verificar todo antes de subir a producción.
