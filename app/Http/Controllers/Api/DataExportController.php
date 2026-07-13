<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DataExportController extends Controller
{
    // ponytail: whitelist of allowed models to avoid 18 identical endpoints.
    // Omitted 'users' for privacy by default.
    protected $allowedModels = [
        'deudas' => \App\Models\Deuda::class,
        'clientes' => \App\Models\Cliente::class,
        'entidades' => \App\Models\Entidad::class,
        'inmuebles' => \App\Models\Inmueble::class,
        'ordenes_compra' => \App\Models\OrdenCompra::class,
        'movimientos' => \App\Models\Movimiento::class,
        'pagos' => \App\Models\Pago::class,
        'pagos_oc' => \App\Models\PagoOC::class,
        'gastos_oc' => \App\Models\GastoOC::class,
        'recibos_alquiler' => \App\Models\ReciboAlquiler::class,
        'deudas_alquiler' => \App\Models\DeudaAlquiler::class,
        'deudas_documentos' => \App\Models\DeudaDocumento::class,
        'deudas_entidad' => \App\Models\DeudaEntidad::class,
        'deudas_historial' => \App\Models\DeudaHistorial::class,
        'notificaciones' => \App\Models\Notificacion::class,
        'configuracion' => \App\Models\Configuracion::class,
        'actividad_logs' => \App\Models\ActividadLog::class,
    ];

    public function index(Request $request, $entidad)
    {
        if (!array_key_exists($entidad, $this->allowedModels)) {
            return response()->json(['error' => 'Entidad no permitida o inexistente'], 404);
        }

        $modelClass = $this->allowedModels[$entidad];
        $query = $modelClass::query();

        // ponytail: generic relation loader ?with=relacion1,relacion2
        if ($request->has('with')) {
            $relations = array_filter(explode(',', $request->get('with')));
            if (!empty($relations)) {
                $query->with($relations);
            }
        }

        return response()->json($query->paginate($request->get('per_page', 50)));
    }
}
