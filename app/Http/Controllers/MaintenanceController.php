<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;

class MaintenanceController extends Controller
{
    /**
     * Token para autorizar operaciones de mantenimiento
     */
    private const MAINTENANCE_TOKEN = 'cleanup_2026_02_16_securekey';

    /**
     * Panel de mantenimiento - limpiar caché y rutas
     */
    public function cleanup(Request $request)
    {
        $token = $request->query('token');

        if (!$token || $token !== self::MAINTENANCE_TOKEN) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o no proporcionado',
            ], 401);
        }

        try {
            $results = [];

            // 1. Limpiar TODO primero
            Artisan::call('optimize:clear');
            $results['optimize_clear'] = ['success' => true, 'message' => 'Optimización limpiada (config, routes, views, events, cache)'];

            // 2. Recachear configuración (CRÍTICO en producción: lee .env y lo compila)
            Artisan::call('config:cache');
            $results['config_cache'] = ['success' => true, 'message' => 'Configuración recacheada desde .env actual'];

            // 3. Recachear rutas
            Artisan::call('route:cache');
            $results['route_cache'] = ['success' => true, 'message' => 'Rutas recacheadas'];

            // 4. Verificar que SIAF proxy está ahora configurado correctamente
            $siafProxyUrl = config('services.siaf.proxy_url');
            $siafProxySecret = config('services.siaf.proxy_secret');
            $results['siaf_config'] = [
                'proxy_url' => $siafProxyUrl ? substr($siafProxyUrl, 0, 40) . '...' : '(vacío - PROBLEMA!)',
                'proxy_secret' => $siafProxySecret ? 'Configurado (' . strlen($siafProxySecret) . ' chars)' : '(vacío - PROBLEMA!)',
                'config_cached' => app()->configurationIsCached(),
            ];

            \Log::info('Maintenance Cleanup Executed', ['results' => $results]);

            return response()->json([
                'success' => true,
                'message' => 'Mantenimiento completado exitosamente',
                'operations' => $results,
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'next_step' => 'Recarga la página de tu aplicación',
            ]);

        } catch (\Exception $e) {
            \Log::error('Maintenance Cleanup Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error durante el mantenimiento',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ver estado actual del sistema + diagnóstico de SIAF
     */
    public function status(Request $request)
    {
        $token = $request->query('token');

        if (!$token || $token !== self::MAINTENANCE_TOKEN) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido',
            ], 401);
        }

        $siafProxyUrl = config('services.siaf.proxy_url');
        $siafProxySecret = config('services.siaf.proxy_secret');

        return response()->json([
            'app' => [
                'name' => config('app.name'),
                'environment' => config('app.env'),
                'debug' => config('app.debug'),
                'url' => config('app.url'),
                'timezone' => config('app.timezone'),
            ],
            'php' => [
                'version' => phpversion(),
                'laravel_version' => app()->version(),
                'config_cached' => app()->configurationIsCached(),
                'routes_cached' => app()->routesAreCached(),
                'extensions' => [
                    'curl' => extension_loaded('curl'),
                    'gd' => extension_loaded('gd'),
                    'openssl' => extension_loaded('openssl'),
                ],
            ],
            'siaf' => [
                'proxy_url' => $siafProxyUrl ?: '(NO CONFIGURADO)',
                'proxy_secret_set' => !empty($siafProxySecret),
                'proxy_secret_length' => strlen($siafProxySecret ?? ''),
            ],
            'session' => [
                'driver' => config('session.driver'),
                'lifetime' => config('session.lifetime'),
            ],
            'storage' => [
                'siaf_dir_exists' => is_dir(storage_path('app/siaf')),
                'siaf_dir_writable' => is_writable(storage_path('app/siaf')),
                'logs_writable' => is_writable(storage_path('logs')),
            ],
        ]);
    }

    /**
     * Test directo del proxy SIAF desde producción
     */
    public function testSiafProxy(Request $request)
    {
        $token = $request->query('token');

        if (!$token || $token !== self::MAINTENANCE_TOKEN) {
            return response()->json(['success' => false, 'message' => 'Token inválido'], 401);
        }

        $proxyUrl = config('services.siaf.proxy_url');
        $proxySecret = config('services.siaf.proxy_secret');

        $results = [
            'config' => [
                'proxy_url' => $proxyUrl ?: '(vacío)',
                'proxy_secret_set' => !empty($proxySecret),
                'config_cached' => app()->configurationIsCached(),
            ],
        ];

        if (empty($proxyUrl)) {
            $results['error'] = 'SIAF_PROXY_URL no está configurado en .env. Agréga SIAF_PROXY_URL y ejecuta /maintenance/cleanup?token=...';
            return response()->json($results);
        }

        $proxyUrl = rtrim($proxyUrl, '/');

        // Test 1: Health check del proxy
        try {
            $healthResponse = Http::withOptions([
                'verify' => false,
                'timeout' => 10,
            ])->withHeaders([
                'X-Proxy-Secret' => $proxySecret,
            ])->get($proxyUrl . '/health');

            $results['health'] = [
                'status' => $healthResponse->status(),
                'body' => $healthResponse->json(),
                'success' => $healthResponse->successful(),
            ];
        } catch (\Exception $e) {
            $results['health'] = [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }

        // Test 2: Captcha del proxy
        try {
            $captchaResponse = Http::withOptions([
                'verify' => false,
                'timeout' => 20,
            ])->withHeaders([
                'X-Proxy-Secret' => $proxySecret,
                'Accept' => 'application/json',
            ])->get($proxyUrl . '/captcha');

            $captchaData = $captchaResponse->json();
            $results['captcha'] = [
                'status' => $captchaResponse->status(),
                'success' => $captchaData['success'] ?? false,
                'has_image' => !empty($captchaData['captcha']),
                'has_session' => !empty($captchaData['session']),
                'source' => $captchaData['source'] ?? 'unknown',
                'message' => $captchaData['message'] ?? null,
            ];
        } catch (\Exception $e) {
            $results['captcha'] = [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }

        return response()->json($results);
    }
}
