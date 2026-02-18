<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class SiafScraperController extends Controller
{
    /**
     * Extrae datos de la tabla expedienteDetalles de SIAF
     * POST /api/siaf/scrape
     */
    public function scrapeTable(Request $request)
    {
        try {
            // Validar parámetros
            $validated = $request->validate([
                'url' => 'required|url',
            ]);

            $url = $validated['url'];

            \Log::info('[SIAF SCRAPER] Iniciando scraping', [
                'url' => $url
            ]);

            // Ruta al script Python
            $pythonScript = base_path('scripts/extract_siaf_table.py');

            if (!file_exists($pythonScript)) {
                \Log::error('[SIAF SCRAPER] Script no encontrado', [
                    'path' => $pythonScript
                ]);
                return response()->json([
                    'success' => false,
                    'error' => 'Script de extracción no disponible'
                ], 500);
            }

            // Ejecutar script Python
            $process = new Process(['python', $pythonScript, $url]);
            $process->setTimeout(40);
            $process->run();

            if (!$process->isSuccessful()) {
                $error = $process->getErrorOutput();
                \Log::error('[SIAF SCRAPER] Error en proceso Python', [
                    'error' => $error
                ]);
                return response()->json([
                    'success' => false,
                    'error' => 'Error ejecutando scraper: ' . $error
                ], 500);
            }

            // Parsear resultado JSON
            $output = $process->getOutput();
            $result = json_decode($output, true);

            \Log::info('[SIAF SCRAPER] Resultado obtenido', [
                'success' => $result['success'] ?? false,
                'rows' => count($result['datos'] ?? [])
            ]);

            return response()->json($result);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Parámetros inválidos',
                'messages' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('[SIAF SCRAPER] Excepción general', [
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
