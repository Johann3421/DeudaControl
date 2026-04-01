# Despliegue Evolution API v2.3.7 en Dokploy

Guía paso a paso para migrar de Evolution API v2.2.3 a v2.3.7 y conectar WhatsApp.

---

## PASO 1 — Reemplazar Docker Compose en Dokploy

1. En Dokploy → Servicio **evolution-api** → pestaña **Docker Compose**
2. **Borra todo** el contenido actual
3. Pega este compose completo:

```yaml
services:
  evolution:
    image: evoapicloud/evolution-api:v2.3.7
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - evolution_instances:/evolution/instances
    environment:
      SERVER_URL: https://evolution.sekaitech.com.pe
      AUTHENTICATION_TYPE: apikey
      AUTHENTICATION_API_KEY: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c=
      AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: "true"
      QRCODE_LIMIT: "30"
      DEL_INSTANCE: "false"
      DATABASE_ENABLED: "true"
      DATABASE_PROVIDER: postgresql
      DATABASE_CONNECTION_URI: postgresql://evolution_user:evolution_pass@postgres:5432/evolution
      DATABASE_SAVE_DATA_INSTANCE: "true"
      DATABASE_SAVE_DATA_NEW_MESSAGE: "true"
      DATABASE_SAVE_MESSAGE_UPDATE: "true"
      DATABASE_SAVE_DATA_CONTACTS: "true"
      DATABASE_SAVE_DATA_CHATS: "true"
      DATABASE_SAVE_DATA_LABELS: "true"
      DATABASE_SAVE_DATA_HISTORIC: "true"
      CACHE_REDIS_ENABLED: "false"
      CACHE_LOCAL_ENABLED: "true"
      CONFIG_SESSION_PHONE_CLIENT: "Evolution API"
      CONFIG_SESSION_PHONE_NAME: "Chrome"
      CONFIG_SESSION_PHONE_VERSION: "2.3000.1015901307"
      CHATWOOT_ENABLED: "true"
      CHATWOOT_API_URL: https://chat.abadgroup.tech
      CHATWOOT_TOKEN: TNoHyvHWtQ6Ng9W3YY7RJ4bq
      CHATWOOT_ACCOUNT_ID: "2"
      CHATWOOT_SIGN_MSG: "false"
      CHATWOOT_REOPEN_CONVERSATION: "true"
      CHATWOOT_CONVERSATION_PENDING: "false"
      LANGUAGE: es
      LOG_LEVEL: WARN
      NODE_OPTIONS: "--dns-result-order=ipv4first"
    sysctls:
      net.ipv6.conf.all.disable_ipv6: 1
    ports: []

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: evolution
      POSTGRES_USER: evolution_user
      POSTGRES_PASSWORD: evolution_pass
    volumes:
      - evolution_postgres_v2:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U evolution_user -d evolution"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  evolution_instances:
  evolution_postgres_v2:
```

> **Cambios clave respecto a v2.2.3:**
> - Imagen: `evoapicloud/evolution-api:v2.3.7` (antes `atendai/evolution-api:v2.2.3`)
> - `CONFIG_SESSION_PHONE_VERSION`: versión de WhatsApp Web actualizada (evita rechazo de Meta)
> - `NODE_OPTIONS: "--dns-result-order=ipv4first"`: fuerza IPv4 (Meta bloquea IPv6 de datacenters)
> - `sysctls: net.ipv6.conf.all.disable_ipv6: 1`: desactiva IPv6 a nivel de container
> - `LOG_LEVEL: WARN`: reduce logs innecesarios
> - Volumen `evolution_postgres_v2` (limpio, sin datos corruptos de v2.2.3)

4. Verifica que el dominio `evolution.sekaitech.com.pe` apunta al puerto **8080** en la pestaña **Domains**
5. Click **Deploy**

---

## PASO 2 — Verificar que Evolution API está corriendo

Espera ~30 segundos después del deploy. Luego verifica:

```bash
curl -s https://evolution.sekaitech.com.pe/instance/fetchInstances \
  -H "apikey: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c=" | python -m json.tool
```

