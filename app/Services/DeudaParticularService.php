<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Deuda;
use App\Models\Movimiento;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeudaParticularService
{
    public function __construct(
        private DeudaHistorialService $historialService
    ) {}

    public function crear(array $datos): Deuda
    {
        return DB::transaction(function () use ($datos) {
            $cliente = Cliente::where('id', $datos['cliente_id'])
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $deuda = Deuda::create([
                'user_id' => Auth::id(),
                'tipo_deuda' => 'particular',
                'cliente_id' => $datos['cliente_id'],
                'descripcion' => $datos['descripcion'],
                'monto_total' => $datos['monto_total'],
                'monto_pendiente' => $datos['monto_total'],
                'tasa_interes' => $datos['tasa_interes'] ?? 0,
                'fecha_inicio' => $datos['fecha_inicio'],
                'fecha_vencimiento' => $datos['fecha_vencimiento'] ?? null,
                'frecuencia_pago' => $datos['frecuencia_pago'] ?? 'mensual',
                'numero_cuotas' => $datos['numero_cuotas'] ?? null,
                'notas' => $datos['notas'] ?? null,
            ]);

            Movimiento::create([
                'user_id' => Auth::id(),
                'tipo' => 'prestamo_otorgado',
                'referencia_tipo' => 'deuda',
                'referencia_id' => $deuda->id,
                'monto' => $deuda->monto_total,
                'descripcion' => "Prestamo otorgado a {$cliente->nombre_completo}: {$deuda->descripcion}",
            ]);

            $this->historialService->registrarCreacion($deuda);

            return $deuda;
        });
    }

    public function actualizar(Deuda $deuda, array $datos): Deuda
    {
        return DB::transaction(function () use ($deuda, $datos) {
            $originales = $deuda->getOriginal();

            $deuda->update($datos);

            $this->historialService->registrarActualizacion($deuda, $originales);

            return $deuda->fresh();
        });
    }
}
