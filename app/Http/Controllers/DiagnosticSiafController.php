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
            'curl_errno' => null,
            'curl_error' => null,
            'response_headers' => [],
            'connection_info' => [],
        ];

        try {
            $ch = curl_init();
            $start = microtime(true);

            // Use config timeouts (30s in production, 20s in dev)
            $timeout = config('services.siaf.timeout', 20);
            $connectTimeout = config('services.siaf.connect_timeout', 10);

            curl_setopt_array($ch, [
                CURLOPT_URL => $result['endpoint'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $timeout,
                CURLOPT_CONNECTTIMEOUT => $connectTimeout,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_VERBOSE => true,
                CURLOPT_STDERR => $verbose = fopen('php://temp', 'w+'),
                CURLOPT_HTTPHEADER => [
                    'User-Agent: Mozilla/5.0 (Diagnostic Test)',
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                ],
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlErrno = curl_errno($ch);
            $curlError = curl_error($ch);
            $duration = (microtime(true) - $start) * 1000;
            
            // Get verbose output (DNS, SSL handshake info)
            rewind($verbose);
            $verboseLog = stream_get_contents($verbose);
            fclose($verbose);

            curl_close($ch);

            $result['http_code'] = $httpCode;
            $result['response_time_ms'] = round($duration, 2);
            $result['curl_errno'] = $curlErrno;
            $result['curl_error'] = $curlError;
            $result['timeout_seconds'] = $timeout;
            $result['connect_timeout_seconds'] = $connectTimeout;
            $result['response_size_bytes'] = strlen($response ?? '');
            
            // Parse verbose output for connection info
            $verboseLines = array_filter(array_map('trim', explode("\n", $verboseLog)));
            $result['verbose_log'] = array_slice($verboseLines, 0, 20); // First 20 lines of verbose output

            if ($curlErrno === 0 && !empty($response)) {
                $result['success'] = true;
            } else {
                // Map common curl errno to readable messages
                $errnoMessages = [
                    6 => 'Could not resolve host name (DNS issue)',
                    7 => 'Failed to connect to host',
                    28 => 'Operation timeout - SIAF server too slow or network issue',
                    35 => 'SSL/TLS connection error',
                    60 => 'SSL certificate problem with peer verification',
                ];
                
                $userMessage = $errnoMessages[$curlErrno] ?? "cURL Error $curlErrno: $curlError";
                $result['errors'][] = $userMessage;
                
                if ($httpCode && $httpCode !== 0) {
                    $result['errors'][] = "HTTP Response Code: $httpCode";
                }
            }
        } catch (\Exception $e) {
            $result['errors'][] = "Exception: " . $e->getMessage();
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
