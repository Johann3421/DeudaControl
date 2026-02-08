import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function InmueblesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        direccion: '',
        tipo: 'casa',
        descripcion: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/inmuebles');
    };

    return (
        <Layout title="Nuevo Inmueble">
            <Head title="Nuevo Inmueble" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/inmuebles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a inmuebles
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Informacion del Inmueble</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre *</label>
                            <input type="text" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.nombre ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                placeholder="Nombre del inmueble" />
                            {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo *</label>
                            <select value={data.tipo} onChange={(e) => setData('tipo', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white ${errors.tipo ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}>
                                <option value="casa">Casa</option>
                                <option value="departamento">Departamento</option>
                                <option value="local">Local</option>
                                <option value="oficina">Oficina</option>
                                <option value="terreno">Terreno</option>
                                <option value="otro">Otro</option>
                            </select>
                            {errors.tipo && <p className="mt-1 text-sm text-red-600">{errors.tipo}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Direccion *</label>
                            <textarea value={data.direccion} onChange={(e) => setData('direccion', e.target.value)} rows={2}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none ${errors.direccion ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                placeholder="Direccion completa del inmueble" />
                            {errors.direccion && <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripcion</label>
                            <textarea value={data.descripcion} onChange={(e) => setData('descripcion', e.target.value)} rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 resize-none"
                                placeholder="Descripcion adicional del inmueble..." />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={processing}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50">
                                {processing ? 'Guardando...' : 'Guardar Inmueble'}
                            </button>
                            <Link href="/inmuebles" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
