<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class MaintenancePanelController extends Controller
{
    /**
     * Solo superadmin puede acceder
     */
    private function authorize(): void
    {
        if (Auth::user()->rol !== 'superadmin') {
            abort(403, 'Acceso restringido a superadmins');
        }
    }

    /**
     * Vista principal del panel de mantenimiento
     */
    public function index()
    {
        $this->authorize();

        $siafProxyUrl = config('services.siaf.proxy_url');
        $siafProxySecret = config('services.siaf.proxy_secret');

        return Inertia::render('Admin/Maintenance', [
            'systemInfo' => [
                'app_name' => config('app.name'),
                'app_env' => config('app.env'),
                'app_debug' => config('app.debug'),
                'app_url' => config('app.url'),
                'php_version' => phpversion(),
                'laravel_version' => app()->version(),
                'config_cached' => app()->configurationIsCached(),
                'routes_cached' => app()->routesAreCached(),
                'session_driver' => config('session.driver'),
                'cache_driver' => config('cache.default'),
                'siaf_proxy_url' => $siafProxyUrl ?: '(no configurado)',
                'siaf_proxy_secret_set' => !empty($siafProxySecret),
                'storage_writable' => is_writable(storage_path()),
                'siaf_dir_writable' => is_dir(storage_path('app/siaf')) && is_writable(storage_path('app/siaf')),
                'extensions' => [
                    'curl' => extension_loaded('curl'),
                    'gd' => extension_loaded('gd'),
                    'openssl' => extension_loaded('openssl'),
                    'mbstring' => extension_loaded('mbstring'),
                ],
            ],
        ]);
    }

    /**
     * Ejecutar limpieza completa de caché
     */
    public function clearAll(): JsonResponse
    {
        $this->authorize();

        try {
            $results = [];

            // 1. Limpiar todo
            Artisan::call('optimize:clear');
            $results[] = ['action' => 'optimize:clear', 'success' => true, 'message' => 'Cache, config, rutas, vistas y eventos limpiados'];

            // 2. Recachear configuración (LEE .env fresco)
            Artisan::call('config:cache');
            $results[] = ['action' => 'config:cache', 'success' => true, 'message' => 'Configuración recacheada desde .env'];

            // 3. Recachear rutas
            try {
                Artisan::call('route:cache');
                $results[] = ['action' => 'route:cache', 'success' => true, 'message' => 'Rutas recacheadas'];
            } catch (\Exception $e) {
                $results[] = ['action' => 'route:cache', 'success' => false, 'message' => $e->getMessage()];
            }

            // Verificar config SIAF después del recache
            $siafUrl = config('services.siaf.proxy_url');

            \Log::info('Maintenance: clearAll ejecutado', ['siaf_proxy_url' => $siafUrl]);

            return response()->json([
                'success' => true,
                'message' => 'Limpieza y recache completado',
                'results' => $results,
                'siaf_config_after' => [
                    'proxy_url' => $siafUrl ?: '(vacío)',
                    'config_cached' => app()->configurationIsCached(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Solo limpiar cache de aplicación
     */
    public function clearCache(): JsonResponse
    {
        $this->authorize();

        try {
            Artisan::call('cache:clear');
            return response()->json(['success' => true, 'message' => 'Cache de aplicación limpiado']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Limpiar y recachear configuración
     */
    public function clearConfig(): JsonResponse
    {
        $this->authorize();

        try {
            Artisan::call('config:clear');
            Artisan::call('config:cache');
            return response()->json([
                'success' => true,
                'message' => 'Configuración limpiada y recacheada desde .env actual',
                'siaf_proxy_url' => config('services.siaf.proxy_url') ?: '(vacío)',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Limpiar vistas compiladas
     */
    public function clearViews(): JsonResponse
    {
        $this->authorize();

        try {
            Artisan::call('view:clear');
            return response()->json(['success' => true, 'message' => 'Vistas compiladas limpiadas']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Probar conectividad con el proxy SIAF
     */
    public function testSiafProxy(): JsonResponse
    {
        $this->authorize();

        $proxyUrl = config('services.siaf.proxy_url');
        $proxySecret = config('services.siaf.proxy_secret');

        $results = [
            'config' => [
                'proxy_url' => $proxyUrl ?: '(no configurado)',
                'proxy_secret_set' => !empty($proxySecret),
                'proxy_secret_length' => strlen($proxySecret ?? ''),
                'config_cached' => app()->configurationIsCached(),
            ],
        ];

        if (empty($proxyUrl)) {
            return response()->json([
                'success' => false,
                'message' => 'SIAF_PROXY_URL no está configurado. Agrégalo en el .env y luego haz "Limpiar Todo".',
                'results' => $results,
            ]);
        }

        $proxyUrl = rtrim($proxyUrl, '/');

        // Test 1: Health
        try {
            $health = Http::withOptions(['verify' => false, 'timeout' => 10])
                ->withHeaders(['X-Proxy-Secret' => $proxySecret])
                ->get($proxyUrl . '/health');

            $results['health'] = [
                'success' => $health->successful(),
                'status' => $health->status(),
                'body' => $health->json(),
            ];
        } catch (\Exception $e) {
            $results['health'] = ['success' => false, 'error' => $e->getMessage()];
        }

        // Test 2: Captcha
        try {
            $captcha = Http::withOptions(['verify' => false, 'timeout' => 20])
                ->withHeaders(['X-Proxy-Secret' => $proxySecret, 'Accept' => 'application/json'])
                ->get($proxyUrl . '/captcha');

            $captchaData = $captcha->json();
            $results['captcha'] = [
                'success' => $captchaData['success'] ?? false,
                'status' => $captcha->status(),
                'has_image' => !empty($captchaData['captcha']),
                'has_session' => !empty($captchaData['session']),
                'source' => $captchaData['source'] ?? 'unknown',
                'message' => $captchaData['message'] ?? null,
            ];
        } catch (\Exception $e) {
            $results['captcha'] = ['success' => false, 'error' => $e->getMessage()];
        }

        $allOk = ($results['health']['success'] ?? false) && ($results['captcha']['success'] ?? false);

        return response()->json([
            'success' => $allOk,
            'message' => $allOk
                ? 'Proxy SIAF funcionando correctamente. Health OK, CAPTCHA OK.'
                : 'Hay problemas con el proxy. Revisa los detalles.',
            'results' => $results,
        ]);
    }

    /**
     * Ver últimas líneas del log de Laravel
     */
    public function viewLogs(): JsonResponse
    {
        $this->authorize();

        $logFile = storage_path('logs/laravel.log');

        if (!file_exists($logFile)) {
            return response()->json([
                'success' => true,
                'lines' => [],
                'message' => 'No hay archivo de log',
            ]);
        }

        // Leer últimas 100 líneas
        $lines = [];
        $fp = fopen($logFile, 'r');
        if ($fp) {
            $allLines = [];
            while (($line = fgets($fp)) !== false) {
                $allLines[] = $line;
                if (count($allLines) > 150) {
                    array_shift($allLines);
                }
            }
            fclose($fp);
            $lines = array_slice($allLines, -100);
        }

        // Filtrar solo entradas SIAF si hay muchas
        $siafLines = array_filter($lines, fn($l) => stripos($l, 'siaf') !== false || stripos($l, 'captcha') !== false || stripos($l, 'proxy') !== false);

        return response()->json([
            'success' => true,
            'total_lines' => count($lines),
            'lines' => array_values(array_map('trim', $lines)),
            'siaf_lines' => array_values(array_map('trim', $siafLines)),
            'file_size' => filesize($logFile),
        ]);
    }

    /**
     * Limpiar archivo de log
     */
    public function clearLogs(): JsonResponse
    {
        $this->authorize();

        $logFile = storage_path('logs/laravel.log');

        if (file_exists($logFile)) {
            file_put_contents($logFile, '');
        }

        return response()->json(['success' => true, 'message' => 'Logs limpiados']);
    }
}
