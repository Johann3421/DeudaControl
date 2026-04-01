<?php

namespace App\Http\Controllers;

use App\Models\Deuda;
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
        $arr                        = $oc->toArray();
        $arr['total_gastos']        = $oc->total_gastos;
        $arr['total_pagado']        = $oc->total_pagado;
        $arr['utilidad']            = $oc->utilidad;
        $arr['porcentaje_utilidad'] = $oc->porcentaje_utilidad;
        $arr['color_utilidad']      = $oc->color_utilidad;
        $arr['deuda_pendiente']     = $oc->deuda_pendiente;

        if ($oc->relationLoaded('deuda') && $oc->deuda) {
            $arr['deuda'] = [
                'id'              => $oc->deuda->id,
                'descripcion'     => $oc->deuda->descripcion,
                'monto_total'     => $oc->deuda->monto_total,
                'monto_pendiente' => $oc->deuda->monto_pendiente,
                'estado'          => $oc->deuda->estado,
                'cliente_nombre'  => optional($oc->deuda->cliente)->nombre ?? '—',
            ];
        }

        return $arr;
    }

    private function deudasDisponibles(?int $userId = null, ?int $excludeOcId = null): \Illuminate\Support\Collection
    {
        $usedIds = OrdenCompra::whereNotNull('deuda_id')
            ->when($excludeOcId, fn ($q) => $q->where('id', '!=', $excludeOcId))
            ->pluck('deuda_id');

        return Deuda::with('cliente')
            ->whereNotIn('id', $usedIds)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($d) => [
                'id'              => $d->id,
                'descripcion'     => $d->descripcion,
                'monto_total'     => $d->monto_total,
                'monto_pendiente' => $d->monto_pendiente,
                'currency_code'   => $d->currency_code,
                'cliente_nombre'  => optional($d->cliente)->nombre ?? '—',
                'estado'          => $d->estado,
            ]);
    }

    // ─── Index ───────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $user  = Auth::user();
        $query = OrdenCompra::with(['gastos', 'pagos', 'deuda.cliente'])
            ->orderBy('fecha_oc', 'desc');

        if ($user->rol !== 'superadmin') {
            $query->where('user_id', $user->id);
        }

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

        // Resumen global
        $allQuery = OrdenCompra::with(['gastos', 'pagos', 'deuda']);
        if ($user->rol !== 'superadmin') {
            $allQuery->where('user_id', $user->id);
        }
        $all = $allQuery->get();
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
        return Inertia::render('Utilidades/Create', [
            'deudas' => $this->deudasDisponibles(Auth::id()),
        ]);
    }

    // ─── Store (OC) ──────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate([
            'deuda_id'        => ['required', 'integer', 'exists:deudas,id'],
            'numero_oc'       => ['required', 'string', 'max:50', 'unique:ordenes_compra,numero_oc'],
            'empresa_factura' => ['nullable', 'string', 'max:200'],
            'entidad_recibe'  => ['nullable', 'string', 'max:200'],
            'fecha_oc'        => ['required', 'date'],
            'fecha_entrega'   => ['nullable', 'date', 'after_or_equal:fecha_oc'],
            'estado'          => ['required', 'in:pendiente,entregado,facturado,pagado'],
            'notas'           => ['nullable', 'string'],
        ]);

        $deuda = Deuda::with('cliente')->findOrFail($validated['deuda_id']);

        $validated['user_id']       = Auth::id();
        $validated['cliente']       = optional($deuda->cliente)->nombre ?? $deuda->descripcion;
        $validated['total_oc']      = $deuda->monto_total;
        $validated['currency_code'] = $deuda->currency_code;

        OrdenCompra::create($validated);

        return redirect()->route('utilidades.index')->with('success', 'Orden de compra creada correctamente.');
    }

    // ─── Show ────────────────────────────────────────────────────────────────

    public function show(OrdenCompra $utilidad)
    {
        $user = Auth::user();
        if ($user->rol !== 'superadmin' && $utilidad->user_id !== $user->id) {
            abort(403);
        }

        $utilidad->load([
            'deuda.cliente',
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
        $user = Auth::user();
        if ($user->rol !== 'superadmin' && $utilidad->user_id !== $user->id) {
            abort(403);
        }

        $utilidad->load('deuda.cliente');

        // Also include the currently linked deuda (even if already used) in the options
        $deudas = $this->deudasDisponibles(Auth::id(), $utilidad->id);
        if ($utilidad->deuda_id && ! $deudas->contains('id', $utilidad->deuda_id)) {
            $d = $utilidad->deuda;
            $deudas->prepend([
                'id'              => $d->id,
                'descripcion'     => $d->descripcion,
                'monto_total'     => $d->monto_total,
                'monto_pendiente' => $d->monto_pendiente,
                'currency_code'   => $d->currency_code,
                'cliente_nombre'  => optional($d->cliente)->nombre ?? '—',
                'estado'          => $d->estado,
            ]);
        }

        return Inertia::render('Utilidades/Edit', [
            'oc'     => $utilidad,
            'deudas' => $deudas,
        ]);
    }

    // ─── Update (OC) ─────────────────────────────────────────────────────────

    public function update(Request $request, OrdenCompra $utilidad)
    {
        $user = Auth::user();
        if ($user->rol !== 'superadmin' && $utilidad->user_id !== $user->id) {
            abort(403);
        }

        $validated = $request->validate([
            'deuda_id'        => ['nullable', 'integer', 'exists:deudas,id'],
            'numero_oc'       => ['required', 'string', 'max:50', "unique:ordenes_compra,numero_oc,{$utilidad->id}"],
            'empresa_factura' => ['nullable', 'string', 'max:200'],
            'entidad_recibe'  => ['nullable', 'string', 'max:200'],
            'fecha_oc'        => ['required', 'date'],
            'fecha_entrega'   => ['nullable', 'date', 'after_or_equal:fecha_oc'],
            'estado'          => ['required', 'in:pendiente,entregado,facturado,pagado'],
            'notas'           => ['nullable', 'string'],
        ]);

        if (!empty($validated['deuda_id'])) {
            $deuda = Deuda::with('cliente')->findOrFail($validated['deuda_id']);
            $validated['cliente']       = optional($deuda->cliente)->nombre ?? $deuda->descripcion;
            $validated['total_oc']      = $deuda->monto_total;
            $validated['currency_code'] = $deuda->currency_code;
        }

        $utilidad->update($validated);

        return redirect()->route('utilidades.show', $utilidad)->with('success', 'Orden actualizada.');
    }

    // ─── Destroy (OC) ────────────────────────────────────────────────────────

    public function destroy(OrdenCompra $utilidad)
    {
        $user = Auth::user();
        if ($user->rol !== 'superadmin' && $utilidad->user_id !== $user->id) {
            abort(403);
        }

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

    public function updateGasto(Request $request, OrdenCompra $utilidad, GastoOC $gasto)
    {
        abort_if($gasto->orden_compra_id !== $utilidad->id, 404);
        $validated = $request->validate([
            'tipo_gasto'  => ['required', 'in:compra_producto,transporte,envio,accesorios,logistica,otro'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'monto'       => ['required', 'numeric', 'min:0.01'],
            'fecha'       => ['nullable', 'date'],
        ]);
        $gasto->update($validated);
        return back()->with('success', 'Gasto actualizado.');
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
