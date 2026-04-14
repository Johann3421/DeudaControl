<?php

namespace App\Http\Controllers;

use App\Models\ActividadLog;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HistorialController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $query = ActividadLog::with('user:id,name,rol')
            ->orderBy('created_at', 'desc');

        // Usuarios normales solo ven sus propias acciones
        if (!$user->esPrivilegiado()) {
            $query->where('user_id', $user->id);
        }

        $logs = $query->paginate(50)->withQueryString();

        return Inertia::render('Historial/Index', [
            'logs' => $logs,
        ]);
    }
}
