<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Cache;

class SiafService
{
    /**
     * URL base del servicio SIAF
     */
    private const SIAF_BASE_URL = 'https://apps2.mef.gob.pe/consulta-vfp-webapp/';

    /**
     * Determina si hay un proxy configurado
     * IMPORTANTE: Solo usa config(), NUNCA env() - en producción con config:cache, env() retorna null
     */
    private function getProxyUrl(): ?string
    {
        $url = config('services.siaf.proxy_url');

        // Log detallado para diagnóstico en producción
        \Log::debug('SIAF getProxyUrl()', [
            'config_value' => $url,
            'is_empty' => empty($url),
            'type' => gettype($url),
            'config_cached' => app()->configurationIsCached(),
        ]);

        if (empty($url)) {
            return null;
        }

        return rtrim($url, '/');
    }

    /**
     * Obtiene el secret del proxy
     * IMPORTANTE: Solo usa config(), NUNCA env()
     */
    private function getProxySecret(): string
    {
        return config('services.siaf.proxy_secret') ?: 'default-secret-change-me';
    }

    /**
     * Archivo de cookies PERSISTENTE para conexión directa
     */
    private function getPersistentCookieFile(): string
    {
        $storageDir = storage_path('app/siaf');
        if (!is_dir($storageDir)) {
            @mkdir($storageDir, 0755, true);
        }
        return $storageDir . '/siaf_session_cookies.txt';
    }

    // ================================================================
    // CAPTCHA: Obtener imagen CAPTCHA del SIAF
    // ================================================================

    /**
     * Obtiene el CAPTCHA del SIAF
     * Estrategia: Directo → Proxy → Local Fallback
     * (Directo primero porque funciona en local, VPS y hosting sin restricciones)
     */
    public function obtenerCaptchaSiaf(): array
    {
        $proxyUrl = $this->getProxyUrl();

        // ESTRATEGIA: Intentar directo primero (funciona en VPS y local)
        // Si falla, fallback a proxy (para hosting compartido con firewall)
        \Log::info('SIAF CAPTCHA - Intentando conexión DIRECTA a SIAF (prioritario en VPS/local)');
        $direct = $this->obtenerCaptchaDirecto(20);
        if ($direct['success']) {
            \Log::info('SIAF CAPTCHA - ✓ Conexión directa exitosa');
            return $direct;
        }

        \Log::warning('SIAF CAPTCHA - Conexión directa falló, intentando fallback');

        // Si directo falló y hay proxy configurado, intentar proxy como fallback
        if ($proxyUrl) {
            \Log::info('SIAF CAPTCHA - Intentando proxy como FALLBACK: ' . $proxyUrl);
            $resultado = $this->obtenerCaptchaViaProxy($proxyUrl);
            if ($resultado['success']) {
                \Log::info('SIAF CAPTCHA - ✓ Proxy exitoso');
                return $resultado;
            }
            \Log::warning('SIAF CAPTCHA - Proxy también falló: ' . ($resultado['message'] ?? 'unknown'));
        } else {
            \Log::warning('SIAF CAPTCHA - Sin proxy configurado para fallback');
        }

        // Último recurso: CAPTCHA local
        \Log::warning('SIAF CAPTCHA - Usando CAPTCHA local como último recurso');
        $razon = 'Conexión directa falló. ';
        if ($proxyUrl) {
            $razon .= 'Proxy también falló.';
        } else {
            $razon .= 'Sin proxy configurado. En Dokploy, verifica que la VPS pueda acceder a apps2.mef.gob.pe.';
        }
        return $this->obtenerCaptchaLocal($razon);
    }

