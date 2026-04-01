import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import Layout from '../../Components/Layout';
import { formatMoney } from '../../helpers/currencyHelper';
import { exportDeudasPDF } from '../../helpers/exportPDF';

// Función para formatear fecha
const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Función para mostrar tiempo relativo (ej: "hace 2 horas")
const formatRelativeTime = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffMins > 0) return `hace ${diffMins} min`;
    return 'ahora';
};

const ESTADO_STYLES = {
    activa: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
    pagada: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    vencida: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    cancelada: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const TIPO_STYLES = {
    particular: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Particular' },
    entidad: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Entidad' },
    alquiler: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Alquiler' },
};

// Progreso basado en fases SIAF + seguimiento para entidades,
// y en pagos para particular/alquiler
function calcProgreso(deuda) {
    if (deuda.estado === 'pagada') return { pct: 100, color: 'bg-emerald-500', label: 'Pagada' };
    if (deuda.estado === 'cancelada') return { pct: 0, color: 'bg-slate-300', label: 'Cancelada' };

    if (deuda.tipo_deuda === 'entidad' && deuda.deuda_entidad) {
        const de = deuda.deuda_entidad;
        const seg = de.estado_seguimiento;
        const siaf = de.estado_siaf;

        if (seg === 'pagado') return { pct: 100, color: 'bg-emerald-500', label: 'Pagado' };

        // Fase SIAF: R=Rechazada(rojo), C=Compromiso, D=Devengado, G=Girado
        if (siaf === 'G') return { pct: 85, color: 'bg-emerald-500', label: 'Girado 85%' };
        if (siaf === 'D') return { pct: 60, color: 'bg-sky-500', label: 'Devengado 60%' };
        if (siaf === 'R') return { pct: 15, color: 'bg-red-500', label: 'Rechazada' };
        if (siaf === 'C') return { pct: 35, color: 'bg-blue-500', label: 'Compromiso 35%' };

        // Seguimiento sin SIAF
        if (seg === 'enviado') return { pct: 25, color: 'bg-sky-400', label: 'Enviado SIAF 25%' };
        if (seg === 'en_proceso') return { pct: 15, color: 'bg-amber-400', label: 'En proceso 15%' };
        if (seg === 'observado') return { pct: 10, color: 'bg-orange-400', label: 'Observado 10%' };
        if (seg === 'emitido') return { pct: 5, color: 'bg-slate-400', label: 'Emitido 5%' };

        return { pct: 0, color: 'bg-slate-300', label: 'Sin estado' };
    }

    // Particular / Alquiler: progreso por pagos
    const pct = deuda.monto_total > 0 ? ((deuda.monto_total - deuda.monto_pendiente) / deuda.monto_total) * 100 : 0;
    return { pct, color: 'bg-[#0EA5E9]', label: `${pct.toFixed(0)}%` };
}

export default function DeudasIndex({ deudas, filtros }) {
    const { auth } = usePage().props;
    const [buscar, setBuscar] = useState(filtros?.buscar || '');
    const [exporting, setExporting] = useState(false);
    const [documentosDeudaId, setDocumentosDeudaId] = useState(null);

    const documentosDeuda = documentosDeudaId ? deudas.data.find(d => d.id === documentosDeudaId) : null;

    const handleExport = () => {
        setExporting(true);
        setTimeout(() => {
            exportDeudasPDF({ deudas, filtros, user: auth?.user });
            setExporting(false);
        }, 50);
    };

    // Detectar si hay deudas de entidad para mostrar columnas SIAF dinámicamente
    const tieneDeudaEntidad = deudas.data.some(d => d.tipo_deuda === 'entidad');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/deudas', { buscar, estado: filtros?.estado, tipo_deuda: filtros?.tipo_deuda }, { preserveState: true });
    };

    const handleFilterEstado = (estado) => {
        router.get('/deudas', { buscar: filtros?.buscar, estado, tipo_deuda: filtros?.tipo_deuda }, { preserveState: true });
    };

    const handleFilterTipo = (tipo_deuda) => {
        router.get('/deudas', { buscar: filtros?.buscar, estado: filtros?.estado, tipo_deuda }, { preserveState: true });
    };

    return (
        <Layout title="Deudas">
            <Head title="Deudas" />
            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Deudas</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{deudas.total} deudas registradas</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExport} disabled={exporting}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            {exporting ? 'Generando...' : 'Exportar PDF'}
                        </button>
                        <Link href="/deudas/create"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Nueva Deuda
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                            <input type="text" value={buscar} onChange={(e) => setBuscar(e.target.value)}
                                placeholder="Buscar por descripcion o cliente..."
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all" />
                            <button type="submit" className="px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Buscar</button>
                        </form>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-slate-400 self-center mr-1">Tipo:</span>
                        {[['', 'Todos'], ['particular', 'Particular'], ['entidad', 'Entidad'], ['alquiler', 'Alquiler']].map(([val, label]) => (
                            <button key={`tipo-${val}`} onClick={() => handleFilterTipo(val)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    (filtros?.tipo_deuda || '') === val ? 'bg-[#0EA5E9] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}>{label}</button>
                        ))}
                        <span className="text-xs text-slate-400 self-center ml-3 mr-1">Estado:</span>
                        {[['', 'Todas'], ['activa', 'Activas'], ['pagada', 'Pagadas'], ['vencida', 'Vencidas']].map(([val, label]) => (
                            <button key={`est-${val}`} onClick={() => handleFilterEstado(val)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    (filtros?.estado || '') === val ? 'bg-[#0EA5E9] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}>{label}</button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {deudas.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-200 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            <p className="text-sm text-slate-400 mt-3">No se encontraron deudas</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">Descripción</th>
                                        <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">Cliente / Entidad</th>
                                        <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">Creado</th>
                                        <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">Tipo</th>
                                        <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">Monto</th>
                                        <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">Pendiente</th>
                                        {tieneDeudaEntidad && (
                                            <>
                                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">UE / Emp. Fact.</th>
                                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">Expediente</th>
                                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">SIAF</th>
                                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">Fase</th>
                                            </>
                                        )}
                                        <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5">Estado</th>
                                        <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2.5"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {deudas.data.map((deuda) => {
                                        const estilos = ESTADO_STYLES[deuda.estado] || ESTADO_STYLES.activa;
                                        const tipoStyle = TIPO_STYLES[deuda.tipo_deuda] || TIPO_STYLES.particular;
                                        const prog = calcProgreso(deuda);
                                        return (
                                            <tr key={deuda.id} className="hover:bg-slate-50/50 transition-colors">
                                                {/* Descripción + barra progreso */}
                                                <td className="px-3 py-2 max-w-[150px]">
                                                    <Link href={`/deudas/${deuda.id}`} className="text-xs font-medium text-slate-800 hover:text-[#0EA5E9] transition-colors truncate block">
                                                        {deuda.descripcion}
                                                    </Link>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                                                            <div className={`h-full ${prog.color} rounded-full transition-all`} style={{ width: `${prog.pct}%` }} />
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{Math.round(prog.pct)}%</span>
                                                    </div>
                                                </td>
                                                {/* Cliente */}
                                                <td className="px-3 py-2 max-w-[140px]">
                                                    {deuda.cliente ? (
                                                        <Link href={`/clientes/${deuda.cliente.id}`} className="text-xs text-slate-600 hover:text-[#0EA5E9] truncate block">
                                                            {deuda.cliente.nombre} {deuda.cliente.apellido}
                                                        </Link>
                                                    ) : deuda.deuda_entidad?.entidad ? (
                                                        <span className="text-xs text-slate-600 truncate block">{deuda.deuda_entidad.entidad.razon_social}</span>
                                                    ) : <span className="text-xs text-slate-400">-</span>}
                                                </td>
                                                {/* Creado */}
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <p className="text-xs text-slate-600">{formatRelativeTime(deuda.updated_at)}</p>
                                                    <p className="text-[10px] text-slate-400">{formatDate(deuda.created_at)}</p>
                                                </td>
                                                {/* Tipo */}
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${tipoStyle.bg} ${tipoStyle.text}`}>
                                                        {tipoStyle.label}
                                                    </span>
                                                </td>
                                                {/* Monto */}
                                                <td className="px-3 py-2 text-right whitespace-nowrap">
                                                    <span className="text-xs font-medium text-slate-800">{formatMoney(deuda.monto_total, deuda.currency_code)}</span>
                                                </td>
                                                {/* Pendiente */}
                                                <td className="px-3 py-2 text-right whitespace-nowrap">
                                                    <span className="text-xs font-semibold text-amber-600">{formatMoney(deuda.monto_pendiente, deuda.currency_code)}</span>
                                                </td>
                                                {/* Columnas de entidad */}
                                                {tieneDeudaEntidad && (
                                                    <>
                                                        {/* UE + Empresa Factura (merged) */}
                                                        <td className="px-3 py-2 max-w-[120px]">
                                                            {deuda.tipo_deuda === 'entidad' && deuda.deuda_entidad?.unidad_ejecutora ? (
                                                                <div>
                                                                    <span className="text-xs text-slate-700 truncate block">{deuda.deuda_entidad.unidad_ejecutora}</span>
                                                                    {deuda.deuda_entidad.empresa_factura && (
                                                                        <span className="text-[10px] text-slate-400 truncate block">{deuda.deuda_entidad.empresa_factura}</span>
                                                                    )}
                                                                </div>
                                                            ) : <span className="text-xs text-slate-300">-</span>}
                                                        </td>
                                                        {/* Expediente */}
                                                        <td className="px-3 py-2 text-center">
                                                            {deuda.tipo_deuda === 'entidad' && deuda.deuda_entidad?.codigo_siaf ? (
                                                                <span className="text-xs font-mono font-semibold text-slate-700">{deuda.deuda_entidad.codigo_siaf}</span>
                                                            ) : <span className="text-xs text-slate-300">-</span>}
                                                        </td>
                                                        {/* Estado SIAF */}
                                                        <td className="px-3 py-2 text-center">
                                                            {deuda.tipo_deuda === 'entidad' && deuda.deuda_entidad?.estado_siaf ? (
                                                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap
                                                                    ${deuda.deuda_entidad.estado_siaf === 'C' ? 'bg-blue-100 text-blue-800' : ''}
                                                                    ${deuda.deuda_entidad.estado_siaf === 'D' ? 'bg-amber-100 text-amber-800' : ''}
                                                                    ${deuda.deuda_entidad.estado_siaf === 'G' ? 'bg-green-100 text-green-800' : ''}
                                                                    ${deuda.deuda_entidad.estado_siaf === 'R' ? 'bg-red-100 text-red-800' : ''}
                                                                `}>
                                                                    {deuda.deuda_entidad.estado_siaf === 'C' && 'COMPROMISO'}
                                                                    {deuda.deuda_entidad.estado_siaf === 'D' && 'DEVENGADO'}
                                                                    {deuda.deuda_entidad.estado_siaf === 'G' && 'GIRADO'}
                                                                    {deuda.deuda_entidad.estado_siaf === 'R' && 'RECHAZADA'}
                                                                </span>
                                                            ) : <span className="text-xs text-slate-300">-</span>}
                                                        </td>
                                                        {/* Fase SIAF */}
                                                        <td className="px-3 py-2 text-center">
                                                            {deuda.tipo_deuda === 'entidad' && deuda.deuda_entidad?.fase_siaf ? (
                                                                <span className="text-xs text-slate-600 font-medium">{deuda.deuda_entidad.fase_siaf}</span>
                                                            ) : <span className="text-xs text-slate-300">-</span>}
                                                        </td>
                                                    </>
                                                )}
                                                {/* Estado */}
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${estilos.bg} ${estilos.text}`}>
                                                        <span className={`w-1 h-1 rounded-full ${estilos.dot}`} />
                                                        {deuda.estado.charAt(0).toUpperCase() + deuda.estado.slice(1)}
                                                    </span>
                                                </td>
                                                {/* Acciones */}
                                                <td className="px-3 py-2 text-right">
                                                    <div className="flex items-center justify-end gap-0.5">
                                                        <button 
                                                            onClick={() => setDocumentosDeudaId(deuda.id)}
                                                            className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-slate-100 transition-colors"
                                                            title="Documentos (Factura/Guía)"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                                        </button>
                                                        <Link href={`/deudas/${deuda.id}`} className="p-1.5 text-slate-400 hover:text-[#0EA5E9] rounded-lg hover:bg-slate-100 transition-colors" title="Detalle">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                                        </Link>
                                                        <Link href={`/deudas/${deuda.id}/edit`} className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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

                    {deudas.last_page > 1 && (
                        <div className="flex items-center justify-between px-3 py-2.5 border-t border-slate-100">
                            <p className="text-[10px] text-slate-400">Mostrando {deudas.from} a {deudas.to} de {deudas.total}</p>
                            <div className="flex gap-1">
                                {deudas.links.map((link, i) => (
                                    <Link key={i} href={link.url || '#'}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                            link.active ? 'bg-[#0EA5E9] text-white' : link.url ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'
                                        }`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Documentos */}
            {documentosDeuda && (
                <DocumentosModal 
                    deuda={documentosDeuda} 
                    onClose={() => setDocumentosDeudaId(null)} 
                />
            )}
        </Layout>
    );
}

