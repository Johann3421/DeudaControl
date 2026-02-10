import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Components/Layout';
import { formatMoney } from '../../helpers/currencyHelper';

const ESTADO_STYLES = {
    activa: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
    pagada: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    vencida: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    cancelada: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const TIPO_STYLES = {
    particular: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Particular' },
    entidad: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Entidad' },
    alquiler: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Alquiler' },
};

export default function DeudasIndex({ deudas, filtros }) {
    const [buscar, setBuscar] = useState(filtros?.buscar || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/deudas', { buscar, estado: filtros?.estado, tipo_deuda: filtros?.tipo_deuda }, { preserveState: true });
    };

    const handleFilterEstado = (estado) => {
        router.get('/deudas', { buscar: filtros?.buscar, estado, tipo_deuda: filtros?.tipo_deuda }, { preserveState: true });
    };

    const handleFilterTipo = (tipo_deuda) => {
        router.get('/deudas', { buscar: filtros?.buscar, estado: filtros?.estado, tipo_deuda }, { preserveState: true });
    };

    return (
        <Layout title="Deudas">
            <Head title="Deudas" />
            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Deudas</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{deudas.total} deudas registradas</p>
                    </div>
                    <Link href="/deudas/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nueva Deuda
                    </Link>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <input type="text" value={buscar} onChange={(e) => setBuscar(e.target.value)}
                                placeholder="Buscar por descripcion o cliente..."
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all" />
                            <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Buscar</button>
                        </form>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-slate-400 self-center mr-1">Tipo:</span>
                        {[['', 'Todos'], ['particular', 'Particular'], ['entidad', 'Entidad'], ['alquiler', 'Alquiler']].map(([val, label]) => (
                            <button key={`tipo-${val}`} onClick={() => handleFilterTipo(val)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    (filtros?.tipo_deuda || '') === val ? 'bg-[#0EA5E9] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}>{label}</button>
                        ))}
                        <span className="text-xs text-slate-400 self-center ml-3 mr-1">Estado:</span>
                        {[['', 'Todas'], ['activa', 'Activas'], ['pagada', 'Pagadas'], ['vencida', 'Vencidas']].map(([val, label]) => (
                            <button key={`est-${val}`} onClick={() => handleFilterEstado(val)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    (filtros?.estado || '') === val ? 'bg-[#0EA5E9] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}>{label}</button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {deudas.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            <p className="text-sm text-slate-400 mt-3">No se encontraron deudas</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Descripcion</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Cliente / Entidad</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Creado Por</th>
                                        <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Tipo</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Monto Total</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Pendiente</th>
                                        <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Estado</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {deudas.data.map((deuda) => {
                                        const estilos = ESTADO_STYLES[deuda.estado] || ESTADO_STYLES.activa;
                                        const tipoStyle = TIPO_STYLES[deuda.tipo_deuda] || TIPO_STYLES.particular;
                                        const progreso = deuda.monto_total > 0 ? (((deuda.monto_total - deuda.monto_pendiente) / deuda.monto_total) * 100) : 0;
                                        return (
                                            <tr key={deuda.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <Link href={`/deudas/${deuda.id}`} className="text-sm font-medium text-slate-800 hover:text-[#0EA5E9] transition-colors">
                                                        {deuda.descripcion}
                                                    </Link>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                                                            <div className="h-full bg-[#0EA5E9] rounded-full" style={{ width: `${progreso}%` }} />
                                                        </div>
                                                        <span className="text-xs text-slate-400">{progreso.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {deuda.cliente ? (
                                                        <Link href={`/clientes/${deuda.cliente.id}`} className="text-sm text-slate-600 hover:text-[#0EA5E9]">
                                                            {deuda.cliente.nombre} {deuda.cliente.apellido}
                                                        </Link>
                                                    ) : deuda.deuda_entidad?.entidad ? (
                                                        <span className="text-sm text-slate-600">
                                                            {deuda.deuda_entidad.entidad.razon_social}
                                                        </span>
                                                    ) : <span className="text-sm text-slate-400">-</span>}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="text-sm">
                                                        <p className="text-slate-700 font-medium">{deuda.user?.name}</p>
                                                        <p className="text-xs text-slate-400">{deuda.user?.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${tipoStyle.bg} ${tipoStyle.text}`}>
                                                        {tipoStyle.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <span className="text-sm font-medium text-slate-800">{formatMoney(deuda.monto_total)}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <span className="text-sm font-semibold text-amber-600">{formatMoney(deuda.monto_pendiente)}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estilos.bg} ${estilos.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${estilos.dot}`} />
                                                        {deuda.estado.charAt(0).toUpperCase() + deuda.estado.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/deudas/${deuda.id}`} className="p-2 text-slate-400 hover:text-[#0EA5E9] rounded-lg hover:bg-slate-100 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                        </Link>
                                                        <Link href={`/deudas/${deuda.id}/edit`} className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {deudas.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">Mostrando {deudas.from} a {deudas.to} de {deudas.total}</p>
                            <div className="flex gap-1">
                                {deudas.links.map((link, i) => (
                                    <Link key={i} href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            link.active ? 'bg-[#0EA5E9] text-white' : link.url ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'
                                        }`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
