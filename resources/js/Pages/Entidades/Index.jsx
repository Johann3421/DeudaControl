import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../Components/Layout';

const TIPO_STYLES = {
    publica: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Publica' },
    privada: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', label: 'Privada' },
};

const ESTADO_STYLES = {
    activo: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Activo' },
    inactivo: { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400', label: 'Inactivo' },
};

export default function EntidadesIndex({ entidades, filtros }) {
    const [buscar, setBuscar] = useState(filtros?.buscar || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/entidades', { buscar, tipo: filtros?.tipo }, { preserveState: true });
    };

    const handleFilterTipo = (tipo) => {
        router.get('/entidades', { buscar: filtros?.buscar, tipo }, { preserveState: true });
    };

    const handleDelete = (entidad) => {
        if (confirm(`Estas seguro de eliminar la entidad "${entidad.razon_social}"? Esta accion no se puede deshacer.`)) {
            router.delete(`/entidades/${entidad.id}`);
        }
    };

    return (
        <Layout title="Entidades">
            <Head title="Entidades" />
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Entidades</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{entidades.total} entidades registradas</p>
                    </div>
                    <Link
                        href="/entidades/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Nueva Entidad
                    </Link>
                </div>

                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={buscar}
                            onChange={(e) => setBuscar(e.target.value)}
                            placeholder="Buscar por razon social o RUC..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
                        />
                        <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                            Buscar
                        </button>
                    </form>
                    <div className="flex gap-2 flex-wrap">
                        {[['', 'Todas'], ['publica', 'Publicas'], ['privada', 'Privadas']].map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => handleFilterTipo(val)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    (filtros?.tipo || '') === val
                                        ? 'bg-[#0EA5E9] text-white'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {entidades.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            <p className="text-sm text-slate-400 mt-3">No se encontraron entidades</p>
                            <Link href="/entidades/create" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#0EA5E9]">
                                Registrar primera entidad
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Razon Social</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">RUC</th>
                                        <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Tipo</th>
                                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Contacto</th>
                                        <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Estado</th>
                                        <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {entidades.data.map((entidad) => {
                                        const tipoStyle = TIPO_STYLES[entidad.tipo] || TIPO_STYLES.privada;
                                        const estadoStyle = ESTADO_STYLES[entidad.estado] || ESTADO_STYLES.activo;
                                        return (
                                            <tr key={entidad.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <Link href={`/entidades/${entidad.id}`} className="text-sm font-medium text-slate-800 hover:text-[#0EA5E9] transition-colors">
                                                        {entidad.razon_social}
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-sm text-slate-600 font-mono">{entidad.ruc}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tipoStyle.bg} ${tipoStyle.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${tipoStyle.dot}`} />
                                                        {tipoStyle.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-sm text-slate-600">{entidad.contacto_nombre || '-'}</p>
                                                    {entidad.contacto_telefono && (
                                                        <p className="text-xs text-slate-400">{entidad.contacto_telefono}</p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoStyle.bg} ${estadoStyle.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${estadoStyle.dot}`} />
                                                        {estadoStyle.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/entidades/${entidad.id}`} className="p-2 text-slate-400 hover:text-[#0EA5E9] rounded-lg hover:bg-slate-100 transition-colors" title="Ver detalle">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                        </Link>
                                                        <Link href={`/entidades/${entidad.id}/edit`} className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors" title="Editar">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </Link>
                                                        <button onClick={() => handleDelete(entidad)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors" title="Eliminar">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Paginacion */}
                    {entidades.last_page > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">
                                Mostrando {entidades.from} a {entidades.to} de {entidades.total}
                            </p>
                            <div className="flex gap-1">
                                {entidades.links.map((link, i) => (
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
