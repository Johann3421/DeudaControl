<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WhatsappInstance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsappConnectionController extends Controller
{
    /**
     * Muestra la vista de conexión para los vendedores.
     */
    public function index()
    {
        return view('whatsapp.conectar');
    }

    /**
     * Solicita el código de vinculación (Pairing Code) a la Evolution API.
     */
    public function requestPairingCode(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|min:8|max:20',
        ]);

        // Limpiar el número de teléfono (solo dígitos)
        $phone = preg_replace('/\D/', '', $request->phone);

        // Generar nombre único para la instancia
        $instanceName = 'vendedor_' . $phone;

        $apiUrl = rtrim(config('services.evolution.url'), '/');
        $apiKey = config('services.evolution.apikey');

        try {
            // 1. Intentar crear la instancia en Evolution API
            // (Si ya existe, la API suele retornar un error que podemos ignorar temporalmente)
            $createResponse = Http::withHeaders([
                'apikey' => $apiKey,
                'Content-Type' => 'application/json'
            ])->post("{$apiUrl}/instance/create", [
                'instanceName' => $instanceName,
                'qrcode' => false,
                'integration' => 'WHATSAPP-BAILEYS'
            ]);

            Log::info("Evolution API Create Instance Response for {$instanceName}: " . $createResponse->body());

            // 2. Solicitar el pairing code (Mediante petición GET con el parámetro query "number")
            $connectResponse = Http::withHeaders([
                'apikey' => $apiKey,
            ])->get("{$apiUrl}/instance/connect/{$instanceName}?number={$phone}");


            Log::info("Evolution API Connect Response for {$instanceName}: " . $connectResponse->body());

            if (!$connectResponse->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo conectar con la Evolution API: ' . $connectResponse->json('message', 'Error desconocido')
                ], 500);
            }

            $data = $connectResponse->json();
            
            // Extraer el código de vinculación (de 8 caracteres) de forma prioritaria
            $code = $data['pairingCode'] ?? $data['qrcode']['pairingCode'] ?? null;

            // Si no se encuentra, usar 'code' solo si tiene el formato de un pairing code (corto)
            if (!$code && isset($data['code']) && strlen($data['code']) < 12) {
                $code = $data['code'];
            }


            if (!$code) {
                return response()->json([
                    'success' => false,
                    'message' => 'La API no devolvió un código de vinculación. Respuesta: ' . json_encode($data)
                ], 500);
            }

            // Guardar o actualizar registro en base de datos
            WhatsappInstance::updateOrCreate(
                ['instance_name' => $instanceName],
                [
                    'name' => $request->name,
                    'phone' => $phone,
                    'status' => 'pairing',
                    'pairing_code' => $code
                ]
            );

            return response()->json([
                'success' => true,
                'code' => $code,
                'instance' => $instanceName
            ]);

        } catch (\Exception $e) {
            Log::error("Error solicitando Pairing Code para {$instanceName}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error en el servidor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Webhook que recibe eventos de Evolution API.
     * Actualiza el estado de las instancias a "connected" o "disconnected".
     */
    public function webhook(Request $request)
    {
        $event = $request->input('event');
        $instanceName = $request->input('instance');
        $state = $request->input('data.state');

        Log::info("Recibido webhook de Evolution API. Evento: {$event}, Instancia: {$instanceName}, Estado: {$state}");

        if ($event === 'connection.update') {
            $status = 'disconnected';
            if ($state === 'open') {
                $status = 'connected';
            } elseif ($state === 'connecting') {
                $status = 'pairing';
            }

            $instance = WhatsappInstance::where('instance_name', $instanceName)->first();
            if ($instance) {
                $instance->update(['status' => $status]);
                Log::info("Instancia {$instanceName} actualizada a estado: {$status}");
            }
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Obtiene el listado de instancias activas (conectadas) para uso en n8n.
     */
    public function getActiveInstances(Request $request)
    {
        // Simple token auth para proteger la lista
        $token = $request->header('X-Alertas-Token') ?: $request->query('token');
        $expected = config('services.alertas.token');

        if (!$expected || !hash_equals($expected, $token ?? '')) {
            return response()->json([
                'error' => 'Unauthorized',
            ], 401);
        }

        $instances = WhatsappInstance::where('status', 'connected')
            ->get(['id', 'name', 'phone', 'instance_name', 'status', 'updated_at']);

        return response()->json($instances);
    }
}
