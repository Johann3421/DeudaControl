<?php

namespace App\Console\Commands;

use App\Models\DeudaEntidad;
use App\Models\OrdenCompra;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CerrarDeudasFasePCommand extends Command
{
    protected $signature = 'deudas:cerrar-fase-p {--dry-run : Muestra los registros que se actualizarían sin aplicar cambios}';
    protected $description = 'Cierra automáticamente deudas, deuda_entidades y órdenes vinculadas que tienen fase_siaf = P (Pagado en cuenta)';

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $pendientes = DeudaEntidad::with(['deuda', 'entidad'])
            ->where('fase_siaf', 'P')
            ->where(function ($q) {
                $q->where('cerrado', false)
                  ->orWhereNull('cerrado')
                  ->orWhereHas('deuda', fn($d) => $d->whereNotIn('estado', ['pagada', 'pagado_banco']));
            })
            ->get();

        if ($pendientes->isEmpty()) {
            $this->info('No hay deudas con fase P pendientes de cerrar.');
            return 0;
        }

        $this->table(
            ['ID Deuda', 'Entidad', 'Orden Compra', 'Estado actual', 'Cerrado', 'Órdenes abiertas'],
            $pendientes->map(function ($de) {
                $ordenesAbiertas = OrdenCompra::where('deuda_id', $de->deuda_id)
                    ->where('estado', '!=', 'pagado')
                    ->count();
                return [
                    $de->deuda_id,
                    optional($de->entidad)->razon_social ?? '-',
                    $de->orden_compra,
                    $de->deuda->estado ?? '-',
                    $de->cerrado ? 'Sí' : 'No',
                    $ordenesAbiertas,
                ];
            })->toArray()
        );

        if ($dryRun) {
            $this->warn('Modo --dry-run: no se aplicó ningún cambio.');
            return 0;
        }

        if (!$this->confirm("¿Cerrar los {$pendientes->count()} registro(s) listados?", true)) {
            $this->info('Operación cancelada.');
            return 0;
        }

        $cerradas = 0;
        $ordenesCerradas = 0;

        DB::transaction(function () use ($pendientes, &$cerradas, &$ordenesCerradas) {
            foreach ($pendientes as $de) {
                // Cerrar la deuda
                $de->deuda->update([
                    'estado'          => 'pagado_banco',
                    'monto_pendiente' => 0,
                ]);

                // Cerrar la deuda_entidad
                $de->update([
                    'cerrado'           => true,
                    'estado_seguimiento' => 'pagado',
                ]);

                // Cerrar órdenes vinculadas
                $updated = OrdenCompra::where('deuda_id', $de->deuda_id)
                    ->where('estado', '!=', 'pagado')
                    ->update(['estado' => 'pagado']);

                $ordenesCerradas += $updated;
                $cerradas++;
            }
        });

        $this->info("✓ {$cerradas} deuda(s) cerrada(s).");
        $this->info("✓ {$ordenesCerradas} orden(es) de compra cerrada(s).");

        return 0;
    }
}
