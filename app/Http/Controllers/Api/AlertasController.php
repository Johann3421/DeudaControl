<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deuda;
use App\Models\DeudaEntidad;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AlertasController extends Controller
{
    public function vencimientos(Request $request)
    {
        // Autenticación por token simple (sin sesión, sin CSRF)
        $token = $request->header('X-Alertas-Token') ?: $request->query('token');
        $expected = config('services.alertas.token');

        if (!$expected || $token !== $expected) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $hoy  = Carbon::today();
        $en7  = Carbon::today()->addDays(7);
        $ayer = Carbon::yesterday(); // Incluye vencidos de ayer

        // ── Deudas activas próximas a vencer ─────────────────────────────────
        $deudas = Deuda::where('estado', 'activa')
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '>=', $ayer)
            ->where('fecha_vencimiento', '<=', $en7)
            ->with(['cliente', 'user'])
            ->orderBy('fecha_vencimiento')
            ->get()
            ->map(function ($d) use ($hoy) {
                $venc = Carbon::parse($d->fecha_vencimiento);
                $dias = (int) $hoy->diffInDays($venc, false);
                $sym  = ($d->currency_code ?? 'PEN') === 'USD' ? '$' : 'S/';
                return [
                    'id'               => $d->id,
                    'descripcion'      => $d->descripcion,
                    'cliente'          => $d->cliente
                        ? trim($d->cliente->nombre . ' ' . ($d->cliente->apellido ?? ''))
                        : 'Sin cliente',
                    'monto'            => $sym . ' ' . number_format($d->monto_pendiente, 2),
                    'fecha_vencimiento'=> $venc->format('d/m/Y'),
                    'dias_restantes'   => $dias,
                    'responsable'      => $d->user ? $d->user->name : 'Sistema',
                ];
            });

        // ── Órdenes de entidad no cerradas próximas al límite de pago ────────
        $ordenes = DeudaEntidad::where('cerrado', false)
            ->whereNotNull('fecha_limite_pago')
            ->where('fecha_limite_pago', '>=', $ayer)
            ->where('fecha_limite_pago', '<=', $en7)
            ->whereHas('deuda', fn($q) => $q->whereNotIn('estado', ['pagada', 'cancelada']))
            ->with(['deuda.user', 'entidad'])
            ->orderBy('fecha_limite_pago')
            ->get()
            ->map(function ($oe) use ($hoy) {
                $venc = Carbon::parse($oe->fecha_limite_pago);
                $dias = (int) $hoy->diffInDays($venc, false);
                $monto = 0;
                $sym   = 'S/';
                if ($oe->deuda) {
                    $sym   = ($oe->deuda->currency_code ?? 'PEN') === 'USD' ? '$' : 'S/';
                    $monto = $oe->deuda->monto_pendiente;
                }
                return [
                    'id'                 => $oe->id,
                    'orden_compra'       => $oe->orden_compra ?? 'Sin N°',
                    'entidad'            => $oe->entidad ? $oe->entidad->razon_social : 'Sin entidad',
                    'producto_servicio'  => $oe->producto_servicio ?? '-',
                    'empresa_factura'    => $oe->empresa_factura ?? null,
                    'estado_seguimiento' => $oe->estado_seguimiento ?? 'emitido',
                    'monto'              => $sym . ' ' . number_format($monto, 2),
                    'fecha_limite_pago'  => $venc->format('d/m/Y'),
                    'dias_restantes'     => $dias,
                    'responsable'        => $oe->deuda && $oe->deuda->user
                        ? $oe->deuda->user->name
                        : 'Sistema',
                ];
            });

        return response()->json([
            'generado'      => now()->format('d/m/Y H:i'),
            'deudas'        => $deudas,
            'ordenes'       => $ordenes,
            'total_alertas' => count($deudas) + count($ordenes),
        ]);
    }
}
