import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Components/Layout';
import { formatMoney } from '../../helpers/currencyHelper';

const TIPO_GASTO_LABELS = {
    compra_producto: 'Compra de Producto',
    transporte:      'Transporte',
    envio:           'Envío',
    accesorios:      'Accesorios',
    logistica:       'Gasto Logístico',
    otro:            'Otro',
};

const ESTADO_STYLES = {
    pendiente:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Pendiente'  },
    entregado:  { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-500',     label: 'Entregado'  },
    facturado:  { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500',  label: 'Facturado'  },
    pagado:     { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Pagado'     },
};

const COLOR_STYLES = {
    verde:   { bar: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Rentabilidad buena' },
    naranja: { bar: 'bg-amber-400',   text: 'text-amber-700',   badge: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Rentabilidad media' },
    rojo:    { bar: 'bg-red-500',     text: 'text-red-700',     badge: 'bg-red-50 text-red-700 border-red-200',             label: 'Pérdida / rentabilidad baja' },
};

const METODO_LABELS = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta', cheque: 'Cheque', otro: 'Otro' };

function AddGastoForm({ ocId }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        tipo_gasto:  'compra_producto',
        descripcion: '',
        monto:       '',
        fecha:       new Date().toISOString().split('T')[0],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/utilidades/${ocId}/gastos`, { onSuccess: () => reset() });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Añadir gasto</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                    <select value={data.tipo_gasto} onChange={e => setData('tipo_gasto', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10">
                        {Object.entries(TIPO_GASTO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <input type="text" value={data.descripcion} onChange={e => setData('descripcion', e.target.value)}
                        placeholder="Descripción (opcional)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10" />
                </div>
                <div>
                    <input type="number" step="0.01" min="0" value={data.monto} onChange={e => setData('monto', e.target.value)}
                        placeholder="Monto *"
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10 ${errors.monto ? 'border-red-300' : 'border-slate-200'}`} />
                </div>
                <div>
                    <input type="date" value={data.fecha} onChange={e => setData('fecha', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10" />
                </div>
            </div>
            {errors.monto && <p className="text-xs text-red-600">{errors.monto}</p>}
            <button type="submit" disabled={processing}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors disabled:opacity-50">
                {processing ? 'Añadiendo...' : '+ Añadir gasto'}
            </button>
        </form>
    );
}

function AddPagoForm({ ocId }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        monto:       '',
        fecha_pago:  new Date().toISOString().split('T')[0],
        metodo_pago: 'transferencia',
        referencia:  '',
        notas:       '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(`/utilidades/${ocId}/pagos`, { onSuccess: () => reset() });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Registrar pago</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                    <input type="number" step="0.01" min="0" value={data.monto} onChange={e => setData('monto', e.target.value)}
                        placeholder="Monto *"
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10 ${errors.monto ? 'border-red-300' : 'border-slate-200'}`} />
                    {errors.monto && <p className="mt-0.5 text-xs text-red-600">{errors.monto}</p>}
                </div>
                <div>
                    <input type="date" value={data.fecha_pago} onChange={e => setData('fecha_pago', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10" />
                </div>
                <div>
                    <select value={data.metodo_pago} onChange={e => setData('metodo_pago', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10">
                        {Object.entries(METODO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </div>
                <div>
                    <input type="text" value={data.referencia} onChange={e => setData('referencia', e.target.value)}
                        placeholder="Referencia (opcional)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10" />
                </div>
            </div>
            <button type="submit" disabled={processing}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {processing ? 'Registrando...' : '+ Registrar pago'}
            </button>
        </form>
    );
}

export default function UtilidadesShow({ oc }) {
    const est    = ESTADO_STYLES[oc.estado] || ESTADO_STYLES.pendiente;
    const col    = COLOR_STYLES[oc.color_utilidad] || COLOR_STYLES.rojo;
    const pct    = Number(oc.porcentaje_utilidad || 0);
    const barW   = Math.min(Math.max(pct, 0), 100);
    const cur    = oc.currency_code || 'PEN';
    const gastos = oc.gastos || [];
    const pagos  = oc.pagos  || [];

    const handleDeleteGasto = (gastoId) => {
        if (!confirm('¿Eliminar este gasto?')) return;
        router.delete(`/utilidades/${oc.id}/gastos/${gastoId}`, { preserveScroll: true });
    };

    const handleDeletePago = (pagoId) => {
        if (!confirm('¿Eliminar este pago?')) return;
        router.delete(`/utilidades/${oc.id}/pagos/${pagoId}`, { preserveScroll: true });
    };

    const handleDeleteOC = () => {
        if (!confirm('¿Eliminar esta orden de compra? Esta acción no se puede deshacer.')) return;
        router.delete(`/utilidades/${oc.id}`);
    };

    return (
        <Layout title={`OC: ${oc.numero_oc}`}>
            <Head title={`OC: ${oc.numero_oc}`} />
            <div className="space-y-6 max-w-5xl">
                {/* Back + Actions */}
                <div className="flex items-center justify-between">
                    <Link href="/utilidades" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a Utilidades
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link href={`/utilidades/${oc.id}/edit`}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                            Editar OC
                        </Link>
                        <button onClick={handleDeleteOC}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                            Eliminar
                        </button>
                    </div>
                </div>

                {/* Header card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-slate-900">{oc.numero_oc}</h2>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${est.bg} ${est.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                                    {est.label}
                                </span>
                            </div>
                            <p className="text-slate-500 text-sm">{oc.cliente}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                <span>Fecha OC: {oc.fecha_oc ? new Date(oc.fecha_oc).toLocaleDateString('es-PE') : '-'}</span>
                                {oc.fecha_entrega && <span>Entrega: {new Date(oc.fecha_entrega).toLocaleDateString('es-PE')}</span>}
                            </div>
                        </div>
                        {/* Utilidad badge */}
                        <div className={`flex flex-col items-end rounded-xl p-4 border ${col.badge} text-right`}>
                            <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{col.label}</p>
                            <p className={`text-3xl font-bold ${col.text}`}>{pct.toFixed(1)}%</p>
                            <p className={`text-sm font-semibold ${col.text}`}>{formatMoney(oc.utilidad, cur)}</p>
                            <div className="w-28 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                                <div className={`h-full rounded-full ${col.bar}`} style={{ width: `${barW}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total OC',      value: formatMoney(oc.total_oc,        cur), color: 'text-slate-800' },
                        { label: 'Total Gastos',  value: formatMoney(oc.total_gastos,    cur), color: 'text-amber-700' },
                        { label: 'Total Pagado',  value: formatMoney(oc.total_pagado,    cur), color: 'text-emerald-700' },
                        { label: 'Deuda Pendiente', value: formatMoney(oc.deuda_pendiente, cur), color: 'text-violet-700' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Gastos */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        Gastos ({gastos.length})
                    </h3>

                    <AddGastoForm ocId={oc.id} />

                    {gastos.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">Sin gastos registrados</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Tipo</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Descripción</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Fecha</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Monto</th>
                                        <th className="px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {gastos.map(g => (
                                        <tr key={g.id} className="hover:bg-slate-50/50">
                                            <td className="px-3 py-2.5">
                                                <span className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{TIPO_GASTO_LABELS[g.tipo_gasto] || g.tipo_gasto}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-sm text-slate-600">{g.descripcion || '-'}</td>
                                            <td className="px-3 py-2.5 text-xs text-slate-400">{g.fecha ? new Date(g.fecha).toLocaleDateString('es-PE') : '-'}</td>
                                            <td className="px-3 py-2.5 text-sm font-semibold text-slate-800 text-right">{formatMoney(g.monto, cur)}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <button onClick={() => handleDeleteGasto(g.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-slate-200">
                                        <td colSpan={3} className="px-3 py-2.5 text-sm font-semibold text-slate-700">Total gastos</td>
                                        <td className="px-3 py-2.5 text-sm font-bold text-amber-700 text-right">{formatMoney(oc.total_gastos, cur)}</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagos */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        Pagos recibidos ({pagos.length})
                    </h3>

                    <AddPagoForm ocId={oc.id} />

                    {pagos.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">Sin pagos registrados</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Fecha</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Método</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Referencia</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">Monto</th>
                                        <th className="px-3 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {pagos.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50/50">
                                            <td className="px-3 py-2.5 text-sm text-slate-600">{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-PE') : '-'}</td>
                                            <td className="px-3 py-2.5">
                                                <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{METODO_LABELS[p.metodo_pago] || p.metodo_pago}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-sm text-slate-500">{p.referencia || '-'}</td>
                                            <td className="px-3 py-2.5 text-sm font-semibold text-emerald-700 text-right">{formatMoney(p.monto, cur)}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <button onClick={() => handleDeletePago(p.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-slate-200">
                                        <td colSpan={3} className="px-3 py-2.5 text-sm font-semibold text-slate-700">Total pagado</td>
                                        <td className="px-3 py-2.5 text-sm font-bold text-emerald-700 text-right">{formatMoney(oc.total_pagado, cur)}</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Notas */}
                {oc.notas && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notas</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{oc.notas}</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
