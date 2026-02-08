<?php

namespace App\Http\Controllers;

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
        $query = Deuda::where('user_id', Auth::id())
            ->with('cliente')
            ->withCount('pagos');

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('descripcion', 'like', "%{$buscar}%")
                  ->orWhereHas('cliente', function ($cq) use ($buscar) {
                      $cq->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('apellido', 'like', "%{$buscar}%");
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
        $this->authorize($deuda);

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
        $this->authorize($deuda);

        if ($deuda->esEntidad()) {
            return redirect()->route('deudas.entidad.edit', $deuda);
        }
        if ($deuda->esAlquiler()) {
            return redirect()->route('deudas.alquiler.edit', $deuda);
        }

        return redirect()->route('deudas.particular.edit', $deuda);
    }

    public function update(Request $request, Deuda $deuda)
    {
        $this->authorize($deuda);

        $validated = $request->validate([
            'descripcion' => ['required', 'string', 'max:255'],
            'tasa_interes' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fecha_vencimiento' => ['nullable', 'date'],
            'frecuencia_pago' => ['required', 'in:semanal,quincenal,mensual,unico'],
            'numero_cuotas' => ['nullable', 'integer', 'min:1'],
            'estado' => ['required', 'in:activa,pagada,vencida,cancelada'],
            'notas' => ['nullable', 'string'],
        ]);

        $deuda->update($validated);

        return redirect()->route('deudas.index')->with('success', 'Deuda actualizada correctamente.');
    }

    public function destroy(Deuda $deuda)
    {
        $this->authorize($deuda);

        if ($deuda->pagos()->exists()) {
            return back()->with('error', 'No se puede eliminar una deuda que tiene pagos registrados.');
        }

        Movimiento::where('referencia_tipo', 'deuda')
            ->where('referencia_id', $deuda->id)
            ->delete();

        $deuda->delete();

        return redirect()->route('deudas.index')->with('success', 'Deuda eliminada correctamente.');
    }

    private function authorize(Deuda $deuda): void
    {
        if ($deuda->user_id !== Auth::id()) {
            abort(403);
        }
    }
}
