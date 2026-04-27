<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ConfiguracionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SettingsController extends Controller
{
    const EMPRESAS_DEFAULT = [
        'GRUPO LARIOS & ASOCIADOS S.A.C.S',
        'THE KING COMPUTER EIRL',
        'MACRO DISTRIBUIDORA DEL PERU E.I.R.L.',
        'ROJAS VILLANUEVA JORGE LUIS',
        'DISTRIBUIDORA PLAZA CENTRO EIRL',
        'GRUPO ALMERCO EIRL',
        'SEKAI TECH S.C.R.L.',
        'ALMERCO JAUREGUI JULIO CESAR',
        'KENYA TECHNOLOGY S.A.C.',
        'FONSECACORP EIRL',
    ];

    private function authorizeAdmin()
    {
        if (!Auth::user()->esPrivilegiado()) {
            abort(403, 'No tienes permisos para acceder a esta área.');
        }
    }

    /** Devuelve el listado actual de empresas (DB o defaults). */
    public static function getEmpresas(): array
    {
        $stored = ConfiguracionService::get('empresas_factura');
        if (is_array($stored) && count($stored) > 0) {
            return $stored;
        }
        return self::EMPRESAS_DEFAULT;
    }

    public function index()
    {
        $this->authorizeAdmin();

        return Inertia::render('Admin/Settings/Index', [
            'app_name'          => config('app.name'),
            'timezone'          => config('app.timezone'),
            'empresas_factura'  => self::getEmpresas(),
        ]);
    }

    public function update(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:255'],
        ]);

        return back()->with('success', 'Configuración actualizada.');
    }

    public function addEmpresa(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:200'],
        ]);

        $empresas = self::getEmpresas();
        $nombre = strtoupper(trim($validated['nombre']));

        if (in_array($nombre, array_map('strtoupper', $empresas))) {
            return back()->with('error', 'Esa empresa ya está en la lista.');
        }

        $empresas[] = trim($validated['nombre']);
        ConfiguracionService::set('empresas_factura', $empresas, 'json', 'Empresas que pueden facturar en deudas entidad');

        return back()->with('success', 'Empresa agregada correctamente.');
    }

    public function removeEmpresa(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'nombre' => ['required', 'string'],
        ]);

        $empresas = self::getEmpresas();
        $empresas = array_values(array_filter($empresas, fn($e) => $e !== $validated['nombre']));
        ConfiguracionService::set('empresas_factura', $empresas, 'json', 'Empresas que pueden facturar en deudas entidad');

        return back()->with('success', 'Empresa eliminada.');
    }
}
