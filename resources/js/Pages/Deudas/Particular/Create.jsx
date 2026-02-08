import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Components/Layout';

export default function ParticularCreate({ clientes }) {
    const { data, setData, post, processing, errors } = useForm({
        cliente_id: '',
        descripcion: '',
        monto_total: '',
        tasa_interes: '0',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        frecuencia_pago: 'mensual',
        numero_cuotas: '',
        notas: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/deudas/particular');
    };

    return (
        <Layout title="Nueva Deuda - Particular">
            <Head title="Nueva Deuda - Particular" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/deudas/create" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver al selector
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">Registrar Nueva Deuda</h2>
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
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                                    <input type="number" step="0.01" min="0.01" value={data.monto_total} onChange={(e) => setData('monto_total', e.target.value)}
                                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.monto_total ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                        placeholder="0.00" />
                                </div>
                                {errors.monto_total && <p className="mt-1 text-sm text-red-600">{errors.monto_total}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tasa de Interes (%)</label>
                                <input type="number" step="0.01" min="0" max="100" value={data.tasa_interes} onChange={(e) => setData('tasa_interes', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                    placeholder="0" />
                            </div>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Numero de Cuotas</label>
                                <input type="number" min="1" value={data.numero_cuotas} onChange={(e) => setData('numero_cuotas', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                    placeholder="Opcional" />
                            </div>
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
                                {processing ? 'Guardando...' : 'Registrar Deuda'}
                            </button>
                            <Link href="/deudas/create" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
