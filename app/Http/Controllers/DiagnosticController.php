<?php

namespace App\Http\Controllers;

use App\Services\SiafService;
use Illuminate\Support\Facades\Auth;
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

        // 3. Verificar funciones cURL
        if (extension_loaded('curl')) {
            $diagnostics['curl_info'] = [
                'version' => curl_version()['version'] ?? 'Unknown',
                'ssl_version' => curl_version()['ssl_version'] ?? 'Unknown',
            ];

            // Verificar que cURL puede hacer conexiones HTTPS
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

        // 4. Intentar obtener CAPTCHA del SIAF
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
                'trace' => $e->getTraceAsString(),
            ];
        }

        // 5. Información del servidor
        $diagnostics['servidor'] = [
            'php_version' => phpversion(),
            'laravel_version' => app()->version(),
            'sistema_operativo' => php_uname(),
            'directorio_base' => base_path(),
        ];

        // 6. Configuración de logs
        $diagnostics['logs'] = [
            'canal_por_defecto' => config('logging.default'),
            'nivel' => config('logging.channels.stack.level') ?? 'N/A',
            'archivo_log' => storage_path('logs/laravel.log'),
            'log_existe' => file_exists(storage_path('logs/laravel.log')),
        ];

        // 7. Últimas líneas del log
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
}
