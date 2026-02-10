<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SettingsController extends Controller
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

        return Inertia::render('Admin/Settings/Index', [
            'app_name' => config('app.name'),
            'timezone' => config('app.timezone'),
        ]);
    }

    public function update(Request $request)
    {
        $this->authorize();

        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:255'],
        ]);

        // Aquí puedes guardar configuraciones en una tabla de configuración
        // Por ahora solo mostramos la interfaz

        return back()->with('success', 'Configuración actualizada.');
    }
}
