import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Components/Layout';

function formatMoney(amount) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const METODO_LABELS = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    cheque: 'Cheque',
    otro: 'Otro',
};

const METODO_COLORS = {
    efectivo: 'bg-emerald-50 text-emerald-700',
    transferencia: 'bg-sky-50 text-sky-700',
    tarjeta: 'bg-violet-50 text-violet-700',
    cheque: 'bg-amber-50 text-amber-700',
    otro: 'bg-slate-100 text-slate-600',
};

export default function PagosIndex({ pagos, filtros }) {
    const [buscar, setBuscar] = useState(filtros?.buscar || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/pagos', { buscar, metodo_pago: filtros?.metodo_pago }, { preserveState: true });
    };

    const handleFilterMetodo = (metodo) => {
        router.get('/pagos', { buscar: filtros?.buscar, metodo_pago: metodo }, { preserveState: true });
    };

    const handleDeletePago = (id) => {
        if (confirm('Eliminar este pago? Se revertira el saldo en la deuda asociada.')) {
            router.delete(`/pagos/${id}`);
        }
    };

    return (
        <Layout title="Pagos">
            <Head title="Pagos" />
            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Pagos</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{pagos.total} pagos registrados</p>
                    </div>
                    <Link href="/pagos/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nuevo Pago
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <input type="text" value={buscar} onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Buscar por referencia, cliente o descripcion..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all" />
                        <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Buscar</button>
                    </form>
                    <div className="flex gap-2 flex-wrap">
                        {[['', 'Todos'], ['efectivo', 'Efectivo'], ['transferencia', 'Transfer.'], ['tarjeta', 'Tarjeta']].map(([val, label]) => (
                            <button key={val} onClick={() => handleFilterMetodo(val)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    (filtros?.metodo_pago || '') === val ? 'bg-[#0EA5E9] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}>{label}</button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {pagos.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                            <p className="text-sm text-slate-400 mt-3">No se encontraron pagos</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Fecha</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Cliente / Deuda</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Monto</th>
                                        <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Metodo</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Referencia</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {pagos.data.map((pago) => (
                                        <tr key={pago.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3.5 text-sm text-slate-700">{formatDate(pago.fecha_pago)}</td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-medium text-slate-800">
                                                    {pago.deuda?.cliente ? `${pago.deuda.cliente.nombre} ${pago.deuda.cliente.apellido}` : '-'}
                                                </p>
                                                <p className="text-xs text-slate-400">{pago.deuda?.descripcion || '-'}</p>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="text-sm font-semibold text-emerald-600">{formatMoney(pago.monto)}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${METODO_COLORS[pago.metodo_pago] || 'bg-slate-100 text-slate-600'}`}>
                                                    {METODO_LABELS[pago.metodo_pago] || pago.metodo_pago}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-slate-400">{pago.referencia || '-'}</td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button onClick={() => handleDeletePago(pago.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {pagos.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">Mostrando {pagos.from} a {pagos.to} de {pagos.total}</p>
                            <div className="flex gap-1">
                                {pagos.links.map((link, i) => (
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
