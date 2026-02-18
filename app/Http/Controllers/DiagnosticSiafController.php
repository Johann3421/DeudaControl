<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class DiagnosticSiafController extends Controller
{
    /**
     * Diagnóstico completo del estado de SIAF
     */
    public function status(): JsonResponse
    {
        // Verificar conectividad básica
        $directTest = $this->testDirectConnection();
        $logs = $this->getRecentLogs();
        
        return response()->json([
            'status' => 'diagnostic',
            'timestamp' => now(),
            'environment' => app()->environment(),
            'direct_connection_test' => $directTest,
            'recent_logs' => $logs,
            'php_info' => [
                'version' => phpversion(),
                'curl_enabled' => function_exists('curl_init'),
                'openssl_enabled' => extension_loaded('openssl'),
                'timeout_functions' => function_exists('set_time_limit'),
            ],
        ]);
    }

    private function testDirectConnection(): array
    {
        $result = [
            'endpoint' => 'https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx',
            'success' => false,
            'errors' => [],
            'http_code' => null,
            'response_time_ms' => null,
        ];

        try {
            $ch = curl_init();
            $start = microtime(true);
            
            curl_setopt_array($ch, [
                CURLOPT_URL => $result['endpoint'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_HTTPHEADER => [
                    'User-Agent: Mozilla/5.0 (Diagnostic Test)',
                ],
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErrno = curl_errno($ch);
            $curlError = curl_error($ch);
            $duration = (microtime(true) - $start) * 1000;

            curl_close($ch);

            $result['http_code'] = $httpCode;
            $result['response_time_ms'] = round($duration, 2);

            if ($curlErrno !== 0) {
                $result['errors'][] = "cURL Error $curlErrno: $curlError";
            } elseif ($httpCode === 200 && !empty($response)) {
                $result['success'] = true;
            } else {
                $result['errors'][] = "HTTP $httpCode response";
            }
        } catch (\Exception $e) {
            $result['errors'][] = $e->getMessage();
        }

        return $result;
    }

    private function getRecentLogs(): array
    {
        $logFile = storage_path('logs/laravel.log');
        
        if (!file_exists($logFile)) {
            return ['error' => 'Log file not found'];
        }

        $lines = array_reverse(file($logFile));
        $siafLogs = [];
        $count = 0;

        foreach ($lines as $line) {
            if (stripos($line, 'SIAF') !== false || stripos($line, 'Directo') !== false) {
                $siafLogs[] = trim($line);
                $count++;
                if ($count >= 30) break;
            }
        }

        return array_reverse($siafLogs);
    }
}
