import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import Layout from '../../Components/Layout';
import { formatMoney } from '../../helpers/currencyHelper';

const ESTADO_DEUDA_LABELS = {
    pendiente:  'Pendiente',
    vencida:    'Vencida',
    pagada:     'Pagada',
    parcial:    'Parcial',
};

export default function UtilidadesCreate({ deudas = [], empresas = [], entidades = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        deuda_id:        '',
        numero_oc:       '',
        empresa_factura: '',
        entidad_recibe:  '',
        fecha_oc:        new Date().toISOString().split('T')[0],
        fecha_entrega:   '',
        estado:          'pendiente',
        notas:           '',
    });

    const selectedDeuda = useMemo(
        () => deudas.find(d => String(d.id) === String(data.deuda_id)) ?? null,
        [data.deuda_id, deudas]
    );

    const handleDeudaChange = (e) => {
        const deuda = deudas.find(d => String(d.id) === e.target.value);
        setData(prev => ({
            ...prev,
            deuda_id:  e.target.value,
            numero_oc: deuda ? `OC-${String(deuda.id).padStart(3, '0')}` : prev.numero_oc,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/utilidades');
    };

    return (
        <Layout title="Nueva Orden de Compra">
            <Head title="Nueva OC" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/utilidades" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a Utilidades
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Nueva OC</span>
                        <h2 className="text-lg font-semibold text-slate-900">Registrar Orden de Compra</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* ── Deuda vinculada ───────────────────────── */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Deuda vinculada *
                                <span className="ml-1.5 text-xs font-normal text-slate-400">El monto total y cliente se toman de aquí</span>
                            </label>
                            {deudas.length === 0 ? (
                                <div className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-700">
                                    No hay deudas disponibles para vincular. <Link href="/deudas/create" className="underline">Crea una deuda primero.</Link>
                                </div>
                            ) : (
                                <select value={data.deuda_id} onChange={handleDeudaChange}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white outline-none transition-all ${errors.deuda_id ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}>
                                    <option value="">— Selecciona una deuda —</option>
                                    {deudas.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.descripcion} · {d.cliente_nombre} · {formatMoney(d.monto_total, d.currency_code)}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.deuda_id && <p className="mt-1 text-xs text-red-600">{errors.deuda_id}</p>}
                        </div>

                        {/* ── Preview de la deuda seleccionada ─────── */}
                        {selectedDeuda && (
                            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                    <p className="text-xs text-sky-500 font-semibold uppercase tracking-wider mb-0.5">Cliente</p>
                                    <p className="text-sm font-semibold text-sky-900">{selectedDeuda.cliente_nombre}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-sky-500 font-semibold uppercase tracking-wider mb-0.5">Total deuda</p>
                                    <p className="text-sm font-bold text-sky-900">{formatMoney(selectedDeuda.monto_total, selectedDeuda.currency_code)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-sky-500 font-semibold uppercase tracking-wider mb-0.5">Pendiente cobro</p>
                                    <p className="text-sm font-semibold text-sky-900">{formatMoney(selectedDeuda.monto_pendiente, selectedDeuda.currency_code)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-sky-500 font-semibold uppercase tracking-wider mb-0.5">Estado deuda</p>
                                    <p className="text-sm font-semibold text-sky-900">{ESTADO_DEUDA_LABELS[selectedDeuda.estado] ?? selectedDeuda.estado}</p>
                                </div>
                            </div>
                        )}

                        {/* ── Empresa / Entidad (Select) ───────────── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Empresa que Factura</label>
                                <select value={data.empresa_factura} onChange={e => setData('empresa_factura', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white outline-none transition-all cursor-pointer ${errors.empresa_factura ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}>
                                    <option value="">— Seleccionar Empresa —</option>
                                    {empresas.map((emp, i) => <option key={i} value={emp}>{emp}</option>)}
                                </select>
                                {errors.empresa_factura && <p className="mt-1 text-xs text-red-600">{errors.empresa_factura}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Entidad que Recibe</label>
                                <select value={data.entidad_recibe} onChange={e => setData('entidad_recibe', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white outline-none transition-all cursor-pointer ${errors.entidad_recibe ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}>
                                    <option value="">— Seleccionar Entidad —</option>
                                    {entidades.map((ent, i) => <option key={i} value={ent}>{ent}</option>)}
                                </select>
                                {errors.entidad_recibe && <p className="mt-1 text-xs text-red-600">{errors.entidad_recibe}</p>}
                            </div>
                        </div>

                        {/* ── N° OC + Fechas ────────────────────────── */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">N° de OC *</label>
                                <input type="text" value={data.numero_oc} onChange={e => setData('numero_oc', e.target.value)}
                                    placeholder="OC-001"
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.numero_oc ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.numero_oc && <p className="mt-1 text-xs text-red-600">{errors.numero_oc}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de OC *</label>
                                <input type="date" value={data.fecha_oc} onChange={e => setData('fecha_oc', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.fecha_oc ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.fecha_oc && <p className="mt-1 text-xs text-red-600">{errors.fecha_oc}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Entrega</label>
                                <input type="date" value={data.fecha_entrega} onChange={e => setData('fecha_entrega', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10" />
                            </div>
                        </div>

                        {/* ── Estado ───────────────────────────────── */}
                        <div className="sm:w-1/3">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado de la OC</label>
                            <select value={data.estado} onChange={e => setData('estado', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10">
                                <option value="pendiente">Pendiente</option>
                                <option value="entregado">Entregado</option>
                                <option value="facturado">Facturado</option>
                                <option value="pagado">Pagado</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <textarea value={data.notas} onChange={e => setData('notas', e.target.value)} rows={3}
                                placeholder="Observaciones adicionales..."
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none resize-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10" />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={processing || !data.deuda_id}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50">
                                {processing ? 'Guardando...' : 'Registrar OC'}
                            </button>
                            <Link href="/utilidades" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
