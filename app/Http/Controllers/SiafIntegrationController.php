<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SiafIntegrationController extends Controller
{
    private const SIAF_BASE_URL = 'https://apps2.mef.gob.pe/consulta-vfp-webapp/';

    /**
     * Obtiene el formulario SIAF pre-llenado con los parámetros
     * GET /api/siaf/embedded-form?anoEje=2026&secEjec=001&expediente=123
     */
    public function embeddedForm(Request $request): JsonResponse | string
    {
        $anoEje = $request->get('anoEje', date('Y'));
        $secEjec = $request->get('secEjec', '');
        $expediente = $request->get('expediente', '');

        try {
            // Paso 1: Establecer sesión con SIAF
            $cookieFile = storage_path('app/siaf/session_' . uniqid() . '.txt');

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => self::SIAF_BASE_URL . 'consultaExpediente.jspx',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_CONNECTTIMEOUT => 25,
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

            $html = curl_exec($ch);
            $errno = curl_errno($ch);
            curl_close($ch);

            if ($errno !== 0 || !$html) {
                \Log::error('SIAF Embedded - Session failed', ['errno' => $errno]);
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo conectar a SIAF. IP bloqueada o servidor no disponible.',
                ], 503);
            }

            // Paso 2: Obtener CAPTCHA
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => self::SIAF_BASE_URL . 'Captcha.jpg',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_CONNECTTIMEOUT => 25,
                CURLOPT_BINARYTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_COOKIEFILE => $cookieFile,
            ]);

            $captchaImage = curl_exec($ch);
            curl_close($ch);

            if (!$captchaImage) {
                \Log::error('SIAF Embedded - CAPTCHA failed');
                return response()->json([
                    'success' => false,
                    'message' => 'No se pudo obtener el CAPTCHA de SIAF.',
                ], 503);
            }

            // Paso 3: Devolver formulario HTML con campos pre-llenados
            $captchaBase64 = 'data:image/jpg;base64,' . base64_encode($captchaImage);
            $sessionFile = basename($cookieFile);

            $formHtml = <<<HTML
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Búsqueda SIAF - Control Deudas</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                        padding: 40px;
                        max-width: 500px;
                        width: 100%;
                    }
                    h1 {
                        color: #1e293b;
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    .subtitle {
                        color: #64748b;
                        font-size: 14px;
                        margin-bottom: 30px;
                    }
                    .form-group {
                        margin-bottom: 20px;
                    }
                    label {
                        display: block;
                        color: #334155;
                        font-weight: 600;
                        font-size: 14px;
                        margin-bottom: 8px;
                    }
                    input[type="text"], input[type="number"], select {
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #cbd5e1;
                        border-radius: 8px;
                        font-size: 14px;
                        outline: none;
                        transition: border-color 0.3s;
                    }
                    input[type="text"]:focus, input[type="number"]:focus, select:focus {
                        border-color: #0ea5e9;
                        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
                    }
                    .captcha-group {
                        background: #f8fafc;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 20px 0;
                    }
                    .captcha-image {
                        background: white;
                        padding: 10px;
                        border-radius: 6px;
                        margin-bottom: 12px;
                        text-align: center;
                    }
                    .captcha-image img {
                        height: 60px;
                        width: auto;
                    }
                    .button-group {
                        display: flex;
                        gap: 12px;
                        margin-top: 30px;
                    }
                    button {
                        flex: 1;
                        padding: 12px;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    .btn-submit {
                        background: #10b981;
                        color: white;
                    }
                    .btn-submit:hover {
                        background: #059669;
                    }
                    .btn-cancel {
                        background: #e2e8f0;
                        color: #475569;
                    }
                    .btn-cancel:hover {
                        background: #cbd5e1;
                    }
                    .info-box {
                        background: #eff6ff;
                        border-left: 4px solid #0ea5e9;
                        padding: 12px;
                        border-radius: 6px;
                        margin-bottom: 20px;
                        font-size: 13px;
                        color: #0c4a6e;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🔍 Búsqueda en SIAF</h1>
                    <p class="subtitle">Ingresa el código de verificación para continuar</p>

                    <div class="info-box">
                        <strong>Datos a consultar:</strong><br>
                        Año: {$anoEje} | Ejecutora: {$secEjec} | Expediente: {$expediente}
                    </div>

                    <form id="siafForm">
                        <div class="form-group">
                            <label>Año de Ejecución</label>
                            <input type="text" name="anoEje" value="{$anoEje}" readonly style="background: #f1f5f9; cursor: not-allowed;">
                        </div>

                        <div class="form-group">
                            <label>Código de Unidad Ejecutora</label>
                            <input type="text" name="secEjec" value="{$secEjec}" readonly style="background: #f1f5f9; cursor: not-allowed;">
                        </div>

                        <div class="form-group">
                            <label>Expediente</label>
                            <input type="text" name="expediente" value="{$expediente}" readonly style="background: #f1f5f9; cursor: not-allowed;">
                        </div>

                        <div class="captcha-group">
                            <label>Código de Verificación CAPTCHA *</label>
                            <div class="captcha-image">
                                <img src="{$captchaBase64}" alt="CAPTCHA" id="captchaImg">
                            </div>
                            <input type="text"
                                   name="j_captcha"
                                   placeholder="Ingresa el código"
                                   maxlength="6"
                                   required
                                   autofocus>
                        </div>

                        <div class="button-group">
                            <button type="submit" class="btn-submit">Consultar SIAF</button>
                            <button type="button" class="btn-cancel" onclick="window.close(); return false;">Cancelar</button>
                        </div>
                    </form>
                </div>

                <script>
                    const form = document.getElementById('siafForm');
                    const sessionFile = '{$sessionFile}';

                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();

                        const captcha = form.j_captcha.value.trim();
                        if (!captcha) {
                            alert('Por favor ingresa el código CAPTCHA');
                            return;
                        }

                        try {
                            document.querySelector('.btn-submit').disabled = true;
                            document.querySelector('.btn-submit').textContent = 'Consultando...';

                            const response = await fetch('/api/siaf/execute-query', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                },
                                body: JSON.stringify({
                                    anoEje: '{$anoEje}',
                                    secEjec: '{$secEjec}',
                                    expediente: '{$expediente}',
                                    j_captcha: captcha,
                                    session_file: sessionFile,
                                })
                            });

                            const result = await response.json();

                            if (result.success && result.data) {
                                // Enviar resultado a ventana padre
                                if (window.opener) {
                                    window.opener.postMessage({
                                        type: 'SIAF_RESULT',
                                        data: result.data
                                    }, window.location.origin);
                                }
                                window.close();
                            } else {
                                alert('Error: ' + (result.message || 'Error desconocido'));
                                document.querySelector('.btn-submit').disabled = false;
                                document.querySelector('.btn-submit').textContent = 'Consultar SIAF';
                            }
                        } catch (error) {
                            alert('Error al consultar: ' + error.message);
                            document.querySelector('.btn-submit').disabled = false;
                            document.querySelector('.btn-submit').textContent = 'Consultar SIAF';
                        }
                    });
                </script>
            </body>
            </html>
            HTML;

            return response(
                $formHtml,
                200,
                ['Content-Type' => 'text/html; charset=utf-8']
            );

        } catch (\Exception $e) {
            \Log::error('SIAF Embedded Form Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al cargar el formulario SIAF',
            ], 500);
        }
    }

    /**
     * Ejecuta la consulta en SIAF con el CAPTCHA ingresado
     * POST /api/siaf/execute-query
     */
    public function executeQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'anoEje' => 'required|numeric',
            'secEjec' => 'required|numeric',
            'expediente' => 'required|numeric',
            'j_captcha' => 'required|string|max:6',
            'session_file' => 'required|string',
        ]);

        try {
            $cookieFile = storage_path('app/siaf/' . $validated['session_file']);

            if (!file_exists($cookieFile)) {
                \Log::warning('SIAF Execute - Cookie file not found', ['file' => $cookieFile]);
                return response()->json([
                    'success' => false,
                    'message' => 'Sesión expirada. Por favor intenta de nuevo.',
                ], 410);
            }

            // Ejecutar consulta a SIAF
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => 'https://apps2.mef.gob.pe/consulta-vfp-webapp/actionConsultaExpediente.jspx',
                CURLOPT_POST => 1,
                CURLOPT_POSTFIELDS => http_build_query([
                    'anoEje' => $validated['anoEje'],
                    'secEjec' => $validated['secEjec'],
                    'expediente' => $validated['expediente'],
                    'j_captcha' => $validated['j_captcha'],
                ]),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_CONNECTTIMEOUT => 25,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_COOKIEFILE => $cookieFile,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: Mozilla/5.0',
                    'Referer: https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx',
                ],
            ]);

            $html = curl_exec($ch);
            $errno = curl_errno($ch);
            curl_close($ch);

            // Limpiar archivo de cookies
            @unlink($cookieFile);

            if ($errno !== 0) {
                \Log::error('SIAF Execute - Query failed', ['errno' => $errno]);
                return response()->json([
                    'success' => false,
                    'message' => 'Error al consultar SIAF: ' . curl_strerror($errno),
                ], 503);
            }

            // Parsear HTML y extraer datos
            $datos = $this->parsearRespuestaSiaf($html);

            if (empty($datos)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron datos para los parámetros ingresados.',
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'datos' => $datos,
                    'info_siaf' => $this->extraerInfoSiaf($datos),
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('SIAF Execute Exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar la consulta',
            ], 500);
        }
    }

    /**
     * Parsea la respuesta HTML de SIAF y extrae datos de la tabla
     */
    private function parsearRespuestaSiaf(string $html): array
    {
        $datos = [];

        // Expresión regular para extraer filas de la tabla
        if (preg_match_all('/<tr[^>]*>.*?<\/tr>/is', $html, $matches)) {
            foreach ($matches[0] as $fila) {
                if (preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $fila, $celdas)) {
                    $valores = array_map(function($celda) {
                        return trim(strip_tags($celda));
                    }, $celdas[1]);

                    // Evitar filas de encabezado
                    if (count($valores) >= 10 && is_numeric($valores[0])) {
                        $datos[] = [
                            'ciclo' => $valores[0] ?? '',
                            'fase' => $valores[1] ?? '',
                            'secuencia' => $valores[2] ?? '',
                            'correlativo' => $valores[3] ?? '',
                            'codDoc' => $valores[4] ?? '',
                            'numDoc' => $valores[5] ?? '',
                            'fecha' => $valores[6] ?? '',
                            'moneda' => $valores[7] ?? '',
                            'monto' => $valores[8] ?? '',
                            'estado' => $valores[9] ?? '',
                        ];
                    }
                }
            }
        }

        return $datos;
    }

    /**
     * Extrae información resumen del SIAF
     */
    private function extraerInfoSiaf(array $datos): array
    {
        if (empty($datos)) {
            return [];
        }

        $primerRegistro = $datos[0];

        return [
            'fase' => $primerRegistro['fase'] ?? '',
            'estado' => $primerRegistro['estado'] ?? '',
            'fechaProceso' => $primerRegistro['fecha'] ?? '',
            'moneda' => $primerRegistro['moneda'] ?? '',
        ];
    }
}
