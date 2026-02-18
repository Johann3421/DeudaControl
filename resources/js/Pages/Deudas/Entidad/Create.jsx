import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Layout from '../../../Components/Layout';
import { useState, useEffect } from 'react';
import { getAvailableCurrencies, getCurrencySymbol } from '../../../helpers/currencyHelper';

export default function EntidadDeudaCreate({ entidades }) {
    const currencies = getAvailableCurrencies();

    // Función para traducir mensajes de error genéricos
    const traducirError = (campo, mensaje) => {
        if (mensaje === 'validation.date') {
            return 'El campo debe ser una fecha válida.';
        }
        if (mensaje === 'validation.in') {
            return 'El valor seleccionado no es válido.';
        }
        if (mensaje === 'validation.numeric') {
            return 'El campo debe ser un número.';
        }
        if (mensaje === 'validation.string') {
            return 'El campo debe ser texto.';
        }
        return mensaje;
    };

    const { data, setData, post, processing, errors } = useForm({
        entidad_id: '',
        descripcion: '',
        orden_compra: '',
        currency_code: 'PEN',
        fecha_emision: new Date().toISOString().split('T')[0],
        producto_servicio: '',
        monto_total: '',
        codigo_siaf: '',
        fecha_limite_pago: '',
        notas: '',
        // Nuevos campos SIAF - deben ser strings vacíos, no undefined
        estado_siaf: '',
        fase_siaf: '',
        estado_expediente: '',
        fecha_proceso: '',
    });

    // Obtener token CSRF de Inertia o del DOM
    const page = usePage();
    const getCsrfToken = () => {
        // Intenta obtener del props de Inertia
        if (page.props.csrf_token) {
            console.log('✓ Token CSRF obtenido de props de Inertia');
            return page.props.csrf_token;
        }

        // Intenta obtener del meta tag
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (metaToken) {
            console.log('✓ Token CSRF obtenido del meta tag');
            return metaToken;
        }

        // Intenta obtener de la cookie XSRF-TOKEN
        const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];
        if (cookieToken) {
            console.log('✓ Token CSRF obtenido de la cookie XSRF-TOKEN');
            return decodeURIComponent(cookieToken);
        }

        console.warn('⚠ Token CSRF no encontrado en ninguna fuente');
        console.log('Props disponibles:', Object.keys(page.props));
        return '';
    };
    const csrfToken = getCsrfToken();

    // Estado para la búsqueda de SIAF
    const [searchError, setSearchError] = useState('');
    const [searchSuccess, setSearchSuccess] = useState(false);
    const [siafResults, setSiafResults] = useState(null);
    const [isUploadingExcel, setIsUploadingExcel] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('📤 Enviando datos del formulario:', {
            ...data,
            estado_siaf: data.estado_siaf || '(vacío)',
            fase_siaf: data.fase_siaf || '(vacío)',
            estado_expediente: data.estado_expediente || '(vacío)',
            fecha_proceso: data.fecha_proceso || '(vacío)',
        });
        post('/deudas/entidad');
    };

    const openSiafDirect = () => {
        // Abre SIAF directamente
        window.open(
            'https://apps2.mef.gob.pe/consulta-vfp-webapp/consultaExpediente.jspx',
            'siaf_window',
            'width=1200,height=800,resizable=yes,scrollbars=yes'
        );
        setSearchError('');
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingExcel(true);
        setSearchError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/siaf/upload-excel', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                console.log('✓ Excel procesado:', result);
                setSearchSuccess(true);
                setSiafResults(result);

                // Llenar campos del formulario
                if (result.info_siaf) {
                    setData('estado_siaf', 'C');
                    setData('fase_siaf', result.info_siaf.fase || '');
                    setData('estado_expediente', result.info_siaf.estado || '');
                    setData('fecha_proceso', result.info_siaf.fechaProceso || '');
                }
            } else {
                setSearchError(result.error || 'Error al procesar el Excel');
                setSearchSuccess(false);
                setSiafResults(null);
            }
        } catch (error) {
            console.error('Error al subir Excel:', error);
            setSearchError('Error al procesar el archivo: ' + error.message);
            setSearchSuccess(false);
            setSiafResults(null);
        } finally {
            // Limpiar el input
            e.target.value = '';
            setIsUploadingExcel(false);
        }
    };

    return (
        <Layout title="Nueva Deuda - Entidad">
            <Head title="Nueva Deuda - Entidad" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/deudas/create" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a tipo de deuda
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                            Entidad
                        </span>
                        <h2 className="text-lg font-semibold text-slate-900">Nueva Deuda - Entidad</h2>
                    </div>

                    {/* Mostrar errores de validación si los hay */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
                            <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                Errores de validación
                            </h3>
                            <ul className="text-sm text-red-700 space-y-1">
                                {Object.entries(errors).map(([campo, mensaje]) => (
                                    <li key={campo}>• {traducirError(campo, mensaje)}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Entidad */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Entidad *</label>
                            <select
                                value={data.entidad_id}
                                onChange={(e) => setData('entidad_id', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white ${errors.entidad_id ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                            >
                                <option value="">Selecciona una entidad</option>
                                {entidades.map((ent) => (
                                    <option key={ent.id} value={ent.id}>
                                        {ent.razon_social} ({ent.ruc}) - {ent.tipo === 'publica' ? 'Publica' : 'Privada'}
                                    </option>
                                ))}
                            </select>
                            {errors.entidad_id && <p className="mt-1 text-sm text-red-600">{errors.entidad_id}</p>}
                        </div>

                        {/* Descripcion */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripcion *</label>
                            <input
                                type="text"
                                value={data.descripcion}
                                onChange={(e) => setData('descripcion', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.descripcion ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                placeholder="Ej: Factura por servicio de consultoria..."
                            />
                            {errors.descripcion && <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>}
                        </div>

                        {/* Orden de Compra + Fecha de Emision */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Orden de Compra *</label>
                                <input
                                    type="text"
                                    value={data.orden_compra}
                                    onChange={(e) => setData('orden_compra', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.orden_compra ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                    placeholder="N. de orden de compra"
                                />
                                {errors.orden_compra && <p className="mt-1 text-sm text-red-600">{errors.orden_compra}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Emision *</label>
                                <input
                                    type="date"
                                    value={data.fecha_emision}
                                    onChange={(e) => setData('fecha_emision', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.fecha_emision ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                />
                                {errors.fecha_emision && <p className="mt-1 text-sm text-red-600">{errors.fecha_emision}</p>}
                            </div>
                        </div>

                        {/* Producto/Servicio */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Producto / Servicio *</label>
                            <input
                                type="text"
                                value={data.producto_servicio}
                                onChange={(e) => setData('producto_servicio', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.producto_servicio ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                placeholder="Descripcion del producto o servicio"
                            />
                            {errors.producto_servicio && <p className="mt-1 text-sm text-red-600">{errors.producto_servicio}</p>}
                        </div>

                        {/* Monto Total + Moneda + Codigo SIAF */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto Total *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">{getCurrencySymbol(data.currency_code)}</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={data.monto_total}
                                        onChange={(e) => setData('monto_total', e.target.value)}
                                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.monto_total ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.monto_total && <p className="mt-1 text-sm text-red-600">{errors.monto_total}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Moneda</label>
                                <select value={data.currency_code} onChange={(e) => setData('currency_code', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 bg-white">
                                    {currencies.map((curr) => (
                                        <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Número Expediente</label>
                                <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={data.codigo_siaf}
                                    onChange={(e) => setData('codigo_siaf', e.target.value)}
                                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.codigo_siaf ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                    placeholder="Codigo SIAF (opcional)"
                                />
                                <button
                                    type="button"
                                    onClick={openSiafDirect}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
                                >
                                    Abrir SIAF
                                </button>
                            </div>
                                {errors.codigo_siaf && <p className="mt-1 text-sm text-red-600">{errors.codigo_siaf}</p>}
                            </div>
                        </div>

                        {/* Upload Excel desde SIAF */}
                        {!searchSuccess && (
                            <div className="mt-6 p-6 rounded-xl border border-blue-200 bg-blue-50">
                                <h3 className="text-base font-semibold text-slate-900 mb-4">📥 Descargar y Subir Excel de SIAF</h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600">
                                        1. Haz clic en "Abrir SIAF" arriba<br/>
                                        2. Completa la búsqueda (año, ejecutora, expediente, CAPTCHA)<br/>
                                        3. Descarga el resultado como Excel<br/>
                                        4. Sube el archivo aquí
                                    </p>

                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={handleExcelUpload}
                                            disabled={isUploadingExcel}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-blue-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {isUploadingExcel && (
                                        <div className="flex items-center gap-2 text-sm text-blue-600">
                                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                                            Procesando archivo...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Resultados de Búsqueda SIAF */}
                        {searchSuccess && siafResults && (
                            <div className="mt-6 p-6 rounded-xl border border-green-200 bg-green-50">
                                <h3 className="text-base font-semibold text-slate-900 mb-4">Resultados de la Búsqueda SIAF</h3>

                                {/* Información del SIAF extraída */}
                                {siafResults.info_siaf && (
                                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 mb-4">
                                        <h4 className="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                                            Datos extraídos del SIAF
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                            <div>
                                                <label className="block text-xs font-medium text-green-700 mb-1">Fase SIAF</label>
                                                <div className="px-3 py-2 bg-green-100 rounded border border-green-300 font-semibold text-green-900">
                                                    {data.fase_siaf || siafResults.info_siaf.fase || '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-green-700 mb-1">Estado Expediente</label>
                                                <div className="px-3 py-2 bg-green-100 rounded border border-green-300 font-semibold text-green-900">
                                                    {data.estado_expediente || siafResults.info_siaf.estado || '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-green-700 mb-1">Fecha Proceso</label>
                                                <div className="px-3 py-2 bg-green-100 rounded border border-green-300 font-semibold text-green-900">
                                                    {data.fecha_proceso ? new Date(data.fecha_proceso).toLocaleDateString('es-ES') : (siafResults.info_siaf.fechaProceso ? new Date(siafResults.info_siaf.fechaProceso).toLocaleDateString('es-ES') : '-')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <label className="block text-xs font-medium text-green-700 mb-1">Estado SIAF (Pre-llenado con C - COMPROMISO) *</label>
                                            <select
                                                value={data.estado_siaf}
                                                onChange={(e) => setData('estado_siaf', e.target.value)}
                                                className="w-full px-3 py-2 rounded border border-green-300 text-xs bg-green-50 font-semibold"
                                            >
                                                <option value="">Selecciona un estado</option>
                                                <option value="C">C - COMPROMISO</option>
                                                <option value="D">D - DEVENGADO</option>
                                                <option value="G">G - GIRADO</option>
                                                <option value="R">R - RECHAZADA</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Tabla de resultados */}
                                {siafResults.datos && siafResults.datos.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-slate-200">
                                                    <th className="border border-slate-300 px-2 py-2 text-left">Ciclo</th>
                                                    <th className="border border-slate-300 px-2 py-2 text-left">Fase</th>
                                                    <th className="border border-slate-300 px-2 py-2 text-left">Sec</th>
                                                    <th className="border border-slate-300 px-2 py-2 text-left">Corr</th>
                                                    <th className="border border-slate-300 px-2 py-2 text-left">Doc</th>
                                                    <th className="border border-slate-300 px-2 py-2 text-left">Número</th>
                                                    <th className="border border-slate-300 px-2 py-2 text-left">Fecha</th>
                                                    <th className="border border-slate-300 px-2 py-2 text-left">Moneda</th>
                                                    <th className="border border-slate-300 px-2 py-2 text-right">Monto</th>
                                                    <th className="border border-slate-300 px-2 py-2 text-left">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {siafResults.datos.map((row, idx) => (
                                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                                        <td className="border border-slate-300 px-2 py-2">{row.ciclo}</td>
                                                        <td className="border border-slate-300 px-2 py-2">{row.fase}</td>
                                                        <td className="border border-slate-300 px-2 py-2">{row.secuencia}</td>
                                                        <td className="border border-slate-300 px-2 py-2">{row.correlativo}</td>
                                                        <td className="border border-slate-300 px-2 py-2">{row.codDoc}</td>
                                                        <td className="border border-slate-300 px-2 py-2">{row.numDoc}</td>
                                                        <td className="border border-slate-300 px-2 py-2">{row.fecha}</td>
                                                        <td className="border border-slate-300 px-2 py-2">{row.moneda}</td>
                                                        <td className="border border-slate-300 px-2 py-2 text-right font-semibold">{row.monto}</td>
                                                        <td className="border border-slate-300 px-2 py-2">{row.estado}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {searchError && (
                                    <div className="p-4 rounded-lg bg-red-100 border border-red-300 mt-4">
                                        <p className="text-sm text-red-700">{searchError}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {searchError && !searchSuccess && (
                            <div className="p-4 rounded-lg bg-red-100 border border-red-300">
                                <p className="text-sm text-red-700">{searchError}</p>
                            </div>
                        )}

                        {/* Fecha Limite de Pago */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha Limite de Pago *</label>
                            <input
                                type="date"
                                value={data.fecha_limite_pago}
                                onChange={(e) => setData('fecha_limite_pago', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.fecha_limite_pago ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                            />
                            {errors.fecha_limite_pago && <p className="mt-1 text-sm text-red-600">{errors.fecha_limite_pago}</p>}
                        </div>

                        {/* Notas */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <textarea
                                value={data.notas}
                                onChange={(e) => setData('notas', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 resize-none"
                                placeholder="Notas adicionales..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50"
                            >
                                {processing ? 'Guardando...' : 'Registrar Deuda'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
