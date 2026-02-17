<?php

namespace App\Http\Controllers;

use App\Services\SiafService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class DiagnosticController extends Controller
{
    public function siaf()
    {
        // Solo superadmins pueden ver diagnósticos
        if (Auth::user()->rol !== 'superadmin') {
            abort(403, 'Solo superadmins pueden ver diagnósticos');
        }

        $diagnostics = [];

        // 1. Verificar estructura de directorios
        $storageDir = storage_path('app');
        $siafDir = storage_path('app/siaf');
        $logsDir = storage_path('logs');

        $diagnostics['directorios'] = [
            'storage_app' => [
                'existe' => is_dir($storageDir),
                'escribible' => is_writable($storageDir),
                'path' => $storageDir,
            ],
            'siaf' => [
                'existe' => is_dir($siafDir),
                'escribible' => is_writable($siafDir),
                'path' => $siafDir,
                'crear_automaticamente' => !is_dir($siafDir),
            ],
            'logs' => [
                'existe' => is_dir($logsDir),
                'escribible' => is_writable($logsDir),
                'path' => $logsDir,
            ],
        ];

        // 2. Verificar extensiones PHP
        $diagnostics['extensiones_php'] = [
            'curl' => extension_loaded('curl'),
            'openssl' => extension_loaded('openssl'),
            'json' => extension_loaded('json'),
            'fileinfo' => extension_loaded('fileinfo'),
        ];

        // 3. Verificar información de cURL
        if (extension_loaded('curl')) {
            $diagnostics['curl_info'] = [
                'version' => curl_version()['version'] ?? 'Unknown',
                'ssl_version' => curl_version()['ssl_version'] ?? 'Unknown',
            ];

            // Verificar que cURL puede hacer conexiones HTTPS a Google
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => 'https://www.google.com',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_SSL_VERIFYPEER => false,
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            $diagnostics['curl_https'] = [
                'funcional' => $httpCode > 0 && !$curlError,
                'http_code' => $httpCode,
                'error' => $curlError ?: 'N/A',
            ];
        }

        // 4. DNS y Conectividad de Red a SIAF
        $siafDomain = 'apps2.mef.gob.pe';
        $diagnostics['dns_and_network'] = $this->checkDnsAndNetwork($siafDomain);

        // 5. Estrategias de Conexión a SIAF
        $diagnostics['connection_strategies'] = [
            'curl_direct' => $this->testSiafWithCurl(),
            'curl_alt' => $this->testSiafWithCurlAlt(),
            'guzzle' => $this->testSiafWithGuzzle(),
            'stream_context' => $this->testSiafWithStreamContext(),
        ];

        // 6. Intentar obtener CAPTCHA del SIAF
        try {
            $siafService = new SiafService();
            $captchaResult = $siafService->obtenerCaptchaSiaf();

            $diagnostics['captcha_siaf'] = [
                'success' => $captchaResult['success'],
                'message' => $captchaResult['message'] ?? 'OK',
                'imagen_size' => isset($captchaResult['captcha']) ? strlen($captchaResult['captcha']) : 0,
            ];

            // Verificar por el archivo de cookies
            $cookieFile = storage_path('app/siaf/siaf_session_cookies.txt');
            $diagnostics['captcha_siaf']['cookie_file'] = [
                'path' => $cookieFile,
                'existe' => file_exists($cookieFile),
                'size' => file_exists($cookieFile) ? filesize($cookieFile) : 0,
            ];
        } catch (\Exception $e) {
            $diagnostics['captcha_siaf'] = [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }

        // 7. Información del servidor
        $diagnostics['servidor'] = [
            'php_version' => phpversion(),
            'laravel_version' => app()->version(),
            'sistema_operativo' => php_uname(),
            'directorio_base' => base_path(),
        ];

        // 8. Configuración de logs
        $diagnostics['logs'] = [
            'canal_por_defecto' => config('logging.default'),
            'nivel' => config('logging.channels.stack.level') ?? 'N/A',
            'archivo_log' => storage_path('logs/laravel.log'),
            'log_existe' => file_exists(storage_path('logs/laravel.log')),
        ];

        // 9. Últimas líneas del log
        $logFile = storage_path('logs/laravel.log');
        $logLines = [];
        if (file_exists($logFile)) {
            $lines = array_reverse(file($logFile));
            $logLines = array_slice($lines, 0, 20);
        }

        return Inertia::render('Admin/DiagnosticSiaf', [
            'diagnostics' => $diagnostics,
            'logLines' => $logLines,
            'timestamp' => now()->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Verifica DNS y conectividad de red a SIAF
     */
    private function checkDnsAndNetwork(string $siafDomain): array
    {
        $results = [];

        // Test 1: DNS resolution
        $start = microtime(true);
        $ip = @gethostbyname($siafDomain);
        $dnsTime = round((microtime(true) - $start) * 1000, 2);

        if ($ip !== $siafDomain && $ip !== false) {
            $results['dns'] = [
                'status' => 'ok',
                'message' => "✓ DNS resuelto: $siafDomain → $ip",
                'ip' => $ip,
                'duration_ms' => $dnsTime,
            ];
        } else {
            $results['dns'] = [
                'status' => 'error',
                'message' => "✗ No se puede resolver DNS: $siafDomain",
                'ip' => null,
                'duration_ms' => $dnsTime,
            ];
            return $results;
        }

        // Test 2: TCP connection to port 443
        $start = microtime(true);
        $errno = 0;
        $errstr = '';
        $fp = @fsockopen($siafDomain, 443, $errno, $errstr, 5);
        $tcpTime = round((microtime(true) - $start) * 1000, 2);

        if ($fp) {
            fclose($fp);
            $results['tcp_443'] = [
                'status' => 'ok',
                'message' => "✓ Conexión TCP a puerto 443 exitosa",
                'duration_ms' => $tcpTime,
            ];
        } else {
            $results['tcp_443'] = [
                'status' => 'warning',
                'message' => "⚠️ No se puede conectar al puerto 443: ($errno) $errstr",
                'duration_ms' => $tcpTime,
                'error_code' => $errno,
                'error_message' => $errstr,
            ];
        }

        // Test 3: Simple HTTP HEAD request with short timeout
        try {
            $start = microtime(true);
            $response = Http::withOptions([
                'verify' => false,
                'timeout' => 5,
                'connect_timeout' => 5,
            ])->head("https://$siafDomain/");
            $httpTime = round((microtime(true) - $start) * 1000, 2);

            $results['http_head'] = [
                'status' => 'ok',
                'message' => "✓ HTTP HEAD exitoso (HTTP {$response->status()})",
                'http_code' => $response->status(),
                'duration_ms' => $httpTime,
            ];
        } catch (\Exception $e) {
            $results['http_head'] = [
                'status' => 'error',
                'message' => "✗ HTTP HEAD falló: " . $e->getMessage(),
                'duration_ms' => null,
            ];
        }

        return $results;
    }

    /**
     * Test cURL directo a SIAF
     */
    private function testSiafWithCurl(): array
    {
        $url = 'https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx';
        $start = microtime(true);
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HTTPHEADER => [
                'User-Agent: Mozilla/5.0',
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErrno = curl_errno($ch);
        $curlError = curl_error($ch);
        $duration = round((microtime(true) - $start) * 1000, 2);
        curl_close($ch);

        if ($curlError) {
            return [
                'status' => 'error',
                'message' => "✗ cURL error ($curlErrno): $curlError",
                'error_code' => $curlErrno,
                'error_message' => $curlError,
                'duration_ms' => $duration,
            ];
        }

        return [
            'status' => 'ok',
            'message' => "✓ cURL exitoso (HTTP $httpCode)",
            'http_code' => $httpCode,
            'duration_ms' => $duration,
        ];
    }

    /**
     * Test cURL con opciones alternativas (TCP keepalive, IPv4 force)
     */
    private function testSiafWithCurlAlt(): array
    {
        $url = 'https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx';
        $start = microtime(true);
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TCP_KEEPALIVE => 1,
            CURLOPT_TCP_KEEPIDLE => 60,
            CURLOPT_TCP_KEEPINTVL => 10,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErrno = curl_errno($ch);
        $curlError = curl_error($ch);
        $duration = round((microtime(true) - $start) * 1000, 2);
        curl_close($ch);

        if ($curlError) {
            return [
                'status' => 'error',
                'message' => "✗ cURL ALT error ($curlErrno): $curlError",
                'error_code' => $curlErrno,
                'duration_ms' => $duration,
            ];
        }

        return [
            'status' => 'ok',
            'message' => "✓ cURL ALT exitoso (HTTP $httpCode)",
            'http_code' => $httpCode,
            'duration_ms' => $duration,
        ];
    }

    /**
     * Test Guzzle HTTP
     */
    private function testSiafWithGuzzle(): array
    {
        try {
            $start = microtime(true);
            $response = Http::withOptions([
                'verify' => false,
                'timeout' => 10,
                'connect_timeout' => 10,
            ])->get('https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx');
            $duration = round((microtime(true) - $start) * 1000, 2);

            return [
                'status' => 'ok',
                'message' => "✓ Guzzle exitoso (HTTP {$response->status()})",
                'http_code' => $response->status(),
                'duration_ms' => $duration,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => "✗ Guzzle error: " . $e->getMessage(),
                'duration_ms' => null,
            ];
        }
    }

    /**
     * Test stream_context (alternativa)
     */
    private function testSiafWithStreamContext(): array
    {
        try {
            $start = microtime(true);
            $context = stream_context_create([
                'http' => [
                    'timeout' => 10,
                    'method' => 'GET',
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                ],
            ]);

            $response = @file_get_contents('https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx', false, $context);
            $duration = round((microtime(true) - $start) * 1000, 2);

            if ($response !== false) {
                return [
                    'status' => 'ok',
                    'message' => "✓ stream_context exitoso",
                    'duration_ms' => $duration,
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => "✗ stream_context retornó false",
                    'duration_ms' => $duration,
                ];
            }
        } catch (\Exception $e) {
            return [
                'status' => 'error',
                'message' => "✗ stream_context error: " . $e->getMessage(),
                'duration_ms' => null,
            ];
        }
    }
}
