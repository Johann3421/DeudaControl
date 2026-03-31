<?php

namespace App\Console\Commands;

use App\Models\Deuda;
use App\Models\DeudaEntidad;
use App\Services\WhatsApp\Contracts\WhatsAppProviderInterface;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class NotificarVencimientosCommand extends Command
{
    protected $signature   = 'notificaciones:vencimientos
                                {--dias=7 : Notificar deudas/órdenes que vencen en los próximos N días}
                                {--dry-run : Solo mostrar lo que se enviaría, sin enviar}';

    protected $description = 'Envía notificaciones WhatsApp al grupo sobre deudas y órdenes próximas a vencer';

    public function __construct(
        private WhatsAppProviderInterface $provider
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $groupId = config('services.whatsapp.group_id', '');
        $dias    = (int) $this->option('dias');
        $dryRun  = $this->option('dry-run');

        if (empty($groupId)) {
            $this->warn('WHATSAPP_GROUP_ID no está configurado. Abortando.');
            Log::warning('NotificarVencimientos: WHATSAPP_GROUP_ID vacío.');
            return Command::FAILURE;
        }

        $hoy   = Carbon::today();
        $hasta = $hoy->copy()->addDays($dias);

        // ── 1. Deudas activas próximas a vencer ─────────────────────────────
        $deudas = Deuda::with(['cliente', 'deudaEntidad.entidad'])
            ->where('estado', 'activa')
            ->whereBetween('fecha_vencimiento', [$hoy, $hasta])
            ->orderBy('fecha_vencimiento')
            ->get();

        // ── 2. Órdenes de compra próximas a vencer ──────────────────────────
        $ordenes = DeudaEntidad::with(['deuda', 'entidad'])
            ->where('cerrado', false)
            ->whereBetween('fecha_limite_pago', [$hoy, $hasta])
            ->whereHas('deuda', fn($q) => $q->whereIn('estado', ['activa', 'vencida']))
            ->orderBy('fecha_limite_pago')
            ->get();

        if ($deudas->isEmpty() && $ordenes->isEmpty()) {
            $this->info('No hay vencimientos próximos. No se envía nada.');
            return Command::SUCCESS;
        }

        $mensaje = $this->construirMensaje($deudas, $ordenes, $dias);

        $this->line($mensaje);

        if ($dryRun) {
            $this->info('[DRY RUN] Mensaje no enviado.');
            return Command::SUCCESS;
        }

        $enviado = $this->provider->sendToGroup($groupId, $mensaje);

        if ($enviado) {
            $this->info("Notificación enviada al grupo {$groupId}.");
            Log::info('NotificarVencimientos: mensaje enviado.', ['group' => $groupId]);
        } else {
            $this->error('Error al enviar la notificación al grupo.');
            Log::error('NotificarVencimientos: fallo al enviar.', ['group' => $groupId]);
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    private function construirMensaje($deudas, $ordenes, int $dias): string
    {
        $hoy = Carbon::today()->format('d/m/Y');
        $lineas = [];

        $lineas[] = "📋 *Control de Vencimientos* — {$hoy}";
        $lineas[] = "Próximos {$dias} días\n";

        // Deudas
        if ($deudas->isNotEmpty()) {
            $lineas[] = "💰 *DEUDAS POR COBRAR ({$deudas->count()})*";
            foreach ($deudas as $deuda) {
                $nombre = $deuda->esEntidad()
                    ? ($deuda->deudaEntidad?->entidad?->razon_social ?? 'N/A')
                    : ($deuda->cliente?->nombre_completo ?? 'N/A');
                $monto  = number_format((float) $deuda->monto_pendiente, 2, '.', ',');
                $fecha  = $deuda->fecha_vencimiento?->format('d/m/Y') ?? '—';
                $lineas[] = "• {$nombre}: S/ {$monto} — vence {$fecha}";
            }
            $lineas[] = '';
        }

        // Órdenes
        if ($ordenes->isNotEmpty()) {
            $lineas[] = "📄 *ÓRDENES PRÓXIMAS A VENCER ({$ordenes->count()})*";
            foreach ($ordenes as $orden) {
                $entidad = $orden->entidad?->razon_social ?? 'N/A';
                $oc      = $orden->orden_compra ?? '—';
                $monto   = $orden->deuda ? number_format((float) $orden->deuda->monto_total, 2, '.', ',') : '—';
                $fecha   = $orden->fecha_limite_pago?->format('d/m/Y') ?? '—';
                $siaf    = $orden->estado_siaf ? " [{$orden->estado_siaf}]" : '';
                $lineas[] = "• OC {$oc} | {$entidad}{$siaf}: S/ {$monto} — límite {$fecha}";
            }
            $lineas[] = '';
        }

        $lineas[] = "_Mensaje automático — DeudaControl_";

        return implode("\n", $lineas);
    }
}
