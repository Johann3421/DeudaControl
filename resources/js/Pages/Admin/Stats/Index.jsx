import { Head } from '@inertiajs/react';
import Layout from '../../../Components/Layout';

export default function StatsIndex({ stats }) {
    return (
        <Layout title="Estadísticas">
            <Head title="Estadísticas" />
            <div className="space-y-5">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Estadísticas del Sistema</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Resumen de actividad y datos</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Users */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Usuarios</p>
                                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total_users}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Debts */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Deudas</p>
                                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total_debts}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Total Payments */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pagos</p>
                                <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total_payments}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                    <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Pending Amount */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monto Pendiente</p>
                                <p className="text-2xl font-bold text-slate-900 mt-2">S/ {(stats.total_pending || 0).toFixed(2)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Users by Role */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Usuarios por Rol</h3>
                        <div className="space-y-3">
                            {stats.users_by_role?.map((item) => (
                                <div key={item.rol} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 capitalize">{item.rol === 'superadmin' ? 'Super Admin' : 'Usuario'}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${item.rol === 'superadmin' ? 'bg-red-500' : 'bg-blue-500'}`}
                                                style={{ width: `${(item.total / stats.total_users) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-900">{item.total}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Debts by Status */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Deudas por Estado</h3>
                        <div className="space-y-3">
                            {stats.debts_by_status?.map((item) => (
                                <div key={item.estado} className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 capitalize">{item.estado}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${
                                                    item.estado === 'activa' ? 'bg-sky-500' :
                                                    item.estado === 'pagada' ? 'bg-green-500' :
                                                    item.estado === 'vencida' ? 'bg-red-500' :
                                                    'bg-slate-400'
                                                }`}
                                                style={{ width: `${(item.total / stats.total_debts) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-900">{item.total}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
