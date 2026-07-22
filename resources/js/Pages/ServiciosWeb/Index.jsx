import { Head, Link, router } from '@inertiajs/react';
import { useMemo } from 'react';
import Layout from '../../Components/Layout';

const TIPO_STYLES = {
    hosting: { bg: 'bg-violet-50 text-violet-700 border-violet-200', icon: '🖥️', label: 'Hosting' },
    dominio: { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🌐', label: 'Dominio' },
    ssl:     { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🔒', label: 'SSL' },
    email:   { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: '📧', label: 'Email' },
    otro:    { bg: 'bg-slate-100 text-slate-600 border-slate-200', icon: '🔧', label: 'Otro' },
};

const ESTADO_STYLES = {
    activo:    { bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    vencido:   { bg: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
    cancelado: { bg: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

function diasHasta(fechaStr) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fechaStr + 'T00:00:00');
    return Math.round((venc - hoy) / 86400000);
}

function urgenciaBadge(dias) {
    if (dias < 0) return 'bg-rose-600 text-white';
    if (dias <= 7) return 'bg-rose-500 text-white';
    if (dias <= 30) return 'bg-amber-500 text-white';
    return 'bg-slate-200 text-slate-600';
}

export default function ServiciosWebIndex({ servicios, filtros }) {
    const handleFilter = (key, value) => {
        router.get('/servicios-web', { ...filtros, [key]: value }, { preserveState: true });
    };

    const handleDelete = (id) => {
        if (confirm('¿Eliminar este servicio?')) {
            router.delete(`/servicios-web/${id}`, { preserveScroll: true });
        }
    };

    // Agrupar por tipo para la visualización organizada
    const grouped = useMemo(() => {
        const g = {};
        servicios.data.forEach(s => {
            const key = s.tipo;
            if (!g[key]) g[key] = [];
            g[key].push(s);
        });
        return g;
    }, [servicios.data]);

    const tiposOrden = ['hosting', 'dominio', 'ssl', 'email', 'otro'];

    return (
        <Layout title="Servicios Web">
            <Head title="Servicios Web" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Servicios Web</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Control de hosting, dominios, SSL y otros servicios digitales</p>
                    </div>
                    <Link
                        href="/servicios-web/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Registrar Servicio
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2 items-center">
                    <input
                        type="text"
                        defaultValue={filtros?.buscar || ''}
                        onKeyDown={(e) => e.key === 'Enter' && handleFilter('buscar', e.target.value)}
                        placeholder="Buscar por nombre o proveedor..."
                        className="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
                    />
                    <select
                        value={filtros?.tipo || ''}
                        onChange={(e) => handleFilter('tipo', e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] outline-none"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="hosting">🖥️ Hosting</option>
                        <option value="dominio">🌐 Dominio</option>
                        <option value="ssl">🔒 SSL</option>
                        <option value="email">📧 Email</option>
                        <option value="otro">🔧 Otro</option>
                    </select>
                    <select
                        value={filtros?.estado || ''}
                        onChange={(e) => handleFilter('estado', e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] outline-none"
                    >
                        <option value="">Todos los estados</option>
                        <option value="activo">🟢 Activo</option>
                        <option value="vencido">🔴 Vencido</option>
                        <option value="cancelado">⚫ Cancelado</option>
                    </select>
                </div>

                {/* Content */}
                {servicios.data.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        <p className="text-sm text-slate-400 mt-3">No se encontraron servicios</p>
                        <Link href="/servicios-web/create" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#0EA5E9]">Registrar primer servicio</Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {tiposOrden.filter(t => grouped[t]).map(tipo => {
                            const style = TIPO_STYLES[tipo];
                            return (
                                <div key={tipo} className="space-y-3">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                                        <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                                        {style.icon} {style.label}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {grouped[tipo].map(s => {
                                            const ss = ESTADO_STYLES[s.estado] || ESTADO_STYLES.activo;
                                            const dias = diasHasta(s.fecha_vencimiento);
                                            const urgencia = urgenciaBadge(dias);
                                            const sym = s.moneda === 'USD' ? '$' : 'S/';
                                            const fechaStr = new Date(s.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-PE');

                                            return (
                                                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                                                    <div className="space-y-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="text-xs text-slate-400 font-medium">{s.proveedor}</p>
                                                                <p className="text-sm font-bold text-slate-800 mt-0.5 break-all">{s.nombre}</p>
                                                            </div>
                                                            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg}`}>
                                                                {style.icon}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ss.bg}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${ss.dot}`} />
                                                                {s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                                                            </span>
                                                            <span className="text-xs text-slate-400 capitalize">{s.periodo}</span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-slate-100 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[10px] uppercase tracking-wider text-slate-400">Vencimiento</p>
                                                                <p className="text-sm font-semibold text-slate-700">{fechaStr}</p>
                                                            </div>
                                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${urgencia}`}>
                                                                {dias < 0 ? `Hace ${Math.abs(dias)}d` : dias === 0 ? '¡HOY!' : `${dias}d`}
                                                            </span>
                                                        </div>

                                                        {s.monto && (
                                                            <p className="text-lg font-extrabold text-slate-900">{sym} {parseFloat(s.monto).toFixed(2)}</p>
                                                        )}

                                                        <div className="flex items-center justify-end gap-1.5 pt-1">
                                                            <Link
                                                                href={`/servicios-web/${s.id}/edit`}
                                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(s.id)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {servicios.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs text-slate-400">Mostrando {servicios.from} a {servicios.to} de {servicios.total}</p>
                        <div className="flex gap-1">
                            {servicios.links.map((link, i) => (
                                <Link key={i} href={link.url || '#'}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${link.active ? 'bg-[#0EA5E9] text-white' : link.url ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
