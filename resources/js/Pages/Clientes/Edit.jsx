import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function ClientesEdit({ cliente }) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        cedula: cliente.cedula || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        direccion: cliente.direccion || '',
        notas: cliente.notas || '',
        estado: cliente.estado || 'activo',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(`/clientes/${cliente.id}`);
    };

    return (
        <Layout title="Editar Cliente">
            <Head title="Editar Cliente" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a clientes
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Editar Cliente</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre *</label>
                                <input type="text" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.nombre ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.nombre && <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Apellido *</label>
                                <input type="text" value={data.apellido} onChange={(e) => setData('apellido', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.apellido ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.apellido && <p className="mt-1 text-sm text-red-600">{errors.apellido}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cedula / DNI</label>
                                <input type="text" value={data.cedula} onChange={(e) => setData('cedula', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefono</label>
                                <input type="text" value={data.telefono} onChange={(e) => setData('telefono', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                            <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Direccion</label>
                            <input type="text" value={data.direccion} onChange={(e) => setData('direccion', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <textarea value={data.notas} onChange={(e) => setData('notas', e.target.value)} rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 resize-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
                            <select value={data.estado} onChange={(e) => setData('estado', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 bg-white">
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={processing}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50">
                                {processing ? 'Guardando...' : 'Actualizar Cliente'}
                            </button>
                            <Link href="/clientes" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
