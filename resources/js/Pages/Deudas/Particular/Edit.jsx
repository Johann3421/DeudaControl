import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../../Components/Layout';
import DocumentosModal from '../../../Components/Documentos/DocumentosModal';
import { getAvailableCurrencies, getCurrencySymbol } from '../../../helpers/currencyHelper';

export default function ParticularEdit({ deuda, clientes }) {
    const currencies = getAvailableCurrencies();
    const { data, setData, put, processing, errors } = useForm({
        cliente_id: deuda.cliente_id || '',
        descripcion: deuda.descripcion || '',
        monto_total: deuda.monto_total || '',
        currency_code: deuda.currency_code || 'PEN',
        tasa_interes: deuda.tasa_interes || '0',
        fecha_inicio: deuda.fecha_inicio || '',
        fecha_vencimiento: deuda.fecha_vencimiento || '',
        frecuencia_pago: deuda.frecuencia_pago || 'mensual',
        numero_cuotas: deuda.numero_cuotas || '',
        estado: deuda.estado || 'activa',
        notas: deuda.notas || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/deudas/${deuda.id}/particular`);
    };

    const [showDocumentos, setShowDocumentos] = useState(false);
    const docsCount = (deuda.factura_pdf ? 1 : 0) + (deuda.guia_pdf ? 1 : 0) + (deuda.documentos?.length || 0);

    return (
        <Layout title="Editar Deuda - Particular">
            <Head title="Editar Deuda - Particular" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/deudas" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a deudas
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Editar Deuda</h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            Particular
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente *</label>
                            <select value={data.cliente_id} onChange={(e) => setData('cliente_id', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white ${errors.cliente_id ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}>
                                <option value="">Selecciona un cliente</option>
                                {clientes.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                                ))}
                            </select>
                            {errors.cliente_id && <p className="mt-1 text-sm text-red-600">{errors.cliente_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripcion *</label>
                            <input type="text" value={data.descripcion} onChange={(e) => setData('descripcion', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.descripcion ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                placeholder="Ej: Prestamo personal, Compra de electrodomestico..." />
                            {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto Total *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">{getCurrencySymbol(data.currency_code)}</span>
                                    <input type="number" step="0.01" min="0.01" value={data.monto_total} onChange={(e) => setData('monto_total', e.target.value)}
                                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.monto_total ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                        placeholder="0.00" />
                                </div>
                                {errors.monto_total && <p className="mt-1 text-sm text-red-600">{errors.monto_total}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Moneda</label>
                                <select value={data.currency_code} onChange={(e) => setData('currency_code', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 bg-white">
                                    {currencies.map((curr) => (
                                        <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tasa de Interes (%)</label>
                                <input type="number" step="0.01" min="0" max="100" value={data.tasa_interes} onChange={(e) => setData('tasa_interes', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                    placeholder="0" />
                            </div>
                            <div></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Inicio *</label>
                                <input type="date" value={data.fecha_inicio} onChange={(e) => setData('fecha_inicio', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.fecha_inicio ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.fecha_inicio && <p className="mt-1 text-sm text-red-600">{errors.fecha_inicio}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Vencimiento</label>
                                <input type="date" value={data.fecha_vencimiento} onChange={(e) => setData('fecha_vencimiento', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.fecha_vencimiento ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.fecha_vencimiento && <p className="mt-1 text-sm text-red-600">{errors.fecha_vencimiento}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Frecuencia de Pago</label>
                                <select value={data.frecuencia_pago} onChange={(e) => setData('frecuencia_pago', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 bg-white">
                                    <option value="semanal">Semanal</option>
                                    <option value="quincenal">Quincenal</option>
                                    <option value="mensual">Mensual</option>
                                    <option value="unico">Pago unico</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
                                <select value={data.estado} onChange={(e) => setData('estado', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 bg-white">
                                    <option value="activa">Activa</option>
                                    <option value="pagada">Pagada</option>
                                    <option value="vencida">Vencida</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Numero de Cuotas</label>
                            <input type="number" min="1" value={data.numero_cuotas} onChange={(e) => setData('numero_cuotas', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                placeholder="Opcional" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <textarea value={data.notas} onChange={(e) => setData('notas', e.target.value)} rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 resize-none"
                                placeholder="Notas adicionales..." />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={processing}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50">
                                {processing ? 'Guardando...' : 'Actualizar Deuda'}
                            </button>
                            <Link href="/deudas" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</Link>
                        </div>
                    </form>

                    {/* Documentos adjuntos */}
                    <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Documentos adjuntos</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{docsCount === 0 ? 'Sin documentos' : `${docsCount} documento${docsCount === 1 ? '' : 's'}`}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDocumentos(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                Gestionar documentos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showDocumentos && (
                <DocumentosModal
                    deuda={deuda}
                    onClose={() => setShowDocumentos(false)}
                />
            )}
        </Layout>
    );
}
