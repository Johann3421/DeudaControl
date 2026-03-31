# Guía: n8n + Chatwoot — Alertas de Vencimientos

Sistema de notificaciones automáticas que consulta la API de `deudas.sekaitech.com.pe` cada mañana (lunes a sábado a las 08:00) y envía un resumen de deudas y órdenes que vencen en los próximos 7 días directamente a Chatwoot.

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

## Paso 2: Configurar las Variables de n8n

Ve a **Settings → Variables** en n8n y crea las siguientes variables:

| Variable | Descripción | Ejemplo |
|---|---|---|
| `ALERTAS_TOKEN` | Token secreto que autentica la API | `abc123xyz...` |
| `CHATWOOT_URL` | URL base de tu Chatwoot (sin `/` al final) | `https://chat.sekaitech.com.pe` |
| `CHATWOOT_TOKEN` | Access Token de agente o bot en Chatwoot | `xxxxxxxxxxxxxxxx` |
| `CHATWOOT_ACCOUNT_ID` | Número de cuenta en Chatwoot | `1` |
| `CHATWOOT_CONV_GROUP_ID` | ID de la conversación donde se enviarán los mensajes | `42` |

### Cómo obtener cada valor

#### `ALERTAS_TOKEN`
Genera un token seguro:
```bash
openssl rand -base64 32
```
Copia el resultado. Este mismo valor **debes agregarlo** en Dokploy como variable de entorno `ALERTAS_TOKEN`.

#### `CHATWOOT_URL`
La URL donde accedes a tu Chatwoot. Sin la barra final.

#### `CHATWOOT_TOKEN`
1. En Chatwoot, ve a tu perfil (ícono abajo a la izquierda)
2. Selecciona **Profile Settings**
3. Copia el **Access Token** al final de la página

> Recomendado: crea un agente bot dedicado para estas notificaciones.

#### `CHATWOOT_ACCOUNT_ID`
Está en la URL cuando entras a Chatwoot:  
`https://chat.tusitio.com/app/accounts/**1**/...`  
El número después de `accounts/` es el ID.

#### `CHATWOOT_CONV_GROUP_ID`
1. Abre la conversación grupal en Chatwoot donde quieres recibir los avisos
2. Mira la URL: `.../conversations/**42**`
3. El número final es el ID de conversación

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
| 🌐 Consultar API Alertas | HTTP Request | GET con timeout 20s, si falla continúa al nodo error |
| 🔍 ¿Error de API? | IF | Detecta errores de red o HTTP |
| 🆘 Notificar Error API | HTTP Request | Envía alerta de fallo a Chatwoot |
| 📝 Procesar y Construir Mensajes | Code | Genera array de mensajes formateados |
| ❓ ¿Hay Alertas? | IF | Comprueba si hay deudas u órdenes próximas |
| ✂️ Dividir Mensajes | SplitOut | Divide el array `mensajes[]` en items individuales |
| ⏳ Esperar 1.5s | Wait | Pausa entre mensajes para evitar rate limiting |
| ✉️ Enviar a Chatwoot | HTTP Request | POST al endpoint de mensajes de Chatwoot |
| 📋 Log Error Envío | Code | Registra en consola si falla el envío |
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
| API devuelve 401 | `ALERTAS_TOKEN` no coincide | Verifica que el token en n8n Variables y en Dokploy sean iguales |
| API devuelve 500 | App caída o error en DB | Revisar logs en Dokploy |
| Chatwoot no recibe mensajes | `CHATWOOT_CONV_GROUP_ID` incorrecto | Verifica el ID en la URL de la conversación |
| `api_access_token` inválido | Token de Chatwoot expirado o incorrecto | Regenerar en Chatwoot Profile Settings |
| No dispara a las 08:00 | Zona horaria incorrecta en n8n | Configurar `America/Lima` en Settings |
| Los mensajes llegan duplicados | Workflow activado más de una vez | Revisar que no haya múltiples instancias activas |
