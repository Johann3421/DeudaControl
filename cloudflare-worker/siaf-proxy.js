/**
 * Cloudflare Worker - SIAF Proxy
 *
 * Este worker actúa como puente entre tu servidor de producción y el SIAF
 * cuando el hosting bloquea conexiones directas a apps2.mef.gob.pe
 *
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Ve a https://dash.cloudflare.com/ y crea una cuenta (gratis)
 * 2. Ve a "Workers & Pages" → "Create Application" → "Create Worker"
 * 3. Ponle nombre: "siaf-proxy"
 * 4. Pega TODO este código en el editor
 * 5. Click en "Save and Deploy"
 * 6. Tu URL será algo como: https://siaf-proxy.tu-usuario.workers.dev
 * 7. Copia esa URL y ponla en tu .env: SIAF_PROXY_URL=https://siaf-proxy.tu-usuario.workers.dev
 *
 * SEGURIDAD:
 * - Configura SIAF_PROXY_SECRET en tu .env y en el Worker (Variables de entorno)
 * - Solo tu servidor podrá usar el proxy
 *
 * LÍMITES GRATIS: 100,000 requests/día (más que suficiente)
 */

export default {
    async fetch(request, env) {
        // Headers CORS para permitir requests desde tu servidor
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Proxy-Secret',
            'Content-Type': 'application/json',
        };

        // Preflight CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Verificar secret (seguridad)
        const proxySecret = env.SIAF_PROXY_SECRET || 'default-secret-change-me';
        const requestSecret = request.headers.get('X-Proxy-Secret') || '';

        if (requestSecret !== proxySecret) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Unauthorized - Invalid proxy secret'
            }), { status: 401, headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // ============================================
            // RUTA 1: GET /captcha - Obtener CAPTCHA del SIAF
            // ============================================
            if (path === '/captcha' && request.method === 'GET') {
                return await handleCaptcha(corsHeaders);
            }

            // ============================================
            // RUTA 2: POST /consultar - Consultar expediente SIAF
            // ============================================
            if (path === '/consultar' && request.method === 'POST') {
                const body = await request.json();
                return await handleConsultar(body, corsHeaders);
            }

            // ============================================
            // RUTA 3: GET /health - Health check
            // ============================================
            if (path === '/health') {
                return new Response(JSON.stringify({
                    success: true,
                    message: 'SIAF Proxy is running',
                    timestamp: new Date().toISOString(),
                }), { headers: corsHeaders });
            }

            // Ruta no encontrada
            return new Response(JSON.stringify({
                success: false,
                message: 'Route not found. Available: GET /captcha, POST /consultar, GET /health'
            }), { status: 404, headers: corsHeaders });

        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Proxy error: ' + error.message
            }), { status: 500, headers: corsHeaders });
        }
    }
};

/**
 * Obtiene CAPTCHA del SIAF
 * 1. Establece sesión con SIAF
 * 2. Descarga imagen CAPTCHA
 * 3. Retorna imagen + cookies de sesión
 */
