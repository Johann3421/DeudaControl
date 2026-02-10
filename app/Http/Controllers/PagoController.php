<?php

namespace App\Http\Controllers;

use App\Models\Deuda;
use App\Models\Movimiento;
use App\Models\Pago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PagoController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Admin ve todos, usuarios ven solo los suyos
        $query = Pago::with(['deuda.cliente', 'deuda.user:id,name,email,rol']);
        
        if ($user->rol !== 'superadmin') {
            $query->whereHas('deuda', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        if ($request->filled('buscar')) {
            $buscar = $request->buscar;
            $query->where(function ($q) use ($buscar) {
                $q->where('referencia', 'like', "%{$buscar}%")
                  ->orWhereHas('deuda', function ($dq) use ($buscar) {
                      $dq->where('descripcion', 'like', "%{$buscar}%");
                  })
                  ->orWhereHas('deuda.cliente', function ($cq) use ($buscar) {
                      $cq->where('nombre', 'like', "%{$buscar}%")
                        ->orWhere('apellido', 'like', "%{$buscar}%");
                  });
            });
        }

        if ($request->filled('metodo_pago')) {
            $query->where('metodo_pago', $request->metodo_pago);
        }

        $pagos = $query->orderBy('fecha_pago', 'desc')->paginate(15)->withQueryString();

        return Inertia::render('Pagos/Index', [
            'pagos' => $pagos,
            'filtros' => $request->only(['buscar', 'metodo_pago']),
        ]);
    }

    public function create(Request $request)
    {
        $deudas = Deuda::where('user_id', Auth::id())
            ->where('estado', 'activa')
            ->with('cliente')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Pagos/Create', [
            'deudas' => $deudas,
            'deuda_id' => $request->query('deuda_id'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'deuda_id' => ['required', 'exists:deudas,id'],
            'monto' => ['required', 'numeric', 'min:0.01'],
            'fecha_pago' => ['required', 'date'],
            'metodo_pago' => ['required', 'in:efectivo,transferencia,tarjeta,cheque,otro'],
            'referencia' => ['nullable', 'string', 'max:100'],
            'notas' => ['nullable', 'string'],
            'currency_code' => ['required', 'string', 'in:PEN,USD,EUR,BRL,COP,CLP,ARS,MXN'],
        ], [
            'deuda_id.required' => 'Selecciona una deuda.',
            'monto.required' => 'El monto es obligatorio.',
            'monto.min' => 'El monto debe ser mayor a cero.',
            'fecha_pago.required' => 'La fecha de pago es obligatoria.',
            'currency_code.required' => 'Selecciona una moneda.',
            'currency_code.in' => 'La moneda seleccionada no es valida.',
        ]);

        $deuda = Deuda::where('id', $validated['deuda_id'])
            ->where('user_id', Auth::id())
            ->where('estado', 'activa')
            ->firstOrFail();

        if ($validated['monto'] > $deuda->monto_pendiente) {
            return back()->withErrors([
                'monto' => "El monto no puede exceder el saldo pendiente (\${$deuda->monto_pendiente}).",
            ]);
        }

        $pago = Pago::create($validated);

        $deuda->monto_pendiente -= $validated['monto'];
        if ($deuda->monto_pendiente <= 0) {
            $deuda->monto_pendiente = 0;
            $deuda->estado = 'pagada';
        }
        $deuda->save();

        Movimiento::create([
            'user_id' => Auth::id(),
            'tipo' => 'pago_recibido',
            'referencia_tipo' => 'pago',
            'referencia_id' => $pago->id,
            'monto' => $pago->monto,
            'descripcion' => "Pago recibido de {$deuda->cliente->nombre_completo} - {$deuda->descripcion}",
        ]);

        return redirect()->route('pagos.index')->with('success', 'Pago registrado correctamente.');
    }

    public function destroy(Pago $pago)
    {
        $deuda = $pago->deuda;

        if ($deuda->user_id !== Auth::id()) {
            abort(403);
        }

        $deuda->monto_pendiente += $pago->monto;
        if ($deuda->estado === 'pagada') {
            $deuda->estado = 'activa';
        }
        $deuda->save();

        Movimiento::where('referencia_tipo', 'pago')
            ->where('referencia_id', $pago->id)
            ->delete();

        $pago->delete();

        return redirect()->route('pagos.index')->with('success', 'Pago eliminado correctamente.');
    }
}
