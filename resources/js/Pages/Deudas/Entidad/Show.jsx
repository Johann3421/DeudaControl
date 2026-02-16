import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../../Components/Layout';

function formatMoney(amount, currencyCode = 'PEN') {
    const currencyMap = {
        'PEN': 'es-PE',
        'USD': 'en-US',
        'EUR': 'es-ES',
        'BRL': 'pt-BR',
        'COP': 'es-CO',
        'CLP': 'es-CL',
        'ARS': 'es-AR',
        'MXN': 'es-MX'
    };

    return new Intl.NumberFormat(currencyMap[currencyCode] || 'es-PE', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2
    }).format(amount || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        // Intenta parsear como ISO date (YYYY-MM-DD)
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('T')[0].split('-');
            const d = new Date(year, month - 1, day);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
        }
        // Intenta parsear normalmente
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        return '-';
    } catch (e) {
        return '-';
    }
}

const ESTADO_STYLES = {
    activa: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
    pagada: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    vencida: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    cancelada: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const SEGUIMIENTO_STYLES = {
    emitido: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Emitido' },
    enviado: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Enviado' },
    observado: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Observado' },
    pagado: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Pagado' },
};

const METODO_LABELS = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    cheque: 'Cheque',
    otro: 'Otro',
};

export default function EntidadDeudaShow({ deuda }) {
    const deudaEntidad = deuda.deuda_entidad || {};
    const entidad = deudaEntidad.entidad || {};
    const pagos = deuda.pagos || [];
    const historial = deuda.historial || [];
    const estiloEstado = ESTADO_STYLES[deuda.estado] || ESTADO_STYLES.activa;

    const [seguimientoOpen, setSeguimientoOpen] = useState(false);
    const [updatingSeguimiento, setUpdatingSeguimiento] = useState(false);

    const seguimientoActual = deudaEntidad.estado_seguimiento || 'emitido';
    const estiloSeguimiento = SEGUIMIENTO_STYLES[seguimientoActual] || SEGUIMIENTO_STYLES.emitido;

    const progreso = deuda.monto_total > 0 ? (((deuda.monto_total - deuda.monto_pendiente) / deuda.monto_total) * 100) : 0;

    const handleCambiarSeguimiento = (nuevoEstado) => {
        setUpdatingSeguimiento(true);
        setSeguimientoOpen(false);
        router.patch(`/deudas/entidad/${deudaEntidad.id}/seguimiento`, {
            estado_seguimiento: nuevoEstado,
        }, {
            preserveScroll: true,
            onFinish: () => setUpdatingSeguimiento(false),
        });
    };

    const handleDelete = () => {
        if (confirm('Estas seguro de eliminar esta deuda? Esta accion no se puede deshacer.')) {
            router.delete(`/deudas/${deuda.id}`);
        }
    };

    return (
        <Layout title="Detalle de Deuda - Entidad">
            <Head title={deuda.descripcion} />
            <div className="space-y-6">
                {/* Back link */}
                <div className="mb-6">
                    <Link href="/deudas" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a deudas
                    </Link>
                </div>

                {/* Header card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                                    Entidad
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estiloEstado.bg} ${estiloEstado.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${estiloEstado.dot}`} />
                                    {deuda.estado.charAt(0).toUpperCase() + deuda.estado.slice(1)}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mt-2">{deuda.descripcion}</h2>
                            {entidad.razon_social && (
                                <p className="text-sm text-[#0EA5E9] mt-1">{entidad.razon_social} - RUC: {entidad.ruc}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Link href={`/pagos/create?deuda_id=${deuda.id}`}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors">
                                Registrar Pago
                            </Link>
                            <Link href={`/deudas/${deuda.id}/entidad/edit`}
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
                            <p className="text-lg font-bold text-slate-900 mt-1">{formatMoney(deuda.monto_total, deuda.currency_code)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50">
                            <p className="text-xs text-amber-600">Pendiente</p>
                            <p className="text-lg font-bold text-amber-700 mt-1">{formatMoney(deuda.monto_pendiente, deuda.currency_code)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50">
                            <p className="text-xs text-emerald-600">Pagado</p>
                            <p className="text-lg font-bold text-emerald-700 mt-1">{formatMoney(deuda.monto_total - deuda.monto_pendiente, deuda.currency_code)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-violet-50">
                            <p className="text-xs text-violet-600">Entidad</p>
                            <p className="text-sm font-bold text-violet-800 mt-1 truncate">{entidad.razon_social || '-'}</p>
                        </div>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-xs text-slate-400">Orden de Compra</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{deudaEntidad.orden_compra || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Fecha de Emision</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{formatDate(deudaEntidad.fecha_emision)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Producto / Servicio</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{deudaEntidad.producto_servicio || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Codigo SIAF</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{deudaEntidad.codigo_siaf || '-'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-xs text-slate-400">Monto Total</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{formatMoney(deuda.monto_total, deuda.currency_code)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Monto Pendiente</p>
                            <p className="text-sm font-medium text-amber-600 mt-0.5">{formatMoney(deuda.monto_pendiente, deuda.currency_code)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Fecha Limite de Pago</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{formatDate(deudaEntidad.fecha_limite_pago)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">Cerrado</p>
                            <p className="text-sm font-medium text-slate-700 mt-0.5">{deudaEntidad.cerrado ? 'Si' : 'No'}</p>
                        </div>
                    </div>

                    {/* Información del SIAF */}
                    {(deudaEntidad.estado_siaf || deudaEntidad.fase_siaf || deudaEntidad.estado_expediente || deudaEntidad.fecha_proceso) && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
                            <div>
                                <p className="text-xs text-slate-400">Estado SIAF</p>
                                <p className="text-sm font-medium text-slate-700 mt-0.5">
                                    {deudaEntidad.estado_siaf ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                                            {deudaEntidad.estado_siaf === 'C' && 'COMPROMISO'}
                                            {deudaEntidad.estado_siaf === 'D' && 'DEVENGADO'}
                                            {deudaEntidad.estado_siaf === 'G' && 'GIRADO'}
                                            {deudaEntidad.estado_siaf === 'R' && 'RECHAZADA'}
                                        </span>
                                    ) : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Fase SIAF</p>
                                <p className="text-sm font-medium text-slate-700 mt-0.5">{deudaEntidad.fase_siaf || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Estado Expediente</p>
                                <p className="text-sm font-medium text-slate-700 mt-0.5">{deudaEntidad.estado_expediente || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Fecha de Proceso</p>
                                <p className="text-sm font-medium text-slate-700 mt-0.5">{deudaEntidad.fecha_proceso ? new Date(deudaEntidad.fecha_proceso).toLocaleDateString('es-MX') : '-'}</p>
                            </div>
                        </div>
                    )}

                    {deuda.notas && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-xs text-slate-400">Notas</p>
                            <p className="text-sm text-slate-600 mt-1">{deuda.notas}</p>
                        </div>
                    )}
                </div>

                {/* Estado de seguimiento */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-1">Estado de Seguimiento</h3>
                            <p className="text-xs text-slate-400">Controla el progreso administrativo de esta deuda</p>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setSeguimientoOpen(!seguimientoOpen)}
                                disabled={updatingSeguimiento}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${estiloSeguimiento.bg} ${estiloSeguimiento.text} hover:opacity-80 disabled:opacity-50`}
                            >
                                <span className={`w-2 h-2 rounded-full ${estiloSeguimiento.dot}`} />
                                {updatingSeguimiento ? 'Actualizando...' : estiloSeguimiento.label}
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>

                            {seguimientoOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setSeguimientoOpen(false)} />
                                    <div className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1">
                                        {Object.entries(SEGUIMIENTO_STYLES).map(([key, style]) => (
                                            <button
                                                key={key}
                                                onClick={() => handleCambiarSeguimiento(key)}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                                                    seguimientoActual === key
                                                        ? 'bg-slate-50 font-medium text-slate-900'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                                {style.label}
                                                {seguimientoActual === key && (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-auto text-[#0EA5E9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Historial de pagos */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Historial de Pagos</h3>
                        <span className="text-xs text-slate-400">{pagos.length} pagos</span>
                    </div>

                    {pagos.length === 0 ? (
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
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Notas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {pagos.map((pago) => (
                                        <tr key={pago.id} className="hover:bg-slate-50/50">
                                            <td className="px-5 py-3 text-sm text-slate-700">{formatDate(pago.fecha_pago)}</td>
                                            <td className="px-5 py-3 text-sm font-semibold text-emerald-600 text-right">{formatMoney(pago.monto, deuda.currency_code)}</td>
                                            <td className="px-5 py-3 text-sm text-slate-600">{METODO_LABELS[pago.metodo_pago] || pago.metodo_pago}</td>
                                            <td className="px-5 py-3 text-sm text-slate-400">{pago.referencia || '-'}</td>
                                            <td className="px-5 py-3 text-sm text-slate-400">{pago.notas || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Historial de cambios */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Historial de Cambios</h3>
                        <span className="text-xs text-slate-400">{historial.length} registros</span>
                    </div>

                    {historial.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-sm text-slate-400">No hay cambios registrados</p>
                        </div>
                    ) : (
                        <div className="p-5">
                            <div className="relative">
                                {/* Linea de tiempo vertical */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />

                                <div className="space-y-6">
                                    {historial.map((item, index) => (
                                        <div key={item.id || index} className="relative flex gap-4 pl-6">
                                            {/* Punto de la linea de tiempo */}
                                            <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 border-white bg-[#0EA5E9] shadow-sm" />

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium text-slate-800">{item.campo_modificado || item.descripcion || 'Cambio registrado'}</p>
                                                    <span className="text-xs text-slate-400">{formatDate(item.created_at?.split('T')[0] || item.fecha)}</span>
                                                </div>
                                                {(item.valor_anterior || item.valor_nuevo) && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {item.valor_anterior && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-xs text-red-600 line-through">
                                                                {item.valor_anterior}
                                                            </span>
                                                        )}
                                                        {item.valor_anterior && item.valor_nuevo && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                                        )}
                                                        {item.valor_nuevo && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-xs text-emerald-600">
                                                                {item.valor_nuevo}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {item.usuario && (
                                                    <p className="text-xs text-slate-400 mt-1">Por: {item.usuario.name || item.usuario}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
