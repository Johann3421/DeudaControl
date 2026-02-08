<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Deuda;
use App\Models\Entidad;
use App\Models\Inmueble;
use App\Models\Pago;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $totalClientes = Cliente::where('user_id', $userId)->count();
        $clientesActivos = Cliente::where('user_id', $userId)->where('estado', 'activo')->count();

        $deudasActivas = Deuda::where('user_id', $userId)->where('estado', 'activa')->count();
        $totalDeudas = Deuda::where('user_id', $userId)->count();

        $montoTotalPrestado = Deuda::where('user_id', $userId)->sum('monto_total');
        $montoPendiente = Deuda::where('user_id', $userId)->where('estado', 'activa')->sum('monto_pendiente');
        $montoRecuperado = $montoTotalPrestado - $montoPendiente;

        $deudasVencidas = Deuda::where('user_id', $userId)
            ->where('estado', 'activa')
            ->where('fecha_vencimiento', '<', now())
            ->count();

        $metricasPorTipo = Deuda::where('user_id', $userId)
            ->select('tipo_deuda',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN estado = "activa" THEN 1 ELSE 0 END) as activas'),
                DB::raw('SUM(monto_total) as monto_total'),
                DB::raw('SUM(CASE WHEN estado = "activa" THEN monto_pendiente ELSE 0 END) as monto_pendiente')
            )
            ->groupBy('tipo_deuda')
            ->get()
            ->keyBy('tipo_deuda');

        $totalEntidades = Entidad::where('user_id', $userId)->count();
        $totalInmuebles = Inmueble::where('user_id', $userId)->count();

        $pagosRecientes = Pago::whereHas('deuda', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
        ->with(['deuda.cliente'])
        ->orderBy('fecha_pago', 'desc')
        ->limit(10)
        ->get()
        ->map(function ($pago) {
            return [
                'id' => $pago->id,
                'monto' => $pago->monto,
                'fecha_pago' => $pago->fecha_pago->format('d/m/Y'),
                'metodo_pago' => $pago->metodo_pago,
                'cliente' => $pago->deuda->cliente?->nombre_completo ?? 'Entidad',
                'deuda_descripcion' => $pago->deuda->descripcion,
                'tipo_deuda' => $pago->deuda->tipo_deuda ?? 'particular',
            ];
        });

        $pagosPorMes = Pago::whereHas('deuda', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
        ->where('fecha_pago', '>=', now()->subMonths(6))
        ->select(
            DB::raw('MONTH(fecha_pago) as mes'),
            DB::raw('YEAR(fecha_pago) as anio'),
            DB::raw('SUM(monto) as total')
        )
        ->groupBy('mes', 'anio')
        ->orderBy('anio')
        ->orderBy('mes')
        ->get();

        $deudasPorEstado = Deuda::where('user_id', $userId)
            ->select('estado', DB::raw('COUNT(*) as total'), DB::raw('SUM(monto_total) as monto'))
            ->groupBy('estado')
            ->get();

        return Inertia::render('Dashboard', [
            'metricas' => [
                'total_clientes' => $totalClientes,
                'clientes_activos' => $clientesActivos,
                'deudas_activas' => $deudasActivas,
                'total_deudas' => $totalDeudas,
                'monto_total_prestado' => (float) $montoTotalPrestado,
                'monto_pendiente' => (float) $montoPendiente,
                'monto_recuperado' => (float) $montoRecuperado,
                'deudas_vencidas' => $deudasVencidas,
                'total_entidades' => $totalEntidades,
                'total_inmuebles' => $totalInmuebles,
            ],
            'metricas_por_tipo' => $metricasPorTipo,
            'pagos_recientes' => $pagosRecientes,
            'pagos_por_mes' => $pagosPorMes,
            'deudas_por_estado' => $deudasPorEstado,
        ]);
    }
}