Respuesta esperada: `[]` (array vacío) — significa que Evolution API responde pero no hay instancias creadas aún.

---

## PASO 3 — Eliminar instancia vieja (si existe)

```bash
curl -X DELETE https://evolution.sekaitech.com.pe/instance/delete/sekaitech \
  -H "apikey: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c="
```

Respuesta esperada: `{"status":"SUCCESS"}` o `404` si no existía. Ambos están bien.

---

## PASO 4 — Crear instancia nueva

```bash
curl -X POST https://evolution.sekaitech.com.pe/instance/create \
  -H "apikey: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c=" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "sekaitech",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

Respuesta esperada:
```json
{
  "instance": {
    "instanceName": "sekaitech",
    "status": "created"
  },
  "hash": { ... },
  "qrcode": {
    "base64": "data:image/png;base64,iVBOR..."
  }
}
```

Si el campo `qrcode.base64` viene en la respuesta, copia el string base64 y decodifícalo en https://base64.guru/converter/decode/image para ver el QR.

---

## PASO 5 — Obtener QR para escanear

```bash
curl -s https://evolution.sekaitech.com.pe/instance/connect/sekaitech \
  -H "apikey: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c="
```

Respuesta esperada con QR:
```json
{
  "pairingCode": null,
  "code": "2@abc123...",
  "base64": "data:image/png;base64,iVBOR...",
  "count": 1
}
```

**Para ver el QR:** copia el valor de `base64` (incluyendo `data:image/png;base64,`) y pégalo en la barra de direcciones de Chrome. Se mostrará la imagen del QR.

**Alternativa más fácil:** usa el script `get_qr.py` que ya tienes:
```bash
python get_qr.py
```

---

## PASO 6 — Escanear el QR

1. Abre WhatsApp en tu teléfono
2. Ve a **Dispositivos vinculados** → **Vincular un dispositivo**
3. Escanea el QR que obtuviste en el paso anterior
4. **Tienes ~45 segundos** antes de que expire

---

## PASO 7 — Verificar conexión exitosa

```bash
curl -s https://evolution.sekaitech.com.pe/instance/fetchInstances \
  -H "apikey: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c=" | python -m json.tool
```

Busca `"connectionStatus": "open"` en la respuesta. Si dice `"open"`, WhatsApp está conectado.

---

## PASO 8 — Probar envío de mensaje

Envía un mensaje de prueba a tu propio número:

```bash
curl -X POST https://evolution.sekaitech.com.pe/message/sendText/sekaitech \
  -H "apikey: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c=" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "51TUNUMERO@s.whatsapp.net",
    "text": "✅ Evolution API v2.3.7 conectada correctamente"
  }'
