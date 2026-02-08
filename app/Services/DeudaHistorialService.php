<?php

namespace App\Services;

use App\Models\Deuda;
use App\Models\DeudaHistorial;
use Illuminate\Support\Facades\Auth;

class DeudaHistorialService
{
    public function registrar(Deuda $deuda, string $evento, ?array $datosAnteriores = null, ?array $datosNuevos = null, ?string $descripcion = null): DeudaHistorial
    {
        return DeudaHistorial::create([
            'deuda_id' => $deuda->id,
            'user_id' => Auth::id(),
            'evento' => $evento,
            'datos_anteriores' => $datosAnteriores,
            'datos_nuevos' => $datosNuevos,
            'descripcion' => $descripcion,
        ]);
    }

    public function registrarCreacion(Deuda $deuda): DeudaHistorial
    {
        return $this->registrar(
            $deuda,
            'creacion',
            null,
            $deuda->toArray(),
            "Deuda creada: {$deuda->descripcion}"
        );
    }

    public function registrarActualizacion(Deuda $deuda, array $datosOriginales): DeudaHistorial
    {
        $cambios = array_intersect_key($deuda->getChanges(), $datosOriginales);

        return $this->registrar(
            $deuda,
            'actualizacion',
            array_intersect_key($datosOriginales, $cambios),
            $cambios,
            "Deuda actualizada: {$deuda->descripcion}"
        );
    }

    public function registrarCambioEstado(Deuda $deuda, string $estadoAnterior): DeudaHistorial
    {
        return $this->registrar(
            $deuda,
            'cambio_estado',
            ['estado' => $estadoAnterior],
            ['estado' => $deuda->estado],
            "Estado cambiado de {$estadoAnterior} a {$deuda->estado}"
        );
    }

    public function registrarPago(Deuda $deuda, float $monto): DeudaHistorial
    {
        return $this->registrar(
            $deuda,
            'pago_registrado',
            null,
            ['monto_pago' => $monto, 'monto_pendiente' => $deuda->monto_pendiente],
            "Pago de \${$monto} registrado"
        );
    }
}
