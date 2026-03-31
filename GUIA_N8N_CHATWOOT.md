# Guía: n8n + Chatwoot + Evolution API — Alertas de Vencimientos

Sistema de notificaciones automáticas que consulta la API de `deudas.sekaitech.com.pe` cada mañana (lunes a sábado a las 08:00) y envía un resumen de deudas y órdenes que vencen en los próximos 7 días a un **grupo de WhatsApp** real.

---

## ⚠️ Problema con la API Oficial de Meta

La API de WhatsApp Business de Meta **no permite crear ni gestionar grupos**. Si intentas hacerlo desde Chatwoot con Meta como proveedor, el endpoint simplemente no existe o devuelve error.

**La solución: Evolution API** — API No Oficial open-source que actúa como cliente WhatsApp Web. Funciona con cualquier número normal (no necesita aprobación de Meta), permite crear grupos, y tiene integración nativa con Chatwoot y n8n.

### Arquitectura completa

```
⏰ n8n Scheduler
        │
        ▼
🌐 API deudas.sekaitech.com.pe  ──►  📝 Construir mensajes
                                              │
                                              ▼
                                    📲 Evolution API (WhatsApp)
                                              │
                                              ▼
                                    👥 Grupo WhatsApp ◄──── también en ──► 💬 Chatwoot
```

---

## PARTE 1 — Desplegar Evolution API en Dokploy

### Paso 1.1 — Nueva aplicación en Dokploy

1. En Dokploy → **Create Service → Docker Compose**
2. Nombre: `evolution-api`
3. En el campo **Docker Compose**, pega esto:

```yaml
services:
  evolution:
    image: atendai/evolution-api:v2.2.3
    restart: always
    volumes:
      - evolution_data:/evolution/instances
    environment:
      SERVER_URL: https://evolution.TU_DOMINIO.com   # ← CAMBIAR
      AUTHENTICATION_TYPE: apikey
      AUTHENTICATION_API_KEY: TU_API_KEY_SECRETA     # ← genera con: openssl rand -base64 32
      AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: true
      QRCODE_LIMIT: 30
      DEL_INSTANCE: false
      DATABASE_ENABLED: false
      CACHE_REDIS_ENABLED: false
      CHATWOOT_ENABLED: true
      CHATWOOT_API_URL: https://chat.abadgroup.tech
      CHATWOOT_TOKEN: TU_CHATWOOT_ACCESS_TOKEN       # ← el mismo de siempre
      CHATWOOT_ACCOUNT_ID: "1"
      CHATWOOT_SIGN_MSG: false
      CHATWOOT_REOPEN_CONVERSATION: true
      CHATWOOT_CONVERSATION_PENDING: false
      LANGUAGE: es
    ports: []

volumes:
  evolution_data:
```

4. En la pestaña **Domains**: apunta `evolution.TU_DOMINIO.com` → puerto `8080`
5. Click **Deploy**

---

### Paso 1.2 — Crear instancia y conectar número

Con Evolution API corriendo, crea la instancia de WhatsApp:

```bash
curl -X POST https://evolution.TU_DOMINIO.com/instance/create \
  -H "apikey: TU_API_KEY_SECRETA" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "sekaitech",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

Respuesta devuelve un `base64` con el QR. Para verlo fácil:

```bash
curl -X GET https://evolution.TU_DOMINIO.com/instance/connect/sekaitech \
  -H "apikey: TU_API_KEY_SECRETA"
```

Abre la URL del QR en tu navegador → escanéalo con el WhatsApp del número que usarás para enviar alertas.

> **Tip**: Usa un número secundario o una línea específica para el bot. Una vez que escaneas el QR, ese número queda conectado a Evolution API.

---

### Paso 1.3 — Verificar conexión

```bash
curl https://evolution.TU_DOMINIO.com/instance/fetchInstances \
  -H "apikey: TU_API_KEY_SECRETA"
```

Debes ver `"state": "open"` en la instancia `sekaitech`. Si ves `"state": "close"`, repite el QR.

---

### Paso 1.4 — Integrar Evolution API con Chatwoot

Esto hace que los mensajes del grupo también aparezcan en Chatwoot:

```bash
curl -X POST https://evolution.TU_DOMINIO.com/chatwoot/set/sekaitech \
  -H "apikey: TU_API_KEY_SECRETA" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "account_id": "1",
    "token": "TU_CHATWOOT_ACCESS_TOKEN",
    "url": "https://chat.abadgroup.tech",
    "sign_msg": false,
    "reopen_conversation": true,
    "conversation_pending": false
  }'