```

Reemplaza `51TUNUMERO` con tu número real (código de país + número, sin `+`).

---

---

# ERRORES COMUNES Y SOLUCIONES

---

### Error: `{"count": 0}` al pedir QR (loop infinito)

**Síntomas:** El endpoint `/instance/connect/sekaitech` devuelve `{"count": 0}` siempre, nunca genera QR.

**Causa:** Bug en v2.2.3 — loop de reconexión infinito que bloquea la generación del QR.

**Solución:**
1. Verifica que estás usando la imagen `evoapicloud/evolution-api:v2.3.7` (no `atendai/...v2.2.3`)
2. Elimina la instancia vieja: `curl -X DELETE .../instance/delete/sekaitech`
3. Crea una nueva: `curl -X POST .../instance/create`

---

### Error: `Database provider invalid` o `prisma` errors al iniciar

**Síntomas:** Evolution API crashea al arrancar con errores sobre Prisma o base de datos.

**Causa:** Evolution API v2 usa Prisma ORM internamente y **solo acepta `postgresql` o `mongodb`** como provider. SQLite no es compatible.

**Solución:**
Verifica estas 3 variables en el compose:
```yaml
DATABASE_ENABLED: "true"
DATABASE_PROVIDER: postgresql
DATABASE_CONNECTION_URI: postgresql://evolution_user:evolution_pass@postgres:5432/evolution
```

> **Ojo:** La variable se llama `DATABASE_CONNECTION_URI` (no `DATABASE_URL` ni `DATABASE_CONNECTION_URL`).

---

### Error: `password authentication failed for user "evolution_user"`

**Síntomas:** Evolution API no puede conectar al PostgreSQL interno.

**Causa:** El volumen de PostgreSQL tiene datos de un deploy anterior con una contraseña diferente.

**Solución:**
1. Cambia el nombre del volumen en el compose (ej: `evolution_postgres_v2` → `evolution_postgres_v3`)
2. Redeploya — esto crea un volumen limpio con la contraseña correcta

---

### Error: `mgt.clearMarks is not a function` en el panel manager

**Síntomas:** El panel web de Evolution API (manager) muestra pantalla blanca con este error en la consola del navegador.

**Causa:** Bug en el frontend del manager de v2.2.3 que usa `performance.clearMarks()` de forma incorrecta.

**Solución:** Este error desaparece con v2.3.7. Si persiste igualmente, no afecta la funcionalidad — solo el panel web. La API REST funciona igual.

---

### Error: QR se genera pero WhatsApp dice "versión no compatible" o el QR expira instantáneamente

**Síntomas:** El QR aparece pero al escanearlo con el teléfono, falla o se desconecta inmediatamente.

**Causa:** WhatsApp rechaza conexiones desde versiones antiguas del protocolo Web. Meta actualizó los requisitos en 2026.

**Solución:**
Verifica que el compose tiene estas variables:
```yaml
CONFIG_SESSION_PHONE_CLIENT: "Evolution API"
CONFIG_SESSION_PHONE_NAME: "Chrome"
CONFIG_SESSION_PHONE_VERSION: "2.3000.1015901307"
```

---

### Error: QR se genera, se escanea, pero la conexión cae después de unos segundos

**Síntomas:** Estado cambia brevemente a `"open"` y luego vuelve a `"close"` o `"connecting"`.

**Causa:** Meta detecta que la conexión viene de una IP de datacenter (Hetzner, DigitalOcean, AWS, etc.) y la bloquea. También puede ser IPv6.

**Solución (ya aplicada en el compose):**
```yaml
NODE_OPTIONS: "--dns-result-order=ipv4first"
sysctls:
  net.ipv6.conf.all.disable_ipv6: 1
```

**Si aún falla después de aplicar esto** → la IP de tu servidor está bloqueada por Meta. Opciones:

**Opción A — Proxy SOCKS5:**
Agrega estas variables al compose de evolution:
```yaml
PROXY_HOST: "proxy.webshare.io"
PROXY_PORT: "9999"
PROXY_USERNAME: "tu_user"
PROXY_PASSWORD: "tu_pass"
```
Puedes obtener proxies residenciales en [webshare.io](https://www.webshare.io/) (plan gratis incluye 10 proxies — usa uno residencial US o LATAM).

**Opción B — Cambiar de servidor:**
Si no quieres usar proxy, mueve Evolution API a un VPS con IP residencial o a un proveedor que Meta no bloquee.

---

### Error: `ECONNREFUSED` o `connect ECONNREFUSED 127.0.0.1:5432`

**Síntomas:** Evolution API no puede conectar a PostgreSQL.

**Causa:** PostgreSQL aún no terminó de iniciar, o el servicio postgres no está en el mismo compose.

**Solución:**
1. Verifica que el servicio `postgres` está definido en el mismo compose
2. Verifica que `depends_on` con `service_healthy` está configurado
3. Si persiste, verifica los logs del contenedor postgres en Dokploy → Logs

---

### Error: `sysctls not allowed` o `permission denied for sysctls`

**Síntomas:** Dokploy/Docker no permite la opción `sysctls` en el compose.

**Causa:** Algunos entornos Docker (especialmente rootless) no permiten sysctls.

**Solución:** Elimina el bloque `sysctls` del compose:
```yaml
    # ELIMINAR estas líneas:
    sysctls:
      net.ipv6.conf.all.disable_ipv6: 1
