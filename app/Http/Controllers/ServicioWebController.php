<?php

namespace App\Http\Controllers;

use App\Models\ServicioWeb;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServicioWebController extends Controller
{
    public function index(Request $request)
    {
        $query = ServicioWeb::query();

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }
        if ($request->filled('buscar')) {
            $b = $request->buscar;
            $query->where(function ($q) use ($b) {
                $q->where('nombre', 'like', "%{$b}%")
                  ->orWhere('proveedor', 'like', "%{$b}%");
            });
        }

        $servicios = $query->orderBy('fecha_vencimiento')->paginate(15)->withQueryString();

        return Inertia::render('ServiciosWeb/Index', [
            'servicios' => $servicios,
            'filtros'   => $request->only(['buscar', 'tipo', 'estado']),
        ]);
    }

    public function create()
    {
        return Inertia::render('ServiciosWeb/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo'             => 'required|in:hosting,dominio,ssl,email,otro',
            'proveedor'        => 'required|string|max:100',
            'nombre'           => 'required|string|max:200',
            'fecha_vencimiento'=> 'required|date',
            'monto'            => 'nullable|numeric|min:0',
            'moneda'           => 'required|in:USD,PEN',
            'periodo'          => 'required|in:mensual,anual,bianual',
            'estado'           => 'required|in:activo,vencido,cancelado',
            'notas'            => 'nullable|string',
        ]);

        ServicioWeb::create($validated);

        return redirect()->route('servicios-web.index')->with('success', 'Servicio registrado correctamente.');
    }

    public function edit(ServicioWeb $servicios_web)
    {
        return Inertia::render('ServiciosWeb/Edit', ['servicio' => $servicios_web]);
    }

    public function update(Request $request, ServicioWeb $servicios_web)
    {
        $validated = $request->validate([
            'tipo'             => 'required|in:hosting,dominio,ssl,email,otro',
            'proveedor'        => 'required|string|max:100',
            'nombre'           => 'required|string|max:200',
            'fecha_vencimiento'=> 'required|date',
            'monto'            => 'nullable|numeric|min:0',
            'moneda'           => 'required|in:USD,PEN',
            'periodo'          => 'required|in:mensual,anual,bianual',
            'estado'           => 'required|in:activo,vencido,cancelado',
            'notas'            => 'nullable|string',
        ]);

        $servicios_web->update($validated);

        return redirect()->route('servicios-web.index')->with('success', 'Servicio actualizado correctamente.');
    }

    public function destroy(ServicioWeb $servicios_web)
    {
        $servicios_web->delete();
        return redirect()->route('servicios-web.index')->with('success', 'Servicio eliminado.');
    }
}
