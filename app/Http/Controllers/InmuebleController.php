<?php

namespace App\Http\Controllers;

use App\Models\Inmueble;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class InmuebleController extends Controller
{
    public function index(Request $request)
    {
        $query = Inmueble::where('user_id', Auth::id());

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('nombre', 'like', "%{$buscar}%")
                  ->orWhere('direccion', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        $inmuebles = $query->orderBy('nombre')->paginate(15)->withQueryString();

        return Inertia::render('Inmuebles/Index', [
            'inmuebles' => $inmuebles,
            'filtros' => $request->only(['buscar', 'estado']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Inmuebles/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'direccion' => ['required', 'string'],
            'tipo' => ['required', 'in:casa,departamento,local,oficina,terreno,otro'],
            'descripcion' => ['nullable', 'string'],
        ], [
            'nombre.required' => 'El nombre es obligatorio.',
            'direccion.required' => 'La direccion es obligatoria.',
        ]);

        $validated['user_id'] = Auth::id();

        Inmueble::create($validated);

        return redirect()->route('inmuebles.index')->with('success', 'Inmueble registrado correctamente.');
    }

    public function edit(Inmueble $inmueble)
    {
        $this->authorize($inmueble);

        return Inertia::render('Inmuebles/Edit', [
            'inmueble' => $inmueble,
        ]);
    }

    public function update(Request $request, Inmueble $inmueble)
    {
        $this->authorize($inmueble);

        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'direccion' => ['required', 'string'],
            'tipo' => ['required', 'in:casa,departamento,local,oficina,terreno,otro'],
            'descripcion' => ['nullable', 'string'],
            'estado' => ['required', 'in:disponible,alquilado,mantenimiento'],
        ]);

        $inmueble->update($validated);

        return redirect()->route('inmuebles.index')->with('success', 'Inmueble actualizado correctamente.');
    }

    public function destroy(Inmueble $inmueble)
    {
        $this->authorize($inmueble);

        if ($inmueble->deudaAlquileres()->whereHas('deuda', fn($q) => $q->where('estado', 'activa'))->exists()) {
            return back()->with('error', 'No se puede eliminar un inmueble con alquileres activos.');
        }

        $inmueble->delete();

        return redirect()->route('inmuebles.index')->with('success', 'Inmueble eliminado correctamente.');
    }

    private function authorize(Inmueble $inmueble): void
    {
        if ($inmueble->user_id !== Auth::id()) {
            abort(403);
        }
    }
}
