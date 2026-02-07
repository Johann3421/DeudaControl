import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';

function formatMoney(amount) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount || 0);
}

const ESTADO_COLORS = {
    activa: 'bg-sky-100 text-sky-700',
    pagada: 'bg-emerald-100 text-emerald-700',
    vencida: 'bg-red-100 text-red-700',
    cancelada: 'bg-slate-100 text-slate-600',
};

export default function ClientesShow({ cliente }) {
    const handleDelete = () => {
        if (confirm('Estas seguro de eliminar este cliente? Esta accion no se puede deshacer.')) {
            router.delete(`/clientes/${cliente.id}`);
        }
    };

    return (
        <Layout title={`${cliente.nombre} ${cliente.apellido}`}>
            <Head title={`${cliente.nombre} ${cliente.apellido}`} />
            <div className="space-y-6">
                <div className="mb-6">
                    <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a clientes
                    </Link>
                </div>

                {/* Client info */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                                {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{cliente.nombre} {cliente.apellido}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                        cliente.estado === 'activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                    </span>
                                    {cliente.cedula && <span className="text-sm text-slate-400">ID: {cliente.cedula}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/clientes/${cliente.id}/edit`}
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
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Telefono</p>
                            <p className="text-sm font-medium text-slate-700 mt-1">{cliente.telefono || 'No registrado'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Email</p>
                            <p className="text-sm font-medium text-slate-700 mt-1">{cliente.email || 'No registrado'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Direccion</p>
                            <p className="text-sm font-medium text-slate-700 mt-1">{cliente.direccion || 'No registrada'}</p>
                        </div>
                    </div>

                    {cliente.notas && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Notas</p>
                            <p className="text-sm text-slate-600 mt-1">{cliente.notas}</p>
                        </div>
                    )}
                </div>

                {/* Debts */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-900">Deudas del Cliente</h3>
                        <Link href={`/deudas/create?cliente_id=${cliente.id}`}
                            className="text-xs font-medium text-[#0EA5E9] hover:text-[#0284C7]">
                            Nueva deuda
                        </Link>
                    </div>

                    {(!cliente.deudas || cliente.deudas.length === 0) ? (
                        <div className="py-12 text-center">
                            <p className="text-sm text-slate-400">Este cliente no tiene deudas registradas</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {cliente.deudas.map((deuda) => (
                                <Link key={deuda.id} href={`/deudas/${deuda.id}`}
                                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800">{deuda.descripcion}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {deuda.pagos_count || 0} pagos registrados
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-900">{formatMoney(deuda.monto_total)}</p>
                                            <p className="text-xs text-slate-400">Pendiente: {formatMoney(deuda.monto_pendiente)}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ESTADO_COLORS[deuda.estado] || ''}`}>
                                            {deuda.estado.charAt(0).toUpperCase() + deuda.estado.slice(1)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
