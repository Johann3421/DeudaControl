import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Components/Layout';

function formatMoney(amount) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount || 0);
}

const TIPO_CONFIG = {
    pago_recibido: { label: 'Pago Recibido', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '+' },
    prestamo_otorgado: { label: 'Prestamo Otorgado', bg: 'bg-sky-50', text: 'text-sky-700', icon: '-' },
    ingreso: { label: 'Ingreso', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '+' },
    egreso: { label: 'Egreso', bg: 'bg-red-50', text: 'text-red-700', icon: '-' },
    ajuste: { label: 'Ajuste', bg: 'bg-amber-50', text: 'text-amber-700', icon: '~' },
};

export default function MovimientosIndex({ movimientos, filtros }) {
    const [tipo, setTipo] = useState(filtros?.tipo || '');
    const [desde, setDesde] = useState(filtros?.desde || '');
    const [hasta, setHasta] = useState(filtros?.hasta || '');

    const handleFilter = () => {
        router.get('/movimientos', { tipo, desde, hasta }, { preserveState: true });
    };

    const handleReset = () => {
        setTipo('');
        setDesde('');
        setHasta('');
        router.get('/movimientos', {}, { preserveState: true });
    };

    return (
        <Layout title="Movimientos">
            <Head title="Historial Financiero" />
            <div className="space-y-5">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Historial Financiero</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Registro de todos los movimientos del sistema</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                            <select value={tipo} onChange={(e) => setTipo(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white outline-none focus:border-[#0EA5E9]">
                                <option value="">Todos los tipos</option>
                                <option value="pago_recibido">Pago Recibido</option>
                                <option value="prestamo_otorgado">Prestamo Otorgado</option>
                                <option value="ingreso">Ingreso</option>
                                <option value="egreso">Egreso</option>
                                <option value="ajuste">Ajuste</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Desde</label>
                            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0EA5E9]" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Hasta</label>
                            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-[#0EA5E9]" />
                        </div>
                        <div className="flex items-end gap-2">
                            <button onClick={handleFilter}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#0EA5E9] text-white hover:bg-[#0284C7] transition-colors">
                                Filtrar
                            </button>
                            <button onClick={handleReset}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {movimientos.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <p className="text-sm text-slate-400 mt-3">No hay movimientos registrados</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {movimientos.data.map((mov) => {
                                const config = TIPO_CONFIG[mov.tipo] || TIPO_CONFIG.ajuste;
                                const fecha = new Date(mov.created_at);
                                return (
                                    <div key={mov.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                                        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                                            <span className={`text-lg font-bold ${config.text}`}>{config.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${config.bg} ${config.text}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1 truncate">{mov.descripcion}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-sm font-semibold ${
                                                ['pago_recibido', 'ingreso'].includes(mov.tipo) ? 'text-emerald-600' : 'text-slate-800'
                                            }`}>
                                                {['pago_recibido', 'ingreso'].includes(mov.tipo) ? '+' : ''}{formatMoney(mov.monto)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {movimientos.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">Mostrando {movimientos.from} a {movimientos.to} de {movimientos.total}</p>
                            <div className="flex gap-1">
                                {movimientos.links.map((link, i) => (
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
