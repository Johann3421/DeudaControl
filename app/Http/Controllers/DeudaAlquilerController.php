<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Deuda;
use App\Models\Inmueble;
use App\Models\ReciboAlquiler;
use App\Services\DeudaAlquilerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DeudaAlquilerController extends Controller
{
    public function __construct(
        private DeudaAlquilerService $service
    ) {}

    public function create()
    {
        $clientes = Cliente::where('user_id', Auth::id())
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido']);

        $inmuebles = Inmueble::where('user_id', Auth::id())
            ->whereIn('estado', ['disponible', 'alquilado'])
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'direccion', 'tipo', 'estado']);

        return Inertia::render('Deudas/Alquiler/Create', [
            'clientes' => $clientes,
            'inmuebles' => $inmuebles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => ['required', 'exists:clientes,id'],
            'inmueble_id' => ['required', 'exists:inmuebles,id'],
            'descripcion' => ['required', 'string', 'max:255'],
            'monto_mensual' => ['required', 'numeric', 'min:0.01'],
            'periodicidad' => ['required', 'in:mensual,bimestral,trimestral'],
            'fecha_inicio_contrato' => ['required', 'date'],
            'fecha_corte' => ['nullable', 'date', 'after:fecha_inicio_contrato'],
            'servicios_incluidos' => ['nullable', 'array'],
            'notas' => ['nullable', 'string'],
        ], [
            'cliente_id.required' => 'Selecciona un inquilino.',
            'inmueble_id.required' => 'Selecciona un inmueble.',
            'monto_mensual.required' => 'El monto mensual es obligatorio.',
            'fecha_inicio_contrato.required' => 'La fecha de inicio es obligatoria.',
        ]);

        $this->service->crear($validated);

        return redirect()->route('deudas.index')->with('success', 'Deuda de alquiler registrada correctamente.');
    }

    public function show(Deuda $deuda)
    {
        $this->authorize($deuda);

        $deuda->load([
            'cliente',
            'deudaAlquiler.inmueble',
            'deudaAlquiler.recibos' => fn($q) => $q->orderBy('periodo_inicio', 'desc'),
            'pagos' => fn($q) => $q->orderBy('fecha_pago', 'desc'),
            'historial' => fn($q) => $q->orderBy('created_at', 'desc')->limit(20),
        ]);

        return Inertia::render('Deudas/Alquiler/Show', [
            'deuda' => $deuda,
        ]);
    }

    public function edit(Deuda $deuda)
    {
        $this->authorize($deuda);

        $deuda->load('deudaAlquiler');

        $clientes = Cliente::where('user_id', Auth::id())
            ->where('estado', 'activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'apellido']);

        $inmuebles = Inmueble::where('user_id', Auth::id())
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'direccion', 'tipo', 'estado']);

        return Inertia::render('Deudas/Alquiler/Edit', [
            'deuda' => $deuda,
            'clientes' => $clientes,
            'inmuebles' => $inmuebles,
        ]);
    }

    public function update(Request $request, Deuda $deuda)
    {
        $this->authorize($deuda);

        $validated = $request->validate([
            'descripcion' => ['required', 'string', 'max:255'],
            'monto_mensual' => ['required', 'numeric', 'min:0.01'],
            'periodicidad' => ['required', 'in:mensual,bimestral,trimestral'],
            'fecha_corte' => ['nullable', 'date'],
            'servicios_incluidos' => ['nullable', 'array'],
            'estado' => ['required', 'in:activa,pagada,vencida,cancelada'],
            'notas' => ['nullable', 'string'],
        ]);

        $this->service->actualizar($deuda, $validated);

        return redirect()->route('deudas.index')->with('success', 'Deuda de alquiler actualizada.');
    }

    public function generarRecibo(Deuda $deuda)
    {
        $this->authorize($deuda);

        $alquiler = $deuda->deudaAlquiler;
        if (!$alquiler) {
            return back()->with('error', 'Esta deuda no es de tipo alquiler.');
        }

        $this->service->generarRecibo($alquiler);

        return back()->with('success', 'Recibo generado correctamente.');
    }

    public function pagarRecibo(ReciboAlquiler $recibo)
    {
        $deuda = $recibo->deudaAlquiler->deuda;
        if ($deuda->user_id !== Auth::id()) {
            abort(403);
        }

        $this->service->marcarReciboPagado($recibo);

        return back()->with('success', 'Recibo marcado como pagado.');
    }

    private function authorize(Deuda $deuda): void
    {
        if ($deuda->user_id !== Auth::id()) {
            abort(403);
        }
    }
}