```
La opción `NODE_OPTIONS: "--dns-result-order=ipv4first"` sigue forzando IPv4 a nivel de Node.js, que es suficiente en la mayoría de los casos.

---

### Error: `502 Bad Gateway` al acceder a `evolution.sekaitech.com.pe`

**Síntomas:** Traefik devuelve 502 al intentar acceder a la API.

**Causa:** El dominio apunta al puerto incorrecto, o Evolution API aún está arrancando.

**Solución:**
1. En Dokploy → Servicio evolution-api → pestaña **Domains**
2. Verifica que el dominio apunta al puerto **8080** (puerto interno de Evolution API)
3. Espera 30-60 segundos después del deploy y vuelve a intentar
4. Si persiste: en Dokploy → Logs → busca errores en el contenedor `evolution`

---

### Error: La instancia aparece como `"connecting"` permanentemente

**Síntomas:** `fetchInstances` devuelve `"connectionStatus": "connecting"` y nunca pasa a `"open"`.

**Causa:** QR expirado o no escaneado a tiempo. WhatsApp da ~45 segundos.

**Solución:**
1. Elimina la instancia: `curl -X DELETE .../instance/delete/sekaitech`
2. Espera 3 segundos
3. Crea de nuevo: `curl -X POST .../instance/create`
4. Obtén QR fresco: `curl .../instance/connect/sekaitech`
5. **Escanea inmediatamente** (tienes ~45 segundos)

O usa el script `get_qr.py` que automatiza todo esto.

---

### Error: `instance already exists` al crear

**Síntomas:** El POST a `/instance/create` devuelve error diciendo que la instancia ya existe.

**Solución:** Primero elimínala y luego créala de nuevo:
```bash
curl -X DELETE https://evolution.sekaitech.com.pe/instance/delete/sekaitech \
  -H "apikey: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c="

# Espera 2 segundos

curl -X POST https://evolution.sekaitech.com.pe/instance/create \
  -H "apikey: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c=" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "sekaitech", "qrcode": true, "integration": "WHATSAPP-BAILEYS"}'
```

---

### Error: Mensajes no llegan al grupo de WhatsApp

**Síntomas:** La API responde 200 al enviar mensaje pero no llega al grupo.

**Causas posibles:**
1. `groupJid` incorrecto — debe terminar en `@g.us`
2. El número no es administrador del grupo
3. La instancia se desconectó (verificar estado con `fetchInstances`)

**Solución:**
```bash
# 1. Verificar que la instancia sigue conectada:
curl -s https://evolution.sekaitech.com.pe/instance/fetchInstances \
  -H "apikey: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c=" | python -m json.tool

# 2. Listar grupos del número para encontrar el JID correcto:
curl -s https://evolution.sekaitech.com.pe/group/fetchAllGroups/sekaitech \
  -H "apikey: 6mF28RqtJdPIZorVIbAaRBiKZoZr3a5t4d9jikNna7c=" | python -m json.tool
```

---

## Resumen de comandos rápidos

| Acción | Comando |
|---|---|
| Ver instancias | `curl .../instance/fetchInstances -H "apikey: ..."` |
| Eliminar instancia | `curl -X DELETE .../instance/delete/sekaitech -H "apikey: ..."` |
| Crear instancia | `curl -X POST .../instance/create -H "apikey: ..." -H "Content-Type: application/json" -d '{"instanceName":"sekaitech","qrcode":true,"integration":"WHATSAPP-BAILEYS"}'` |
| Obtener QR | `curl .../instance/connect/sekaitech -H "apikey: ..."` |
| Verificar estado | `curl .../instance/fetchInstances -H "apikey: ..."` → buscar `"connectionStatus":"open"` |
| Enviar mensaje | `curl -X POST .../message/sendText/sekaitech -H "apikey: ..." -d '{"number":"51XXX@s.whatsapp.net","text":"test"}'` |
| Listar grupos | `curl .../group/fetchAllGroups/sekaitech -H "apikey: ..."` |
| Script automatizado | `python get_qr.py` |
