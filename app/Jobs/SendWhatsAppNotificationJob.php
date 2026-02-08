<?php

namespace App\Jobs;

use App\Models\Deuda;
use App\Services\WhatsApp\WhatsAppNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWhatsAppNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        private Deuda $deuda,
        private string $tipo = 'vencimiento'
    ) {}

    public function handle(WhatsAppNotificationService $service): void
    {
        match ($this->tipo) {
            'vencimiento' => $service->enviarRecordatorioVencimiento($this->deuda),
            default => null,
        };
    }
}
