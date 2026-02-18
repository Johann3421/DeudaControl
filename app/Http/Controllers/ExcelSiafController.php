<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class ExcelSiafController extends Controller
{
    /**
     * Formatea una fecha del Excel al formato dd/mm/yyyy
     */
    private function formatExcelDate($cellValue)
    {
        if (empty($cellValue)) {
            return '';
        }

        // Si es un número serial de Excel
        if (is_numeric($cellValue)) {
            try {
                $dateTime = Date::excelToDateTimeObject($cellValue);
                // Asegurar que el día y mes tengan ceros a la izquierda (dd/mm/yyyy)
                $day = str_pad($dateTime->format('d'), 2, '0', STR_PAD_LEFT);
                $month = str_pad($dateTime->format('m'), 2, '0', STR_PAD_LEFT);
                $year = $dateTime->format('Y');
                return "{$day}/{$month}/{$year}";
            } catch (\Exception $e) {
                // Si falla, tratar como string
            }
        }

        // Convertir a string
        $dateStr = trim((string)$cellValue);
        
        if (empty($dateStr)) {
            return '';
        }

        // Intentar parsear diferentes formatos y devolver dd/mm/yyyy
        // Soporta: d/m/yyyy, dd/mm/yyyy, d-m-yyyy, dd-mm-yyyy
        $dateStr = str_replace('-', '/', $dateStr);
        
        // Patrón: capturar día, mes, año
        if (preg_match('/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/', $dateStr, $matches)) {
            $day = str_pad($matches[1], 2, '0', STR_PAD_LEFT);
            $month = str_pad($matches[2], 2, '0', STR_PAD_LEFT);
            $year = $matches[3];
            return "{$day}/{$month}/{$year}";
        }

        return $dateStr;
    }
    /**
     * Procesa un archivo Excel descargado desde SIAF
     * POST /api/siaf/upload-excel
     */
    public function uploadExcel(Request $request)
    {
        // Asegurar que siempre devolvemos JSON
        $request->headers->set('Accept', 'application/json');

        try {
            \Log::info('[EXCEL SIAF] Solicitud recibida', [
                'has_file' => $request->hasFile('file'),
                'method' => $request->method(),
            ]);

            // Validar que existe el archivo
            if (!$request->hasFile('file')) {
                \Log::error('[EXCEL SIAF] No hay archivo en la solicitud');
                return response()->json([
                    'success' => false,
                    'error' => 'No se encontró ningún archivo'
                ], 422);
            }

            $file = $request->file('file');

            // Validar que es un archivo
            if (!$file->isValid()) {
                return response()->json([
                    'success' => false,
                    'error' => 'El archivo no es válido'
                ], 422);
            }

            // Validar tamaño (5MB máximo)
            if ($file->getSize() > 5 * 1024 * 1024) {
                return response()->json([
                    'success' => false,
                    'error' => 'El archivo es demasiado grande (máximo 5MB)'
                ], 422);
            }

            // Validar extensión
            $ext = strtolower($file->getClientOriginalExtension());
            if (!in_array($ext, ['xlsx', 'xls', 'csv'])) {
                return response()->json([
                    'success' => false,
                    'error' => 'Solo se aceptan archivos Excel (.xlsx, .xls) o CSV. Extensión detectada: ' . $ext
                ], 422);
            }

            \Log::info('[EXCEL SIAF] Procesando archivo', [
                'filename' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'extension' => $ext,
                'path' => $file->getRealPath()
            ]);

            // Leer el Excel
            try {
                $spreadsheet = IOFactory::load($file->getRealPath());
            } catch (\Exception $e) {
                \Log::error('[EXCEL SIAF] Error cargando spreadsheet', [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]);
                return response()->json([
                    'success' => false,
                    'error' => 'No se pudo leer el archivo Excel. Verifica que sea un archivo válido descargado de SIAF. Detalle: ' . $e->getMessage()
                ], 500);
            }

            $worksheet = $spreadsheet->getActiveSheet();

            // Extraer datos de la tabla
            $datos = [];
            $infoSiaf = [];

            // Obtener las filas de forma correcta
            $highestRow = $worksheet->getHighestRow();
            $highestColumn = $worksheet->getHighestColumn();

            for ($row = 2; $row <= $highestRow; $row++) {
                // Obtener valores de celdas
                $ciclo = $worksheet->getCell("A{$row}")->getValue();
                $fase = $worksheet->getCell("B{$row}")->getValue();
                $secuencia = $worksheet->getCell("C{$row}")->getValue();
                $correlativo = $worksheet->getCell("D{$row}")->getValue();
                $codDoc = $worksheet->getCell("E{$row}")->getValue();
                $numDoc = $worksheet->getCell("F{$row}")->getValue();
                $fecha = $worksheet->getCell("G{$row}")->getValue();
                $ff = $worksheet->getCell("H{$row}")->getValue();
                $moneda = $worksheet->getCell("I{$row}")->getValue();
                $monto = $worksheet->getCell("J{$row}")->getValue();
                $estado = $worksheet->getCell("K{$row}")->getValue();
                $fechaHora = $worksheet->getCell("L{$row}")->getValue();

                // Si la fila tiene al menos datos básicos, procesarla
                if ($ciclo || $fase || $secuencia) {
                    $row_data = [
                        'ciclo' => trim((string)$ciclo),
                        'fase' => trim((string)$fase),
                        'secuencia' => trim((string)$secuencia),
                        'correlativo' => trim((string)$correlativo),
                        'codDoc' => trim((string)$codDoc),
                        'numDoc' => trim((string)$numDoc),
                        'fecha' => $this->formatExcelDate($fecha),
                        'ff' => trim((string)$ff),
                        'moneda' => trim((string)$moneda),
                        'monto' => trim((string)$monto),
                        'estado' => trim((string)$estado),
                        'fechaHora' => $this->formatExcelDate($fechaHora),
                    ];

                    $datos[] = $row_data;

                    // Usar el ÚLTIMO registro con datos válidos como referencia
                    if ($fase && $estado) {
                        $infoSiaf = [
                            'fase' => $fase,
                            'estado' => $estado,
                            'fechaProceso' => $this->formatExcelDate($fechaHora),
                        ];
                    }
                }
            }

            // Validar que se extrajeron datos
            if (empty($datos)) {
                \Log::warning('[EXCEL SIAF] No se encontraron datos en el Excel');
                return response()->json([
                    'success' => false,
                    'error' => 'El archivo Excel no contiene datos válidos. Verifica que sea un archivo descargado desde SIAF.'
                ], 422);
            }

            \Log::info('[EXCEL SIAF] ✓ Datos extraídos correctamente', [
                'rows' => count($datos),
                'hasSiafInfo' => !empty($infoSiaf)
            ]);

            return response()->json([
                'success' => true,
                'error' => null,
                'datos' => $datos,
                'info_siaf' => $infoSiaf,
                'timestamp' => now()->toIso8601String(),
            ]);

        } catch (\Exception $e) {
            \Log::error('[EXCEL SIAF] Error procesando archivo', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error al procesar el archivo: ' . $e->getMessage()
            ], 500);
        }
    }
}
