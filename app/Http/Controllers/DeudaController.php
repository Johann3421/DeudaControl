<?php

namespace App\Http\Controllers;

use App\Models\ActividadLog;
use App\Models\Cliente;
use App\Models\Deuda;
use App\Models\Movimiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DeudaController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // Admin ve todas, usuarios ven solo las suyas
        $query = Deuda::with(['cliente', 'user:id,name,email,rol', 'deudaEntidad.entidad'])
            ->withCount('pagos');

        if (!$user->esPrivilegiado()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('descripcion', 'like', "%{$buscar}%")
                  ->orWhereHas('cliente', function ($cq) use ($buscar) {
                      $cq->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('apellido', 'like', "%{$buscar}%");
                  })
                  ->orWhereHas('deudaEntidad.entidad', function ($cq) use ($buscar) {
                      $cq->where('razon_social', 'like', "%{$buscar}%")
                        ->orWhere('ruc', 'like', "%{$buscar}%");
                  })
                  ->orWhereHas('user', function ($cq) use ($buscar) {
                      $cq->where('name', 'like', "%{$buscar}%");
                  });
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('tipo_deuda')) {
            $query->where('tipo_deuda', $request->tipo_deuda);
        }

        $deudas = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        // Transformar datos para incluir relaciones ANTES de enviar a Inertia
        $deudasTransformadas = $deudas->map(function ($deuda) {
            $arrDeuda = $deuda->toArray();
            if ($deuda->tipo_deuda === 'entidad' && $deuda->deudaEntidad) {
                $arrDeuda['deuda_entidad'] = $deuda->deudaEntidad->toArray();
                if ($deuda->deudaEntidad->entidad) {
                    $arrDeuda['deuda_entidad']['entidad'] = $deuda->deudaEntidad->entidad->toArray();
                }
            }
            return $arrDeuda;
        })->all();

        $deudas->setCollection(collect($deudasTransformadas));

        return Inertia::render('Deudas/Index', [
            'deudas' => $deudas,
            'filtros' => $request->only(['buscar', 'estado', 'tipo_deuda']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Deudas/CreateSelector');
    }

    public function show(Deuda $deuda)
    {
        if ($deuda->esEntidad()) {
            $deuda->load([
                'deudaEntidad.entidad',
                'pagos' => fn($q) => $q->orderBy('fecha_pago', 'desc'),
                'historial' => fn($q) => $q->orderBy('created_at', 'desc')->limit(20),
            ]);
            return Inertia::render('Deudas/Entidad/Show', ['deuda' => $deuda]);
        }

        if ($deuda->esAlquiler()) {
            $deuda->load([
                'cliente',
                'deudaAlquiler.inmueble',
                'deudaAlquiler.recibos' => fn($q) => $q->orderBy('periodo_inicio', 'desc'),
                'pagos' => fn($q) => $q->orderBy('fecha_pago', 'desc'),
            ]);
            return Inertia::render('Deudas/Alquiler/Show', ['deuda' => $deuda]);
        }

        $deuda->load(['cliente', 'pagos' => fn($q) => $q->orderBy('fecha_pago', 'desc')]);
        return Inertia::render('Deudas/Show', ['deuda' => $deuda]);
    }

    public function edit(Deuda $deuda)
    {
        if ($deuda->esEntidad()) {
            return Inertia::location(route('deudas.entidad.edit', $deuda));
        }
        if ($deuda->esAlquiler()) {
            return Inertia::location(route('deudas.alquiler.edit', $deuda));
        }

        return Inertia::location(route('deudas.particular.edit', $deuda));
    }

    public function update(Request $request, Deuda $deuda)
    {
        $validated = $request->validate([
            'descripcion' => ['required', 'string', 'max:255'],
            'tasa_interes' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fecha_vencimiento' => ['nullable', 'date'],
            'frecuencia_pago' => ['required', 'in:semanal,quincenal,mensual,unico'],
            'numero_cuotas' => ['nullable', 'integer', 'min:1'],
            'estado' => ['required', 'in:activa,pagada,vencida,cancelada,pagado_banco'],
            'notas' => ['nullable', 'string'],
        ]);

        // Si la deuda se marca como pagada o pagado_banco, asegurarnos que el pendiente sea 0
        if (isset($validated['estado']) && in_array($validated['estado'], ['pagada', 'pagado_banco'])) {
            // Para deudas de entidad, solo el jefe puede marcarlas como pagadas (requiere fase SIAF = 'P')
            if ($deuda->tipo_deuda === 'entidad') {
                $deuda->load('deudaEntidad');
                if ($deuda->deudaEntidad?->fase_siaf !== 'P') {
                    return back()->withErrors([
                        'estado' => 'No se puede marcar esta deuda como pagada hasta que el Jefe establezca la fase SIAF como P – Pagado en cuenta.',
                    ]);
                }
            }
            $validated['monto_pendiente'] = 0;
        }

        $deuda->update($validated);

        ActividadLog::registrar('editado', 'deuda', $deuda->id, "Deuda '{$deuda->descripcion}' actualizada");

        return redirect()->route('deudas.index')->with('success', 'Deuda actualizada correctamente.');
    }

    public function destroy(Deuda $deuda)
    {
        if ($deuda->pagos()->exists()) {
            return back()->with('error', 'No se puede eliminar una deuda que tiene pagos registrados.');
        }

        Movimiento::where('referencia_tipo', 'deuda')
            ->where('referencia_id', $deuda->id)
            ->delete();

        $descripcion = $deuda->descripcion;
        $deuda->delete();

        ActividadLog::registrar('eliminado', 'deuda', null, "Deuda '{$descripcion}' eliminada");

        return redirect()->route('deudas.index')->with('success', 'Deuda eliminada correctamente.');
    }

    private function authorize(Deuda $deuda): void
    {
        $user = Auth::user();
        if (!$user->esPrivilegiado() && $deuda->user_id !== $user->id) {
            abort(403);
        }
    }

    // ─── Documentos (Factura / Guía) ─────────────────────────────────────────

    public function uploadDocument(Request $request, Deuda $deuda, $tipo)
    {
        $this->authorize($deuda);
        if (!in_array($tipo, ['factura', 'guia'])) abort(404);

        $request->validate([
            'documento' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], // max 5MB
        ]);

        $file = $request->file('documento');
        $fileName = "{$tipo}_{$deuda->id}_" . time() . '.' . $file->extension();
        $path = $file->storeAs("deudas/docs/{$deuda->id}", $fileName, 'public');

        $campo = "{$tipo}_pdf";

        if ($deuda->$campo) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($deuda->$campo);
        }

        $deuda->update([$campo => $path]);

        return back()->with('success', ucfirst($tipo) . ' subida correctamente.');
    }

    public function viewDocument(Deuda $deuda, $tipo)
    {
        $this->authorize($deuda);
        if (!in_array($tipo, ['factura', 'guia'])) abort(404);

        $campo = "{$tipo}_pdf";
        if (!$deuda->$campo || !\Illuminate\Support\Facades\Storage::disk('public')->exists($deuda->$campo)) {
            abort(404, 'Documento no encontrado.');
        }

        $path = \Illuminate\Support\Facades\Storage::disk('public')->path($deuda->$campo);
        return response()->file($path);
    }

    public function deleteDocument(Deuda $deuda, $tipo)
    {
        $this->authorize($deuda);
        if (!in_array($tipo, ['factura', 'guia'])) abort(404);

        $campo = "{$tipo}_pdf";
        if ($deuda->$campo) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($deuda->$campo);
            $deuda->update([$campo => null]);
        }

        return back()->with('success', ucfirst($tipo) . ' eliminada correctamente.');
    }
}
