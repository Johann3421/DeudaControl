# Dokploy - Comandos Útiles

## 1. Asignar rol de Superadmin a un usuario

Una vez que el usuario se registre en la app, ejecuta este comando en la terminal de Dokploy:

```bash
php artisan make:superadmin tu.email@gmail.com
```

**Ejemplo:**
```bash
php artisan make:superadmin johan12@gmail.com
```

Deberías ver:
```
✓ User 'johan12@gmail.com' is now a superadmin!
```

---

## 2. Limpiar Cache y Caché de Configuración

Ejecuta estos comandos en orden:

```bash
# Limpiar cache de aplicación
php artisan cache:clear

# Limpiar cache de configuración
php artisan config:clear

# Reconstruir cache de configuración (recomendado)
php artisan config:cache
```

O todo junto:
```bash
php artisan cache:clear && php artisan config:clear && php artisan config:cache
```

---

## 3. Acceder a la terminal de Dokploy

### Opción A: Terminal en la UI de Dokploy
1. Ve a tu aplicación en Dokploy
2. Busca la sección **"Terminal"** o **"Shell"**
3. Haz clic y tendrás acceso a la terminal del contenedor

### Opción B: SSH directo a tu VPS
```bash
ssh root@tu-ip-vps
docker exec -it nombre-contenedor bash
```

---

## 4. Ver Diagnóstico de SIAF

Accede a esta URL en tu navegador (sin autenticación):

```
https://tu-dominio.com/api/diagnostic/siaf/status
```

O si está en local:
```
http://localhost:8000/api/diagnostic/siaf/status
```

**Esto te mostrará:**
- Estado de conectividad directa a SIAF
- Si puede llegar a `apps2.mef.gob.pe`
- Los últimos 30 logs de intentos SIAF
- Información de PHP (cURL, OpenSSL, etc.)

---

## 5. Flujo completo después del push a Dokploy

```bash
# 1. Reconstruir (trigger: git push)
# (Dokploy hace esto automáticamente si configuraste deploy on push)

# 2. Acceder a terminal y ejecutar:
php artisan cache:clear
php artisan config:clear
php artisan config:cache

# 3. Si agregaste nuevo usuario, asignarlo como superadmin:
php artisan make:superadmin johan12@gmail.com

# 4. Ver logs:
tail -f /app/storage/logs/laravel.log

# 5. Probar diagnóstico SIAF:
# Abre en navegador: https://tu-dominio.com/api/diagnostic/siaf/status
```

---

## 6. Problema: CAPTCHA sigue siendo local

Si después de subir los cambios el CAPTCHA sigue siendo local, el diagnóstico te dirá por qué:

**Posibles causas y soluciones:**

| Error | Causa | Solución |
|-------|-------|----------|
| `cURL Error 28: timeout` | SIAF muy lenta | Aumentar timeout en `SiafService.php` |
| `cURL Error 6: resolve host` | No puede resolver DNS | Verificar /etc/hosts o DNS en VPS |
| `cURL Error 7: connection refused` | SIAF no responde en ese puerto | Verificar IP/puerto de SIAF |
| `HTTP 403 Forbidden` | SIAF rechaza la request | Agregar headers adicionales (User-Agent, etc.) |
| `HTTP 404` | URL incorrecta | Verificar `SIAF_BASE_URL` en SiafService.php |

---

## 7. Comandos útiles de debugging

```bash
# Ver últimos 50 líneas de log (en tiempo real)
tail -f /app/storage/logs/laravel.log | grep SIAF

# Ver dónde está guardado el proyecto
pwd

# Ver si existe el archivo de cookies
ls -la /app/storage/app/siaf/

# Probar conectividad a SIAF manualmente
curl -v --max-time 10 https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx

# Ver variables de entorno
cat /app/.env | grep SIAF
```

---

## 8. Contacto y Logs

Si algo va mal, proporciona:

1. Salida de: `php artisan make:superadmin tu-email@gmail.com`
2. Resultado de: `curl -v https://apps2.mef.gob.pe/...` (primeras líneas)
3. Últimos logs SIAF: `tail -50 /app/storage/logs/laravel.log | grep SIAF`
4. Respuesta de diagnóstico: `https://tu-dominio/api/diagnostic/siaf/status`
