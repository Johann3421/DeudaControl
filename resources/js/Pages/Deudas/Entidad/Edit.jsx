import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../../Components/Layout';

export default function EntidadDeudaEdit({ deuda, entidades }) {
    const deudaEntidad = deuda.deuda_entidad || {};
    const cerrado = !!deudaEntidad.cerrado;

    const { data, setData, put, processing, errors } = useForm({
        descripcion: deuda.descripcion || '',
        producto_servicio: deudaEntidad.producto_servicio || '',
        codigo_siaf: deudaEntidad.codigo_siaf || '',
        fecha_limite_pago: deudaEntidad.fecha_limite_pago ? deudaEntidad.fecha_limite_pago.split('T')[0] : '',
        currency_code: deuda.currency_code || 'PEN',
        estado: deuda.estado || 'activa',
        estado_siaf: deudaEntidad.estado_siaf || '',
        fase_siaf: deudaEntidad.fase_siaf || '',
        estado_expediente: deudaEntidad.estado_expediente || '',
        fecha_proceso: deudaEntidad.fecha_proceso ? deudaEntidad.fecha_proceso.split('T')[0] : '',
        notas: deuda.notas || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (cerrado) return;
        put(`/deudas/${deuda.id}/entidad`);
    };

    return (
        <Layout title="Editar Deuda - Entidad">
            <Head title="Editar Deuda - Entidad" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href={`/deudas/${deuda.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver al detalle
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                            Entidad
                        </span>
                        <h2 className="text-lg font-semibold text-slate-900">Editar Deuda</h2>
                    </div>

                    {/* Aviso de deuda cerrada */}
                    {cerrado && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            Esta deuda esta cerrada y no puede ser editada. Contacte al administrador si necesita realizar cambios.
                        </div>
                    )}

                    {/* Informacion de la entidad (solo lectura) */}
                    {deudaEntidad.entidad && (
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-50 border border-violet-100 mb-6">
                            <div className="flex-1">
                                <p className="text-xs text-violet-600">Entidad</p>
                                <p className="text-sm font-semibold text-violet-800">{deudaEntidad.entidad.razon_social}</p>
                            </div>
                            <div>
                                <p className="text-xs text-violet-600">RUC</p>
                                <p className="text-sm font-medium text-violet-700">{deudaEntidad.entidad.ruc}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Descripcion */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripcion *</label>
                            <input
                                type="text"
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                                disabled={cerrado}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${errors.descripcion ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                            />
                            {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
                        </div>

                        {/* Producto/Servicio */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Producto / Servicio</label>
                            <input
                                type="text"
                                value={data.producto_servicio}
                                onChange={(e) => setData('producto_servicio', e.target.value)}
                                disabled={cerrado}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${errors.producto_servicio ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                placeholder="Descripcion del producto o servicio"
                            />
                            {errors.producto_servicio && <p className="mt-1 text-sm text-red-600">{errors.producto_servicio}</p>}
                        </div>

                        {/* Codigo SIAF + Fecha Limite */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Codigo SIAF</label>
                                <input
                                    type="text"
                                    value={data.codigo_siaf}
                                    onChange={(e) => setData('codigo_siaf', e.target.value)}
                                    disabled={cerrado}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${errors.codigo_siaf ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                    placeholder="Codigo SIAF"
                                />
                                {errors.codigo_siaf && <p className="mt-1 text-sm text-red-600">{errors.codigo_siaf}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha Limite de Pago</label>
                                <input
                                    type="date"
                                    value={data.fecha_limite_pago}
                                    onChange={(e) => setData('fecha_limite_pago', e.target.value)}
                                    disabled={cerrado}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${errors.fecha_limite_pago ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                />
                                {errors.fecha_limite_pago && <p className="mt-1 text-sm text-red-600">{errors.fecha_limite_pago}</p>}
                            </div>
                        </div>

                        {/* Currency Code + Estado */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Moneda</label>
                                <select
                                    value={data.currency_code}
                                    onChange={(e) => setData('currency_code', e.target.value)}
                                    disabled={cerrado}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${errors.currency_code ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                >
                                    <option value="PEN">Soles (PEN)</option>
                                    <option value="USD">Dolares (USD)</option>
                                    <option value="EUR">Euros (EUR)</option>
                                    <option value="BRL">Reales (BRL)</option>
                                    <option value="COP">Pesos Colombianos (COP)</option>
                                    <option value="CLP">Pesos Chilenos (CLP)</option>
                                </select>
                                {errors.currency_code && <p className="mt-1 text-sm text-red-600">{errors.currency_code}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
                                <select
                                    value={data.estado}
                                    onChange={(e) => setData('estado', e.target.value)}
                                    disabled={cerrado}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${errors.estado ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                >
                                    <option value="activa">Activa</option>
                                    <option value="pagada">Pagada</option>
                                    <option value="vencida">Vencida</option>
                                    <option value="cancelada">Cancelada</option>
                                </select>
                                {errors.estado && <p className="mt-1 text-sm text-red-600">{errors.estado}</p>}
                            </div>
                        </div>

                        {/* SIAF Fields Divider */}
                        <div className="border-t border-slate-200 pt-5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                                Informacion SIAF
                            </h3>

                            {/* Estado SIAF + Fase SIAF */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado SIAF</label>
                                    <select
                                        value={data.estado_siaf}
                                        onChange={(e) => setData('estado_siaf', e.target.value)}
                                        disabled={cerrado}
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${errors.estado_siaf ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        <option value="C">Compromiso (C)</option>
                                        <option value="D">Devengado (D)</option>
                                        <option value="G">Girado (G)</option>
                                        <option value="R">Rechazada (R)</option>
                                    </select>
                                    {errors.estado_siaf && <p className="mt-1 text-sm text-red-600">{errors.estado_siaf}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fase SIAF</label>
                                    <input
                                        type="text"
                                        value={data.fase_siaf}
                                        onChange={(e) => setData('fase_siaf', e.target.value)}
                                        disabled={cerrado}
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${errors.fase_siaf ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                        placeholder="Fase del proceso SIAF"
                                    />
                                    {errors.fase_siaf && <p className="mt-1 text-sm text-red-600">{errors.fase_siaf}</p>}
                                </div>
                            </div>

                            {/* Estado Expediente + Fecha Proceso */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado Expediente</label>
                                    <input
                                        type="text"
                                        value={data.estado_expediente}
                                        onChange={(e) => setData('estado_expediente', e.target.value)}
                                        disabled={cerrado}
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${errors.estado_expediente ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                        placeholder="Estado del expediente"
                                    />
                                    {errors.estado_expediente && <p className="mt-1 text-sm text-red-600">{errors.estado_expediente}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Proceso SIAF</label>
                                    <input
                                        type="date"
                                        value={data.fecha_proceso}
                                        onChange={(e) => setData('fecha_proceso', e.target.value)}
                                        disabled={cerrado}
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''} ${errors.fecha_proceso ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                    />
                                    {errors.fecha_proceso && <p className="mt-1 text-sm text-red-600">{errors.fecha_proceso}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Notas */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <textarea
                                value={data.notas}
                                onChange={(e) => setData('notas', e.target.value)}
                                disabled={cerrado}
                                rows={3}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none ${cerrado ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                placeholder="Notas adicionales..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            {!cerrado && (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50"
                                >
                                    {processing ? 'Guardando...' : 'Actualizar Deuda'}
                                </button>
                            )}
                            <Link href={`/deudas/${deuda.id}`} className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                {cerrado ? 'Volver' : 'Cancelar'}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
