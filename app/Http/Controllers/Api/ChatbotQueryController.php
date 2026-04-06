<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Deuda;
use App\Models\DeudaEntidad;
use App\Models\OrdenCompra;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ChatbotQueryController extends Controller
{
    /**
     * Middleware: validate token before any query.
     */
    private function validateToken(Request $request): bool
    {
        $token = $request->header('X-Alertas-Token') ?: $request->query('token');
        $expected = config('services.alertas.token');
        return $expected && $token === $expected;
    }

    /**
     * Main query endpoint — the AI bot calls this with a `tipo` parameter.
     * GET /api/chatbot/consulta?tipo=resumen|deudas|ordenes|utilidades|buscar&q=...
     */
    public function consulta(Request $request)
    {
        if (!$this->validateToken($request)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $tipo = $request->query('tipo', 'resumen');

        return match ($tipo) {
            'resumen'     => $this->resumen(),
            'deudas'      => $this->deudas($request),
            'ordenes'     => $this->ordenes($request),
            'utilidades'  => $this->utilidades($request),
            'buscar'      => $this->buscar($request),
            default       => response()->json(['error' => 'Tipo no válido. Usa: resumen, deudas, ordenes, utilidades, buscar']),
        };
    }

    // ── Resumen General ─────────────────────────────────────────────────────

    private function resumen()
    {
        $hoy = Carbon::today();

        $totalDeudas     = Deuda::count();
        $deudasActivas   = Deuda::where('estado', 'activa')->count();
        $deudasPagadas   = Deuda::where('estado', 'pagada')->count();
        $deudasVencidas  = Deuda::where('estado', 'vencida')->count();
        $deudasCancelada = Deuda::where('estado', 'cancelada')->count();

        $montoTotalActivas   = Deuda::where('estado', 'activa')->sum('monto_total');
        $pendienteActivas    = Deuda::where('estado', 'activa')->sum('monto_pendiente');

        $vencenHoy  = Deuda::where('estado', 'activa')
            ->whereDate('fecha_vencimiento', $hoy)->count();
        $vencentEn7 = Deuda::where('estado', 'activa')
            ->whereBetween('fecha_vencimiento', [$hoy, $hoy->copy()->addDays(7)])->count();

        $totalOrdenes    = DeudaEntidad::count();
        $ordenesCerradas = DeudaEntidad::where('cerrado', true)->count();
        $ordenesAbiertas = DeudaEntidad::where('cerrado', false)->count();

        $totalUtilidades = OrdenCompra::count();

        return response()->json([
            'tipo' => 'resumen',
            'generado' => now()->format('d/m/Y H:i'),
            'deudas' => [
                'total'      => $totalDeudas,
                'activas'    => $deudasActivas,
                'pagadas'    => $deudasPagadas,
                'vencidas'   => $deudasVencidas,
                'canceladas' => $deudasCancelada,
                'monto_total_activas'   => number_format($montoTotalActivas, 2),
                'monto_pendiente_total' => number_format($pendienteActivas, 2),
                'vencen_hoy'     => $vencenHoy,
                'vencen_en_7dias' => $vencentEn7,
            ],
            'ordenes' => [
                'total'    => $totalOrdenes,
                'abiertas' => $ordenesAbiertas,
                'cerradas' => $ordenesCerradas,
            ],
            'utilidades' => [
                'total_ocs' => $totalUtilidades,
            ],
        ]);
    }

    // ── Deudas Detalladas ───────────────────────────────────────────────────

    private function deudas(Request $request)
    {
        $estado = $request->query('estado'); // activa, pagada, vencida, cancelada
        $tipo   = $request->query('tipo_deuda'); // particular, entidad, alquiler
        $limit  = min((int) ($request->query('limit', 20)), 50);

        $query = Deuda::with(['cliente', 'user:id,name', 'deudaEntidad.entidad']);

        if ($estado) $query->where('estado', $estado);
        if ($tipo)   $query->where('tipo_deuda', $tipo);

        $deudas = $query->orderBy('fecha_vencimiento', 'asc')->limit($limit)->get()->map(function ($d) {
            $sym = ($d->currency_code ?? 'PEN') === 'USD' ? '$' : 'S/';
            return [
                'id'           => $d->id,
                'descripcion'  => $d->descripcion,
                'tipo'         => $d->tipo_deuda,
                'estado'       => $d->estado,
                'cliente'      => $d->cliente ? trim($d->cliente->nombre . ' ' . ($d->cliente->apellido ?? '')) : ($d->deudaEntidad?->entidad?->razon_social ?? 'Sin cliente'),
                'monto_total'     => $sym . ' ' . number_format($d->monto_total, 2),
                'monto_pendiente' => $sym . ' ' . number_format($d->monto_pendiente, 2),
                'fecha_vencimiento' => $d->fecha_vencimiento?->format('d/m/Y'),
                'responsable'       => $d->user?->name ?? 'Sistema',
                'fase_siaf'         => $d->deudaEntidad?->estado_siaf ?? null,
                'expediente'        => $d->deudaEntidad?->codigo_siaf ?? null,
            ];
        });

        return response()->json([
            'tipo' => 'deudas',
            'filtros' => ['estado' => $estado, 'tipo_deuda' => $tipo],
            'total_resultados' => count($deudas),
            'deudas' => $deudas,
        ]);
    }

    // ── Órdenes de Entidad ──────────────────────────────────────────────────

    private function ordenes(Request $request)
    {
        $estado = $request->query('estado_siaf'); // C, D, G, R
        $entidad = $request->query('entidad');
        $limit  = min((int) ($request->query('limit', 20)), 50);

        $query = DeudaEntidad::with(['deuda.user', 'entidad']);

        if ($estado) $query->where('estado_siaf', $estado);
        if ($entidad) {
            $query->whereHas('entidad', fn($q) => $q->where('razon_social', 'like', "%{$entidad}%"));
        }

        $ordenes = $query->orderBy('fecha_limite_pago', 'asc')->limit($limit)->get()->map(function ($oe) {
            $monto = $oe->deuda ? $oe->deuda->monto_pendiente : 0;
            $sym   = ($oe->deuda?->currency_code ?? 'PEN') === 'USD' ? '$' : 'S/';
            $siafMap = ['C' => 'Compromiso', 'D' => 'Devengado', 'G' => 'Girado', 'R' => 'Rechazada'];
            return [
                'id'                 => $oe->id,
                'orden_compra'       => $oe->orden_compra ?? 'Sin N°',
                'entidad'            => $oe->entidad?->razon_social ?? '-',
                'producto_servicio'  => $oe->producto_servicio ?? '-',
                'empresa_factura'    => $oe->empresa_factura ?? '-',
                'unidad_ejecutora'   => $oe->unidad_ejecutora ?? '-',
                'estado_siaf'        => $siafMap[$oe->estado_siaf] ?? ($oe->estado_siaf ?? 'Sin estado'),
                'estado_seguimiento' => $oe->estado_seguimiento ?? 'emitido',
                'expediente'         => $oe->codigo_siaf ?? '-',
                'monto_pendiente'    => $sym . ' ' . number_format($monto, 2),
                'fecha_limite_pago'  => $oe->fecha_limite_pago?->format('d/m/Y'),
                'cerrado'            => $oe->cerrado,
                'responsable'        => $oe->deuda?->user?->name ?? 'Sistema',
            ];
        });

        return response()->json([
            'tipo' => 'ordenes',
            'filtros' => ['estado_siaf' => $estado, 'entidad' => $entidad],
            'total_resultados' => count($ordenes),
            'ordenes' => $ordenes,
        ]);
    }

    // ── Utilidades (Órdenes de Compra) ──────────────────────────────────────

    private function utilidades(Request $request)
    {
        $limit = min((int) ($request->query('limit', 20)), 50);

        $ocs = OrdenCompra::with(['gastos', 'pagos', 'deuda'])->limit($limit)->orderBy('created_at', 'desc')->get()->map(function ($oc) {
            $sym = ($oc->currency_code ?? 'PEN') === 'USD' ? '$' : 'S/';
            return [
                'id'            => $oc->id,
                'numero_oc'     => $oc->numero_oc ?? '-',
                'empresa_factura' => $oc->empresa_factura ?? '-',
                'entidad_recibe'  => $oc->entidad_recibe ?? '-',
                'total_oc'        => $sym . ' ' . number_format($oc->total_oc, 2),
                'total_gastos'    => $sym . ' ' . number_format($oc->total_gastos, 2),
                'utilidad'        => $sym . ' ' . number_format($oc->utilidad, 2),
                'porcentaje'      => $oc->porcentaje_utilidad . '%',
                'estado'          => $oc->estado ?? 'pendiente',
                'deuda_pendiente' => $sym . ' ' . number_format($oc->deuda_pendiente, 2),
            ];
        });

        $totalVendido  = OrdenCompra::sum('total_oc');
        $totalGastado  = OrdenCompra::with('gastos')->get()->sum(fn($oc) => $oc->total_gastos);
        $utilidadNeta  = $totalVendido - $totalGastado;

        return response()->json([
            'tipo' => 'utilidades',
            'resumen' => [
                'total_ocs'       => OrdenCompra::count(),
                'total_vendido'   => 'S/ ' . number_format($totalVendido, 2),
                'total_gastado'   => 'S/ ' . number_format($totalGastado, 2),
                'utilidad_neta'   => 'S/ ' . number_format($utilidadNeta, 2),
            ],
            'ocs' => $ocs,
        ]);
    }

    // ── Búsqueda General ────────────────────────────────────────────────────

    private function buscar(Request $request)
    {
        $q = $request->query('q', '');
        if (strlen($q) < 2) {
            return response()->json(['error' => 'El término de búsqueda debe tener al menos 2 caracteres']);
        }

        $limit = min((int) ($request->query('limit', 15)), 30);

        // Buscar en Deudas
        $deudas = Deuda::with(['cliente', 'deudaEntidad.entidad'])
            ->where(function ($query) use ($q) {
                $query->where('descripcion', 'like', "%{$q}%")
                    ->orWhereHas('cliente', fn($cq) => $cq->where('nombre', 'like', "%{$q}%")->orWhere('apellido', 'like', "%{$q}%"))
                    ->orWhereHas('deudaEntidad', fn($eq) => $eq->where('orden_compra', 'like', "%{$q}%")->orWhere('codigo_siaf', 'like', "%{$q}%"))
                    ->orWhereHas('deudaEntidad.entidad', fn($enq) => $enq->where('razon_social', 'like', "%{$q}%"));
            })
            ->limit($limit)->get()->map(function ($d) {
                $sym = ($d->currency_code ?? 'PEN') === 'USD' ? '$' : 'S/';
                return [
                    'encontrado_en' => 'deuda',
                    'id' => $d->id,
                    'descripcion' => $d->descripcion,
                    'tipo' => $d->tipo_deuda,
                    'estado' => $d->estado,
                    'cliente' => $d->cliente ? trim($d->cliente->nombre . ' ' . ($d->cliente->apellido ?? '')) : ($d->deudaEntidad?->entidad?->razon_social ?? '-'),
                    'monto_pendiente' => $sym . ' ' . number_format($d->monto_pendiente, 2),
                    'fecha_vencimiento' => $d->fecha_vencimiento?->format('d/m/Y'),
                ];
            });

        // Buscar en Órdenes
        $ordenes = DeudaEntidad::with(['entidad', 'deuda'])
            ->where(function ($query) use ($q) {
                $query->where('orden_compra', 'like', "%{$q}%")
                    ->orWhere('producto_servicio', 'like', "%{$q}%")
                    ->orWhere('codigo_siaf', 'like', "%{$q}%")
                    ->orWhereHas('entidad', fn($enq) => $enq->where('razon_social', 'like', "%{$q}%"));
            })
            ->limit($limit)->get()->map(function ($oe) {
                $sym = ($oe->deuda?->currency_code ?? 'PEN') === 'USD' ? '$' : 'S/';
                return [
                    'encontrado_en' => 'orden',
                    'id' => $oe->id,
                    'orden_compra' => $oe->orden_compra ?? '-',
                    'entidad' => $oe->entidad?->razon_social ?? '-',
                    'producto' => $oe->producto_servicio ?? '-',
                    'monto' => $sym . ' ' . number_format($oe->deuda?->monto_pendiente ?? 0, 2),
                    'estado_siaf' => $oe->estado_siaf ?? '-',
                ];
            });

        return response()->json([
            'tipo' => 'buscar',
            'termino' => $q,
            'total_resultados' => count($deudas) + count($ordenes),
            'resultados_deudas'  => $deudas,
            'resultados_ordenes' => $ordenes,
        ]);
    }
}
