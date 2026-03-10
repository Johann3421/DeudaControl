<?php

namespace App\Http\Controllers;

use App\Models\GastoOC;
use App\Models\OrdenCompra;
use App\Models\PagoOC;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class UtilidadController extends Controller
{
    // ─── Helpers ────────────────────────────────────────────────────────────

    private function withUtilidad(OrdenCompra $oc): array
    {
        $arr                       = $oc->toArray();
        $arr['total_gastos']       = $oc->total_gastos;
        $arr['total_pagado']       = $oc->total_pagado;
        $arr['utilidad']           = $oc->utilidad;
        $arr['porcentaje_utilidad'] = $oc->porcentaje_utilidad;
        $arr['color_utilidad']     = $oc->color_utilidad;
        $arr['deuda_pendiente']    = $oc->deuda_pendiente;
        return $arr;
    }

    // ─── Index ───────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $user  = Auth::user();
        $query = OrdenCompra::with(['gastos', 'pagos'])
            ->where('user_id', $user->id)
            ->orderBy('fecha_oc', 'desc');

        if ($request->filled('buscar')) {
            $q = $request->buscar;
            $query->where(function ($sq) use ($q) {
                $sq->where('numero_oc', 'like', "%{$q}%")
                   ->orWhere('cliente', 'like', "%{$q}%");
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('filtro_utilidad')) {
            switch ($request->filtro_utilidad) {
                case 'perdida':
                    // porcentaje < 0 → utilidad < 0 → total_oc < total_gastos
                    $query->whereRaw('total_oc < (SELECT COALESCE(SUM(monto),0) FROM gastos_oc WHERE orden_compra_id = ordenes_compra.id)');
                    break;
                case 'baja':
                    // 0 <= % < 5
                    $query->whereRaw('total_oc >= (SELECT COALESCE(SUM(monto),0) FROM gastos_oc WHERE orden_compra_id = ordenes_compra.id)')
                          ->whereRaw('(total_oc - (SELECT COALESCE(SUM(monto),0) FROM gastos_oc WHERE orden_compra_id = ordenes_compra.id)) / total_oc * 100 < 5');
                    break;
                case 'pendiente_pago':
                    $query->whereRaw('total_oc > (SELECT COALESCE(SUM(monto),0) FROM pagos_oc WHERE orden_compra_id = ordenes_compra.id)');
                    break;
            }
        }

        $ocs = $query->paginate(20)->withQueryString();

        $ocs->getCollection()->transform(fn ($oc) => $this->withUtilidad($oc));

        // Resumen global (solo del usuario)
        $all   = OrdenCompra::with(['gastos', 'pagos'])->where('user_id', $user->id)->get();
        $resumen = [
            'total_vendido'  => $all->sum('total_oc'),
            'total_gastado'  => $all->sum(fn ($o) => $o->total_gastos),
            'total_utilidad' => $all->sum(fn ($o) => $o->utilidad),
            'total_deuda'    => $all->sum(fn ($o) => $o->deuda_pendiente),
            'total_ocs'      => $all->count(),
        ];

        return Inertia::render('Utilidades/Index', [
            'ocs'     => $ocs,
            'resumen' => $resumen,
            'filtros' => $request->only(['buscar', 'estado', 'filtro_utilidad']),
        ]);
    }

    // ─── Create ──────────────────────────────────────────────────────────────

    public function create()
    {
        return Inertia::render('Utilidades/Create');
    }

    // ─── Store (OC) ──────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate([
            'numero_oc'     => ['required', 'string', 'max:50', 'unique:ordenes_compra,numero_oc'],
            'cliente'       => ['required', 'string', 'max:200'],
            'fecha_oc'      => ['required', 'date'],
            'fecha_entrega' => ['nullable', 'date', 'after_or_equal:fecha_oc'],
            'estado'        => ['required', 'in:pendiente,entregado,facturado,pagado'],
            'total_oc'      => ['required', 'numeric', 'min:0.01'],
            'currency_code' => ['required', 'string', 'in:PEN,USD,EUR'],
            'notas'         => ['nullable', 'string'],
        ]);

        $validated['user_id'] = Auth::id();
        OrdenCompra::create($validated);

        return redirect()->route('utilidades.index')->with('success', 'Orden de compra creada correctamente.');
    }

    // ─── Show ────────────────────────────────────────────────────────────────

    public function show(OrdenCompra $utilidad)
    {
        $utilidad->load([
            'gastos' => fn ($q) => $q->orderBy('created_at', 'asc'),
            'pagos'  => fn ($q) => $q->orderBy('fecha_pago', 'desc'),
        ]);

        return Inertia::render('Utilidades/Show', [
            'oc' => $this->withUtilidad($utilidad),
        ]);
    }

    // ─── Edit ────────────────────────────────────────────────────────────────

    public function edit(OrdenCompra $utilidad)
    {
        return Inertia::render('Utilidades/Edit', [
            'oc' => $utilidad,
        ]);
    }

    // ─── Update (OC) ─────────────────────────────────────────────────────────

    public function update(Request $request, OrdenCompra $utilidad)
    {
        $validated = $request->validate([
            'numero_oc'     => ['required', 'string', 'max:50', "unique:ordenes_compra,numero_oc,{$utilidad->id}"],
            'cliente'       => ['required', 'string', 'max:200'],
            'fecha_oc'      => ['required', 'date'],
            'fecha_entrega' => ['nullable', 'date', 'after_or_equal:fecha_oc'],
            'estado'        => ['required', 'in:pendiente,entregado,facturado,pagado'],
            'total_oc'      => ['required', 'numeric', 'min:0.01'],
            'currency_code' => ['required', 'string', 'in:PEN,USD,EUR'],
            'notas'         => ['nullable', 'string'],
        ]);

        $utilidad->update($validated);

        return redirect()->route('utilidades.show', $utilidad)->with('success', 'Orden actualizada.');
    }

    // ─── Destroy (OC) ────────────────────────────────────────────────────────

    public function destroy(OrdenCompra $utilidad)
    {
        $utilidad->delete();
        return redirect()->route('utilidades.index')->with('success', 'Orden eliminada.');
    }

    // ─── Gastos ──────────────────────────────────────────────────────────────

    public function storeGasto(Request $request, OrdenCompra $utilidad)
    {
        $validated = $request->validate([
            'tipo_gasto'  => ['required', 'in:compra_producto,transporte,envio,accesorios,logistica,otro'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'monto'       => ['required', 'numeric', 'min:0.01'],
            'fecha'       => ['nullable', 'date'],
        ]);

        $validated['orden_compra_id'] = $utilidad->id;
        GastoOC::create($validated);

        return back()->with('success', 'Gasto añadido.');
    }

    public function destroyGasto(OrdenCompra $utilidad, GastoOC $gasto)
    {
        abort_if($gasto->orden_compra_id !== $utilidad->id, 404);
        $gasto->delete();
        return back()->with('success', 'Gasto eliminado.');
    }

    // ─── Pagos ───────────────────────────────────────────────────────────────

    public function storePago(Request $request, OrdenCompra $utilidad)
    {
        $validated = $request->validate([
            'monto'       => ['required', 'numeric', 'min:0.01'],
            'fecha_pago'  => ['required', 'date'],
            'metodo_pago' => ['required', 'in:efectivo,transferencia,tarjeta,cheque,otro'],
            'referencia'  => ['nullable', 'string', 'max:100'],
            'notas'       => ['nullable', 'string'],
        ]);

        $validated['orden_compra_id'] = $utilidad->id;
        PagoOC::create($validated);

        return back()->with('success', 'Pago registrado.');
    }

    public function destroyPago(OrdenCompra $utilidad, PagoOC $pago)
    {
        abort_if($pago->orden_compra_id !== $utilidad->id, 404);
        $pago->delete();
        return back()->with('success', 'Pago eliminado.');
    }
}
