import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Components/Layout';

export default function EntidadDeudaCreate({ entidades }) {
    const { data, setData, post, processing, errors } = useForm({
        entidad_id: '',
        descripcion: '',
        orden_compra: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        producto_servicio: '',
        monto_total: '',
        codigo_siaf: '',
        fecha_limite_pago: '',
        notas: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/deudas/entidad');
    };

    return (
        <Layout title="Nueva Deuda - Entidad">
            <Head title="Nueva Deuda - Entidad" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/deudas/create" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a tipo de deuda
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                            Entidad
                        </span>
                        <h2 className="text-lg font-semibold text-slate-900">Nueva Deuda - Entidad</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Entidad */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Entidad *</label>
                            <select
                                value={data.entidad_id}
                                onChange={(e) => setData('entidad_id', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white ${errors.entidad_id ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                            >
                                <option value="">Selecciona una entidad</option>
                                {entidades.map((ent) => (
                                    <option key={ent.id} value={ent.id}>
                                        {ent.razon_social} ({ent.ruc}) - {ent.tipo === 'publica' ? 'Publica' : 'Privada'}
                                    </option>
                                ))}
                            </select>
                            {errors.entidad_id && <p className="mt-1 text-sm text-red-600">{errors.entidad_id}</p>}
                        </div>

                        {/* Descripcion */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripcion *</label>
                            <input
                                type="text"
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.descripcion ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                placeholder="Ej: Factura por servicio de consultoria..."
                            />
                            {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
                        </div>

                        {/* Orden de Compra + Fecha de Emision */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Orden de Compra</label>
                                <input
                                    type="text"
                                    value={data.orden_compra}
                                    onChange={(e) => setData('orden_compra', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.orden_compra ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                    placeholder="N. de orden de compra"
                                />
                                {errors.orden_compra && <p className="mt-1 text-sm text-red-600">{errors.orden_compra}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Emision *</label>
                                <input
                                    type="date"
                                    value={data.fecha_emision}
                                    onChange={(e) => setData('fecha_emision', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.fecha_emision ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                />
                                {errors.fecha_emision && <p className="mt-1 text-sm text-red-600">{errors.fecha_emision}</p>}
                            </div>
                        </div>

                        {/* Producto/Servicio */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Producto / Servicio *</label>
                            <input
                                type="text"
                                value={data.producto_servicio}
                                onChange={(e) => setData('producto_servicio', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.producto_servicio ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                placeholder="Descripcion del producto o servicio"
                            />
                            {errors.producto_servicio && <p className="mt-1 text-sm text-red-600">{errors.producto_servicio}</p>}
                        </div>

                        {/* Monto Total + Codigo SIAF */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto Total *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={data.monto_total}
                                        onChange={(e) => setData('monto_total', e.target.value)}
                                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.monto_total ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.monto_total && <p className="mt-1 text-sm text-red-600">{errors.monto_total}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Codigo SIAF</label>
                                <input
                                    type="text"
                                    value={data.codigo_siaf}
                                    onChange={(e) => setData('codigo_siaf', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.codigo_siaf ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                    placeholder="Codigo SIAF (opcional)"
                                />
                                {errors.codigo_siaf && <p className="mt-1 text-sm text-red-600">{errors.codigo_siaf}</p>}
                            </div>
                        </div>

                        {/* Fecha Limite de Pago */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha Limite de Pago</label>
                            <input
                                type="date"
                                value={data.fecha_limite_pago}
                                onChange={(e) => setData('fecha_limite_pago', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.fecha_limite_pago ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                            />
                            {errors.fecha_limite_pago && <p className="mt-1 text-sm text-red-600">{errors.fecha_limite_pago}</p>}
                        </div>

                        {/* Notas */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <textarea
                                value={data.notas}
                                onChange={(e) => setData('notas', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 resize-none"
                                placeholder="Notas adicionales..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50"
                            >
                                {processing ? 'Guardando...' : 'Registrar Deuda'}
                            </button>
                            <Link href="/deudas/create" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
