import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { formatMoney } from '../../helpers/currencyHelper';

const ESTADO_COLORS = {
    activa: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
    pagada: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    vencida: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    cancelada: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

export default function EntidadesShow({ entidad }) {
    const handleDelete = () => {
        if (confirm('Estas seguro de eliminar esta entidad? Esta accion no se puede deshacer.')) {
            router.delete(`/entidades/${entidad.id}`);
        }
    };

    const deudas = (entidad.deuda_entidades || []).map((de) => ({
        ...de,
        deuda: de.deuda || {},
    }));

    return (
        <Layout title={entidad.razon_social}>
            <Head title={entidad.razon_social} />
            <div className="space-y-6">
                <div className="mb-6">
                    <Link href="/entidades" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a entidades
                    </Link>
                </div>

                {/* Entity info */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                                {entidad.razon_social.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{entidad.razon_social}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                        entidad.estado === 'activa' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {entidad.estado === 'activa' ? 'Activa' : 'Inactiva'}
                                    </span>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                        entidad.tipo === 'publica' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {entidad.tipo === 'publica' ? 'Publica' : 'Privada'}
                                    </span>
                                    {entidad.ruc && <span className="text-sm text-slate-400">RUC: {entidad.ruc}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/entidades/${entidad.id}/edit`}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                Editar
                            </Link>
                            <button onClick={handleDelete}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                                Eliminar
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Contacto</p>
                            <p className="text-sm font-medium text-slate-700 mt-1">{entidad.contacto_nombre || 'No registrado'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Telefono</p>
                            <p className="text-sm font-medium text-slate-700 mt-1">{entidad.contacto_telefono || 'No registrado'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Email</p>
                            <p className="text-sm font-medium text-slate-700 mt-1">{entidad.contacto_email || 'No registrado'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Direccion</p>
                            <p className="text-sm font-medium text-slate-700 mt-1">{entidad.direccion || 'No registrada'}</p>
                        </div>
                    </div>

                    {entidad.notas && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Notas</p>
                            <p className="text-sm text-slate-600 mt-1">{entidad.notas}</p>
                        </div>
                    )}
                </div>

                {/* Related debts */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Deudas de la Entidad</h3>
                        <span className="text-xs font-medium text-slate-400">{deudas.length} registros</span>
                    </div>

                    {deudas.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-sm text-slate-400">Esta entidad no tiene deudas registradas</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Descripcion</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Monto Total</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Pendiente</th>
                                        <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Estado</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {deudas.map((de) => {
                                        const deuda = de.deuda;
                                        const estilos = ESTADO_COLORS[deuda.estado] || ESTADO_COLORS.activa;
                                        return (
                                            <tr key={de.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <Link href={`/deudas/${deuda.id}`} className="text-sm font-medium text-slate-800 hover:text-[#0EA5E9] transition-colors">
                                                        {deuda.descripcion || '-'}
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <span className="text-sm font-medium text-slate-800">{formatMoney(deuda.monto_total)}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <span className="text-sm font-semibold text-amber-600">{formatMoney(deuda.monto_pendiente)}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    {deuda.estado && (
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estilos.bg} ${estilos.text}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${estilos.dot}`} />
                                                            {deuda.estado.charAt(0).toUpperCase() + deuda.estado.slice(1)}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <Link href={`/deudas/${deuda.id}`} className="p-2 text-slate-400 hover:text-[#0EA5E9] rounded-lg hover:bg-slate-100 transition-colors inline-flex">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
