<?php

namespace App\Http\Controllers;

use App\Models\ReciboLuzAgua;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReciboLuzAguaController extends Controller
{
    public function index(Request $request)
    {
        $query = ReciboLuzAgua::query();

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('numero_suministro', 'like', "%{$buscar}%")
                  ->orWhere('mes_recibo', 'like', "%{$buscar}%");
            });
        }

        // Ordenar por mes de recibo más reciente, luego por tipo y estado
        $recibos = $query->orderBy('mes_recibo', 'desc')
                         ->orderBy('tipo', 'asc')
                         ->paginate(15)
                         ->withQueryString();

        return Inertia::render('LuzAgua/Index', [
            'recibos' => $recibos,
            'filtros' => $request->only(['buscar', 'tipo', 'estado']),
        ]);
    }

    public function create()
    {
        return Inertia::render('LuzAgua/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo' => 'required|in:luz,agua',
            'numero_suministro' => 'required|string|max:100',
            'fecha_emision' => 'required|date',
            'fecha_vencimiento' => 'required|date|after_or_equal:fecha_emision',
            'monto' => 'required|numeric|min:0.01',
            'estado' => 'required|in:pendiente,pagado',
            'mes_recibo' => 'required|regex:/^\d{4}-\d{2}$/', // YYYY-MM
        ], [
            'tipo.required' => 'El tipo de servicio es obligatorio.',
            'numero_suministro.required' => 'El número de suministro es obligatorio.',
            'fecha_emision.required' => 'La fecha de emisión es obligatoria.',
            'fecha_vencimiento.required' => 'La fecha de vencimiento es obligatoria.',
            'monto.required' => 'El monto es obligatorio.',
            'mes_recibo.required' => 'El mes del recibo es obligatorio.',
            'mes_recibo.regex' => 'El formato debe ser AAAA-MM (ej. 2026-07).',
        ]);

        ReciboLuzAgua::create($validated);

        return redirect()->route('luz-agua.index')->with('success', 'Recibo registrado correctamente.');
    }

    public function edit(ReciboLuzAgua $luz_agua)
    {
        return Inertia::render('LuzAgua/Edit', [
            'recibo' => $luz_agua,
        ]);
    }

    public function update(Request $request, ReciboLuzAgua $luz_agua)
    {
        $validated = $request->validate([
            'tipo' => 'required|in:luz,agua',
            'numero_suministro' => 'required|string|max:100',
            'fecha_emision' => 'required|date',
            'fecha_vencimiento' => 'required|date|after_or_equal:fecha_emision',
            'monto' => 'required|numeric|min:0.01',
            'estado' => 'required|in:pendiente,pagado',
            'mes_recibo' => 'required|regex:/^\d{4}-\d{2}$/', // YYYY-MM
        ]);

        $luz_agua->update($validated);

        return redirect()->route('luz-agua.index')->with('success', 'Recibo actualizado correctamente.');
    }

    public function destroy(ReciboLuzAgua $luz_agua)
    {
        $luz_agua->delete();

        return redirect()->route('luz-agua.index')->with('success', 'Recibo eliminado correctamente.');
    }

    public function pagarRecibo(ReciboLuzAgua $recibo)
    {
        $nuevoEstado = $recibo->estado === 'pendiente' ? 'pagado' : 'pendiente';
        $recibo->update(['estado' => $nuevoEstado]);

        return back()->with('success', 'Estado del recibo actualizado.');
    }
}
