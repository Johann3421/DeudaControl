<?php

namespace App\Console\Commands;

use App\Jobs\SendWhatsAppNotificationJob;
use App\Models\Deuda;
use Illuminate\Console\Command;

class CheckVencimientosCommand extends Command
{
    protected $signature = 'deudas:check-vencimientos {--dias=3 : Dias antes del vencimiento para notificar}';
    protected $description = 'Revisa deudas proximas a vencer y envia notificaciones WhatsApp';

    public function handle(): int
    {
        $diasAntes = (int) $this->option('dias');

        $fechaLimite = now()->addDays($diasAntes);

        $deudas = Deuda::where('estado', 'activa')
            ->where('monto_pendiente', '>', 0)
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '<=', $fechaLimite)
            ->where('fecha_vencimiento', '>=', now())
            ->whereDoesntHave('notificaciones', function ($q) {
                $q->where('canal', 'whatsapp')
                  ->where('estado', 'enviada')
                  ->where('created_at', '>=', now()->subDays(1));
            })
            ->with(['cliente', 'deudaEntidad.entidad'])
            ->get();

        $this->info("Encontradas {$deudas->count()} deudas proximas a vencer.");

        foreach ($deudas as $deuda) {
            SendWhatsAppNotificationJob::dispatch($deuda, 'vencimiento');
            $this->line("  - Notificacion programada: {$deuda->descripcion}");
        }

        $this->info('Proceso completado.');

        return Command::SUCCESS;
    }
}
