<?php

namespace App\Services;

use App\Models\Deuda;
use App\Models\DeudaAlquiler;
use App\Models\Inmueble;
use App\Models\Movimiento;
use App\Models\ReciboAlquiler;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeudaAlquilerService
{
    public function __construct(
        private DeudaHistorialService $historialService
    ) {}

    public function crear(array $datos): Deuda
    {
        return DB::transaction(function () use ($datos) {
            Inmueble::where('id', $datos['inmueble_id'])
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $deuda = Deuda::create([
                'user_id' => Auth::id(),
                'tipo_deuda' => 'alquiler',
                'cliente_id' => $datos['cliente_id'],
                'descripcion' => $datos['descripcion'],
                'monto_total' => $datos['monto_mensual'],
                'monto_pendiente' => $datos['monto_mensual'],
                'tasa_interes' => 0,
                'fecha_inicio' => $datos['fecha_inicio_contrato'],
                'fecha_vencimiento' => $datos['fecha_corte'] ?? null,
                'frecuencia_pago' => $datos['periodicidad'] ?? 'mensual',
                'notas' => $datos['notas'] ?? null,
            ]);

            $alquiler = DeudaAlquiler::create([
                'deuda_id' => $deuda->id,
                'inmueble_id' => $datos['inmueble_id'],
                'monto_mensual' => $datos['monto_mensual'],
                'periodicidad' => $datos['periodicidad'] ?? 'mensual',
                'fecha_inicio_contrato' => $datos['fecha_inicio_contrato'],
                'fecha_corte' => $datos['fecha_corte'] ?? null,
                'servicios_incluidos' => $datos['servicios_incluidos'] ?? null,
            ]);

            // Generate first receipt
            $this->generarRecibo($alquiler);

            Movimiento::create([
                'user_id' => Auth::id(),
                'tipo' => 'prestamo_otorgado',
                'referencia_tipo' => 'deuda',
                'referencia_id' => $deuda->id,
                'monto' => $datos['monto_mensual'],
                'descripcion' => "Alquiler registrado: {$datos['descripcion']}",
            ]);

            $this->historialService->registrarCreacion($deuda);

            return $deuda->load('deudaAlquiler.inmueble', 'deudaAlquiler.recibos');
        });
    }

    public function actualizar(Deuda $deuda, array $datos): Deuda
    {
        return DB::transaction(function () use ($deuda, $datos) {
            $originales = $deuda->getOriginal();

            $deuda->update(array_filter([
                'descripcion' => $datos['descripcion'] ?? null,
                'notas' => $datos['notas'] ?? null,
                'estado' => $datos['estado'] ?? null,
            ], fn($v) => $v !== null));

            $extension = $deuda->deudaAlquiler;
            if ($extension) {
                $extension->update(array_filter([
                    'monto_mensual' => $datos['monto_mensual'] ?? null,
                    'periodicidad' => $datos['periodicidad'] ?? null,
                    'fecha_corte' => $datos['fecha_corte'] ?? null,
                    'servicios_incluidos' => $datos['servicios_incluidos'] ?? null,
                ], fn($v) => $v !== null));
            }

            $this->historialService->registrarActualizacion($deuda, $originales);

            return $deuda->fresh(['deudaAlquiler.inmueble', 'deudaAlquiler.recibos']);
        });
    }

    public function generarRecibo(DeudaAlquiler $alquiler): ReciboAlquiler
    {
        $ultimoRecibo = $alquiler->recibos()->orderBy('periodo_fin', 'desc')->first();

        if ($ultimoRecibo) {
            $periodoInicio = $ultimoRecibo->periodo_fin->addDay();
        } else {
            $periodoInicio = $alquiler->fecha_inicio_contrato;
        }

        $mesesPorPeriodo = match ($alquiler->periodicidad) {
            'mensual' => 1,
            'bimestral' => 2,
            'trimestral' => 3,
            default => 1,
        };

        $periodoFin = $periodoInicio->copy()->addMonths($mesesPorPeriodo)->subDay();

        $totalRecibos = $alquiler->recibos()->count();
        $numeroRecibo = 'REC-' . str_pad($alquiler->id, 4, '0', STR_PAD_LEFT) . '-' . str_pad($totalRecibos + 1, 4, '0', STR_PAD_LEFT);

        return ReciboAlquiler::create([
            'deuda_alquiler_id' => $alquiler->id,
            'numero_recibo' => $numeroRecibo,
            'monto' => $alquiler->monto_mensual * $mesesPorPeriodo,
            'periodo_inicio' => $periodoInicio,
            'periodo_fin' => $periodoFin,
            'estado' => 'pendiente',
        ]);
    }

    public function marcarReciboPagado(ReciboAlquiler $recibo): ReciboAlquiler
    {
        return DB::transaction(function () use ($recibo) {
            $recibo->update([
                'estado' => 'pagado',
                'fecha_pago' => now(),
            ]);

            $alquiler = $recibo->deudaAlquiler;
            $deuda = $alquiler->deuda;

            $pendientes = $alquiler->recibosPendientes()->count();
            if ($pendientes === 0) {
                $deuda->update(['monto_pendiente' => 0, 'estado' => 'pagada']);
            } else {
                $totalPendiente = $alquiler->recibosPendientes()->sum('monto');
                $deuda->update(['monto_pendiente' => $totalPendiente]);
            }

            $this->historialService->registrarPago($deuda, $recibo->monto);

            return $recibo->fresh();
        });
    }
}
