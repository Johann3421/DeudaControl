<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;

class SiafService
{
    /**
     * URL base del servicio SIAF - Alternativa 1 (apps2.mef.gob.pe)
     */
    private const SIAF_API_URL_PRIMARY = 'https://apps2.mef.gob.pe/consulta-vfp-webapp/';

    /**
     * URL base del servicio SIAF - Alternativa 2 (original, por si la primera no funciona)
     */
    private const SIAF_API_URL_BACKUP = 'https://www.siaf.mef.gob.pe/siaf_mef_web/';

    /**
     * Archivo de cookies PERSISTENTE para mantener sesión SIAF
     * Crítico: La MISMA sesión/cookies debe usarse para:
     * 1. Obtener CAPTCHA
     * 2. Validar CAPTCHA en POST
     */
    private function getPersistentCookieFile(): string
    {
        return sys_get_temp_dir() . '/siaf_session_cookies.txt';
    }

    /**
     * Obtiene el CAPTCHA real del SIAF (no genera uno local)
     * Mantiene la sesión en archivo persistente para validación posterior
     */
    public function obtenerCaptchaSiaf(): array
    {
        try {
            $cookieFile = $this->getPersistentCookieFile();

            // Paso 1: GET inicial para crear sesión en SIAF
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => 'https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_COOKIEFILE => $cookieFile,
                CURLOPT_COOKIEJAR => $cookieFile,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                ],
            ]);

            curl_exec($ch);
            curl_close($ch);

            // Paso 2: GET a Captcha.jpg con la MISMA sesión
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => 'https://apps2.mef.gob.pe/consulta-vfp-webapp/Captcha.jpg',
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_BINARYTRANSFER => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_COOKIEFILE => $cookieFile,  // ← Reutilizar cookies
                CURLOPT_HTTPHEADER => [
                    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                ],
            ]);

            $imageData = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200 || !$imageData) {
                return [
                    'success' => false,
                    'message' => 'No se pudo obtener el CAPTCHA del SIAF'
                ];
            }

            $base64 = base64_encode($imageData);

            \Log::info('SIAF CAPTCHA Obtained', ['cookieFile' => $cookieFile, 'httpCode' => $httpCode]);

            return [
                'success' => true,
                'captcha' => 'data:image/jpg;base64,' . $base64,
            ];
        } catch (\Exception $e) {
            \Log::warning('Error obtaining SIAF CAPTCHA: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ];
        }
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
     * No validamos el CAPTCHA localmente
     * SIAF lo valida en su servidor cuando hacemos POST
     */
    public function validarCaptcha(string $inputCaptcha): bool
    {
        // El CAPTCHA será validado por SIAF
        // Aquí solo verificamos que no esté vacío
        return !empty($inputCaptcha) && strlen($inputCaptcha) >= 4;
    }

    /**
     * Consulta el SIAF para obtener datos de un expediente
     * Con múltiples intentos y fallback a datos simulados
     */
    public function consultarExpediente(
        string $anoEje,
        string $secEjec,
        string $expediente,
        string $codigoSiaf,
        string $captcha = ''
    ): array {
        // Intentar primero con la URL alternativa (apps2.mef.gob.pe)
        $resultado = $this->intentarConexionSiaf(
            self::SIAF_API_URL_PRIMARY,
            $anoEje,
            $secEjec,
            $expediente,
            $codigoSiaf,
            $captcha
        );

        if ($resultado['success']) {
            return $resultado;
        }

        // Si falla, intentar con URL de backup (www.siaf.mef.gob.pe)
        $resultado = $this->intentarConexionSiaf(
            self::SIAF_API_URL_BACKUP,
            $anoEje,
            $secEjec,
            $expediente,
            $codigoSiaf,
            $captcha
        );

        if ($resultado['success']) {
            return $resultado;
        }

        // Si ambas fallan, devolver datos simulados (garantizado)
        \Log::warning('SIAF Connection Failed - Using Simulated Data', [
            'anoEje' => $anoEje,
            'secEjec' => $secEjec,
            'expediente' => $expediente,
        ]);

        return $this->obtenerDatosSimulados($expediente);
    }

    /**
     * Intenta conectarse a SIAF con una URL específica
     * Usa múltiples estrategias: cURL directo y Guzzle HTTP
     */
    private function intentarConexionSiaf(
        string $baseUrl,
        string $anoEje,
        string $secEjec,
        string $expediente,
        string $codigoSiaf,
        string $captcha = ''
    ): array {
        // Parámetros POST para SIAF (INCLUIR EL CAPTCHA RESUELTO)
        $params = [
            'anoEje' => $anoEje,
            'secEjec' => $secEjec,
            'expediente' => $expediente,
        ];

        // Solo agregar CAPTCHA si se proporciona
        if (!empty($captcha)) {
            $params['j_captcha'] = $captcha;
        }

        // Debug: Loguear los parámetros que se envían
        \Log::info('SIAF Parámetros enviados', [
            'baseUrl' => $baseUrl,
            'params' => $params,
            'captchaProvided' => !empty($captcha),
            'captchaValue' => $captcha ?? 'EMPTY'
        ]);

        // Intentar primero con cURL directo (más confiable para sitios complejos)
        $htmlResponse = $this->intentarConexionCurl(
            $baseUrl . 'actionConsultaExpediente.jspx',
            $params
        );

        if ($htmlResponse) {
            $tabla = $this->extraerTablaSiaf($htmlResponse);
            if ($tabla) {
                // Parsear la tabla para obtener datos estructurados
                $datos = $this->parsearTablaSiaf($tabla);

                // Si hay datos, extraer información del MEJOR registro (último con más datos) para la deuda
                $mejorRegistro = $this->obtenerMejorRegistroSiaf($datos);
                $infoSiaf = [];
                if ($mejorRegistro) {
                    $infoSiaf = [
                        'fase' => $mejorRegistro['fase'] ?? null,
                        'estado' => $mejorRegistro['estado'] ?? null,
                        'fechaProceso' => $this->extraerSoloFecha($mejorRegistro['fechaHora'] ?? null),
                    ];
                }

                \Log::info('SIAF Connection Success (cURL)', [
                    'url' => $baseUrl,
                    'registros_encontrados' => count($datos),
                    'info_siaf' => $infoSiaf
                ]);

                return [
                    'success' => true,
                    'data' => [
                        'codigo_siaf' => $codigoSiaf,
                        'datos' => $datos,  // Array de registros
                        'tabla_html' => $tabla,  // HTML original para respaldo
                        'info_siaf' => $infoSiaf,  // Info del mejor registro para la deuda
                        'anoEje' => $anoEje,
                        'secEjec' => $secEjec,
                        'expediente' => $expediente,
                    ],
                    'message' => 'Datos obtenidos correctamente del SIAF'
                ];
            }
        }

        // Intentar con Guzzle HTTP (fallback)
        $htmlResponse = $this->intentarConexionGuzzle(
            $baseUrl . 'actionConsultaExpediente.jspx',
            $params
        );

        if ($htmlResponse) {
            $tabla = $this->extraerTablaSiaf($htmlResponse);
            if ($tabla) {
                // Parsear la tabla para obtener datos estructurados
                $datos = $this->parsearTablaSiaf($tabla);

                // Si hay datos, extraer información del MEJOR registro (último con más datos) para la deuda
                $mejorRegistro = $this->obtenerMejorRegistroSiaf($datos);
                $infoSiaf = [];
                if ($mejorRegistro) {
                    $infoSiaf = [
                        'fase' => $mejorRegistro['fase'] ?? null,
                        'estado' => $mejorRegistro['estado'] ?? null,
                        'fechaProceso' => $this->extraerSoloFecha($mejorRegistro['fechaHora'] ?? null),
                    ];
                }

                \Log::info('SIAF Connection Success (Guzzle)', [
                    'url' => $baseUrl,
                    'registros_encontrados' => count($datos),
                    'info_siaf' => $infoSiaf
                ]);

                return [
                    'success' => true,
                    'data' => [
                        'codigo_siaf' => $codigoSiaf,
                        'datos' => $datos,  // Array de registros
                        'tabla_html' => $tabla,  // HTML original para respaldo
                        'info_siaf' => $infoSiaf,  // Info del mejor registro para la deuda
                        'anoEje' => $anoEje,
                        'secEjec' => $secEjec,
                        'expediente' => $expediente,
                    ],
                    'message' => 'Datos obtenidos correctamente del SIAF'
                ];
            }
        }

        \Log::warning('SIAF Connection Failed (todas las estrategias)', [
            'url' => $baseUrl,
            'anoEje' => $anoEje,
            'expediente' => $expediente,
        ]);

        return ['success' => false, 'message' => 'No se pudo conectar a SIAF'];
    }

    /**
     * Intenta conexión via cURL directo
     * Usa COOKIES PERSISTENTES para mantener la MISMA SESIÓN SIAF
     * que se estableció cuando obtuvimos el CAPTCHA
     */
    private function intentarConexionCurl(string $url, array $params): ?string
    {
        try {
            if (!function_exists('curl_init')) {
                \Log::warning('cURL no disponible');
                return null;
            }

            $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
            $cookieFile = $this->getPersistentCookieFile();

            // POST directo a actionConsultaExpediente.jspx usando MISMAS cookies
            $ch = curl_init();
            $postData = http_build_query($params);

            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_POST => 1,
                CURLOPT_POSTFIELDS => $postData,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 15,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 5,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_COOKIEFILE => $cookieFile,  // ← MISMAS cookies del CAPTCHA
                CURLOPT_COOKIEJAR => $cookieFile,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: ' . $userAgent,
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language: es-ES,es;q=0.9',
                    'Content-Type: application/x-www-form-urlencoded',
                    'Referer: https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx',
                ],
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);

            curl_close($ch);

            if ($error) {
                \Log::warning('SIAF cURL Error', ['error' => $error, 'url' => $url]);
                return null;
            }

            if (!$response) {
                \Log::warning('SIAF cURL Empty Response', ['url' => $url]);
                return null;
            }

            \Log::info('SIAF cURL Success', [
                'url' => $url,
                'httpCode' => $httpCode,
                'size' => strlen($response),
                'cookieFile' => $cookieFile
            ]);

            return $response;

        } catch (\Exception $e) {
            \Log::warning('SIAF cURL Exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Intenta conexión via Guzzle HTTP (fallback de cURL)
     */
    private function intentarConexionGuzzle(string $url, array $params): ?string
    {
        try {
            \Log::info('Intentando Guzzle Connection', ['url' => $url]);

            $response = Http::withOptions([
                'verify' => false,
                'timeout' => 15,
                'connect_timeout' => 10,
                'allow_redirects' => true,
            ])->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language' => 'es-ES,es;q=0.9',
                'Cache-Control' => 'no-cache',
            ])->asForm()->post($url, $params);

            if ($response->successful()) {
                $html = $response->body();

                \Log::info('Guzzle Connection Success', [
                    'url' => $url,
                    'size' => strlen($html)
                ]);

                return $html;
            }

            \Log::warning('Guzzle HTTP Error', [
                'code' => $response->status(),
                'url' => $url
            ]);

            return null;

        } catch (\Exception $e) {
            \Log::warning('Guzzle Exception', [
                'error' => $e->getMessage(),
                'url' => $url
            ]);
            return null;
        }
    }

    /**
     * Extrae la tabla HTML con id="expedienteDetalles" de la respuesta del SIAF
     */
    private function extraerTablaSiaf(string $html): ?string
    {
        try {
            // Buscar la tabla con id="expedienteDetalles"
            if (preg_match('/<table[^>]*id=["\']expedienteDetalles["\'][^>]*>.*?<\/table>/is', $html, $matches)) {
                return $matches[0];
            }

            // Si no encuentra la tabla, pero hay contenido de expediente, devolver nulo
            return null;

        } catch (\Exception $e) {
            \Log::warning('Error extracting SIAF table: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Parsea la tabla HTML del SIAF y extrae los datos estructurados
     * @param string $tablaHtml HTML de la tabla
     * @return array Array de registros con estructura: ['ciclo', 'fase', 'secuencia', 'correlativo', 'codDoc', 'numDoc', 'fecha', 'ff', 'moneda', 'monto', 'estado', 'fechaHora', 'idTrx']
     */
    private function parsearTablaSiaf(string $tablaHtml): array
    {
        $datos = [];

        // Expresión regular para extraer filas (<tr>)
        if (preg_match_all('/<tr[^>]*>.*?<\/tr>/is', $tablaHtml, $filasMatches)) {
            foreach ($filasMatches[0] as $fila) {
                // Saltar encabezados
                if (stripos($fila, '<th') !== false) {
                    continue;
                }

                // Extraer celdas (<td>)
                $celdas = [];
                if (preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $fila, $celdasMatches)) {
                    foreach ($celdasMatches[1] as $celda) {
                        // Limpiar HTML
                        $celda = strip_tags($celda);
                        // Decodificar HTML entities
                        $celda = html_entity_decode($celda, ENT_QUOTES, 'UTF-8');
                        // Trimear espacios
                        $celda = trim($celda);
                        $celdas[] = $celda;
                    }
                }

                // Asignar datos a array asociativo según las columnas esperadas
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

    /**
     * Obtiene el MEJOR registro: ÚLTIMA fila, rellenando campos vacíos con filas anteriores
     * Esto es útil cuando hay múltiples filas y la última es la más reciente pero con datos incompletos
     * @param array $registros Array de registros parseados
     * @return array|null El último registro con campos completados si es necesario
     */
    private function obtenerMejorRegistroSiaf(array $registros): ?array
    {
        if (empty($registros)) {
            return null;
        }

        // Tomar el último registro como base
        $ultimoRegistro = $registros[count($registros) - 1];

        // Rellenar campos vacíos del último registro con datos de registros anteriores
        // Priorizar registros que compartan ciclo, fase, sec, correlativo
        foreach ($ultimoRegistro as $campo => $valor) {
            if (empty($valor) || $valor === '') {
                // Buscar este campo en registros anteriores (de atrás hacia adelante)
                for ($i = count($registros) - 2; $i >= 0; $i--) {
                    $registroAnterior = $registros[$i];

                    // Preferir registros con misma fase y ciclo
                    if (!empty($registroAnterior[$campo]) &&
                        $registroAnterior[$campo] !== '' &&
                        $registroAnterior['ciclo'] === $ultimoRegistro['ciclo'] &&
                        $registroAnterior['fase'] === $ultimoRegistro['fase']) {
                        $ultimoRegistro[$campo] = $registroAnterior[$campo];
                        break;
                    }
                }

                // Si aún están vacíos, buscar en cualquier registro anterior
                if (empty($ultimoRegistro[$campo]) || $ultimoRegistro[$campo] === '') {
                    for ($i = count($registros) - 2; $i >= 0; $i--) {
                        $registroAnterior = $registros[$i];
                        if (!empty($registroAnterior[$campo]) && $registroAnterior[$campo] !== '') {
                            $ultimoRegistro[$campo] = $registroAnterior[$campo];
                            break;
                        }
                    }
                }
            }
        }

        return $ultimoRegistro;
    }

    /**
     * Falla cuando no se puede conectar a SIAF
     * Retorna error claro para que el usuario sepa qué pasó
     */
    private function obtenerDatosSimulados(string $expediente): array
    {
        return [
            'success' => false,
            'message' => 'No se pudo conectar al servidor SIAF. Verifica que los datos sean correctos y que tu CAPTCHA sea válido. Si el problema persiste, intenta más tarde.'
        ];
    }

    /**
     * Genera una tabla HTML vacía pero válida en formato SIAF
     * Permite al usuario ingresar datos manualmente
     */
    private function generarTablaHtmlVacia(): string
    {
        $html = '<table id="expedienteDetalles" class="dataTable">' . "\n";
        $html .= '<thead>' . "\n";
        $html .= '<tr>' . "\n";
        $html .= '<th class="ciclo">Ciclo</th>' . "\n";
        $html .= '<th class="fase">Fase</th>' . "\n";
        $html .= '<th class="secuencia">Sec</th>' . "\n";
        $html .= '<th class="correlativo">Corr</th>' . "\n";
        $html .= '<th class="codDoc">Doc</th>' . "\n";
        $html .= '<th class="numDoc">Numero</th>' . "\n";
        $html .= '<th class="fecha">Fecha</th>' . "\n";
        $html .= '<th class="ff">FF</th>' . "\n";
        $html .= '<th class="moneda">Moneda</th>' . "\n";
        $html .= '<th class="monto">Monto</th>' . "\n";
        $html .= '<th class="estado">Est.</th>' . "\n";
        $html .= '<th class="fechaHora">Fecha Proceso</th>' . "\n";
        $html .= '<th class="estado">Id Trx</th>' . "\n";
        $html .= '</tr>' . "\n";
        $html .= '</thead>' . "\n";
        $html .= '<tbody>' . "\n";

        // Generar 5 filas vacías para que el usuario las complete
        for ($i = 0; $i < 5; $i++) {
            $clase = ($i % 2 === 0) ? 'odd' : 'even';
            $html .= '<tr class="' . $clase . '" data-row-index="' . $i . '">' . "\n";
            $html .= '<td class="ciclo"><input type="text" class="editable" placeholder="Ej: G" maxlength="1" /></td>' . "\n";
            $html .= '<td class="fase"><input type="text" class="editable" placeholder="Ej: C,D,G" maxlength="1" /></td>' . "\n";
            $html .= '<td class="secuencia"><input type="text" class="editable" placeholder="Ej: 1" maxlength="2" /></td>' . "\n";
            $html .= '<td class="correlativo"><input type="text" class="editable" placeholder="Ej: 1" maxlength="2" /></td>' . "\n";
            $html .= '<td class="codDoc"><input type="text" class="editable" placeholder="Ej: 031" maxlength="3" /></td>' . "\n";
            $html .= '<td class="numDoc"><input type="text" class="editable" placeholder="N° Documento" maxlength="20" /></td>' . "\n";
            $html .= '<td class="fecha"><input type="text" class="editable" placeholder="dd/mm/yyyy" maxlength="10" /></td>' . "\n";
            $html .= '<td class="ff"><input type="text" class="editable" placeholder="Ej: 15" maxlength="2" /></td>' . "\n";
            $html .= '<td class="moneda"><input type="text" class="editable" placeholder="S/. o USD" maxlength="5" /></td>' . "\n";
            $html .= '<td class="monto"><input type="text" class="editable" placeholder="Ej: 1,000.00" maxlength="15" /></td>' . "\n";
            $html .= '<td class="estado"><input type="text" class="editable" placeholder="A,V,F" maxlength="1" /></td>' . "\n";
            $html .= '<td class="fechaHora"><input type="text" class="editable" placeholder="dd/mm/yyyy HH:MM" maxlength="16" /></td>' . "\n";
            $html .= '<td class="estado"><input type="text" class="editable" placeholder="ID Transacción" maxlength="15" /></td>' . "\n";
            $html .= '</tr>' . "\n";
        }

        $html .= '</tbody>' . "\n";
        $html .= '</table>' . "\n";
        $html .= '<div class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">' . "\n";
        $html .= '<strong>⚠️ Nota:</strong> No se pudo conectar al SIAF. Complete los datos manualmente con la información de su expediente. Si desea, puede copiar los datos directamente desde la página oficial del SIAF.' . "\n";
        $html .= '</div>' . "\n";

        return $html;
    }

    /**
     * Genera la tabla HTML en formato SIAF
     */
    private function generarTablaHtmlSiaf(array $registros): string
    {
        $html = '<table id="expedienteDetalles" class="dataTable">' . "\n";
        $html .= '<thead>' . "\n";
        $html .= '<tr>' . "\n";
        $html .= '<th class="ciclo">Ciclo</th>' . "\n";
        $html .= '<th class="fase">Fase</th>' . "\n";
        $html .= '<th class="secuencia">Sec</th>' . "\n";
        $html .= '<th class="correlativo">Corr</th>' . "\n";
        $html .= '<th class="codDoc">Doc</th>' . "\n";
        $html .= '<th class="numDoc">Numero</th>' . "\n";
        $html .= '<th class="fecha">Fecha</th>' . "\n";
        $html .= '<th class="ff">FF</th>' . "\n";
        $html .= '<th class="moneda">Moneda</th>' . "\n";
        $html .= '<th class="monto">Monto</th>' . "\n";
        $html .= '<th class="estado">Est.</th>' . "\n";
        $html .= '<th class="fechaHora">Fecha Proceso</th>' . "\n";
        $html .= '<th class="estado">Id Trx</th>' . "\n";
        $html .= '</tr>' . "\n";
        $html .= '</thead>' . "\n";
        $html .= '<tbody>' . "\n";

        foreach ($registros as $index => $registro) {
            $clase = ($index % 2 === 0) ? 'odd' : 'even';
            $html .= '<tr class="' . $clase . '">' . "\n";
            $html .= '<td class="ciclo">' . htmlspecialchars($registro['ciclo'] ?? '') . '</td>' . "\n";
            $html .= '<td class="fase">' . htmlspecialchars($registro['fase'] ?? '') . '</td>' . "\n";
            $html .= '<td class="secuencia">' . htmlspecialchars($registro['secuencia'] ?? '') . '</td>' . "\n";
            $html .= '<td class="correlativo">' . htmlspecialchars($registro['correlativo'] ?? '') . '</td>' . "\n";
            $html .= '<td class="codDoc">' . htmlspecialchars($registro['codDoc'] ?? '') . '</td>' . "\n";
            $html .= '<td class="numDoc">' . htmlspecialchars($registro['numDoc'] ?? '') . '</td>' . "\n";
            $html .= '<td class="fecha">' . htmlspecialchars($registro['fecha'] ?? '') . '</td>' . "\n";
            $html .= '<td class="ff">' . htmlspecialchars($registro['ff'] ?? '') . '</td>' . "\n";
            $html .= '<td class="moneda">' . htmlspecialchars($registro['moneda'] ?? '') . '</td>' . "\n";
            $html .= '<td class="monto">' . htmlspecialchars($registro['monto'] ?? '') . '</td>' . "\n";
            $html .= '<td class="estado">' . htmlspecialchars($registro['estado'] ?? '') . '</td>' . "\n";
            $html .= '<td class="fechaHora">' . htmlspecialchars($registro['fechaHora'] ?? '') . '</td>' . "\n";
            $html .= '<td class="estado">' . htmlspecialchars($registro['idTrx'] ?? '') . '</td>' . "\n";
            $html .= '</tr>' . "\n";
        }

        $html .= '</tbody>' . "\n";
        $html .= '</table>';

        return $html;
    }

    /**
     * Extrae solo la parte de fecha de un campo fechaHora
     * Convierte formatos como "22/12/2025 15:20:55" a "2025-12-22"
     * @param string|null $fechaHora Fecha con hora en formato dd/mm/yyyy HH:MM:SS
     * @return string|null Fecha en formato Y-m-d o null
     */
    private function extraerSoloFecha(?string $fechaHora): ?string
    {
        if (empty($fechaHora) || $fechaHora === '') {
            return null;
        }

        // Si contiene espacio, es formato con hora (dd/mm/yyyy HH:MM:SS)
        if (strpos($fechaHora, ' ') !== false) {
            $fechaHora = explode(' ', $fechaHora)[0];
        }

        // Si está en formato dd/mm/yyyy, convertir a Y-m-d
        if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $fechaHora, $matches)) {
            return $matches[3] . '-' . $matches[2] . '-' . $matches[1];
        }

        // Si ya está en Y-m-d, devolverla
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $fechaHora)) {
            return $fechaHora;
        }

        return null;
    }
}
