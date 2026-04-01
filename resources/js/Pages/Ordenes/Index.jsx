import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import Layout from '../../Components/Layout';
import { formatMoney } from '../../helpers/currencyHelper';

// ─── Estado SIAF ─────────────────────────────────────────────────────────────
const SIAF_MAP = {
    C: { label: 'Compromiso',  bg: 'bg-blue-100',    text: 'text-blue-800'   },
    D: { label: 'Devengado',   bg: 'bg-violet-100',  text: 'text-violet-800' },
    G: { label: 'Girado',      bg: 'bg-emerald-100', text: 'text-emerald-800'},
    R: { label: 'Rechazada',   bg: 'bg-red-100',     text: 'text-red-800'    },
};

// ─── Estado Seguimiento ───────────────────────────────────────────────────────
const SEGUIMIENTO_MAP = {
    emitido:    { label: 'Emitido',      bg: 'bg-slate-100',   text: 'text-slate-700'  },
    en_proceso: { label: 'En Proceso',   bg: 'bg-amber-100',   text: 'text-amber-800'  },
    enviado:    { label: 'Enviado SIAF', bg: 'bg-sky-100',     text: 'text-sky-800'    },
    observado:  { label: 'Observado',    bg: 'bg-orange-100',  text: 'text-orange-800' },
    pagado:     { label: 'Pagado',       bg: 'bg-emerald-100', text: 'text-emerald-800'},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcDias(fechaStr) {
    if (!fechaStr) return null;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const f = new Date(fechaStr); f.setHours(0, 0, 0, 0);
    return Math.ceil((f - hoy) / 86_400_000);
}

function formatFecha(fechaStr) {
    if (!fechaStr) return '—';
    const d = new Date(fechaStr);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function DiasBadge({ dias, cerrado }) {
    if (cerrado) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">Cerrada</span>;
    if (dias === null) return <span className="text-slate-400 text-xs">—</span>;
    if (dias < 0)  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Vencida {Math.abs(dias)}d</span>;
    if (dias === 0) return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Hoy</span>;
    if (dias <= 3)  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">{dias}d</span>;
    if (dias <= 7)  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">{dias}d</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{dias}d</span>;
}

function isOrdenCerrada(o) {
    return o.cerrado || o.estado_seguimiento === 'pagado' || o.deuda?.estado === 'pagada';
}

function StatusBadge({ map, value }) {
    const s = map[value];
    if (!s) return <span className="text-slate-400 text-xs">—</span>;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
}

// ─── Editable Cell ───────────────────────────────────────────────────────────────
function EditableCell({ ordenId, field, value, placeholder = '—' }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value || '');
    const inputRef = useRef(null);

    const save = () => {
        setEditing(false);
        if (val !== (value || '')) {
            router.patch(`/ordenes/${ordenId}/field`, { field, value: val || null }, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const startEdit = () => {
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    if (editing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={val}
                onChange={e => setVal(e.target.value)}
                onBlur={save}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(value || ''); setEditing(false); } }}
                className="w-full px-2 py-1 rounded border border-sky-300 text-sm outline-none focus:ring-2 focus:ring-sky-200 bg-white"
            />
        );
    }

    return (
        <button
            onClick={startEdit}
            title="Clic para editar"
            className="group text-left w-full px-1 py-0.5 rounded hover:bg-sky-50 transition-colors cursor-pointer"
        >
            <span className={value ? 'text-slate-900 font-medium' : 'text-slate-400 italic'}>
                {value || placeholder}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="inline w-3 h-3 ml-1 text-slate-300 group-hover:text-sky-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
        </button>
    );
}

// ─── PDF Cell ─────────────────────────────────────────────────────────────────
function PdfCell({ orden }) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('pdf', file);
        router.post(`/ordenes/${orden.id}/pdf`, fd, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploading(false);
                if (inputRef.current) inputRef.current.value = '';
            },
        });
    };

    const handleDelete = () => {
        if (!confirm('¿Eliminar el PDF adjunto?')) return;
        router.delete(`/ordenes/${orden.id}/pdf`, { preserveScroll: true });
    };

    if (orden.pdf_oc) {
        return (
            <div className="flex items-center gap-1.5">
                <a
                    href={`/ordenes/${orden.id}/pdf/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    Ver PDF
                </a>
                <button onClick={handleDelete} title="Eliminar PDF" className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <>
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
            <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
                {uploading
                    ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                }
                {uploading ? 'Subiendo…' : 'Subir PDF'}
            </button>
        </>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = 'slate' }) {
    const cls = {
        slate: 'bg-white border-slate-200 text-slate-800',
        red:   'bg-red-50 border-red-200 text-red-700',
        amber: 'bg-amber-50 border-amber-200 text-amber-800',
        blue:  'bg-blue-50 border-blue-200 text-blue-800',
    };
    return (
        <div className={`rounded-2xl border p-5 ${cls[color]}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OrdenesIndex({ ordenes }) {
    const { flash } = usePage().props;

    const [busqueda, setBusqueda]           = useState('');
    const [filtroSiaf, setFiltroSiaf]       = useState('');
    const [filtroSeg, setFiltroSeg]         = useState('');
    const [soloProximas, setSoloProximas]   = useState(false);

    const proximas7  = ordenes.filter(o => { const d = calcDias(o.fecha_limite_pago); return d !== null && d >= 0 && d <= 7 && !isOrdenCerrada(o); }).length;
    const vencidas   = ordenes.filter(o => { const d = calcDias(o.fecha_limite_pago); return d !== null && d < 0 && !isOrdenCerrada(o); }).length;
    const compromiso = ordenes.filter(o => !o.estado_siaf || o.estado_siaf === 'C').length;

    const filtered = ordenes.filter(o => {
        const q = busqueda.toLowerCase();
        if (q && !([o.orden_compra, o.entidad?.razon_social, o.producto_servicio, o.unidad_ejecutora, o.empresa_factura].some(v => v?.toLowerCase().includes(q)))) return false;
        if (filtroSiaf && o.estado_siaf !== filtroSiaf) return false;
        if (filtroSeg && o.estado_seguimiento !== filtroSeg) return false;
        if (soloProximas) {
            const d = calcDias(o.fecha_limite_pago);
            if (d === null || d > 7 || isOrdenCerrada(o)) return false;
        }
        return true;
    });

    return (
        <Layout title="Órdenes de Compra">
            <Head title="Órdenes de Compra" />
            <div className="max-w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {flash?.success && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>}
                {flash?.error   && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{flash.error}</div>}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Órdenes de Compra</h1>
                        <p className="text-sm text-slate-500 mt-0.5">PeruCompras / SIAF — seguimiento de órdenes por entidad</p>
                    </div>
                    <Link href="/deudas/entidad/create"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0EA5E9] text-white text-sm font-semibold hover:bg-sky-600 transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Nueva Orden
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Órdenes"   value={ordenes.length} color="slate" />
                    <StatCard label="Próximas 7 días" value={proximas7}      color="amber" />
                    <StatCard label="Vencidas"        value={vencidas}       color="red"   />
                    <StatCard label="En Compromiso"   value={compromiso}     color="blue"  />
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
                    <input type="text" placeholder="Buscar N° OC, entidad, producto…"
                        value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        className="flex-1 min-w-[220px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                    <select value={filtroSiaf} onChange={e => setFiltroSiaf(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
                        <option value="">Estado SIAF (todos)</option>
                        <option value="C">Compromiso</option>
                        <option value="D">Devengado</option>
                        <option value="G">Girado</option>
                        <option value="R">Rechazada</option>
                    </select>
                    <select value={filtroSeg} onChange={e => setFiltroSeg(e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
                        <option value="">Seguimiento (todos)</option>
                        <option value="emitido">Emitido</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="enviado">Enviado SIAF</option>
                        <option value="observado">Observado</option>
                        <option value="pagado">Pagado</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                        <input type="checkbox" checked={soloProximas} onChange={e => setSoloProximas(e.target.checked)}
                            className="rounded border-slate-300 text-sky-500 focus:ring-sky-300" />
                        Solo próximas a vencer
                    </label>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {['N° OC', 'Entidad', 'Unidad Ejecutora', 'Producto / Servicio', 'Monto', 'F. Límite', 'Días', 'Estado SIAF', 'Seguimiento', 'Expediente', 'PDF OC', 'Acciones'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="text-center py-14 text-slate-400">
                                            No se encontraron órdenes con los filtros seleccionados.
                                        </td>
                                    </tr>
                                ) : filtered.map(orden => {
                                    const dias = calcDias(orden.fecha_limite_pago);
                                    const ocCerrada = isOrdenCerrada(orden);
                                    const rowBg = ocCerrada ? 'opacity-60'
                                        : dias !== null && dias < 0 ? 'bg-red-50/40'
                                        : dias !== null && dias <= 3 ? 'bg-amber-50/30' : '';
                                    return (
                                        <tr key={orden.id} className={`transition-colors hover:bg-slate-50 ${rowBg}`}>
                                            <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                                                <EditableCell ordenId={orden.id} field="orden_compra" value={orden.orden_compra} placeholder="Sin N° OC" />
                                                {orden.codigo_siaf && <div className="text-xs text-slate-400 mt-0.5">SIAF: {orden.codigo_siaf}</div>}
                                            </td>
                                            <td className="px-4 py-3 max-w-[180px]">
                                                <div className="truncate font-medium text-slate-800">{orden.entidad?.razon_social ?? '—'}</div>
                                                {orden.entidad?.ruc && <div className="text-xs text-slate-400">RUC {orden.entidad.ruc}</div>}
                                            </td>
                                            <td className="px-4 py-3 max-w-[160px]">
                                                <div className="truncate text-xs text-slate-600">{orden.unidad_ejecutora || '—'}</div>
                                                {orden.empresa_factura && <div className="truncate text-xs text-slate-400 mt-0.5">{orden.empresa_factura}</div>}
                                            </td>
                                            <td className="px-4 py-3 max-w-[200px]">
                                                <div className="truncate text-slate-700">{orden.producto_servicio || '—'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                                                {orden.deuda ? formatMoney(orden.deuda.monto_total, orden.deuda.currency_code) : '—'}
                                                {orden.deuda?.estado === 'pagada' && <div className="text-xs text-emerald-600 font-normal">Pagada</div>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatFecha(orden.fecha_limite_pago)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <DiasBadge dias={dias} cerrado={ocCerrada} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge map={SIAF_MAP} value={orden.estado_siaf} />
                                                {orden.fase_siaf && <div className="text-xs text-slate-400 mt-0.5">{orden.fase_siaf}</div>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <StatusBadge map={SEGUIMIENTO_MAP} value={orden.estado_seguimiento} />
                                            </td>
                                            <td className="px-4 py-3 min-w-[140px]">
                                                <EditableCell ordenId={orden.id} field="estado_expediente" value={orden.estado_expediente} placeholder="Sin expediente" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <PdfCell orden={orden} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/deudas/${orden.deuda_id}/entidad/show`} className="text-xs font-medium text-sky-600 hover:text-sky-800 transition-colors">Ver</Link>
                                                    <Link href={`/deudas/${orden.deuda_id}/entidad/edit`} className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">Editar</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length > 0 && (
                        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
                            Mostrando {filtered.length} de {ordenes.length} órdenes
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
