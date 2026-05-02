<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeudaEntidad;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AlertasEntregaController extends Controller
{
    public function vencimientos(Request $request)
    {
        // Misma autenticación por token que AlertasController
        $token    = $request->header('X-Alertas-Token') ?: $request->query('token');
        $expected = config('services.alertas.token');

        if (!$expected || $token !== $expected) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $dias  = (int) ($request->query('dias', 7));
        $hoy   = Carbon::today();
        $hasta = Carbon::today()->addDays($dias);
        $ayer  = Carbon::yesterday();

        $ordenes = DeudaEntidad::where('cerrado', false)
            ->whereNotNull('fecha_limite_entrega')
            ->where('fecha_limite_entrega', '>=', $ayer)
            ->where('fecha_limite_entrega', '<=', $hasta)
            ->whereHas('deuda', fn($q) => $q->whereNotIn('estado', ['pagada', 'cancelada', 'pagado_banco']))
            ->with(['deuda.user', 'entidad'])
            ->orderBy('fecha_limite_entrega')
            ->get()
            ->map(function ($oe) use ($hoy) {
                $fecha = Carbon::parse($oe->fecha_limite_entrega);
                $dias  = (int) $hoy->diffInDays($fecha, false);
                $sym   = 'S/';
                $monto = 0;
                if ($oe->deuda) {
                    $sym   = ($oe->deuda->currency_code ?? 'PEN') === 'USD' ? '$' : 'S/';
                    $monto = $oe->deuda->monto_total;
                }
                return [
                    'id'                   => $oe->id,
                    'orden_compra'         => $oe->orden_compra ?? 'Sin N°',
                    'entidad'              => $oe->entidad ? $oe->entidad->razon_social : 'Sin entidad',
                    'producto_servicio'    => $oe->producto_servicio ?? '-',
                    'empresa_factura'      => $oe->empresa_factura ?? null,
                    'estado_seguimiento'   => $oe->estado_seguimiento ?? 'emitido',
                    'monto'                => $sym . ' ' . number_format($monto, 2),
                    'fecha_limite_entrega' => $fecha->format('d/m/Y'),
                    'dias_restantes'       => $dias,
                    'responsable'          => $oe->deuda && $oe->deuda->user
                        ? $oe->deuda->user->name
                        : 'Sistema',
                ];
            });

        return response()->json([
            'generado'      => now()->format('d/m/Y H:i'),
            'ordenes'       => $ordenes,
            'total_alertas' => $ordenes->count(),
        ]);
    }
}
