<?php

namespace App\Http\Controllers;

use App\Models\Deuda;
use App\Models\DeudaEntidad;
use App\Models\Entidad;
use App\Services\DeudaEntidadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DeudaEntidadController extends Controller
{
    public function __construct(
        private DeudaEntidadService $service
    ) {}

    public function create()
    {
        $entidades = Entidad::where('user_id', Auth::id())
            ->where('estado', 'activa')
            ->orderBy('razon_social')
            ->get(['id', 'razon_social', 'ruc', 'tipo']);

        return Inertia::render('Deudas/Entidad/Create', [
            'entidades' => $entidades,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'entidad_id' => ['required', 'exists:entidades,id'],
            'descripcion' => ['required', 'string', 'max:255'],
            'orden_compra' => ['required', 'string', 'max:100'],
            'fecha_emision' => ['required', 'date'],
            'producto_servicio' => ['required', 'string', 'max:255'],
            'monto_total' => ['required', 'numeric', 'min:0.01'],
            'codigo_siaf' => ['nullable', 'string', 'max:50'],
            'fecha_limite_pago' => ['required', 'date', 'after_or_equal:fecha_emision'],
            'notas' => ['nullable', 'string'],
            'currency_code' => ['required', 'string', 'in:PEN,USD,EUR,BRL,COP,CLP,ARS,MXN'],
        ], [
            'entidad_id.required' => 'Selecciona una entidad.',
            'orden_compra.required' => 'La orden de compra es obligatoria.',
            'fecha_emision.required' => 'La fecha de emision es obligatoria.',
            'producto_servicio.required' => 'El producto o servicio es obligatorio.',
            'monto_total.required' => 'El monto es obligatorio.',
            'fecha_limite_pago.required' => 'La fecha limite de pago es obligatoria.',
            'currency_code.required' => 'Selecciona una moneda.',
            'currency_code.in' => 'La moneda seleccionada no es valida.',
        ]);

        $this->service->crear($validated);

        return redirect()->route('deudas.index')->with('success', 'Deuda con entidad registrada correctamente.');
    }

    public function show(Deuda $deuda)
    {
        $this->authorize($deuda);

        $deuda->load([
            'deudaEntidad.entidad',
            'pagos' => fn($q) => $q->orderBy('fecha_pago', 'desc'),
            'historial' => fn($q) => $q->orderBy('created_at', 'desc')->limit(20),
        ]);

        return Inertia::render('Deudas/Entidad/Show', [
            'deuda' => $deuda,
        ]);
    }

    public function edit(Deuda $deuda)
    {
        $this->authorize($deuda);

        $deuda->load('deudaEntidad');

        if ($deuda->deudaEntidad && !$deuda->deudaEntidad->estaEditable()) {
            return back()->with('error', 'Esta deuda esta cerrada y no puede editarse.');
        }

        $entidades = Entidad::where('user_id', Auth::id())
            ->where('estado', 'activa')
            ->orderBy('razon_social')
            ->get(['id', 'razon_social', 'ruc', 'tipo']);

        return Inertia::render('Deudas/Entidad/Edit', [
            'deuda' => $deuda,
            'entidades' => $entidades,
        ]);
    }

    public function update(Request $request, Deuda $deuda)
    {
        $this->authorize($deuda);

        $validated = $request->validate([
            'descripcion' => ['required', 'string', 'max:255'],
            'producto_servicio' => ['required', 'string', 'max:255'],
            'codigo_siaf' => ['nullable', 'string', 'max:50'],
            'fecha_limite_pago' => ['required', 'date'],
            'estado' => ['required', 'in:activa,pagada,vencida,cancelada'],
            'notas' => ['nullable', 'string'],
            'currency_code' => ['required', 'string', 'in:PEN,USD,EUR,BRL,COP,CLP,ARS,MXN'],
        ], [
            'currency_code.required' => 'Selecciona una moneda.',
            'currency_code.in' => 'La moneda seleccionada no es valida.',
        ]);

        $this->service->actualizar($deuda, $validated);

        return redirect()->route('deudas.index')->with('success', 'Deuda con entidad actualizada correctamente.');
    }

    public function cambiarSeguimiento(Request $request, DeudaEntidad $deudaEntidad)
    {
        if ($deudaEntidad->deuda->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'estado_seguimiento' => ['required', 'in:emitido,enviado,observado,pagado'],
        ]);

        $this->service->cambiarEstadoSeguimiento($deudaEntidad, $validated['estado_seguimiento']);

        return back()->with('success', 'Estado de seguimiento actualizado.');
    }

    private function authorize(Deuda $deuda): void
    {
        if ($deuda->user_id !== Auth::id()) {
            abort(403);
        }
    }
}
