import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import Layout from '../../Components/Layout';

const ESTADO_STYLES = {
    pendiente: { bg: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'bg-rose-500', btn: 'bg-rose-600 hover:bg-rose-700' },
    pagado: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700' },
};

const TIPO_STYLES = {
    luz: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Luz', icon: '⚡' },
    agua: { bg: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Agua', icon: '💧' },
};

export default function LuzAguaIndex({ recibos, filtros }) {
    const [buscar, setBuscar] = useState(filtros?.buscar || '');
    const [tipo, setTipo] = useState(filtros?.tipo || '');
    const [estado, setEstado] = useState(filtros?.estado || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/luz-agua', { buscar, tipo, estado }, { preserveState: true });
    };

    const handleFilterChange = (newTipo, newEstado) => {
        setTipo(newTipo);
        setEstado(newEstado);
        router.get('/luz-agua', { buscar, tipo: newTipo, estado: newEstado }, { preserveState: true });
    };

    const handleTogglePago = (id) => {
        router.patch(`/luz-agua/${id}/pagar`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar este recibo?')) {
            router.delete(`/luz-agua/${id}`, {
                preserveScroll: true,
            });
        }
    };

    // Agrupar recibos por mes para cumplir con "QUE SE ORGANIZE POR RECIBO DE MES"
    const groupedRecibos = useMemo(() => {
        const groups = {};
        recibos.data.forEach(recibo => {
            const [year, month] = recibo.mes_recibo.split('-');
            const months = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            const monthName = months[parseInt(month, 10) - 1] || month;
            const groupName = `${monthName} ${year}`;

            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(recibo);
        });
        return groups;
    }, [recibos.data]);

    return (
        <Layout title="Luz y Agua">
            <Head title="Recibos de Luz y Agua" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Recibos de Luz y Agua</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Control de consumo de servicios públicos y alertas de vencimiento</p>
                    </div>
                    <Link
                        href="/luz-agua/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Registrar Recibo
                    </Link>
                </div>

                {/* Filters */}
                <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                value={buscar}
                                onChange={(e) => setBuscar(e.target.value)}
                                placeholder="Buscar por suministro o mes (AAAA-MM)..."
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {/* Tipo Filter */}
                            <select
                                value={tipo}
                                onChange={(e) => handleFilterChange(e.target.value, estado)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] outline-none"
                            >
                                <option value="">Todos los servicios</option>
                                <option value="luz">⚡ Luz</option>
                                <option value="agua">💧 Agua</option>
                            </select>

                            {/* Estado Filter */}
                            <select
                                value={estado}
                                onChange={(e) => handleFilterChange(tipo, e.target.value)}
                                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] outline-none"
                            >
                                <option value="">Todos los estados</option>
                                <option value="pendiente">🔴 Pendiente</option>
                                <option value="pagado">🟢 Pagado</option>
                            </select>

                            <button
                                type="submit"
                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                Buscar
                            </button>
                        </div>
                    </div>
                </form>

                {/* Content Grouped by Month */}
                {Object.keys(groupedRecibos).length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2v0a8 8 0 0 0-8 8c0 4.4 3.6 8 8 8s8-3.6 8-8a8 8 0 0 0-8-8z"/><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        <p className="text-sm text-slate-400 mt-3">No se encontraron recibos de luz o agua</p>
                        <Link href="/luz-agua/create" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#0EA5E9]">Registrar primer recibo</Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedRecibos).map(([mes, items]) => (
                            <div key={mes} className="space-y-3">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-1">
                                    <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                                    {mes}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {items.map((recibo) => {
                                        const typeStyle = TIPO_STYLES[recibo.tipo];
                                        const stateStyle = ESTADO_STYLES[recibo.estado];
                                        const formatFecha = (f) => f ? new Date(f).toLocaleDateString('es-PE', { timeZone: 'UTC' }) : '-';

                                        return (
                                            <div key={recibo.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                                                <div className="space-y-3">
                                                    {/* Card Header */}
                                                    <div className="flex items-center justify-between">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeStyle.bg}`}>
                                                            <span>{typeStyle.icon}</span>
                                                            <span>{typeStyle.label}</span>
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${stateStyle.bg}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${stateStyle.dot}`} />
                                                            {recibo.estado.toUpperCase()}
                                                        </span>
                                                    </div>

                                                    {/* Card Content */}
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-slate-400">Suministro</p>
                                                        <p className="text-sm font-bold text-slate-800">{recibo.numero_suministro}</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <p className="text-slate-400">Emisión</p>
                                                            <p className="font-medium text-slate-700">{formatFecha(recibo.fecha_emision)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-400">Vencimiento</p>
                                                            <p className={`font-semibold ${recibo.estado === 'pendiente' && new Date(recibo.fecha_vencimiento) < new Date() ? 'text-rose-600' : 'text-slate-700'}`}>
                                                                {formatFecha(recibo.fecha_vencimiento)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Footer */}
                                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Monto</p>
                                                        <p className="text-lg font-extrabold text-slate-900">S/ {parseFloat(recibo.monto).toFixed(2)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {/* Toggle Pago */}
                                                        <button
                                                            onClick={() => handleTogglePago(recibo.id)}
                                                            className={`px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors ${
                                                                recibo.estado === 'pendiente' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                                                            }`}
                                                        >
                                                            {recibo.estado === 'pendiente' ? 'Marcar Pagado' : 'Marcar Pendiente'}
                                                        </button>

                                                        {/* Edit Link */}
                                                        <Link
                                                            href={`/luz-agua/${recibo.id}/edit`}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                        </Link>

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => handleDelete(recibo.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {recibos.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs text-slate-400">
                            Mostrando {recibos.from} a {recibos.to} de {recibos.total}
                        </p>
                        <div className="flex gap-1">
                            {recibos.links.map((link, i) => (
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
        </Layout>
    );
}
