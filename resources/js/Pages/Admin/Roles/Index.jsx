import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../../Components/Layout';

const ROL_LABELS = {
    usuario: 'Usuario',
    superadmin: 'Super Admin',
};

const ROL_COLORS = {
    usuario: 'bg-sky-50 text-sky-700',
    superadmin: 'bg-red-50 text-red-700',
};

export default function RolesIndex({ usuarios }) {
    const handleRoleChange = (userId, newRol) => {
        if (confirm(`¿Cambiar rol a ${ROL_LABELS[newRol]}?`)) {
            router.patch(`/admin/roles/${userId}`, { rol: newRol });
        }
    };

    const handleDelete = (userId, userName) => {
        if (confirm(`¿Está seguro de eliminar a ${userName}? Esta acción no se puede deshacer.`)) {
            router.delete(`/admin/roles/${userId}`);
        }
    };

    return (
        <Layout title="Administración de Roles">
            <Head title="Administración de Roles" />
            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Administración de Roles</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Total de usuarios registrados: {usuarios.total}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {usuarios.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <p className="text-sm text-slate-400 mt-3">No hay usuarios registrados</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Usuario</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Email</th>
                                        <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Rol Actual</th>
                                        <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Acción</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {usuarios.data.map((usuario) => (
                                        <tr key={usuario.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-medium text-slate-800">{usuario.name}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm text-slate-600">{usuario.email}</p>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${ROL_COLORS[usuario.rol] || 'bg-slate-100 text-slate-600'}`}>
                                                    {ROL_LABELS[usuario.rol] || usuario.rol}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                {usuario.rol === 'usuario' ? (
                                                    <button 
                                                        onClick={() => handleRoleChange(usuario.id, 'superadmin')}
                                                        className="px-3 py-1 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    >
                                                        Hacer Admin
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleRoleChange(usuario.id, 'usuario')}
                                                        className="px-3 py-1 text-xs font-medium bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg transition-colors"
                                                    >
                                                        Hacer Usuario
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button 
                                                    onClick={() => handleDelete(usuario.id, usuario.name)}
                                                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {usuarios.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">Mostrando {usuarios.from} a {usuarios.to} de {usuarios.total}</p>
                            <div className="flex gap-1">
                                {usuarios.links.map((link, i) => (
                                    <Link key={i} href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            link.active ? 'bg-[#0EA5E9] text-white' : link.url ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'
                                        }`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
