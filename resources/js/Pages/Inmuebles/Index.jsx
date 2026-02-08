import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Components/Layout';

const ESTADO_STYLES = {
    disponible: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    alquilado: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
    mantenimiento: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

const TIPO_STYLES = {
    casa: 'bg-blue-50 text-blue-700',
    departamento: 'bg-purple-50 text-purple-700',
    local: 'bg-amber-50 text-amber-700',
    oficina: 'bg-teal-50 text-teal-700',
    terreno: 'bg-lime-50 text-lime-700',
    otro: 'bg-slate-100 text-slate-600',
};

export default function InmueblesIndex({ inmuebles, filtros }) {
    const [buscar, setBuscar] = useState(filtros?.buscar || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/inmuebles', { buscar, estado: filtros?.estado }, { preserveState: true });
    };

    const handleFilterEstado = (estado) => {
        router.get('/inmuebles', { buscar: filtros?.buscar, estado }, { preserveState: true });
    };

    return (
        <Layout title="Inmuebles">
            <Head title="Inmuebles" />
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Inmuebles</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{inmuebles.total} inmuebles registrados</p>
                    </div>
                    <Link
                        href="/inmuebles/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nuevo Inmueble
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Buscar por nombre o direccion..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
                        />
                        <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                            Buscar
                        </button>
                    </form>
                    <div className="flex gap-2 flex-wrap">
                        {[['', 'Todos'], ['disponible', 'Disponible'], ['alquilado', 'Alquilado'], ['mantenimiento', 'Mantenimiento']].map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => handleFilterEstado(val)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    (filtros?.estado || '') === val
                                        ? 'bg-[#0EA5E9] text-white'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {inmuebles.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            <p className="text-sm text-slate-400 mt-3">No se encontraron inmuebles</p>
                            <Link href="/inmuebles/create" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#0EA5E9]">Registrar primer inmueble</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Nombre</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Direccion</th>
                                        <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Tipo</th>
                                        <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Estado</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {inmuebles.data.map((inmueble) => {
                                        const estadoStyle = ESTADO_STYLES[inmueble.estado] || ESTADO_STYLES.disponible;
                                        const tipoStyle = TIPO_STYLES[inmueble.tipo] || TIPO_STYLES.otro;
                                        return (
                                            <tr key={inmueble.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <Link href={`/inmuebles/${inmueble.id}`} className="text-sm font-medium text-slate-800 hover:text-[#0EA5E9] transition-colors">
                                                        {inmueble.nombre}
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-sm text-slate-600 truncate max-w-xs">{inmueble.direccion || '-'}</p>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tipoStyle}`}>
                                                        {inmueble.tipo ? inmueble.tipo.charAt(0).toUpperCase() + inmueble.tipo.slice(1) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoStyle.bg} ${estadoStyle.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${estadoStyle.dot}`} />
                                                        {inmueble.estado ? inmueble.estado.charAt(0).toUpperCase() + inmueble.estado.slice(1) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/inmuebles/${inmueble.id}`} className="p-2 text-slate-400 hover:text-[#0EA5E9] rounded-lg hover:bg-slate-100 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                        </Link>
                                                        <Link href={`/inmuebles/${inmueble.id}/edit`} className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {inmuebles.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">
                                Mostrando {inmuebles.from} a {inmuebles.to} de {inmuebles.total}
                            </p>
                            <div className="flex gap-1">
                                {inmuebles.links.map((link, i) => (
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