// ─── Modal de Documentos ──────────────────────────────────────────────────────
function DocumentosModal({ deuda, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">Documentos Adjuntos</h3>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-[280px] truncate">{deuda.descripcion}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <DocumentoUploader deuda={deuda} tipo="factura" label="Factura" />
                    <div className="h-px bg-slate-100 w-full" />
                    <DocumentoUploader deuda={deuda} tipo="guia" label="Guía de Remisión" />
                </div>
            </div>
        </div>
    );
}

function DocumentoUploader({ deuda, tipo, label }) {
    const inputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    
    const campo = `${tipo}_pdf`;
    const tienePdf = !!deuda[campo];

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('documento', file);
        
        router.post(`/deudas/${deuda.id}/documentos/${tipo}`, fd, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploading(false);
                if (inputRef.current) inputRef.current.value = '';
            },
        });
    };

    const handleDelete = () => {
        if (!confirm(`¿Estás seguro de eliminar el PDF de la ${label}?`)) return;
        router.delete(`/deudas/${deuda.id}/documentos/${tipo}`, { preserveScroll: true });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700">{label}</label>
                {tienePdf && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                        Adjunto
                    </span>
                )}
            </div>

            {tienePdf ? (
                <div className="flex items-center gap-2">
                    <a href={`/deudas/${deuda.id}/documentos/${tipo}/view`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Ver PDF
                    </a>
                    <button onClick={handleDelete}
                        className="p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <input type="file" ref={inputRef} accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} className="hidden" />
                    <button onClick={() => inputRef.current?.click()} disabled={uploading}
                        className="w-full flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors disabled:opacity-50 group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">
                            {uploading ? 'Subiendo...' : 'Subir archivo (PDF, JPG, PNG)'}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
