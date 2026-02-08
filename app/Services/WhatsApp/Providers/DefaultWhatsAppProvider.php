<?php

namespace App\Services\WhatsApp\Providers;

use App\Services\WhatsApp\Contracts\WhatsAppProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DefaultWhatsAppProvider implements WhatsAppProviderInterface
{
    private string $apiUrl;
    private string $apiToken;

    public function __construct()
    {
        $this->apiUrl = config('services.whatsapp.api_url', '');
        $this->apiToken = config('services.whatsapp.api_token', '');
    }

    public function send(string $to, string $message): bool
    {
        if (empty($this->apiUrl) || empty($this->apiToken)) {
            Log::warning('WhatsApp provider not configured. Message not sent.', [
                'to' => $to,
                'message' => $message,
            ]);
            return false;
        }

        try {
            $response = Http::withToken($this->apiToken)
                ->post($this->apiUrl . '/messages', [
                    'to' => $to,
                    'body' => $message,
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('WhatsApp send failed', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function sendToGroup(string $groupId, string $message): bool
    {
        if (empty($this->apiUrl) || empty($this->apiToken)) {
            Log::warning('WhatsApp provider not configured. Group message not sent.', [
                'group' => $groupId,
                'message' => $message,
            ]);
            return false;
        }

        try {
            $response = Http::withToken($this->apiToken)
                ->post($this->apiUrl . '/groups/' . $groupId . '/messages', [
                    'body' => $message,
                ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('WhatsApp group send failed', [
                'group' => $groupId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
