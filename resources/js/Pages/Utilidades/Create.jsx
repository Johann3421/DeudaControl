import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function UtilidadesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        numero_oc:     '',
        cliente:       '',
        fecha_oc:      new Date().toISOString().split('T')[0],
        fecha_entrega: '',
        estado:        'pendiente',
        total_oc:      '',
        currency_code: 'PEN',
        notas:         '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/utilidades');
    };

    return (
        <Layout title="Nueva Orden de Compra">
            <Head title="Nueva OC" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/utilidades" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a Utilidades
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">Nueva OC</span>
                        <h2 className="text-lg font-semibold text-slate-900">Registrar Orden de Compra</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">N° de Orden de Compra *</label>
                                <input type="text" value={data.numero_oc} onChange={e => setData('numero_oc', e.target.value)}
                                    placeholder="Ej: OC-001"
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.numero_oc ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.numero_oc && <p className="mt-1 text-xs text-red-600">{errors.numero_oc}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente / Entidad *</label>
                                <input type="text" value={data.cliente} onChange={e => setData('cliente', e.target.value)}
                                    placeholder="Nombre del cliente o entidad"
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.cliente ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.cliente && <p className="mt-1 text-xs text-red-600">{errors.cliente}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de OC *</label>
                                <input type="date" value={data.fecha_oc} onChange={e => setData('fecha_oc', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.fecha_oc ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.fecha_oc && <p className="mt-1 text-xs text-red-600">{errors.fecha_oc}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Entrega</label>
                                <input type="date" value={data.fecha_entrega} onChange={e => setData('fecha_entrega', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Total OC *</label>
                                <input type="number" step="0.01" min="0" value={data.total_oc} onChange={e => setData('total_oc', e.target.value)}
                                    placeholder="0.00"
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.total_oc ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.total_oc && <p className="mt-1 text-xs text-red-600">{errors.total_oc}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Moneda</label>
                                <select value={data.currency_code} onChange={e => setData('currency_code', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10">
                                    <option value="PEN">Soles (PEN)</option>
                                    <option value="USD">Dólares (USD)</option>
                                    <option value="EUR">Euros (EUR)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
                                <select value={data.estado} onChange={e => setData('estado', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none bg-white transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10">
                                    <option value="pendiente">Pendiente</option>
                                    <option value="entregado">Entregado</option>
                                    <option value="facturado">Facturado</option>
                                    <option value="pagado">Pagado</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <textarea value={data.notas} onChange={e => setData('notas', e.target.value)} rows={3}
                                placeholder="Observaciones adicionales..."
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none resize-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10" />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={processing}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50">
                                {processing ? 'Guardando...' : 'Registrar OC'}
                            </button>
                            <Link href="/utilidades" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
