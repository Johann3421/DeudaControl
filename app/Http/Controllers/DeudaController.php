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

        $deudas = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('Deudas/Index', [
            'deudas' => $deudas,
            'filtros' => $request->only(['buscar', 'estado']),
        ]);
    }

    public function create()
    {
        $clientes = Cliente::where('user_id', Auth::id())
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido']);

        return Inertia::render('Deudas/Create', [
            'clientes' => $clientes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => ['required', 'exists:clientes,id'],
            'descripcion' => ['required', 'string', 'max:255'],
            'monto_total' => ['required', 'numeric', 'min:0.01'],
            'tasa_interes' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_vencimiento' => ['nullable', 'date', 'after:fecha_inicio'],
            'frecuencia_pago' => ['required', 'in:semanal,quincenal,mensual,unico'],
            'numero_cuotas' => ['nullable', 'integer', 'min:1'],
            'notas' => ['nullable', 'string'],
        ], [
            'cliente_id.required' => 'Selecciona un cliente.',
            'descripcion.required' => 'La descripción es obligatoria.',
            'monto_total.required' => 'El monto es obligatorio.',
            'monto_total.min' => 'El monto debe ser mayor a cero.',
            'fecha_inicio.required' => 'La fecha de inicio es obligatoria.',
            'fecha_vencimiento.after' => 'La fecha de vencimiento debe ser posterior a la fecha de inicio.',
        ]);

        $cliente = Cliente::where('id', $validated['cliente_id'])
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated['user_id'] = Auth::id();
        $validated['monto_pendiente'] = $validated['monto_total'];
        $validated['tasa_interes'] = $validated['tasa_interes'] ?? 0;

        $deuda = Deuda::create($validated);

        Movimiento::create([
            'user_id' => Auth::id(),
            'tipo' => 'prestamo_otorgado',
            'referencia_tipo' => 'deuda',
            'referencia_id' => $deuda->id,
            'monto' => $deuda->monto_total,
            'descripcion' => "Préstamo otorgado a {$cliente->nombre_completo}: {$deuda->descripcion}",
        ]);

        return redirect()->route('deudas.index')->with('success', 'Deuda registrada correctamente.');
    }

    public function show(Deuda $deuda)
    {
        $this->authorize($deuda);

        $deuda->load(['cliente', 'pagos' => function ($q) {
            $q->orderBy('fecha_pago', 'desc');
        }]);

        return Inertia::render('Deudas/Show', [
            'deuda' => $deuda,
        ]);
    }

    public function edit(Deuda $deuda)
    {
        $this->authorize($deuda);

        $clientes = Cliente::where('user_id', Auth::id())
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido']);

        return Inertia::render('Deudas/Edit', [
            'deuda' => $deuda,
            'clientes' => $clientes,
        ]);
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
