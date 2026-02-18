<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Deuda;
use App\Models\Movimiento;
use App\Services\DeudaParticularService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DeudaParticularController extends Controller
{
    public function __construct(
        private DeudaParticularService $service
    ) {}

    public function create()
    {
        $clientes = Cliente::where('user_id', Auth::id())
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido']);

        return Inertia::render('Deudas/Particular/Create', [
            'clientes' => $clientes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => ['required', 'exists:clientes,id'],
            'descripcion' => ['required', 'string', 'max:255'],
            'monto_total' => ['required', 'numeric', 'min:0.01'],
            'currency_code' => ['required', 'string', 'in:PEN,USD,EUR,BRL,COP,CLP,ARS,MXN'],
            'tasa_interes' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_vencimiento' => ['nullable', 'date', 'after:fecha_inicio'],
            'frecuencia_pago' => ['required', 'in:semanal,quincenal,mensual,unico'],
            'numero_cuotas' => ['nullable', 'integer', 'min:1'],
            'notas' => ['nullable', 'string'],
        ], [
            'cliente_id.required' => 'Selecciona un cliente.',
            'descripcion.required' => 'La descripcion es obligatoria.',
            'monto_total.required' => 'El monto es obligatorio.',
            'monto_total.min' => 'El monto debe ser mayor a cero.',
            'currency_code.required' => 'Selecciona una moneda.',
            'fecha_inicio.required' => 'La fecha de inicio es obligatoria.',
            'fecha_vencimiento.after' => 'La fecha de vencimiento debe ser posterior a la de inicio.',
        ]);

        $this->service->crear($validated);

        return redirect()->route('deudas.index')->with('success', 'Deuda particular registrada correctamente.');
    }

    public function edit(Deuda $deuda)
    {
        $clientes = Cliente::where('user_id', Auth::id())
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido']);

        return Inertia::render('Deudas/Particular/Edit', [
            'deuda' => $deuda,
            'clientes' => $clientes,
        ]);
    }

    public function update(Request $request, Deuda $deuda)
    {
        $validated = $request->validate([
            'descripcion' => ['required', 'string', 'max:255'],
            'tasa_interes' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fecha_vencimiento' => ['nullable', 'date'],
            'frecuencia_pago' => ['required', 'in:semanal,quincenal,mensual,unico'],
            'numero_cuotas' => ['nullable', 'integer', 'min:1'],
            'estado' => ['required', 'in:activa,pagada,vencida,cancelada'],
            'notas' => ['nullable', 'string'],
        ]);

        $this->service->actualizar($deuda, $validated);

        return redirect()->route('deudas.index')->with('success', 'Deuda actualizada correctamente.');
    }
}
