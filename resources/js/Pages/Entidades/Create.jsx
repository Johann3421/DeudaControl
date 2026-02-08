import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function EntidadesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        razon_social: '',
        ruc: '',
        tipo: 'publica',
        contacto_nombre: '',
        contacto_telefono: '',
        contacto_email: '',
        direccion: '',
        notas: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/entidades');
    };

    return (
        <Layout title="Nueva Entidad">
            <Head title="Nueva Entidad" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/entidades" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a entidades
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Informacion de la Entidad</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Razon Social *</label>
                                <input type="text" value={data.razon_social} onChange={(e) => setData('razon_social', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.razon_social ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                    placeholder="Nombre de la entidad" />
                                {errors.razon_social && <p className="mt-1 text-sm text-red-600">{errors.razon_social}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">RUC *</label>
                                <input type="text" value={data.ruc} onChange={(e) => setData('ruc', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.ruc ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                    placeholder="Numero de RUC" />
                                {errors.ruc && <p className="mt-1 text-sm text-red-600">{errors.ruc}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo *</label>
                            <select value={data.tipo} onChange={(e) => setData('tipo', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white ${errors.tipo ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}>
                                <option value="publica">Publica</option>
                                <option value="privada">Privada</option>
                            </select>
                            {errors.tipo && <p className="mt-1 text-sm text-red-600">{errors.tipo}</p>}
                        </div>

                        <div className="border-t border-slate-100 pt-5">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Datos de Contacto</h3>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de Contacto</label>
                                    <input type="text" value={data.contacto_nombre} onChange={(e) => setData('contacto_nombre', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                        placeholder="Nombre del contacto principal" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefono de Contacto</label>
                                        <input type="text" value={data.contacto_telefono} onChange={(e) => setData('contacto_telefono', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                            placeholder="Numero de telefono" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email de Contacto</label>
                                        <input type="email" value={data.contacto_email} onChange={(e) => setData('contacto_email', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                            placeholder="correo@entidad.com" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Direccion</label>
                            <textarea value={data.direccion} onChange={(e) => setData('direccion', e.target.value)} rows={2}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 resize-none"
                                placeholder="Direccion completa de la entidad" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <textarea value={data.notas} onChange={(e) => setData('notas', e.target.value)} rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 resize-none"
                                placeholder="Notas adicionales sobre la entidad..." />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={processing}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50">
                                {processing ? 'Guardando...' : 'Guardar Entidad'}
                            </button>
                            <Link href="/entidades" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
