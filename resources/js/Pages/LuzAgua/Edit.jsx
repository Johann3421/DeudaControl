import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function LuzAguaEdit({ recibo }) {
    const { data, setData, put, processing, errors } = useForm({
        tipo: recibo.tipo || 'luz',
        numero_suministro: recibo.numero_suministro || '',
        fecha_emision: recibo.fecha_emision ? recibo.fecha_emision.substring(0, 10) : '',
        fecha_vencimiento: recibo.fecha_vencimiento ? recibo.fecha_vencimiento.substring(0, 10) : '',
        monto: recibo.monto || '',
        estado: recibo.estado || 'pendiente',
        mes_recibo: recibo.mes_recibo || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/luz-agua/${recibo.id}`);
    };

    return (
        <Layout title="Editar Recibo">
            <Head title="Editar Recibo de Luz o Agua" />
            <div className="max-w-xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Editar Recibo</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Modifica los datos del recibo seleccionado</p>
                    </div>
                    <Link
                        href="/luz-agua"
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Volver
                    </Link>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    {/* Tipo de servicio */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo de Servicio</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setData('tipo', 'luz')}
                                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                    data.tipo === 'luz'
                                        ? 'border-amber-400 bg-amber-50/55 text-amber-800'
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                ⚡ Luz
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('tipo', 'agua')}
                                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                    data.tipo === 'agua'
                                        ? 'border-sky-400 bg-sky-50/55 text-sky-800'
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                💧 Agua
                            </button>
                        </div>
                        {errors.tipo && <p className="text-xs text-rose-500">{errors.tipo}</p>}
                    </div>

                    {/* Suministro */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Número de Suministro</label>
                        <input
                            type="text"
                            value={data.numero_suministro}
                            onChange={(e) => setData('numero_suministro', e.target.value)}
                            placeholder="Ej. 1827364"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
                        />
                        {errors.numero_suministro && <p className="text-xs text-rose-500">{errors.numero_suministro}</p>}
                    </div>

                    {/* Mes del Recibo */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mes del Recibo (AAAA-MM)</label>
                        <input
                            type="month"
                            value={data.mes_recibo}
                            onChange={(e) => setData('mes_recibo', e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
                        />
                        {errors.mes_recibo && <p className="text-xs text-rose-500">{errors.mes_recibo}</p>}
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de Emisión</label>
                            <input
                                type="date"
                                value={data.fecha_emision}
                                onChange={(e) => setData('fecha_emision', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
                            />
                            {errors.fecha_emision && <p className="text-xs text-rose-500">{errors.fecha_emision}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de Vencimiento</label>
                            <input
                                type="date"
                                value={data.fecha_vencimiento}
                                onChange={(e) => setData('fecha_vencimiento', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
                            />
                            {errors.fecha_vencimiento && <p className="text-xs text-rose-500">{errors.fecha_vencimiento}</p>}
                        </div>
                    </div>

                    {/* Monto y Estado */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Importe de Deuda (S/)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={data.monto}
                                onChange={(e) => setData('monto', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
                            />
                            {errors.monto && <p className="text-xs text-rose-500">{errors.monto}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</label>
                            <select
                                value={data.estado}
                                onChange={(e) => setData('estado', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 bg-white outline-none transition-all"
                            >
                                <option value="pendiente">Pendiente</option>
                                <option value="pagado">Pagado</option>
                            </select>
                            {errors.estado && <p className="text-xs text-rose-500">{errors.estado}</p>}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-[#0EA5E9]/25"
                        >
                            {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
