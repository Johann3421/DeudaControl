import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';

const TIPOS    = ['hosting', 'dominio', 'ssl', 'email', 'otro'];
const MONEDAS  = ['USD', 'PEN'];
const PERIODOS = ['mensual', 'anual', 'bianual'];
const ESTADOS  = ['activo', 'vencido', 'cancelado'];
const TIPO_LABELS = { hosting: '🖥️ Hosting', dominio: '🌐 Dominio', ssl: '🔒 SSL', email: '📧 Email', otro: '🔧 Otro' };

export default function ServiciosWebEdit({ servicio }) {
    const { data, setData, put, processing, errors } = useForm({
        tipo:              servicio.tipo || 'hosting',
        proveedor:         servicio.proveedor || '',
        nombre:            servicio.nombre || '',
        fecha_vencimiento: servicio.fecha_vencimiento ? servicio.fecha_vencimiento.substring(0, 10) : '',
        monto:             servicio.monto || '',
        moneda:            servicio.moneda || 'USD',
        periodo:           servicio.periodo || 'anual',
        estado:            servicio.estado || 'activo',
        notas:             servicio.notas || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/servicios-web/${servicio.id}`);
    };

    return (
        <Layout title="Editar Servicio Web">
            <Head title="Editar Servicio Web" />
            <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Editar Servicio</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{servicio.nombre}</p>
                    </div>
                    <Link href="/servicios-web" className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Volver</Link>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    {/* Tipo */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo de Servicio</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {TIPOS.map(t => (
                                <button key={t} type="button" onClick={() => setData('tipo', t)}
                                    className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all text-center ${data.tipo === t ? 'border-[#0EA5E9] bg-sky-50/55 text-sky-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    {TIPO_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Proveedor y Nombre */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</label>
                            <input type="text" value={data.proveedor} onChange={e => setData('proveedor', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all" />
                            {errors.proveedor && <p className="text-xs text-rose-500">{errors.proveedor}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre / Dominio</label>
                            <input type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all" />
                            {errors.nombre && <p className="text-xs text-rose-500">{errors.nombre}</p>}
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha de Vencimiento</label>
                            <input type="date" value={data.fecha_vencimiento} onChange={e => setData('fecha_vencimiento', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Periodo</label>
                            <select value={data.periodo} onChange={e => setData('periodo', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] outline-none">
                                {PERIODOS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Monto, Moneda y Estado */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5 col-span-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</label>
                            <input type="number" step="0.01" value={data.monto} onChange={e => setData('monto', e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Moneda</label>
                            <select value={data.moneda} onChange={e => setData('moneda', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] outline-none">
                                {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</label>
                            <select value={data.estado} onChange={e => setData('estado', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] outline-none">
                                {ESTADOS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notas</label>
                        <textarea value={data.notas} onChange={e => setData('notas', e.target.value)} rows={3}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all resize-none" />
                    </div>

                    <button type="submit" disabled={processing}
                        className="w-full py-3 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-[#0EA5E9]/25">
                        {processing ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        </Layout>
    );
}
