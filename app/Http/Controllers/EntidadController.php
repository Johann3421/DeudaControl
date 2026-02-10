<?php
namespace App\Http\Controllers;

use App\Models\Entidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EntidadController extends Controller
{
    public function index(Request $request)
    {
        $query = Entidad::where('user_id', Auth::id());

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('razon_social', 'like', "%{$buscar}%")
                    ->orWhere('ruc', 'like', "%{$buscar}%");
            });
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        $entidades = $query->orderBy('razon_social')->paginate(15)->withQueryString();

        return Inertia::render('Entidades/Index', [
            'entidades' => $entidades,
            'filtros'   => $request->only(['buscar', 'tipo']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Entidades/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'razon_social'      => ['required', 'string', 'max:200'],
            'ruc'               => ['nullable', 'string', 'max:20'],
            'tipo'              => ['required', 'in:publica,privada'],
            'contacto_nombre'   => ['nullable', 'string', 'max:150'],
            'contacto_telefono' => ['nullable', 'string', 'max:20'],
            'contacto_email'    => ['nullable', 'email', 'max:150'],
            'direccion'         => ['nullable', 'string'],
            'notas'             => ['nullable', 'string'],
        ], [
            'razon_social.required' => 'La razon social es obligatoria.',
        ]);

        $validated['user_id'] = Auth::id();

        Entidad::create($validated);

        return redirect()->route('entidades.index')->with('success', 'Entidad registrada correctamente.');
    }

    public function show(Entidad $entidad)
    {
        $this->authorize($entidad);

        $entidad->load(['deudaEntidades.deuda' => fn($q) => $q->orderBy('created_at', 'desc')]);

        return Inertia::render('Entidades/Show', [
            'entidad' => $entidad,
        ]);
    }

    public function edit(Entidad $entidad)
    {
        $this->authorize($entidad);

        return Inertia::render('Entidades/Edit', [
            'entidad' => $entidad,
        ]);
    }

    public function update(Request $request, Entidad $entidad)
    {
        $this->authorize($entidad);

        $validated = $request->validate([
            'razon_social'      => ['required', 'string', 'max:200'],
            'ruc'               => ['nullable', 'string', 'max:20'],
            'tipo'              => ['required', 'in:publica,privada'],
            'contacto_nombre'   => ['nullable', 'string', 'max:150'],
            'contacto_telefono' => ['nullable', 'string', 'max:20'],
            'contacto_email'    => ['nullable', 'email', 'max:150'],
            'direccion'         => ['nullable', 'string'],
            'notas'             => ['nullable', 'string'],
            'estado'            => ['required', 'in:activa,inactiva'],
        ]);

        $entidad->update($validated);

        return redirect()->route('entidades.index')->with('success', 'Entidad actualizada correctamente.');
    }

    public function destroy($id)
    {
        $entidad = Entidad::find($id);

        \Log::info('destroy() llamado', [
            'id_param' => $id,
            'entidad_id' => $entidad?->id,
            'entidad_user_id' => $entidad?->user_id,
            'auth_id' => \Illuminate\Support\Facades\Auth::id(),
            'auth_name' => \Illuminate\Support\Facades\Auth::user()->name ?? 'null',
        ]);

        if (!$entidad) {
            abort(404, 'Entidad no encontrada');
        }

        // Admin o propietario pueden eliminar
        if (Auth::id() !== $entidad->user_id && Auth::user()->name !== 'Administrador') {
            \Log::warning('Acceso denegado en destroy', [
                'auth_id' => Auth::id(),
                'entidad_user_id' => $entidad->user_id,
            ]);
            abort(403);
        }

        if ($entidad->deudaEntidades()->whereHas('deuda', fn($q) => $q->where('estado', 'activa'))->exists()) {
            return back()->with('error', 'No se puede eliminar una entidad con deudas activas.');
        }

        $entidad->delete();
        return redirect()->route('entidades.index')->with('success', 'Entidad eliminada correctamente.');
    }

    private function authorize(Entidad $entidad): void
    {
        if ($entidad->user_id !== Auth::id()) {
            abort(403);
        }
    }
}
