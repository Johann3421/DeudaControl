import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── Slot fijo: Factura o Guía de Remisión ─────────────────────────────────
function FixedDocumentoUploader({ deuda, tipo, label }) {
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

// ─── Item de adjunto extra con título editable ────────────────────────────
function ExtraDocumentoItem({ deuda, doc }) {
    const [editing, setEditing] = useState(false);
    const [titulo, setTitulo] = useState(doc.titulo);
    const [updating, setUpdating] = useState(false);

    const handleSave = async () => {
        if (!titulo.trim() || titulo === doc.titulo) {
            setEditing(false);
            setTitulo(doc.titulo);
            return;
        }
        setUpdating(true);
        router.put(`/deudas/${deuda.id}/documentos/${doc.id}`, { titulo: titulo.trim() }, {
            preserveScroll: true,
            onFinish: () => {
                setUpdating(false);
                setEditing(false);
            },
        });
    };

    const handleDelete = () => {
        if (!confirm(`¿Eliminar el documento "${doc.titulo}"?`)) return;
        router.delete(`/deudas/${deuda.id}/documentos/${doc.id}/delete`, { preserveScroll: true });
    };

    return (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 group">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className="flex-1 min-w-0">
                {editing ? (
                    <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') { setEditing(false); setTitulo(doc.titulo); }
                        }}
                        onBlur={handleSave}
                        autoFocus
                        maxLength={100}
                        className="w-full px-2 py-1 text-sm rounded border border-slate-300 focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10 outline-none"
                    />
                ) : (
                    <button
                        onClick={() => setEditing(true)}
                        className="text-left w-full"
                        title="Click para editar título"
                    >
                        <p className="text-sm font-medium text-slate-800 truncate">{doc.titulo}</p>
                        <p className="text-[11px] text-slate-500">{formatBytes(doc.size)}</p>
                    </button>
                )}
            </div>
            <a href={`/deudas/${deuda.id}/documentos/${doc.id}/view`} target="_blank" rel="noopener noreferrer"
                className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Ver">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </a>
            <button onClick={handleDelete} disabled={updating}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Eliminar">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
        </div>
    );
}

// ─── Form para añadir nuevo adjunto con título ─────────────────────────────
function AddExtraDocumentoForm({ deuda, onCancel }) {
    const inputRef = useRef(null);
    const [titulo, setTitulo] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file || !titulo.trim()) {
            if (!titulo.trim()) alert('Ingresa un título para el documento');
            return;
        }
        setUploading(true);
        const fd = new FormData();
        fd.append('titulo', titulo.trim());
        fd.append('documento', file);
        router.post(`/deudas/${deuda.id}/documentos`, fd, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setUploading(false);
                if (inputRef.current) inputRef.current.value = '';
            },
        });
    };

    return (
        <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2">
            <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título del documento (ej. Contrato, Recibo, Cotización)"
                maxLength={100}
                className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none"
            />
            <div className="flex items-center gap-2">
                <input type="file" ref={inputRef} accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
                <button onClick={() => inputRef.current?.click()} disabled={uploading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {uploading ? 'Subiendo...' : 'Subir documento'}
                </button>
                <button onClick={onCancel} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    Cancelar
                </button>
            </div>
        </div>
    );
}

// ─── Modal principal ───────────────────────────────────────────────────────
export default function DocumentosModal({ deuda, onClose }) {
    const [addingExtra, setAddingExtra] = useState(false);
    const documentos = deuda.documentos || [];

    // Si el modal se abre y no hay extras, mostrar el form automáticamente
    useEffect(() => {
        if (documentos.length === 0 && !addingExtra) {
            setAddingExtra(true);
        }
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">Documentos Adjuntos</h3>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-[280px] truncate">{deuda.descripcion}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto">
                    <FixedDocumentoUploader deuda={deuda} tipo="factura" label="Factura" />
                    <div className="h-px bg-slate-100 w-full" />
                    <FixedDocumentoUploader deuda={deuda} tipo="guia" label="Guía de Remisión" />

                    {documentos.length > 0 && (
                        <>
                            <div className="h-px bg-slate-100 w-full" />
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-slate-700">Otros documentos</label>
                                    <span className="text-xs text-slate-500">{documentos.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {documentos.map((doc) => (
                                        <ExtraDocumentoItem key={doc.id} deuda={deuda} doc={doc} />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {addingExtra ? (
                        <AddExtraDocumentoForm deuda={deuda} onCancel={() => setAddingExtra(false)} />
                    ) : (
                        <button onClick={() => setAddingExtra(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-dashed border-indigo-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Añadir otro documento
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