    /**
     * Obtiene CAPTCHA via el Cloudflare Worker proxy
     */
    private function obtenerCaptchaViaProxy(string $proxyUrl): array
    {
        try {
            $secret = $this->getProxySecret();
            $fullUrl = $proxyUrl . '/captcha';

            \Log::info('SIAF Proxy CAPTCHA Request', [
                'url' => $fullUrl,
                'secret_length' => strlen($secret),
                'secret_preview' => substr($secret, 0, 3) . '***',
            ]);

            // Intentar con retries porque la llamada al SIAF puede ser lenta desde el Worker
            $attemptTimeouts = [20, 40, 60];
            $response = null;
            $lastException = null;
            foreach ($attemptTimeouts as $attempt => $t) {
                try {
                    $started = microtime(true);
                    $response = Http::withOptions([
                        'verify' => false,
                        'timeout' => $t,
                        'connect_timeout' => min(15, (int)($t / 2)),
                    ])->withHeaders([
                        'X-Proxy-Secret' => $secret,
                        'Accept' => 'application/json',
                    ])->get($fullUrl);

                    $duration = round((microtime(true) - $started) * 1000);
                    \Log::info('SIAF Proxy CAPTCHA Response', [
                        'attempt' => $attempt + 1,
                        'timeout_seconds' => $t,
                        'duration_ms' => $duration,
                        'status' => $response->status(),
                        'body_length' => strlen($response->body()),
                        'body_preview' => substr($response->body(), 0, 200),
                    ]);

                    // Si recibimos algo legible, rompemos el loop
                    if ($response->successful()) {
                        break;
                    }
                } catch (\Exception $inner) {
                    $lastException = $inner;
                    \Log::warning('SIAF Proxy CAPTCHA attempt failed', [
                        'attempt' => $attempt + 1,
                        'timeout_seconds' => $t,
                        'error' => $inner->getMessage(),
                    ]);
                    // pequeña espera antes del siguiente intento
                    usleep(200000);
                }
            }

            if (is_null($response)) {
                if ($lastException) {
                    throw $lastException;
                }
                return [
                    'success' => false,
                    'message' => 'No response from proxy after retries',
                ];
            }

            $data = $response->json();

            if ($response->successful() && ($data['success'] ?? false)) {
                // Guardar la sesión SIAF del proxy para usarla en la consulta
                if (!empty($data['session'])) {
                    // Guardar la cookie completa en la sesión y en cache con una key corta
                    $sessionString = $data['session'];
                    Session::put('siaf_proxy_session', $sessionString);
                    Session::put('siaf_proxy_timestamp', time());

                    // Crear una clave corta para el cache (por si la sesión se pierde o el driver es inestable)
                    try {
                        $token = 'siaf_' . bin2hex(random_bytes(10));
                    } catch (\Exception $e) {
                        $token = 'siaf_' . uniqid();
                    }
                    Cache::put($token, $sessionString, now()->addMinutes(10));
                    Session::put('siaf_proxy_key', $token);

                    \Log::info('SIAF CAPTCHA - Proxy session guardada (session + cache key)', ['cache_key' => $token]);
                }

                \Log::info('SIAF CAPTCHA - Obtenido exitosamente via proxy');
                return [
                    'success' => true,
                    'captcha' => $data['captcha'],
                    'session_key' => Session::get('siaf_proxy_key'),
                    'source' => 'siaf_proxy',
                ];
            }

            return [
                'success' => false,
                'message' => 'Proxy response: ' . ($data['message'] ?? 'Error desconocido'),
            ];
        } catch (\Exception $e) {
            \Log::error('SIAF CAPTCHA Proxy Exception: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Proxy exception: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Obtiene CAPTCHA via conexión directa a SIAF (cURL)
     */
    private function obtenerCaptchaDirecto(int $timeoutSecs): array
    {
        try {
            $cookieFile = $this->getPersistentCookieFile();
            
            \Log::info('SIAF Directo PASO 1: Estableciendo sesión', [
                'url' => self::SIAF_BASE_URL . 'consultaExpediente.jspx',
                'timeout' => $timeoutSecs,
                'cookie_file' => $cookieFile,
            ]);

            // PASO 1: Establecer sesión en SIAF
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => self::SIAF_BASE_URL . 'consultaExpediente.jspx',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $timeoutSecs,
                CURLOPT_CONNECTTIMEOUT => $timeoutSecs,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_COOKIEFILE => $cookieFile,
                CURLOPT_COOKIEJAR => $cookieFile,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                ],
            ]);

            $response1 = curl_exec($ch);
            $httpCode1 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErrno1 = curl_errno($ch);
            $curlError1 = curl_error($ch);
            curl_close($ch);

            \Log::info('SIAF Directo PASO 1 - Resultado', [
                'http_code' => $httpCode1,
                'curl_errno' => $curlErrno1,
                'curl_error' => $curlError1,
                'response_length' => strlen($response1 ?? ''),
                'has_response' => !empty($response1),
            ]);

            if (!$response1 || $curlErrno1 !== 0) {
                $errorMsg = $curlError1 ?: "No response from session request (HTTP $httpCode1)";
                \Log::error('SIAF Directo PASO 1 FALLÓ', ['error' => $errorMsg, 'errno' => $curlErrno1]);
                return ['success' => false, 'message' => "Session failed: $errorMsg"];
            }

            // PASO 2: Obtener imagen CAPTCHA
            \Log::info('SIAF Directo PASO 2: Obteniendo imagen CAPTCHA');
            
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => self::SIAF_BASE_URL . 'Captcha.jpg',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $timeoutSecs,
                CURLOPT_CONNECTTIMEOUT => $timeoutSecs,
                CURLOPT_BINARYTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_COOKIEFILE => $cookieFile,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                ],
            ]);

            $imageData = curl_exec($ch);
            $httpCode2 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErrno2 = curl_errno($ch);
            $curlError2 = curl_error($ch);
            curl_close($ch);

            \Log::info('SIAF Directo PASO 2 - Resultado', [
                'http_code' => $httpCode2,
                'curl_errno' => $curlErrno2,
                'curl_error' => $curlError2,
                'image_size_bytes' => strlen($imageData ?? ''),
                'has_image' => !empty($imageData),
            ]);

            if ($curlErrno2 !== 0 || $httpCode2 !== 200 || !$imageData) {
                $errorMsg = $curlError2 ?: "HTTP $httpCode2 or empty image";
                \Log::error('SIAF Directo PASO 2 FALLÓ', [
                    'errno' => $curlErrno2,
                    'http_code' => $httpCode2,
                    'error' => $errorMsg,
                    'image_empty' => empty($imageData),
                ]);
                return ['success' => false, 'message' => "Captcha image failed: $errorMsg"];
            }

            // Marcar que usamos conexión directa (no proxy)
            Session::forget('siaf_proxy_session');
            Session::forget('siaf_proxy_key');

            \Log::info('SIAF Directo ✓ ÉXITO - CAPTCHA obtenido via conexión directa');
            
            return [
                'success' => true,
                'captcha' => 'data:image/jpg;base64,' . base64_encode($imageData),
                'source' => 'siaf_direct',
            ];
        } catch (\Exception $e) {
            \Log::error('SIAF Directo Exception', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Genera un CAPTCHA local como fallback
     */
    private function obtenerCaptchaLocal(string $razon): array
    {
        \Log::info("SIAF CAPTCHA Fallback local. Razón: $razon");

        $codigo = $this->generarCodigoAleatorio(6);
        Session::put('captcha_local', $codigo);
        Session::put('captcha_timestamp', time());

        $imagenPng = $this->crearImagenCaptcha($codigo);

        return [
            'success' => true,
            'captcha' => 'data:image/png;base64,' . base64_encode($imagenPng),
            'source' => 'local_fallback',
            'message' => $razon,
        ];
    }

    // ================================================================
    // VALIDACIÓN DE CAPTCHA
    // ================================================================

    /**
     * Valida el CAPTCHA (local o SIAF)
     */
    public function validarCaptcha(string $inputCaptcha): bool
    {
        // Si hay CAPTCHA local en sesión, validar contra eso
        if (Session::has('captcha_local')) {
            $codigoLocal = Session::get('captcha_local');
            $timestamp = Session::get('captcha_timestamp', 0);

            if (time() - $timestamp > 300) {
                \Log::warning('SIAF - CAPTCHA local expirado');
                Session::forget(['captcha_local', 'captcha_timestamp']);
                return false;
            }

            $input = trim(strtoupper($inputCaptcha));
            $codigo = trim(strtoupper($codigoLocal));

            if ($input === $codigo) {
                \Log::info('SIAF - CAPTCHA local validado OK');
                Session::forget(['captcha_local', 'captcha_timestamp']);
                return true;
            }

            \Log::warning('SIAF - CAPTCHA local inválido', ['input' => $input, 'expected' => $codigo]);
            return false;
        }

        // CAPTCHA de SIAF (proxy o directo) - se valida en el POST a SIAF
        return !empty($inputCaptcha) && strlen($inputCaptcha) >= 4;
    }

    // ================================================================
    // CONSULTA DE EXPEDIENTE SIAF
    // ================================================================

    /**
     * Consulta el SIAF para obtener datos de un expediente
     * Estrategia: Directo → Proxy → Error
     * (Directo primero porque funciona en VPS/Dokploy sin restricciones)
     */
    public function consultarExpediente(
        string $anoEje,
        string $secEjec,
        string $expediente,
        string $codigoSiaf,
        string $captcha = ''
    ): array {
        $proxyUrl = $this->getProxyUrl();
        $proxySession = Session::get('siaf_proxy_session');

        // Si por alguna razón la sesión no está en el driver (drivers inestables), intentar rehidratar desde cache
        if (empty($proxySession) && Session::has('siaf_proxy_key')) {
            $key = Session::get('siaf_proxy_key');
            $cached = Cache::get($key);
            if (!empty($cached)) {
                $proxySession = $cached;
                Session::put('siaf_proxy_session', $proxySession);
                \Log::info('SIAF Consulta - Rehidratada proxy_session desde cache', ['cache_key' => $key]);
            }
        }

        // ESTRATEGIA: Intenta directo primero (para VPS/Dokploy)
        \Log::info('SIAF Consulta - Intentando conexión DIRECTA a SIAF (prioritario en VPS)');
        $direct = $this->consultarDirecto($anoEje, $secEjec, $expediente, $codigoSiaf, $captcha);
        if ($direct['success']) {
            \Log::info('SIAF Consulta - ✓ Conexión directa exitosa');
            return $direct;
        }

        \Log::warning('SIAF Consulta - Conexión directa falló, intentando fallback');

        // Si directo falló y hay proxy con sesión, intentar proxy como fallback
        if ($proxyUrl && $proxySession) {
            \Log::info('SIAF Consulta - Intentando PROXY como fallback (requiere sesión del CAPTCHA)');
            $resultado = $this->consultarViaProxy($proxyUrl, $proxySession, $anoEje, $secEjec, $expediente, $codigoSiaf, $captcha);
            if ($resultado['success']) {
                \Log::info('SIAF Consulta - ✓ Proxy exitoso');
                return $resultado;
            }
            \Log::warning('SIAF Consulta - Proxy también falló: ' . ($resultado['message'] ?? ''));
            return [
                'success' => false,
                'message' => 'Error al consultar SIAF: directo falló y proxy también. ' . ($resultado['message'] ?? 'Error desconocido'),
            ];
        }

        // Si hay proxy pero sin sesión del CAPTCHA
        if ($proxyUrl && !$proxySession) {
            \Log::warning('SIAF Consulta - Proxy disponible pero sin sesión de CAPTCHA');
            return [
                'success' => false,
                'message' => 'Sesión de SIAF expirada. Recarga el CAPTCHA e intenta de nuevo.',
            ];
        }

        // Sin proxy configurado
        \Log::warning('SIAF Consulta - Conexión directa falló y sin proxy configurado');
        return [
            'success' => false,
            'message' => 'No se pudo conectar al servidor SIAF. En Dokploy, verifica que la VPS pueda acceder a apps2.mef.gob.pe.',
        ];
    }

    /**
     * Consulta expediente via el Cloudflare Worker proxy
     */
    private function consultarViaProxy(
        string $proxyUrl,
        string $session,
        string $anoEje,
        string $secEjec,
        string $expediente,
        string $codigoSiaf,
        string $captcha
    ): array {
        try {

            $started = microtime(true);
            $response = Http::withOptions([
                'verify' => false,
                'timeout' => 60,
                'connect_timeout' => 20,
            ])->withHeaders([
                'X-Proxy-Secret' => $this->getProxySecret(),
                'Accept' => 'application/json',
            ])->post($proxyUrl . '/consultar', [
                'session' => $session,
                'anoEje' => $anoEje,
                'secEjec' => $secEjec,
                'expediente' => $expediente,
                'j_captcha' => $captcha,
            ]);

            $duration = round((microtime(true) - $started) * 1000);
            \Log::info('SIAF Proxy CONSULTA Response', [
                'url' => $proxyUrl . '/consultar',
                'duration_ms' => $duration,
                'status' => $response->status(),
                'body_length' => strlen($response->body()),
                'body_preview' => substr($response->body(), 0, 200),
            ]);

            $data = $response->json();

            if (!$response->successful() || !($data['success'] ?? false)) {
                return [
                    'success' => false,
                    'message' => 'Proxy consulta failed: ' . ($data['message'] ?? 'Error'),
                ];
            }

            // Parsear el HTML retornado por el proxy
            $html = $data['html'] ?? '';
            if (empty($html)) {
                return ['success' => false, 'message' => 'Proxy retornó HTML vacío'];
            }

            return $this->parsearRespuestaSiaf($html, $codigoSiaf, $anoEje, $secEjec, $expediente);

        } catch (\Exception $e) {
            \Log::error('SIAF Proxy Consulta Exception: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Proxy exception: ' . $e->getMessage()];
        }
    }

    /**
     * Consulta expediente via conexión directa
     */
    private function consultarDirecto(
        string $anoEje,
        string $secEjec,
        string $expediente,
        string $codigoSiaf,
        string $captcha
    ): array {
        $params = [
            'anoEje' => $anoEje,
            'secEjec' => $secEjec,
            'expediente' => $expediente,
        ];
        if (!empty($captcha)) {
            $params['j_captcha'] = $captcha;
        }

        // Intentar con cURL
        $htmlResponse = $this->intentarConexionCurl(
            self::SIAF_BASE_URL . 'actionConsultaExpediente.jspx',
            $params
        );

        if ($htmlResponse) {
            $resultado = $this->parsearRespuestaSiaf($htmlResponse, $codigoSiaf, $anoEje, $secEjec, $expediente);
            if ($resultado['success']) {
                return $resultado;
            }
        }

        // Intentar con Guzzle
        $htmlResponse = $this->intentarConexionGuzzle(
            self::SIAF_BASE_URL . 'actionConsultaExpediente.jspx',
            $params
        );

        if ($htmlResponse) {
            $resultado = $this->parsearRespuestaSiaf($htmlResponse, $codigoSiaf, $anoEje, $secEjec, $expediente);
            if ($resultado['success']) {
                return $resultado;
            }
        }

        return ['success' => false, 'message' => 'Conexión directa falló'];
    }

    /**
     * Parsea la respuesta HTML del SIAF y retorna datos estructurados
     */
    private function parsearRespuestaSiaf(
        string $html,
        string $codigoSiaf,
        string $anoEje,
        string $secEjec,
        string $expediente
    ): array {
        $tabla = $this->extraerTablaSiaf($html);
        if (!$tabla) {
            return ['success' => false, 'message' => 'No se encontró tabla de expediente en la respuesta'];
        }

        $datos = $this->parsearTablaSiaf($tabla);
        $mejorRegistro = $this->obtenerMejorRegistroSiaf($datos);

        $infoSiaf = [];
        if ($mejorRegistro) {
            $infoSiaf = [
                'fase' => $mejorRegistro['fase'] ?? null,
                'estado' => $mejorRegistro['estado'] ?? null,
                'fechaProceso' => $this->extraerSoloFecha($mejorRegistro['fechaHora'] ?? null),
            ];
        }

        \Log::info('SIAF Consulta Success', [
            'registros' => count($datos),
            'info_siaf' => $infoSiaf,
        ]);

        return [
            'success' => true,
            'data' => [
                'codigo_siaf' => $codigoSiaf,
                'datos' => $datos,
                'tabla_html' => $tabla,
                'info_siaf' => $infoSiaf,
                'anoEje' => $anoEje,
                'secEjec' => $secEjec,
                'expediente' => $expediente,
            ],
            'message' => 'Datos obtenidos correctamente del SIAF',
        ];
    }

    // ================================================================
    // MÉTODOS DE CONEXIÓN (cURL y Guzzle)
    // ================================================================

    private function intentarConexionCurl(string $url, array $params): ?string
    {
        try {
            if (!function_exists('curl_init')) {
                return null;
            }

            $cookieFile = $this->getPersistentCookieFile();
            $ch = curl_init();

            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_POST => 1,
                CURLOPT_POSTFIELDS => http_build_query($params),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 15,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 5,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_COOKIEFILE => $cookieFile,
                CURLOPT_COOKIEJAR => $cookieFile,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Content-Type: application/x-www-form-urlencoded',
                    'Referer: ' . self::SIAF_BASE_URL . 'consultaExpediente.jspx',
                ],
            ]);

            $response = curl_exec($ch);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error || !$response) {
                \Log::warning('SIAF cURL Error', ['error' => $error]);
                return null;
            }

            return $response;
        } catch (\Exception $e) {
            \Log::warning('SIAF cURL Exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function intentarConexionGuzzle(string $url, array $params): ?string
    {
        try {
            $response = Http::withOptions([
                'verify' => false,
                'timeout' => 15,
                'connect_timeout' => 10,
            ])->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                'Accept' => 'text/html',
            ])->asForm()->post($url, $params);

            if ($response->successful()) {
                return $response->body();
            }
            return null;
        } catch (\Exception $e) {
            \Log::warning('SIAF Guzzle Exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ================================================================
    // PARSEO DE HTML SIAF
    // ================================================================

    private function extraerTablaSiaf(string $html): ?string
    {
        if (preg_match('/<table[^>]*id=["\']expedienteDetalles["\'][^>]*>.*?<\/table>/is', $html, $matches)) {
            return $matches[0];
        }
        return null;
    }

    private function parsearTablaSiaf(string $tablaHtml): array
    {
        $datos = [];
        if (preg_match_all('/<tr[^>]*>.*?<\/tr>/is', $tablaHtml, $filasMatches)) {
            foreach ($filasMatches[0] as $fila) {
                if (stripos($fila, '<th') !== false) continue;

                $celdas = [];
                if (preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $fila, $celdasMatches)) {
                    foreach ($celdasMatches[1] as $celda) {
                        $celdas[] = trim(html_entity_decode(strip_tags($celda), ENT_QUOTES, 'UTF-8'));
                    }
                }

                if (count($celdas) >= 12) {
                    $datos[] = [
                        'ciclo' => $celdas[0] ?? '',
                        'fase' => $celdas[1] ?? '',
                        'secuencia' => $celdas[2] ?? '',
                        'correlativo' => $celdas[3] ?? '',
                        'codDoc' => $celdas[4] ?? '',
                        'numDoc' => $celdas[5] ?? '',
                        'fecha' => $celdas[6] ?? '',
                        'ff' => $celdas[7] ?? '',
                        'moneda' => $celdas[8] ?? '',
                        'monto' => $celdas[9] ?? '',
                        'estado' => $celdas[10] ?? '',
                        'fechaHora' => $celdas[11] ?? '',
                        'idTrx' => $celdas[12] ?? '',
                    ];
                }
            }
        }
        return $datos;
    }

    private function obtenerMejorRegistroSiaf(array $registros): ?array
    {
        if (empty($registros)) return null;

        $ultimoRegistro = $registros[count($registros) - 1];

        foreach ($ultimoRegistro as $campo => $valor) {
            if (empty($valor)) {
                for ($i = count($registros) - 2; $i >= 0; $i--) {
                    if (!empty($registros[$i][$campo]) &&
                        $registros[$i]['ciclo'] === $ultimoRegistro['ciclo'] &&
                        $registros[$i]['fase'] === $ultimoRegistro['fase']) {
                        $ultimoRegistro[$campo] = $registros[$i][$campo];
                        break;
                    }
                }
                if (empty($ultimoRegistro[$campo])) {
                    for ($i = count($registros) - 2; $i >= 0; $i--) {
                        if (!empty($registros[$i][$campo])) {
                            $ultimoRegistro[$campo] = $registros[$i][$campo];
                            break;
                        }
                    }
                }
            }
        }

        return $ultimoRegistro;
    }

    // ================================================================
    // UTILIDADES
    // ================================================================

    private function generarCodigoAleatorio(int $longitud): string
    {
        $caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $codigo = '';
        for ($i = 0; $i < $longitud; $i++) {
            $codigo .= $caracteres[rand(0, strlen($caracteres) - 1)];
        }
        return $codigo;
    }

    private function crearImagenCaptcha(string $codigo): string
    {
        $imagen = imagecreatetruecolor(200, 60);
        $colorFondo = imagecolorallocate($imagen, 255, 255, 255);
        $colorTexto = imagecolorallocate($imagen, 50, 50, 50);
        $colorLineas = imagecolorallocate($imagen, 200, 200, 200);

        imagefilledrectangle($imagen, 0, 0, 200, 60, $colorFondo);

        for ($i = 0; $i < 5; $i++) {
            imageline($imagen, rand(0, 200), rand(0, 60), rand(0, 200), rand(0, 60), $colorLineas);
        }

        $x = 10;
        $y = 25;
        foreach (str_split($codigo) as $char) {
            imagestring($imagen, 5, $x, $y + rand(-5, 5), $char, $colorTexto);
            $x += 30;
        }

        ob_start();
        imagepng($imagen);
        $contenido = ob_get_clean();
        imagedestroy($imagen);

        return $contenido;
    }

    private function extraerSoloFecha(?string $fechaHora): ?string
    {
        if (empty($fechaHora)) return null;

        if (strpos($fechaHora, ' ') !== false) {
            $fechaHora = explode(' ', $fechaHora)[0];
        }

        if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $fechaHora, $m)) {
            return $m[3] . '-' . $m[2] . '-' . $m[1];
        }

        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $fechaHora)) {
            return $fechaHora;
        }

        return null;
    }
}