async function handleCaptcha(corsHeaders) {
    const SIAF_BASE = 'https://apps2.mef.gob.pe/consulta-vfp-webapp/';

    // Helper: fetch with timeout using AbortController
    const fetchWithTimeout = async (resource, options = {}, timeoutMs = 25000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(resource, { ...options, signal: controller.signal });
            clearTimeout(id);
            return res;
        } catch (err) {
            clearTimeout(id);
            throw err;
        }
    };

    // Paso 1: GET a la página principal para establecer sesión (con timeout)
    let sessionResponse;
    try {
        sessionResponse = await fetchWithTimeout(SIAF_BASE + 'consultaExpediente.jspx', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9',
            },
            redirect: 'follow',
        }, 24000);
    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Error fetching SIAF session page: ' + (err.name === 'AbortError' ? 'timeout' : err.message)
        }), { status: 504, headers: corsHeaders });
    }

    if (!sessionResponse.ok) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Error al establecer sesión SIAF: HTTP ' + sessionResponse.status
        }), { status: sessionResponse.status, headers: corsHeaders });
    }

    // Extraer cookies de la respuesta (múltiples métodos para compatibilidad)
    let cookieString = '';
    try {
        // Método 1: getSetCookie() - estándar moderno
        if (typeof sessionResponse.headers.getSetCookie === 'function') {
            const cookies = sessionResponse.headers.getSetCookie();
            cookieString = cookies.map(c => c.split(';')[0]).join('; ');
        }
        // Método 2: getAll() - extensión de Cloudflare Workers
        if (!cookieString && typeof sessionResponse.headers.getAll === 'function') {
            const setCookieHeaders = sessionResponse.headers.getAll('set-cookie');
            cookieString = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
        }
        // Método 3: get() - fallback básico (solo obtiene la primera cookie)
        if (!cookieString) {
            const singleCookie = sessionResponse.headers.get('set-cookie');
            if (singleCookie) {
                cookieString = singleCookie.split(',').map(c => c.split(';')[0].trim()).join('; ');
            }
        }
    } catch (e) {
        // Último recurso
        const singleCookie = sessionResponse.headers.get('set-cookie');
        if (singleCookie) {
            cookieString = singleCookie.split(';')[0];
        }
    }

    if (!cookieString) {
        return new Response(JSON.stringify({
            success: false,
            message: 'SIAF no retornó cookies de sesión'
        }), { headers: corsHeaders });
    }

    // Paso 2: GET a Captcha.jpg con las mismas cookies (con timeout)
    let captchaResponse;
    try {
        captchaResponse = await fetchWithTimeout(SIAF_BASE + 'Captcha.jpg', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
                'Cookie': cookieString,
            },
        }, 20000);
    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Error fetching CAPTCHA image: ' + (err.name === 'AbortError' ? 'timeout' : err.message)
        }), { status: 504, headers: corsHeaders });
    }

    if (!captchaResponse.ok) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Error al obtener CAPTCHA: HTTP ' + captchaResponse.status
        }), { status: captchaResponse.status, headers: corsHeaders });
    }

    // Convertir imagen a base64
    const imageBuffer = await captchaResponse.arrayBuffer();
    const base64 = arrayBufferToBase64(imageBuffer);

    return new Response(JSON.stringify({
        success: true,
        captcha: 'data:image/jpg;base64,' + base64,
        session: cookieString,  // El servidor debe guardar esto para la consulta
        source: 'siaf_proxy',
    }), { headers: corsHeaders });
}

/**
 * Consulta expediente en SIAF
 * Recibe: session (cookies), anoEje, secEjec, expediente, j_captcha
 * Retorna: HTML de la respuesta SIAF
 */
async function handleConsultar(body, corsHeaders) {
    const { session, anoEje, secEjec, expediente, j_captcha } = body;

    if (!session || !anoEje || !secEjec || !expediente || !j_captcha) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Faltan parámetros requeridos: session, anoEje, secEjec, expediente, j_captcha'
        }), { status: 400, headers: corsHeaders });
    }

    const SIAF_URL = 'https://apps2.mef.gob.pe/consulta-vfp-webapp/actionConsultaExpediente.jspx';

    // Construir form data
    const formData = new URLSearchParams({
        anoEje: anoEje,
        secEjec: secEjec,
        expediente: expediente,
        j_captcha: j_captcha,
    });

    // POST a SIAF con las cookies de sesión
    // POST a SIAF con las cookies de sesión (con timeout)
    let response;
    try {
        response = await fetchWithTimeout(SIAF_URL, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx',
                'Cookie': session,
            },
            body: formData.toString(),
            redirect: 'follow',
        }, 45000);
    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Error posting to SIAF: ' + (err.name === 'AbortError' ? 'timeout' : err.message)
        }), { status: 504, headers: corsHeaders });
    }

    const html = await response.text();

    return new Response(JSON.stringify({
        success: true,
        html: html,
        httpCode: response.status,
    }), { headers: corsHeaders });
}

/**
 * Convierte ArrayBuffer a Base64
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
