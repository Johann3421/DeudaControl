import { Head, Link } from '@inertiajs/react';
import Layout from '../Components/Layout';

function formatMoney(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount || 0);
}

function StatCard({ title, value, subtitle, icon, color, href }) {
    const colorMap = {
        blue: { bg: 'bg-sky-50', icon: 'text-[#0EA5E9]', border: 'border-sky-100' },
        green: { bg: 'bg-emerald-50', icon: 'text-emerald-500', border: 'border-emerald-100' },
        amber: { bg: 'bg-amber-50', icon: 'text-amber-500', border: 'border-amber-100' },
        red: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-100' },
        violet: { bg: 'bg-violet-50', icon: 'text-violet-500', border: 'border-violet-100' },
    };
    const c = colorMap[color] || colorMap.blue;

    const content = (
        <div className={`bg-white rounded-2xl border ${c.border} p-5 hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-start justify-between">
                <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
                    {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
                </div>
                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                    <span className={c.icon}>{icon}</span>
                </div>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href} className="block">{content}</Link>;
    }
    return content;
}

const ESTADO_COLORS = {
    activa: { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
    pagada: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    vencida: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    cancelada: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const METODO_LABELS = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    cheque: 'Cheque',
    otro: 'Otro',
};

export default function Dashboard({ metricas, pagos_recientes, deudas_por_estado }) {
    const porcentajeRecuperado = metricas.monto_total_prestado > 0
        ? ((metricas.monto_recuperado / metricas.monto_total_prestado) * 100).toFixed(1)
        : 0;

    return (
        <Layout title="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Welcome section */}
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Resumen General</h2>
                    <p className="text-sm text-slate-500 mt-1">Vista general de tu actividad financiera</p>
                </div>

                {/* Main stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Prestado"
                        value={formatMoney(metricas.monto_total_prestado)}
                        subtitle={`${metricas.total_deudas} deudas registradas`}
                        color="blue"
                        href="/deudas"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23" />
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Pendiente por Cobrar"
                        value={formatMoney(metricas.monto_pendiente)}
                        subtitle={`${metricas.deudas_activas} deudas activas`}
                        color="amber"
                        href="/deudas?estado=activa"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Recuperado"
                        value={formatMoney(metricas.monto_recuperado)}
                        subtitle={`${porcentajeRecuperado}% del total`}
                        color="green"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                <polyline points="17 6 23 6 23 12" />
                            </svg>
                        }
                    />
                    <StatCard
                        title="Clientes"
                        value={metricas.clientes_activos}
                        subtitle={`${metricas.total_clientes} registrados en total`}
                        color="violet"
                        href="/clientes"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        }
                    />
                </div>

                {/* Alert: overdue debts */}
                {metricas.deudas_vencidas > 0 && (
                    <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-50 border border-red-200">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800">
                                {metricas.deudas_vencidas} {metricas.deudas_vencidas === 1 ? 'deuda vencida' : 'deudas vencidas'}
                            </p>
                            <p className="text-xs text-red-600 mt-0.5">Requieren atencion inmediata</p>
                        </div>
                        <Link
                            href="/deudas?estado=vencida"
                            className="text-sm font-medium text-red-700 hover:text-red-900 whitespace-nowrap"
                        >
                            Ver deudas
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Recent payments */}
                    <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Pagos Recientes</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Ultimos pagos registrados</p>
                            </div>
                            <Link
                                href="/pagos"
                                className="text-xs font-medium text-[#0EA5E9] hover:text-[#0284C7] transition-colors"
                            >
                                Ver todos
                            </Link>
                        </div>

                        {pagos_recientes.length === 0 ? (
                            <div className="px-5 py-12 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                    <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                                <p className="text-sm text-slate-400 mt-3">Aun no hay pagos registrados</p>
                                <Link
                                    href="/pagos/create"
                                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#0EA5E9] hover:text-[#0284C7]"
                                >
                                    Registrar primer pago
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {pagos_recientes.map((pago) => (
                                    <div key={pago.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                                        <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{pago.cliente}</p>
                                            <p className="text-xs text-slate-400 truncate">{pago.deuda_descripcion}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-semibold text-emerald-600">{formatMoney(pago.monto)}</p>
                                            <p className="text-xs text-slate-400">{pago.fecha_pago}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Debts by status */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-900">Deudas por Estado</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Distribucion actual</p>
                        </div>

                        {deudas_por_estado.length === 0 ? (
                            <div className="px-5 py-12 text-center">
                                <p className="text-sm text-slate-400">Sin datos disponibles</p>
                            </div>
                        ) : (
                            <div className="p-5 space-y-4">
                                {deudas_por_estado.map((item) => {
                                    const colors = ESTADO_COLORS[item.estado] || ESTADO_COLORS.activa;
                                    const total = deudas_por_estado.reduce((acc, i) => acc + i.total, 0);
                                    const percentage = total > 0 ? ((item.total / total) * 100).toFixed(0) : 0;

                                    return (
                                        <div key={item.estado}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                                        {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-medium text-slate-500">{item.total}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${colors.dot}`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-400 w-16 text-right">{formatMoney(item.monto)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Link
                        href="/clientes/create"
                        className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#0EA5E9]/30 hover:shadow-md transition-all duration-200 group"
                    >
                        <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center group-hover:bg-[#0EA5E9] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#0EA5E9] group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Nuevo Cliente</p>
                            <p className="text-xs text-slate-400">Registrar cliente</p>
                        </div>
                    </Link>
                    <Link
                        href="/deudas/create"
                        className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 group"
                    >
                        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Nueva Deuda</p>
                            <p className="text-xs text-slate-400">Registrar prestamo</p>
                        </div>
                    </Link>
                    <Link
                        href="/pagos/create"
                        className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 group"
                    >
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                <line x1="1" y1="10" x2="23" y2="10" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Nuevo Pago</p>
                            <p className="text-xs text-slate-400">Registrar cobro</p>
                        </div>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