```

---

## PARTE 2 — Crear el Grupo de WhatsApp

### Paso 2.1 — Crear el grupo

```bash
curl -X POST https://evolution.TU_DOMINIO.com/group/create/sekaitech \
  -H "apikey: TU_API_KEY_SECRETA" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "🔔 Alertas Deudas — Sekaitech",
    "description": "Notificaciones automáticas de vencimientos",
    "participants": [
      "51987654321@s.whatsapp.net",
      "51912345678@s.whatsapp.net"
    ]
  }'
```

> Los números van en formato `51XXXXXXXXX@s.whatsapp.net` (código de país sin `+`).

La respuesta incluye el `groupJid` — **cópialo**, lo necesitas en el siguiente paso:

```json
{
  "groupJid": "120363XXXXXXXXXX@g.us"
}
```

### Paso 2.2 — Probar envío al grupo

```bash
curl -X POST https://evolution.TU_DOMINIO.com/message/sendText/sekaitech \
  -H "apikey: TU_API_KEY_SECRETA" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "120363XXXXXXXXXX@g.us",
    "text": "✅ Bot de alertas conectado correctamente"
  }'
```

Si llega el mensaje al grupo, todo está listo.

---

## PARTE 3 — Actualizar el Workflow de n8n

### Paso 3.1 — Abrir nodo ✉️ Enviar a Chatwoot

Después de importar `n8n-workflow-alertas-deudas.json`, abre el nodo **✉️ Enviar a Chatwoot** y actualiza estas constantes:

```js
// ── Credenciales — EDITAR ESTOS VALORES ──────────────────
const EVOLUTION_URL      = 'https://evolution.TU_DOMINIO.com';
const EVOLUTION_API_KEY  = 'TU_API_KEY_SECRETA';
const EVOLUTION_INSTANCE = 'sekaitech';
const GROUP_JID          = '120363XXXXXXXXXX@g.us';   // ← del paso 2.1
```

El nodo enviará directamente al grupo de WhatsApp vía Evolution API en lugar de Chatwoot.

### Paso 3.2 — Actualizar nodo 🆘 Notificar Error API

Igual — actualiza las mismas constantes para que los errores también lleguen al grupo.

---

## PARTE 4 — Configurar `ALERTAS_TOKEN` en Dokploy

1. Dokploy → app **Control Deudas** → pestaña **Environment**
2. Agrega:
```
ALERTAS_TOKEN=el_token_que_generaste
```
3. Redespliega

---

## PARTE 5 — Activar y Probar

1. En n8n → abre el workflow → toggle **Activate**
2. Para probar: click en **Test Workflow** (no esperes al cron)
3. Verifica que llega al grupo de WhatsApp

---

## Resumen de variables a reemplazar

| Variable | Dónde | Valor |
|---|---|---|
| `TU_DOMINIO.com` | docker-compose Evolution + curl | tu dominio real |
| `TU_API_KEY_SECRETA` | docker-compose Evolution + todos los curl + n8n | `openssl rand -base64 32` |
| `TU_CHATWOOT_ACCESS_TOKEN` | docker-compose Evolution + curl Chatwoot | Chatwoot → Profile → Access Token |
| `ALERTAS_TOKEN` | Dokploy env + nodo n8n | `openssl rand -base64 32` (distinto del de Evolution) |
| `GROUP_JID` | nodo n8n | respuesta del `curl /group/create` |
| números `participants` | curl crear grupo | `51XXXXXXXXX@s.whatsapp.net` |

---

---

## Arquitectura del Flujo

```
⏰ Scheduler ──► 🌐 API Alertas ──► 🔍 ¿Error?
                                      ├── SÍ ──► 🆘 Notificar Error
                                      └── NO ──► 📝 Construir Mensajes ──► ❓ ¿Hay alertas?
                                                                              ├── SÍ ──► ✂️ Dividir ──► ⏳ 1.5s ──► ✉️ Chatwoot
                                                                              └── NO ──► 🔕 Sin alertas (OK)
