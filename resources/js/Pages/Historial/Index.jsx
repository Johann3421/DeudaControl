import { Head, Link, usePage } from '@inertiajs/react';
import Layout from '../../Components/Layout';

const ACCION_STYLES = {
    creado:    { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    editado:   { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
    eliminado: { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
    pago:      { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
    default:   { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400'   },
};

const TIPO_LABELS = {
    deuda:    { label: 'Deuda',    href: (id) => `/deudas/${id}` },
    pago:     { label: 'Pago',     href: (id) => `/pagos` },
    utilidad: { label: 'Utilidad', href: (id) => `/utilidades/${id}` },
    gasto:    { label: 'Gasto',    href: (id) => `/utilidades` },
    orden:    { label: 'Orden',    href: (id) => `/ordenes` },
};

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        return d.toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch { return '-'; }
}

function formatRelative(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'ahora mismo';
        if (mins < 60) return `hace ${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `hace ${hrs}h`;
        const days = Math.floor(hrs / 24);
        return `hace ${days}d`;
    } catch { return ''; }
}

export default function HistorialIndex({ logs }) {
    const { auth } = usePage().props;
    const esSuperadmin = auth.user?.rol === 'superadmin' || auth.user?.rol === 'jefe';

    return (
        <Layout title="Historial de Actividad">
            <Head title="Historial" />

            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Historial de Actividad</h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {esSuperadmin
                                ? 'Registro de todas las acciones realizadas por los usuarios'
                                : 'Tus acciones recientes en el sistema'}
                        </p>
                    </div>
                    <span className="text-sm text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                        {logs.total} registro{logs.total !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Timeline */}
                {logs.data.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-300 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <p className="text-slate-500 text-sm">No hay actividad registrada aún.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                                    {esSuperadmin && (
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</th>
                                    )}
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Acción</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.data.map((log) => {
                                    const accionStyle = ACCION_STYLES[log.accion] || ACCION_STYLES.default;
                                    const tipoInfo = TIPO_LABELS[log.entidad_tipo];

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            {/* Fecha */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-xs font-medium text-slate-700">{formatRelative(log.created_at)}</p>
                                                <p className="text-[10px] text-slate-400">{formatDateTime(log.created_at)}</p>
                                            </td>
                                            {/* Usuario (solo superadmin) */}
                                            {esSuperadmin && (
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {log.user ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-[#0EA5E9]/15 flex items-center justify-center text-[#0EA5E9] text-[10px] font-bold shrink-0">
                                                                {log.user.name?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-slate-700">{log.user.name}</p>
                                                                <p className="text-[10px] text-slate-400 capitalize">{log.user.rol}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">Sistema</span>
                                                    )}
                                                </td>
                                            )}
                                            {/* Acción */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${accionStyle.bg} ${accionStyle.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${accionStyle.dot}`} />
                                                    {log.accion.charAt(0).toUpperCase() + log.accion.slice(1)}
                                                </span>
                                            </td>
                                            {/* Tipo */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {tipoInfo && log.entidad_id ? (
                                                    <Link href={tipoInfo.href(log.entidad_id)}
                                                        className="text-xs text-[#0EA5E9] hover:underline font-medium">
                                                        {tipoInfo.label}
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-slate-500 capitalize">{log.entidad_tipo}</span>
                                                )}
                                            </td>
                                            {/* Descripción */}
                                            <td className="px-4 py-3 max-w-xs">
                                                <p className="text-xs text-slate-600 truncate" title={log.descripcion}>{log.descripcion}</p>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {logs.last_page > 1 && (
                            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Mostrando {logs.from}–{logs.to} de {logs.total}
                                </p>
                                <div className="flex gap-1">
                                    {logs.links.map((link, i) => (
                                        link.url ? (
                                            <Link key={i} href={link.url}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${link.active ? 'bg-[#0EA5E9] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span key={i}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-50"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
