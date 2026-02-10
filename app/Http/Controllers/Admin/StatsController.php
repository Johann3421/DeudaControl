<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Deuda;
use App\Models\Pago;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StatsController extends Controller
{
    private function authorize()
    {
        if (Auth::user()->rol !== 'superadmin') {
            abort(403, 'No tienes permisos para acceder a esta área.');
        }
    }

    public function index()
    {
        $this->authorize();

        $stats = [
            'total_users' => User::count(),
            'total_debts' => Deuda::count(),
            'total_payments' => Pago::count(),
            'total_pending' => (float) (Deuda::sum('monto_pendiente') ?? 0),
            'total_collected' => (float) (Deuda::sum(DB::raw('monto_total - monto_pendiente')) ?? 0),
            'users_by_role' => User::selectRaw('rol, COUNT(*) as total')->groupBy('rol')->get(),
            'debts_by_status' => Deuda::selectRaw('estado, COUNT(*) as total')->groupBy('estado')->get(),
        ];

        return Inertia::render('Admin/Stats/Index', [
            'stats' => $stats,
        ]);
    }
}
