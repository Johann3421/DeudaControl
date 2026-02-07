import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function DeudasEdit({ deuda, clientes }) {
    const { data, setData, put, processing, errors } = useForm({
        descripcion: deuda.descripcion || '',
        tasa_interes: deuda.tasa_interes || '0',
        fecha_vencimiento: deuda.fecha_vencimiento || '',
        frecuencia_pago: deuda.frecuencia_pago || 'mensual',
        numero_cuotas: deuda.numero_cuotas || '',
        estado: deuda.estado || 'activa',
        notas: deuda.notas || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/deudas/${deuda.id}`);
    };

    return (
        <Layout title="Editar Deuda">
            <Head title="Editar Deuda" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/deudas" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a deudas
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Editar Deuda</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripcion *</label>
                            <input type="text" value={data.descripcion} onChange={(e) => setData('descripcion', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.descripcion ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                            {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tasa de Interes (%)</label>
                                <input type="number" step="0.01" min="0" max="100" value={data.tasa_interes} onChange={(e) => setData('tasa_interes', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Vencimiento</label>
                                <input type="date" value={data.fecha_vencimiento} onChange={(e) => setData('fecha_vencimiento', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10" />
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
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <textarea value={data.notas} onChange={(e) => setData('notas', e.target.value)} rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 resize-none" />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={processing}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50">
                                {processing ? 'Guardando...' : 'Actualizar Deuda'}
                            </button>
                            <Link href="/deudas" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
