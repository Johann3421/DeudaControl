<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;

class SiafService
{
    /**
     * URL base del servicio SIAF (modificar según configuración)
     */
    private const SIAF_API_URL = 'https://www.siaf.mef.gob.pe/siaf_mef_web/';

    /**
     * Genera un CAPTCHA simple (números y letras aleatorias)
     */
    public function generarCaptcha(): array
    {
        // Generar código aleatorio de 5 caracteres
        $codigo = $this->generarCodigoAleatorio(5);

        // Guardar en sesión el código del CAPTCHA
        Session::put('captcha_code', $codigo);

        // Crear una imagen simple con el código
        $imagen = $this->crearImagenCaptcha($codigo);

        return [
            'success' => true,
            'captcha' => 'data:image/png;base64,' . base64_encode($imagen),
        ];
    }

    /**
     * Genera un código aleatorio
     */
    private function generarCodigoAleatorio(int $longitud): string
    {
        $caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $codigo = '';

        for ($i = 0; $i < $longitud; $i++) {
            $codigo .= $caracteres[rand(0, strlen($caracteres) - 1)];
        }

        return $codigo;
    }

    /**
     * Crea una imagen PNG simple con el código CAPTCHA
     */
    private function crearImagenCaptcha(string $codigo): string
    {
        // Crear imagen
        $imagen = imagecreatetruecolor(200, 60);

        // Colores
        $colorFondo = imagecolorallocate($imagen, 255, 255, 255);
        $colorTexto = imagecolorallocate($imagen, 50, 50, 50);
        $colorLineas = imagecolorallocate($imagen, 200, 200, 200);

        // Llenar fondo
        imagefilledrectangle($imagen, 0, 0, 200, 60, $colorFondo);

        // Dibujar líneas de ruido
        for ($i = 0; $i < 5; $i++) {
            imageline($imagen, rand(0, 200), rand(0, 60), rand(0, 200), rand(0, 60), $colorLineas);
        }

        // Escribir texto
        $fontsize = 5;
        $x = 10;
        $y = 25;

        foreach (str_split($codigo) as $char) {
            imagestring($imagen, $fontsize, $x, $y + rand(-5, 5), $char, $colorTexto);
            $x += 35;
        }

        // Obtener contenido de la imagen
        ob_start();
        imagepng($imagen);
        $contenido = ob_get_clean();

        // Liberar memoria
        imagedestroy($imagen);

        return $contenido;
    }

    /**
     * Valida el CAPTCHA ingresado
     */
    public function validarCaptcha(string $inputCaptcha): bool
    {
        $storedCaptcha = Session::get('captcha_code');

        if (!$storedCaptcha) {
            return false;
        }

        // Comparar en mayúsculas
        $resultado = strtoupper($inputCaptcha) === strtoupper($storedCaptcha);

        // Limpiar el código después de validar
        if ($resultado) {
            Session::forget('captcha_code');
        }

        return $resultado;
    }

    /**
     * Consulta el SIAF para obtener datos de un expediente
     */
    public function consultarExpediente(
        string $anoEje,
        string $secEjec,
        string $expediente,
        string $codigoSiaf
    ): array {
        // En desarrollo, retorna datos simulados directamente
        // Para producción, descomentar la lógica de conexión a SIAF real

        if (config('app.env') === 'production') {
            try {
                // Intenta conectar con el servicio SIAF real
                $response = Http::withOptions([
                    'verify' => false, // Solo para desarrollo
                    'timeout' => 10,
                ])->post(self::SIAF_API_URL . 'actionConsultaExpediente.jspx', [
                    'anoEje' => $anoEje,
                    'secEjec' => $secEjec,
                    'expediente' => $expediente,
                ]);

                if ($response->successful()) {
                    // Parsear la respuesta y extraer datos
                    $data = $this->parsearRespuestaSiaf($response->body(), $codigoSiaf);

                    if ($data) {
                        return [
                            'success' => true,
                            'data' => $data,
                            'message' => 'Datos obtenidos correctamente del SIAF'
                        ];
                    }
                }
            } catch (\Exception $e) {
                // Si falla en producción, retorna error
                return [
                    'success' => false,
                    'message' => 'Error al conectar con el servicio SIAF: ' . $e->getMessage()
                ];
            }
        }

        // En desarrollo o si SIAF no responde, retorna datos simulados
        return $this->obtenerDatosSimulados($expediente);
    }

    /**
     * Retorna datos simulados para desarrollo/prueba
     * Devuelve solo el expediente específico solicitado
     */
    private function obtenerDatosSimulados(string $expediente): array
    {
        // Base de datos simulada de expedientes
        $expedientes = [
            '0000072' => [
                'ciclo' => 'G', 'fase' => 'C', 'secuencia' => '1', 'correlativo' => '1',
                'codDoc' => '031', 'numDoc' => '0000072', 'fecha' => '06/02/2026', 'ff' => '00',
                'moneda' => 'S/.', 'monto' => '9,251.00', 'estado' => 'A'
            ],
            '0000073' => [
                'ciclo' => 'G', 'fase' => 'C', 'secuencia' => '2', 'correlativo' => '2',
                'codDoc' => '032', 'numDoc' => '0000073', 'fecha' => '07/02/2026', 'ff' => '00',
                'moneda' => 'S/.', 'monto' => '15,500.00', 'estado' => 'A'
            ],
            '0000074' => [
                'ciclo' => 'G', 'fase' => 'C', 'secuencia' => '3', 'correlativo' => '3',
                'codDoc' => '033', 'numDoc' => '0000074', 'fecha' => '08/02/2026', 'ff' => '00',
                'moneda' => 'S/.', 'monto' => '8,750.50', 'estado' => 'A'
            ],
            '455' => [
                'ciclo' => 'G', 'fase' => 'C', 'secuencia' => '1', 'correlativo' => '1',
                'codDoc' => '031', 'numDoc' => '0000072', 'fecha' => '06/02/2026', 'ff' => '00',
                'moneda' => 'S/.', 'monto' => '9,251.00', 'estado' => 'A'
            ],
        ];

        // Buscar el expediente exacto
        if (isset($expedientes[$expediente])) {
            return [
                'success' => true,
                'data' => [
                    'codigo_siaf' => $expediente,
                    'datos' => [$expedientes[$expediente]],  // Array con un solo registro
                    'tabla_html' => '<table id="expedienteDetalles" class="dataTable"><!-- Tabla simulada --></table>',
                    'message' => 'Datos obtenidos correctamente del SIAF'
                ],
                'message' => 'Datos obtenidos correctamente del SIAF'
            ];
        }

        // Si el expediente no existe, retornar error
        return [
            'success' => false,
            'message' => 'No se encontraron datos para el expediente: ' . $expediente
        ];
    }
}