```

El flujo genera **hasta 3 mensajes** separados:
1. Encabezado con resumen de totales
2. Bloque de deudas (si hay)
3. Bloque de órdenes de compra (si hay)

---

## Requisitos Previos

- n8n corriendo (auto-hospedado o cloud)
- Chatwoot con una conversación/inbox configurada para recibir notificaciones del grupo
- La aplicación `deudas.sekaitech.com.pe` desplegada y funcionando en Dokploy

---

## Paso 1: Importar el Workflow

1. En n8n, ve a **Workflows → Import from File**
2. Selecciona el archivo `n8n-workflow-alertas-deudas.json` de este repositorio
3. El workflow se importará con el nombre **"Alertas Deudas y Órdenes — Control Deudas v2"**

> **Nota:** El archivo está excluido de git por defecto (`.gitignore` contiene `n8n-workflow-*.json`).  
> Para compartirlo, renómbralo a `n8n-workflow-alertas-deudas.example.json`.

---

## Paso 2: Editar las Constantes del Workflow

El workflow usa `const` hardcodeadas dentro de los nodos de código — **no requiere n8n Enterprise ni la sección Variables**.

Después de importar, abre los 3 nodos de código que dicen `// Credenciales hardcodeadas` y actualiza estos valores:

| Constante | Dónde encontrarla | Nodos que la usan |
|---|---|---|
| `ALERTAS_TOKEN` | La generas tú (ver abajo) | 🌐 Consultar API Alertas |
| `CHATWOOT_URL` | Ya configurada: `https://chat.abadgroup.tech` | 🆘 Notificar Error API, ✉️ Enviar a Chatwoot |
| `CHATWOOT_TOKEN` | Ya configurada desde kenya bot | 🆘 Notificar Error API, ✉️ Enviar a Chatwoot |
| `CHATWOOT_ACCOUNT_ID` | En la URL de Chatwoot (ver abajo) | 🆘 Notificar Error API, ✉️ Enviar a Chatwoot |
| `CHATWOOT_CONV_GROUP_ID` | ID de la conversación donde llegan las alertas | 🆘 Notificar Error API, ✉️ Enviar a Chatwoot |

### Cómo obtener cada valor

#### `ALERTAS_TOKEN`
Genera un token seguro:
```bash
openssl rand -base64 32
```
Copia el resultado. Úsalo como valor de `ALERTAS_TOKEN` en los nodos **y** en Dokploy (ver Paso 3).

#### `CHATWOOT_ACCOUNT_ID`
Está en la URL cuando entras a Chatwoot:  
`https://chat.abadgroup.tech/app/accounts/**1**/...`  
El número después de `accounts/` es el ID. Probablemente `1`.

#### `CHATWOOT_CONV_GROUP_ID`
1. Abre en Chatwoot la conversación/grupo donde quieres recibir los avisos
2. Mira la URL: `.../conversations/**42**`
3. El número final es el ID — actualiza `CHATWOOT_CONV_GROUP_ID` con ese valor

---

## Paso 3: Configurar `ALERTAS_TOKEN` en Dokploy

El token que generaste debe coincidir entre n8n y Dokploy.

1. En Dokploy, ve a la aplicación **Control Deudas**
2. Entra a la pestaña **Environment** (Variables de entorno)
3. Agrega o actualiza:
   ```
   ALERTAS_TOKEN=tu_token_generado_aqui
   ```
4. Redespliega la aplicación para que tome efecto

---

## Paso 4: Activar el Workflow

1. Abre el workflow en n8n
2. Haz clic en el botón **Activate** (toggle superior derecho)
3. El scheduler se ejecutará cada día lunes–sábado a las 08:00 (hora del servidor n8n)

---

## Paso 5: Probar Manualmente

Para probar sin esperar al horario programado:

1. Abre el workflow en n8n
2. Haz clic en **Test workflow** (o el botón ▶️ del nodo Schedule)
3. Observa la ejecución nodo por nodo en el panel de ejecución
4. Verifica que los mensajes llegan a Chatwoot

### Qué esperar en escenario normal

Si hay alertas, Chatwoot recibirá mensajes como este:

```
📋 *ALERTAS DE VENCIMIENTO*
🗓️ 01/04/2026 08:00  |  deudas.sekaitech.com.pe
────────────────────────────────────
📊 *Resumen:*
   • Total alertas: *3*
   • 🔴 Vencidas/Hoy: *1*
   • 🟠 Críticas (≤3d): *1*
   • 💳 Deudas: 2
   • 📦 Órdenes: 1
```

