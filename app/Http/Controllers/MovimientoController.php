<?php

namespace App\Http\Controllers;

use App\Models\Movimiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MovimientoController extends Controller
{
    public function index(Request $request)
    {
        $query = Movimiento::where('user_id', Auth::id());

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->filled('desde')) {
            $query->where('created_at', '>=', $request->desde);
        }

        if ($request->filled('hasta')) {
            $query->where('created_at', '<=', $request->hasta . ' 23:59:59');
        }

        $movimientos = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        return Inertia::render('Movimientos/Index', [
            'movimientos' => $movimientos,
            'filtros' => $request->only(['tipo', 'desde', 'hasta']),
        ]);
    }
}
