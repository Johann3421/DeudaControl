<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class MaintenanceController extends Controller
{
    /**
     * Token para autorizar operaciones de mantenimiento
     * CAMBIAR ESTE TOKEN ANTES DE SUBIR A PRODUCCIÓN
     */
    private const MAINTENANCE_TOKEN = 'cleanup_2026_02_16_securekey';

    /**
     * Panel de mantenimiento - limpiar caché y rutas
     */
    public function cleanup(Request $request)
    {
        // Validar token
        $token = $request->query('token');

        if (!$token || $token !== self::MAINTENANCE_TOKEN) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o no proporcionado',
                'error' => 'Acceso denegado'
            ], 401);
        }

        try {
            $results = [];

            // 1. Limpiar rutas
            Artisan::call('route:clear');
            $results['route_clear'] = [
                'success' => true,
                'message' => 'Rutas cacheadas eliminadas'
            ];

            // 2. Limpiar configuración
            Artisan::call('config:clear');
            $results['config_clear'] = [
                'success' => true,
                'message' => 'Configuración cacheada eliminada'
            ];

            // 3. Limpiar caché general
            Artisan::call('cache:clear');
            $results['cache_clear'] = [
                'success' => true,
                'message' => 'Caché general eliminado'
            ];

            // 4. Limpiar vistas compiladas
            Artisan::call('view:clear');
            $results['view_clear'] = [
                'success' => true,
                'message' => 'Vistas compiladas eliminadas'
            ];

            // 5. Limpiar eventos cacheados (si existen)
            try {
                Artisan::call('event:clear');
                $results['event_clear'] = [
                    'success' => true,
                    'message' => 'Eventos cacheados eliminados'
                ];
            } catch (\Exception $e) {
                $results['event_clear'] = [
                    'success' => false,
                    'message' => 'No había eventos cacheados'
                ];
            }

            // Log del evento
            \Log::info('Maintenance Cleanup Executed Successfully', [
                'timestamp' => now(),
                'results' => $results
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Mantenimiento completado exitosamente',
                'operations' => $results,
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'next_step' => 'Recarga la página de tu aplicación'
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Maintenance Cleanup Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error durante el mantenimiento',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ver estado actual del sistema
     */
    public function status(Request $request)
    {
        $token = $request->query('token');

        if (!$token || $token !== self::MAINTENANCE_TOKEN) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido o no proporcionado'
            ], 401);
        }

        return response()->json([
            'app_name' => config('app.name'),
            'environment' => config('app.env'),
            'debug' => config('app.debug'),
            'timezone' => config('app.timezone'),
            'storage_path' => storage_path(),
            'bootstrap_path' => bootstrap_path('cache'),
            'php_version' => phpversion(),
            'laravel_version' => app()->version(),
        ], 200);
    }
}
