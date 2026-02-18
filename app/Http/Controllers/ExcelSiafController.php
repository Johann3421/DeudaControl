<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ExcelSiafController extends Controller
{
    /**
     * Procesa un archivo Excel descargado desde SIAF
     * POST /api/siaf/upload-excel
     */
    public function uploadExcel(Request $request)
    {
        try {
            // Validar que existe el archivo
            $request->validate([
                'file' => 'required|file|mimes:xlsx,xls,csv'
            ]);

            $file = $request->file('file');

            \Log::info('[EXCEL SIAF] Procesando archivo', [
                'filename' => $file->getClientOriginalName(),
                'size' => $file->getSize()
            ]);

            // Leer el Excel
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();

            // Extraer datos de la tabla
            $datos = [];
            $infoSiaf = [];

            // Iterar filas (empezar desde fila 2, saltando header)
            foreach ($worksheet->getIterator() as $row) {
                $rowIndex = $row->getRowIndex();
                
                // Saltar header (fila 1)
                if ($rowIndex === 1) continue;

                // Obtener valores de celdas
                $ciclo = $worksheet->getCell("A{$rowIndex}")->getValue();
                $fase = $worksheet->getCell("B{$rowIndex}")->getValue();
                $secuencia = $worksheet->getCell("C{$rowIndex}")->getValue();
                $correlativo = $worksheet->getCell("D{$rowIndex}")->getValue();
                $codDoc = $worksheet->getCell("E{$rowIndex}")->getValue();
                $numDoc = $worksheet->getCell("F{$rowIndex}")->getValue();
                $fecha = $worksheet->getCell("G{$rowIndex}")->getValue();
                $ff = $worksheet->getCell("H{$rowIndex}")->getValue();
                $moneda = $worksheet->getCell("I{$rowIndex}")->getValue();
                $monto = $worksheet->getCell("J{$rowIndex}")->getValue();
                $estado = $worksheet->getCell("K{$rowIndex}")->getValue();
                $fechaHora = $worksheet->getCell("L{$rowIndex}")->getValue();

                // Si la fila tiene al menos datos básicos, procesarla
                if ($ciclo || $fase || $secuencia) {
                    $row_data = [
                        'ciclo' => trim((string)$ciclo),
                        'fase' => trim((string)$fase),
                        'secuencia' => trim((string)$secuencia),
                        'correlativo' => trim((string)$correlativo),
                        'codDoc' => trim((string)$codDoc),
                        'numDoc' => trim((string)$numDoc),
                        'fecha' => trim((string)$fecha),
                        'ff' => trim((string)$ff),
                        'moneda' => trim((string)$moneda),
                        'monto' => trim((string)$monto),
                        'estado' => trim((string)$estado),
                        'fechaHora' => trim((string)$fechaHora),
                    ];

                    $datos[] = $row_data;

                    // Usar la primera fila con datos como referencia
                    if (count($infoSiaf) === 0 && $fase && $estado) {
                        $infoSiaf = [
                            'fase' => $fase,
                            'estado' => $estado,
                            'fechaProceso' => !empty($fechaHora) ? explode(' ', $fechaHora)[0] : $fecha,
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
