<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Deuda;
use App\Models\Movimiento;
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
                'cliente' => $pago->deuda->cliente->nombre_completo,
                'deuda_descripcion' => $pago->deuda->descripcion,
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
            ],
            'pagos_recientes' => $pagosRecientes,
            'pagos_por_mes' => $pagosPorMes,
            'deudas_por_estado' => $deudasPorEstado,
        ]);
    }
}
