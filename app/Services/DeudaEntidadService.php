<?php

namespace App\Services;

use App\Models\Deuda;
use App\Models\DeudaEntidad;
use App\Models\Entidad;
use App\Models\Movimiento;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DeudaEntidadService
{
    public function __construct(
        private DeudaHistorialService $historialService
    ) {}

    public function crear(array $datos): Deuda
    {
        return DB::transaction(function () use ($datos) {
            $entidad = Entidad::where('id', $datos['entidad_id'])
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $deuda = Deuda::create([
                'user_id' => Auth::id(),
                'tipo_deuda' => 'entidad',
                'cliente_id' => null,
                'descripcion' => $datos['descripcion'],
                'monto_total' => $datos['monto_total'],
                'monto_pendiente' => $datos['monto_total'],
                'tasa_interes' => 0,
                'fecha_inicio' => $datos['fecha_emision'],
                'fecha_vencimiento' => $datos['fecha_limite_pago'],
                'frecuencia_pago' => 'unico',
                'notas' => $datos['notas'] ?? null,
                'currency_code' => $datos['currency_code'] ?? 'PEN',
            ]);

            DeudaEntidad::create([
                'deuda_id' => $deuda->id,
                'entidad_id' => $datos['entidad_id'],
                'orden_compra' => $datos['orden_compra'],
                'fecha_emision' => $datos['fecha_emision'],
                'producto_servicio' => $datos['producto_servicio'],
                'codigo_siaf' => $datos['codigo_siaf'] ?? null,
                'fecha_limite_pago' => $datos['fecha_limite_pago'],
                'estado_seguimiento' => 'emitido',
                // Campos SIAF
                'estado_siaf' => $datos['estado_siaf'] ?? null,
                'fase_siaf' => $datos['fase_siaf'] ?? null,
                'estado_expediente' => $datos['estado_expediente'] ?? null,
                'fecha_proceso' => $datos['fecha_proceso'] ?? null,
            ]);

            Movimiento::create([
                'user_id' => Auth::id(),
                'tipo' => 'prestamo_otorgado',
                'referencia_tipo' => 'deuda',
                'referencia_id' => $deuda->id,
                'monto' => $deuda->monto_total,
                'descripcion' => "Deuda con entidad {$entidad->razon_social}: {$datos['producto_servicio']}",
            ]);

            $this->historialService->registrarCreacion($deuda);

            return $deuda->load('deudaEntidad.entidad');
        });
    }

    public function actualizar(Deuda $deuda, array $datos): Deuda
    {
        return DB::transaction(function () use ($deuda, $datos) {
            $extension = $deuda->deudaEntidad;

            if ($extension && !$extension->estaEditable()) {
                throw new \DomainException('Esta deuda de entidad esta cerrada y no puede editarse.');
            }

            $originales = $deuda->getOriginal();

            $deuda->update([
                'descripcion' => $datos['descripcion'] ?? $deuda->descripcion,
                'notas' => $datos['notas'] ?? $deuda->notas,
                'estado' => $datos['estado'] ?? $deuda->estado,
                'currency_code' => $datos['currency_code'] ?? $deuda->currency_code,
            ]);

            if ($extension) {
                $extension->update(array_filter([
                    'producto_servicio' => $datos['producto_servicio'] ?? null,
                    'codigo_siaf' => $datos['codigo_siaf'] ?? null,
                    'fecha_limite_pago' => $datos['fecha_limite_pago'] ?? null,
                    'estado_siaf' => $datos['estado_siaf'] ?? null,
                    'fase_siaf' => $datos['fase_siaf'] ?? null,
                    'estado_expediente' => $datos['estado_expediente'] ?? null,
                    'fecha_proceso' => $datos['fecha_proceso'] ?? null,
                ], fn($v) => $v !== null));
            }

            $this->historialService->registrarActualizacion($deuda, $originales);

            return $deuda->fresh(['deudaEntidad.entidad']);
        });
    }

    public function cambiarEstadoSeguimiento(DeudaEntidad $deudaEntidad, string $nuevoEstado): DeudaEntidad
    {
        return DB::transaction(function () use ($deudaEntidad, $nuevoEstado) {
            $estadoAnterior = $deudaEntidad->estado_seguimiento;

            $deudaEntidad->update(['estado_seguimiento' => $nuevoEstado]);

            if ($nuevoEstado === 'pagado') {
                $deudaEntidad->update(['cerrado' => true]);
                $deudaEntidad->deuda->update([
                    'estado' => 'pagada',
                    'monto_pendiente' => 0,
                ]);
            }

            $this->historialService->registrar(
                $deudaEntidad->deuda,
                'cambio_seguimiento',
                ['estado_seguimiento' => $estadoAnterior],
                ['estado_seguimiento' => $nuevoEstado],
                "Seguimiento: {$estadoAnterior} -> {$nuevoEstado}"
            );

            return $deudaEntidad->fresh();
        });
    }
}