```
💳 *DEUDAS POR COBRAR (2)*
────────────────────────────────────

🔴 *1. Municipalidad de Lima*
   📌 Consultoría técnica Q1
   💰 Pendiente: *S/ 15,000.00*
   ⚠️ VENCIDO hace 1 dia(s) (31/03/2026)
   👤 Responsable: Juan Pérez

🟠 *2. Ministerio de Educación*
   📌 Servicios de capacitación
   💰 Pendiente: *S/ 8,500.00*
   📌 Vence *mañana* (02/04/2026)
   👤 Responsable: Ana García
```

Si no hay alertas, el flujo termina en el nodo **"🔕 Sin Alertas — OK"** sin enviar nada a Chatwoot.

---

## Paso 6: Configurar Zona Horaria en n8n

Para que el cron `0 8 * * 1-6` dispare a las 08:00 hora de Lima (Peru, UTC-5):

1. Ve a **Settings → General** en n8n
2. Cambia **Timezone** a `America/Lima`

---

## Lógica de Colores / Urgencia

| Icono | Condición | Acción recomendada |
|---|---|---|
| 🔴 | `dias_restantes ≤ 0` | Vencida — gestionar pago/cobro inmediato |
| 🟠 | `1 ≤ días ≤ 3` | Crítica — contactar urgente |
| 🟡 | `4 ≤ días ≤ 7` | Próximas — programar gestión |

---

## Nodos del Workflow

| Nodo | Tipo | Descripción |
|---|---|---|
| ⏰ Lun-Sáb 08:00 | ScheduleTrigger | Cron `0 8 * * 1-6` |
| 🌐 Consultar API Alertas | **Code** | GET con `this.helpers.httpRequest()`, maneja errores inline |
| 🔍 ¿Error de API? | IF | Detecta `{ error: true }` devuelto por el nodo anterior |
| 🆘 Notificar Error API | **Code** | Envía alerta de fallo a Chatwoot vía `httpRequest()` |
| 📝 Procesar y Construir Mensajes | Code | Genera array de mensajes formateados |
| ❓ ¿Hay Alertas? | IF | Comprueba si hay deudas u órdenes próximas |
| ✂️ Dividir Mensajes | SplitOut | Divide el array `mensajes[]` en items individuales |
| ⏳ Esperar 1.5s | Wait | Pausa entre mensajes para evitar rate limiting |
| ✉️ Enviar a Chatwoot | **Code** | POST vía `httpRequest()`, maneja errores inline |
| 🔕 Sin Alertas — OK | NoOp | Fin limpio cuando no hay alertas |

---

## Endpoint de la API

```
GET https://deudas.sekaitech.com.pe/api/alertas/vencimientos
Header: X-Alertas-Token: <ALERTAS_TOKEN>
```

Respuesta:
```json
{
  "generado": "01/04/2026 08:00",
  "deudas": [
    {
      "id": 5,
      "descripcion": "Consultoría Q1",
      "cliente": "Municipalidad de Lima",
      "monto": "S/ 15,000.00",
      "fecha_vencimiento": "31/03/2026",
      "dias_restantes": -1,
      "responsable": "Juan Pérez"
    }
  ],
  "ordenes": [
    {
      "id": 12,
      "orden_compra": "OC-2026-001",
      "entidad": "Ministerio de Educación",
      "producto_servicio": "Capacitación docente",
      "empresa_factura": "ABC SAC",
      "estado_seguimiento": "En proceso",
      "monto": "S/ 8,500.00",
      "fecha_limite_pago": "02/04/2026",
      "dias_restantes": 1,
      "responsable": "Ana García"
    }
  ],
  "total_alertas": 2
}
```

Ventana de alertas: **-1 día** (vencidas ayer) hasta **+7 días** (próximas esta semana).

---

## Troubleshooting

| Problema | Causa probable | Solución |
|---|---|---|
| API devuelve 401 | `ALERTAS_TOKEN` no coincide | Verifica que `ALERTAS_TOKEN` en el nodo de código coincida con la env var en Dokploy |
| API devuelve 500 | App caída o error en DB | Revisar logs en Dokploy |
| Chatwoot no recibe mensajes | `CHATWOOT_CONV_GROUP_ID` incorrecto | Verifica el ID en la URL de la conversación |
| `api_access_token` inválido | Token de Chatwoot expirado o incorrecto | Regenerar en Chatwoot Profile Settings |
| No dispara a las 08:00 | Zona horaria incorrecta en n8n | Configurar `America/Lima` en Settings |
| Los mensajes llegan duplicados | Workflow activado más de una vez | Revisar que no haya múltiples instancias activas |
