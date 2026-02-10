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
        $user = Auth::user();
        $userId = $user->id;
        $isSuperAdmin = $user->rol === 'superadmin';

        // Clientes
        $clientesQuery = Cliente::query();
        if (!$isSuperAdmin) $clientesQuery->where('user_id', $userId);
        $totalClientes = $clientesQuery->count();
        
        $clientesActivosQuery = Cliente::where('estado', 'activo');
        if (!$isSuperAdmin) $clientesActivosQuery->where('user_id', $userId);
        $clientesActivos = $clientesActivosQuery->count();

        // Deudas
        $deudasActivasQuery = Deuda::where('estado', 'activa');
        if (!$isSuperAdmin) $deudasActivasQuery->where('user_id', $userId);
        $deudasActivas = $deudasActivasQuery->count();

        $totalDeudasQuery = Deuda::query();
        if (!$isSuperAdmin) $totalDeudasQuery->where('user_id', $userId);
        $totalDeudas = $totalDeudasQuery->count();

        $montoQuery = Deuda::query();
        if (!$isSuperAdmin) $montoQuery->where('user_id', $userId);
        $montoTotalPrestado = $montoQuery->sum('monto_total');

        $montoPendienteQuery = Deuda::where('estado', 'activa');
        if (!$isSuperAdmin) $montoPendienteQuery->where('user_id', $userId);
        $montoPendiente = $montoPendienteQuery->sum('monto_pendiente');
        $montoRecuperado = $montoTotalPrestado - $montoPendiente;

        $vencidosQuery = Deuda::where('estado', 'activa')
            ->where('fecha_vencimiento', '<', now());
        if (!$isSuperAdmin) $vencidosQuery->where('user_id', $userId);
        $deudasVencidas = $vencidosQuery->count();

        $metricasQuery = Deuda::select('tipo_deuda',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN estado = "activa" THEN 1 ELSE 0 END) as activas'),
                DB::raw('SUM(monto_total) as monto_total'),
                DB::raw('SUM(CASE WHEN estado = "activa" THEN monto_pendiente ELSE 0 END) as monto_pendiente')
            );
        if (!$isSuperAdmin) $metricasQuery->where('user_id', $userId);
        $metricasPorTipo = $metricasQuery->groupBy('tipo_deuda')
            ->get()
            ->keyBy('tipo_deuda');

        // Entidades e Inmuebles
        $entidadesQuery = Entidad::query();
        if (!$isSuperAdmin) $entidadesQuery->where('user_id', $userId);
        $totalEntidades = $entidadesQuery->count();

        $inmuebleQuery = Inmueble::query();
        if (!$isSuperAdmin) $inmuebleQuery->where('user_id', $userId);
        $totalInmuebles = $inmuebleQuery->count();

        // Pagos recientes
        if ($isSuperAdmin) {
            $pagosRecientes = Pago::with(['deuda.cliente'])
                ->orderBy('fecha_pago', 'desc')
                ->limit(10)
                ->get();
        } else {
            $pagosRecientes = Pago::whereHas('deuda', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->with(['deuda.cliente'])
            ->orderBy('fecha_pago', 'desc')
            ->limit(10)
            ->get();
        }

        $pagosRecientes = $pagosRecientes->map(function ($pago) {
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

        // Pagos por mes
        if ($isSuperAdmin) {
            $pagosPorMes = Pago::where('fecha_pago', '>=', now()->subMonths(6))
                ->select(
                    DB::raw('MONTH(fecha_pago) as mes'),
                    DB::raw('YEAR(fecha_pago) as anio'),
                    DB::raw('SUM(monto) as total')
                )
                ->groupBy('mes', 'anio')
                ->orderBy('anio')
                ->orderBy('mes')
                ->get();
        } else {
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
        }

        // Deudas por estado
        $estadoQuery = Deuda::select('estado', DB::raw('COUNT(*) as total'), DB::raw('SUM(monto_total) as monto'))
            ->groupBy('estado');
        if (!$isSuperAdmin) $estadoQuery->where('user_id', $userId);
        $deudasPorEstado = $estadoQuery->get();

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
