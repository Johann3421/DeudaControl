import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Components/Layout';

function formatMoney(amount) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount || 0);
}

export default function ClientesIndex({ clientes, filtros }) {
    const [buscar, setBuscar] = useState(filtros?.buscar || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/clientes', { buscar, estado: filtros?.estado }, { preserveState: true });
    };

    const handleFilterEstado = (estado) => {
        router.get('/clientes', { buscar: filtros?.buscar, estado }, { preserveState: true });
    };

    return (
        <Layout title="Clientes">
            <Head title="Clientes" />
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Clientes</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{clientes.total} clientes registrados</p>
                    </div>
                    <Link
                        href="/clientes/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nuevo Cliente
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Buscar por nombre, cedula o email..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
                        />
                        <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                            Buscar
                        </button>
                    </form>
                    <div className="flex gap-2">
                        {['', 'activo', 'inactivo'].map((estado) => (
                            <button
                                key={estado}
                                onClick={() => handleFilterEstado(estado)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    (filtros?.estado || '') === estado
                                        ? 'bg-[#0EA5E9] text-white'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {estado === '' ? 'Todos' : estado === 'activo' ? 'Activos' : 'Inactivos'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {clientes.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            <p className="text-sm text-slate-400 mt-3">No se encontraron clientes</p>
                            <Link href="/clientes/create" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#0EA5E9]">Registrar primer cliente</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Cliente</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Contacto</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Deudas</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Estado</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {clientes.data.map((cliente) => (
                                        <tr key={cliente.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                                                        {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <Link href={`/clientes/${cliente.id}`} className="text-sm font-medium text-slate-800 hover:text-[#0EA5E9] transition-colors">
                                                            {cliente.nombre} {cliente.apellido}
                                                        </Link>
                                                        {cliente.cedula && <p className="text-xs text-slate-400">{cliente.cedula}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm text-slate-600">{cliente.telefono || '-'}</p>
                                                <p className="text-xs text-slate-400">{cliente.email || '-'}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-sm font-medium text-slate-800">{cliente.deudas_activas_count || 0}</span>
                                                <span className="text-xs text-slate-400"> activas / {cliente.deudas_count || 0} total</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                    cliente.estado === 'activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cliente.estado === 'activo' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    {cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/clientes/${cliente.id}`} className="p-2 text-slate-400 hover:text-[#0EA5E9] rounded-lg hover:bg-slate-100 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                    </Link>
                                                    <Link href={`/clientes/${cliente.id}/edit`} className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {clientes.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">
                                Mostrando {clientes.from} a {clientes.to} de {clientes.total}
                            </p>
                            <div className="flex gap-1">
                                {clientes.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            link.active
                                                ? 'bg-[#0EA5E9] text-white'
                                                : link.url
                                                    ? 'text-slate-500 hover:bg-slate-100'
                                                    : 'text-slate-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
