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

        if (!$expected || !hash_equals($expected, $token ?? '')) {
            return response()->json([
                'error' => 'Unauthorized',
            ], 401);
        }

        // Zona horaria de Perú explícitamente (America/Lima)
        $tz    = 'America/Lima';
        $hoy   = Carbon::today($tz);
        $hace7 = Carbon::today($tz)->subDays(7); // Máximo 7 días de atraso
        $en7   = Carbon::today($tz)->addDays(7); // Próximos 7 días a vencer
        $en30  = Carbon::today($tz)->addDays(30);

        // ── 1. Deudas de Clientes / Particulares (Excluyendo 'entidad' para evitar duplicados) ──
        $deudas = Deuda::whereNotIn('estado', ['pagada', 'cancelada'])
            ->where('tipo_deuda', '!=', 'entidad')
            ->where('monto_pendiente', '>', 0)
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '>=', $hace7)
            ->where('fecha_vencimiento', '<=', $en7)
            ->with(['cliente', 'user'])
            ->orderBy('fecha_vencimiento')
            ->get()
            ->map(function ($d) use ($hoy, $tz) {
                $venc = Carbon::parse($d->fecha_vencimiento, $tz)->startOfDay();
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

        // ── 2. Órdenes de Entidad (Deudas institucionales/licitaciones) ──────
        $ordenes = DeudaEntidad::where('cerrado', false)
            ->where(function ($query) {
                $query->whereNotIn('estado_seguimiento', [
                    'pagado', 'Pagado', 'PAGADO'
                ])->orWhereNull('estado_seguimiento');
            })
            ->whereNotNull('fecha_limite_pago')
            ->where('fecha_limite_pago', '>=', $hace7)
            ->where('fecha_limite_pago', '<=', $en7)
            ->whereHas('deuda', fn($q) => $q->whereNotIn('estado', ['pagada', 'cancelada'])->where('monto_pendiente', '>', 0))
            ->with(['deuda.user', 'entidad'])
            ->orderBy('fecha_limite_pago')
            ->get()
            ->map(function ($oe) use ($hoy, $tz) {
                $venc = Carbon::parse($oe->fecha_limite_pago, $tz)->startOfDay();
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

        // ── 3. Recibos de Luz y Agua pendientes ──────────────────────────────
        $recibos = \App\Models\ReciboLuzAgua::where('estado', 'pendiente')
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '>=', $hace7)
            ->where('fecha_vencimiento', '<=', $en7)
            ->orderBy('fecha_vencimiento')
            ->get()
            ->map(function ($r) use ($hoy, $tz) {
                $venc = Carbon::parse($r->fecha_vencimiento, $tz)->startOfDay();
                $dias = (int) $hoy->diffInDays($venc, false);
                return [
                    'id'                => $r->id,
                    'tipo'              => strtoupper($r->tipo),
                    'numero_suministro' => $r->numero_suministro,
                    'monto'             => 'S/ ' . number_format($r->monto, 2),
                    'fecha_vencimiento' => $venc->format('d/m/Y'),
                    'dias_restantes'    => $dias,
                    'mes_recibo'        => $r->mes_recibo,
                ];
            });

        // ── 4. Servicios Web activos (hosting/dominios) ──────────────────────
        $servicios = \App\Models\ServicioWeb::where('estado', 'activo')
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '>=', $hace7)
            ->where('fecha_vencimiento', '<=', $en30)
            ->orderBy('fecha_vencimiento')
            ->get()
            ->map(function ($s) use ($hoy, $tz) {
                $venc = Carbon::parse($s->fecha_vencimiento, $tz)->startOfDay();
                $dias = (int) $hoy->diffInDays($venc, false);
                $sym  = $s->moneda === 'USD' ? '$' : 'S/';
                return [
                    'id'                => $s->id,
                    'tipo'              => strtoupper($s->tipo),
                    'proveedor'         => $s->proveedor,
                    'nombre'            => $s->nombre,
                    'monto'             => $s->monto ? $sym . ' ' . number_format($s->monto, 2) : null,
                    'periodo'           => $s->periodo,
                    'fecha_vencimiento' => $venc->format('d/m/Y'),
                    'dias_restantes'    => $dias,
                ];
            });

        return response()->json([
            'generado'      => now($tz)->format('d/m/Y H:i'),
            'deudas'        => $deudas,
            'ordenes'       => $ordenes,
            'recibos'       => $recibos,
            'servicios'     => $servicios,
            'total_alertas' => count($deudas) + count($ordenes) + count($recibos) + count($servicios),
        ]);
    }
}
