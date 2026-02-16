<?php

namespace App\Http\Controllers;

use App\Services\SiafService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiafController extends Controller
{
    public function __construct(
        private SiafService $siafService
    ) {}

    /**
     * Obtiene la imagen CAPTCHA real del SIAF
     */
    public function generarCaptcha(): JsonResponse
    {
        try {
            $resultado = $this->siafService->obtenerCaptchaSiaf();
            return response()->json($resultado);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener CAPTCHA: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Consulta el servicio SIAF
     */
    public function consultar(Request $request): JsonResponse
    {
        try {
            // Log la solicitud
            \Log::info('SIAF Consultar Request', [
                'user_id' => auth()->id(),
                'timestamp' => now(),
            ]);

            // Validar entrada
            $validated = $request->validate([
                'anoEje' => ['required', 'numeric', 'digits:4'],
                'secEjec' => ['required', 'string', 'max:6'],
                'expediente' => ['required', 'string', 'max:10'],
                'j_captcha' => ['required', 'string', 'max:5'],
                'codigo_siaf' => ['required', 'string', 'max:50'],
            ], [
                'anoEje.required' => 'El año es obligatorio',
                'secEjec.required' => 'El código de unidad ejecutora es obligatorio',
                'expediente.required' => 'El número de expediente es obligatorio',
                'j_captcha.required' => 'El CAPTCHA es obligatorio',
                'codigo_siaf.required' => 'El código SIAF es obligatorio',
            ]);

            // Validar CAPTCHA
            if (!$this->siafService->validarCaptcha($validated['j_captcha'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'El código de la imagen es incorrecto. Intenta de nuevo.',
                ], 422);
            }

            // Consultar SIAF CON el CAPTCHA resuelto
            $resultado = $this->siafService->consultarExpediente(
                $validated['anoEje'],
                $validated['secEjec'],
                $validated['expediente'],
                $validated['codigo_siaf'],
                $validated['j_captcha']  // ← PASAR EL CAPTCHA AQUÍ
            );

            if ($resultado['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $resultado['data'],
                    'message' => $resultado['message'] ?? 'Consulta realizada exitosamente',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $resultado['message'] ?? 'No se encontraron datos',
            ], 404);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('SIAF Validation Error', [
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('SIAF Consultar Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al consultar SIAF: ' . $e->getMessage(),
            ], 500);
        }
    }
}
