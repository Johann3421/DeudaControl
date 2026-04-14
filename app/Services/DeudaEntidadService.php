<?php

namespace App\Services;

use App\Models\Deuda;
use App\Models\DeudaEntidad;
use App\Models\Entidad;
use App\Models\Movimiento;
use App\Models\OrdenCompra;
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
            $entidad = Entidad::findOrFail($datos['entidad_id']);

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
                'empresa_factura' => $datos['empresa_factura'] ?? null,
                'unidad_ejecutora' => $datos['unidad_ejecutora'] ?? null,
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

            $originales = $deuda->getOriginal();

            // Si la fase SIAF es P (Pagado en cuenta), forzar cierre automático
            $esFaseP = isset($datos['fase_siaf']) && $datos['fase_siaf'] === 'P';

            if ($esFaseP) {
                $datos['estado'] = 'pagado_banco';
                $datos['monto_pendiente'] = 0;
            }

            // Determinar nuevo estado y preparar campos a actualizar
            $nuevoEstado = $datos['estado'] ?? $deuda->estado;

            $updateData = [
                'descripcion' => $datos['descripcion'] ?? $deuda->descripcion,
                'notas' => $datos['notas'] ?? $deuda->notas,
                'estado' => $nuevoEstado,
                'currency_code' => $datos['currency_code'] ?? $deuda->currency_code,
            ];

            // Si el llamador pasó explícitamente monto_pendiente, respetarlo.
            if (array_key_exists('monto_pendiente', $datos)) {
                $updateData['monto_pendiente'] = $datos['monto_pendiente'];
            } elseif ($nuevoEstado === 'pagada') {
                // Si la deuda se marca como pagada, asegurarse que el pendiente sea 0
                $updateData['monto_pendiente'] = 0;
            }

            $deuda->update($updateData);

            if ($extension) {
                $extensionData = array_filter([
                    'producto_servicio' => $datos['producto_servicio'] ?? null,
                    'codigo_siaf' => $datos['codigo_siaf'] ?? null,
                    'fecha_limite_pago' => $datos['fecha_limite_pago'] ?? null,
                    'empresa_factura' => $datos['empresa_factura'] ?? null,
                    'unidad_ejecutora' => $datos['unidad_ejecutora'] ?? null,
                    'estado_siaf' => $datos['estado_siaf'] ?? null,
                    'fase_siaf' => $datos['fase_siaf'] ?? null,
                    'estado_expediente' => $datos['estado_expediente'] ?? null,
                    'fecha_proceso' => $datos['fecha_proceso'] ?? null,
                ], fn($v) => $v !== null);

                // Fase P: cerrar la deuda entidad automáticamente
                if ($esFaseP) {
                    $extensionData['cerrado'] = true;
                    $extensionData['estado_seguimiento'] = 'pagado';
                }

                $extension->update($extensionData);
            }

            // Fase P: cerrar todas las órdenes de compra vinculadas a esta deuda
            if ($esFaseP) {
                OrdenCompra::where('deuda_id', $deuda->id)
                    ->where('estado', '!=', 'pagado')
                    ->update(['estado' => 'pagado']);
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
                // Verificar que el jefe haya establecido la fase SIAF como 'P' antes de completar
                if ($deudaEntidad->fase_siaf !== 'P') {
                    throw new \DomainException('No se puede marcar como pagado hasta que el Jefe establezca la fase SIAF como P – Pagado en cuenta.');
                }
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
