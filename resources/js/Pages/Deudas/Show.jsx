import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { formatMoney } from '../../helpers/currencyHelper';

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const ESTADO_STYLES = {
    activa: 'bg-sky-50 text-sky-700',
    pagada: 'bg-emerald-50 text-emerald-700',
    vencida: 'bg-red-50 text-red-700',
    cancelada: 'bg-slate-100 text-slate-600',
};

const METODO_LABELS = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    cheque: 'Cheque',
    otro: 'Otro',
};

export default function DeudasShow({ deuda }) {
    const progreso = deuda.monto_total > 0 ? (((deuda.monto_total - deuda.monto_pendiente) / deuda.monto_total) * 100) : 0;

    const handleDelete = () => {
        if (confirm('Estas seguro de eliminar esta deuda? Esta accion no se puede deshacer.')) {
            router.delete(`/deudas/${deuda.id}`);
        }
    };

    return (
        <Layout title="Detalle de Deuda">
            <Head title={deuda.descripcion} />
            <div className="space-y-6">
                <div className="mb-6">
                    <Link href="/deudas" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a deudas
                    </Link>
                </div>

                {/* Debt header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl font-bold text-slate-900">{deuda.descripcion}</h2>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ESTADO_STYLES[deuda.estado] || ''}`}>
                                    {deuda.estado.charAt(0).toUpperCase() + deuda.estado.slice(1)}
                                </span>
                            </div>
                            {deuda.cliente && (
                                <Link href={`/clientes/${deuda.cliente.id}`} className="text-sm text-[#0EA5E9] hover:underline">
                                    {deuda.cliente.nombre} {deuda.cliente.apellido}
                                </Link>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/pagos/create?deuda_id=${deuda.id}`}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">
                                Registrar Pago
                            </Link>
                            <Link href={`/deudas/${deuda.id}/edit`}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                Editar
                            </Link>
                            <button onClick={handleDelete}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                                Eliminar
                            </button>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500">Progreso de pago</span>
                            <span className="text-sm font-semibold text-slate-700">{progreso.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#0EA5E9] to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${progreso}%` }} />
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50">
                            <p className="text-xs text-slate-400">Monto Total</p>
                            <p className="text-lg font-bold text-slate-900 mt-1">{formatMoney(deuda.monto_total)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50">
                            <p className="text-xs text-amber-600">Pendiente</p>
                            <p className="text-lg font-bold text-amber-700 mt-1">{formatMoney(deuda.monto_pendiente)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50">
                            <p className="text-xs text-emerald-600">Pagado</p>
                            <p className="text-lg font-bold text-emerald-700 mt-1">{formatMoney(deuda.monto_total - deuda.monto_pendiente)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50">
                            <p className="text-xs text-slate-400">Interes</p>
                            <p className="text-lg font-bold text-slate-900 mt-1">{deuda.tasa_interes}%</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-xs text-slate-400">Fecha Inicio</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{formatDate(deuda.fecha_inicio)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Vencimiento</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{formatDate(deuda.fecha_vencimiento)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Frecuencia</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5 capitalize">{deuda.frecuencia_pago}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Cuotas</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{deuda.numero_cuotas || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Payments history */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Historial de Pagos</h3>
                        <span className="text-xs text-slate-400">{deuda.pagos?.length || 0} pagos</span>
                    </div>

                    {(!deuda.pagos || deuda.pagos.length === 0) ? (
                        <div className="py-12 text-center">
                            <p className="text-sm text-slate-400">Aun no hay pagos registrados para esta deuda</p>
                            <Link href={`/pagos/create?deuda_id=${deuda.id}`} className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#0EA5E9]">
                                Registrar primer pago
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Fecha</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Monto</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Metodo</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Referencia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {deuda.pagos.map((pago) => (
                                        <tr key={pago.id} className="hover:bg-slate-50/50">
                                            <td className="px-5 py-3 text-sm text-slate-700">{formatDate(pago.fecha_pago)}</td>
                                            <td className="px-5 py-3 text-sm font-semibold text-emerald-600 text-right">{formatMoney(pago.monto)}</td>
                                            <td className="px-5 py-3 text-sm text-slate-600">{METODO_LABELS[pago.metodo_pago] || pago.metodo_pago}</td>
                                            <td className="px-5 py-3 text-sm text-slate-400">{pago.referencia || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
