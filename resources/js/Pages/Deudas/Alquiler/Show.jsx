import Layout from '../../../Components/Layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount || 0);
};

const formatDate = (dateString) => {
    if (!dateString) return '—';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const estadoBadge = (estado) => {
    const estilos = {
        activa: 'bg-sky-100 text-sky-800',
        pagada: 'bg-green-100 text-green-800',
        vencida: 'bg-red-100 text-red-800',
        cancelada: 'bg-gray-100 text-gray-800',
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
};

const reciboBadge = (estado) => {
    const estilos = {
        pendiente: 'bg-amber-100 text-amber-800',
        pagado: 'bg-green-100 text-green-800',
        vencido: 'bg-red-100 text-red-800',
        cancelado: 'bg-gray-100 text-gray-800',
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
};

const SERVICIOS_LABELS = {
    agua: 'Agua',
    luz: 'Luz',
    internet: 'Internet',
    gas: 'Gas',
    limpieza: 'Limpieza',
};

export default function Show({ deuda }) {
    const [processingRecibo, setProcessingRecibo] = useState(null);
    const [generandoRecibo, setGenerandoRecibo] = useState(false);

    const cliente = deuda.cliente || {};
    const alquiler = deuda.deuda_alquiler || {};
    const inmueble = alquiler.inmueble || {};
    const recibos = alquiler.recibos || [];
    const pagos = deuda.pagos || [];

    const handleMarcarPagado = (reciboId) => {
        if (processingRecibo) return;
        setProcessingRecibo(reciboId);
        router.patch(`/deudas/alquiler/recibo/${reciboId}/pagar`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingRecibo(null),
        });
    };

    const handleGenerarRecibo = () => {
        if (generandoRecibo) return;
        setGenerandoRecibo(true);
        router.post(`/deudas/${deuda.id}/alquiler/recibo`, {}, {
            preserveScroll: true,
            onFinish: () => setGenerandoRecibo(false),
        });
    };

    return (
        <Layout>
            <Head title={`Deuda #${deuda.id} - Alquiler`} />

            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Navegación */}
                <Link
                    href="/deudas"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver a deudas
                </Link>

                {/* Encabezado Principal */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                    Alquiler
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${estadoBadge(deuda.estado)}`}>
                                    {deuda.estado ? deuda.estado.charAt(0).toUpperCase() + deuda.estado.slice(1) : ''}
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                {deuda.descripcion}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Inquilino: <span className="font-medium text-gray-700">{cliente.nombre} {cliente.apellido}</span>
                            </p>
                            {inmueble.id && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Inmueble:{' '}
                                    <Link
                                        href={`/inmuebles/${inmueble.id}`}
                                        className="font-medium text-[#0EA5E9] hover:underline"
                                    >
                                        {inmueble.nombre} — {inmueble.direccion}
                                    </Link>
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Link
                                href={`/deudas/${deuda.id}/alquiler/edit`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[#0EA5E9] border border-[#0EA5E9] hover:bg-sky-50 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Tarjetas de Información */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Monto Mensual */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Monto Mensual</p>
                        <p className="text-xl font-bold text-gray-900">{formatMoney(alquiler.monto_mensual)}</p>
                    </div>

                    {/* Periodicidad */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Periodicidad</p>
                        <p className="text-xl font-bold text-gray-900 capitalize">
                            {alquiler.periodicidad || '—'}
                        </p>
                    </div>

                    {/* Fecha Inicio Contrato */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Inicio Contrato</p>
                        <p className="text-xl font-bold text-gray-900">{formatDate(alquiler.fecha_inicio_contrato)}</p>
                    </div>

                    {/* Fecha de Corte */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fecha de Corte</p>
                        <p className="text-xl font-bold text-gray-900">{formatDate(alquiler.fecha_corte)}</p>
                    </div>
                </div>

                {/* Servicios Incluidos */}
                {alquiler.servicios_incluidos && alquiler.servicios_incluidos.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Servicios Incluidos
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {alquiler.servicios_incluidos.map((servicio) => (
                                <span
                                    key={servicio}
                                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-medium bg-sky-50 text-[#0EA5E9] border border-sky-200"
                                >
                                    {SERVICIOS_LABELS[servicio] || servicio}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notas */}
                {deuda.notas && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Notas</h2>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{deuda.notas}</p>
                    </div>
                )}

                {/* Tabla de Recibos */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex items-center justify-between p-6 pb-4">
                        <h2 className="text-lg font-bold text-gray-900">Recibos de Alquiler</h2>
                        <button
                            onClick={handleGenerarRecibo}
                            disabled={generandoRecibo}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#0EA5E9] hover:bg-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generandoRecibo ? (
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            )}
                            Generar Recibo
                        </button>
                    </div>

                    {recibos.length === 0 ? (
                        <div className="px-6 pb-6">
                            <div className="text-center py-8 text-gray-400">
                                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm">No hay recibos generados todavia.</p>
                                <p className="text-xs mt-1">Presiona "Generar Recibo" para crear el primero.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-t border-gray-100">
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            N. Recibo
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Periodo
                                        </th>
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Monto
                                        </th>
                                        <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Estado
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Fecha de Pago
                                        </th>
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recibos.map((recibo) => (
                                        <tr key={recibo.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-900">
                                                {recibo.numero_recibo || `#${recibo.id}`}
                                            </td>
                                            <td className="px-6 py-3 text-gray-600">
                                                {formatDate(recibo.periodo_inicio)} — {formatDate(recibo.periodo_fin)}
                                            </td>
                                            <td className="px-6 py-3 text-right font-semibold text-gray-900">
                                                {formatMoney(recibo.monto)}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${reciboBadge(recibo.estado)}`}>
                                                    {recibo.estado ? recibo.estado.charAt(0).toUpperCase() + recibo.estado.slice(1) : ''}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-gray-600">
                                                {recibo.fecha_pago ? formatDate(recibo.fecha_pago) : '—'}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                {recibo.estado === 'pendiente' && (
                                                    <button
                                                        onClick={() => handleMarcarPagado(recibo.id)}
                                                        disabled={processingRecibo === recibo.id}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {processingRecibo === recibo.id ? (
                                                            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                        Marcar Pagado
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Historial de Pagos */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 pb-4">
                        <h2 className="text-lg font-bold text-gray-900">Historial de Pagos</h2>
                    </div>

                    {pagos.length === 0 ? (
                        <div className="px-6 pb-6">
                            <div className="text-center py-8 text-gray-400">
                                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-sm">No hay pagos registrados todavia.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-t border-gray-100">
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Fecha
                                        </th>
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Monto
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Metodo
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Referencia
                                        </th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Notas
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pagos.map((pago) => (
                                        <tr key={pago.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 text-gray-900 font-medium">
                                                {formatDate(pago.fecha_pago)}
                                            </td>
                                            <td className="px-6 py-3 text-right font-semibold text-green-700">
                                                {formatMoney(pago.monto)}
                                            </td>
                                            <td className="px-6 py-3 text-gray-600 capitalize">
                                                {pago.metodo_pago || '—'}
                                            </td>
                                            <td className="px-6 py-3 text-gray-600">
                                                {pago.referencia || '—'}
                                            </td>
                                            <td className="px-6 py-3 text-gray-500 text-xs">
                                                {pago.notas || '—'}
                                            </td>
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
