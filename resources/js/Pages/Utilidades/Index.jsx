import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Components/Layout';
import { formatMoney } from '../../helpers/currencyHelper';

const ESTADO_STYLES = {
    pendiente:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Pendiente'  },
    entregado:  { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-500',     label: 'Entregado'  },
    facturado:  { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500',  label: 'Facturado'  },
    pagado:     { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Pagado'     },
};

const COLOR_STYLES = {
    verde:   { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    naranja: { bar: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50'   },
    rojo:    { bar: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50'     },
};

function StatCard({ label, value, sub, color = 'slate' }) {
    const colors = {
        slate:   'bg-white border-slate-200 text-slate-800',
        green:   'bg-emerald-50 border-emerald-200 text-emerald-800',
        red:     'bg-red-50 border-red-200 text-red-700',
        amber:   'bg-amber-50 border-amber-200 text-amber-800',
        violet:  'bg-violet-50 border-violet-200 text-violet-800',
    };
    return (
        <div className={`rounded-2xl border p-5 ${colors[color]}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
        </div>
    );
}

export default function UtilidadesIndex({ ocs, resumen, filtros }) {
    const [buscar, setBuscar] = useState(filtros?.buscar || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/utilidades', { buscar, estado: filtros?.estado, filtro_utilidad: filtros?.filtro_utilidad }, { preserveState: true });
    };
    const filterEstado = (estado) =>
        router.get('/utilidades', { buscar: filtros?.buscar, estado, filtro_utilidad: filtros?.filtro_utilidad }, { preserveState: true });
    const filterUtilidad = (filtro_utilidad) =>
        router.get('/utilidades', { buscar: filtros?.buscar, estado: filtros?.estado, filtro_utilidad }, { preserveState: true });

    return (
        <Layout title="Utilidades">
            <Head title="Utilidades" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Utilidades</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{ocs.total} órdenes de compra</p>
                    </div>
                    <Link href="/utilidades/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nueva OC
                    </Link>
                </div>

                {/* Resumen cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard label="Total Vendido"  value={formatMoney(resumen.total_vendido)}  color="slate"  />
                    <StatCard label="Total Gastado"  value={formatMoney(resumen.total_gastado)}  color="amber"  />
                    <StatCard label="Utilidad Total" value={formatMoney(resumen.total_utilidad)} color={resumen.total_utilidad >= 0 ? 'green' : 'red'} />
                    <StatCard label="Deuda por Cobrar" value={formatMoney(resumen.total_deuda)} color="violet" />
                    <StatCard label="Órdenes"        value={resumen.total_ocs}                  color="slate"  />
                </div>

                {/* Filters */}
                <div className="space-y-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input type="text" value={buscar} onChange={e => setBuscar(e.target.value)}
                            placeholder="Buscar por N° OC o cliente..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all" />
                        <button className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Buscar</button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-slate-400 self-center mr-1">Estado:</span>
                        {[['', 'Todos'], ['pendiente', 'Pendiente'], ['entregado', 'Entregado'], ['facturado', 'Facturado'], ['pagado', 'Pagado']].map(([v, l]) => (
                            <button key={v} onClick={() => filterEstado(v)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(filtros?.estado || '') === v ? 'bg-[#0EA5E9] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{l}</button>
                        ))}
                        <span className="text-xs text-slate-400 self-center ml-3 mr-1">Utilidad:</span>
                        {[['', 'Todas'], ['perdida', 'Pérdida'], ['baja', 'Baja (<5%)'], ['pendiente_pago', 'Pendiente pago']].map(([v, l]) => (
                            <button key={v} onClick={() => filterUtilidad(v)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(filtros?.filtro_utilidad || '') === v ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{l}</button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {ocs.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <p className="text-sm text-slate-400 mt-3">No se encontraron órdenes de compra</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        {['N° OC', 'Cliente', 'Fecha OC', 'Total OC', 'Gastos', 'Utilidad', '% Utilidad', 'Deuda', 'Estado', 'Acciones'].map(h => (
                                            <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {ocs.data.map((oc) => {
                                        const est   = ESTADO_STYLES[oc.estado] || ESTADO_STYLES.pendiente;
                                        const col   = COLOR_STYLES[oc.color_utilidad] || COLOR_STYLES.rojo;
                                        const pct   = Number(oc.porcentaje_utilidad || 0);
                                        const barW  = Math.min(Math.max(pct, 0), 100);
                                        return (
                                            <tr key={oc.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <Link href={`/utilidades/${oc.id}`} className="text-sm font-semibold text-slate-800 hover:text-[#0EA5E9]">{oc.numero_oc}</Link>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-slate-600 max-w-[160px] truncate">{oc.cliente}</td>
                                                <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                                                    {oc.fecha_oc ? new Date(oc.fecha_oc).toLocaleDateString('es-PE') : '-'}
                                                </td>
                                                <td className="px-5 py-3.5 text-sm font-medium text-slate-800 whitespace-nowrap">{formatMoney(oc.total_oc, oc.currency_code)}</td>
                                                <td className="px-5 py-3.5 text-sm text-slate-600 whitespace-nowrap">{formatMoney(oc.total_gastos, oc.currency_code)}</td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className={`text-sm font-semibold ${col.text}`}>{formatMoney(oc.utilidad, oc.currency_code)}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2 min-w-[90px]">
                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${col.bar}`} style={{ width: `${barW}%` }} />
                                                        </div>
                                                        <span className={`text-xs font-semibold ${col.text}`}>{pct.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm font-medium text-violet-700 whitespace-nowrap">{formatMoney(oc.deuda_pendiente, oc.currency_code)}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${est.bg} ${est.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${est.dot}`} />
                                                        {est.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <Link href={`/utilidades/${oc.id}`} className="text-xs text-slate-500 hover:text-[#0EA5E9] transition-colors">Ver</Link>
                                                        <Link href={`/utilidades/${oc.id}/edit`} className="text-xs text-slate-500 hover:text-amber-600 transition-colors">Editar</Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {ocs.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {ocs.links.map((link, i) => (
                            <button key={i} disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${link.active ? 'bg-[#0EA5E9] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 disabled:opacity-40'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}
