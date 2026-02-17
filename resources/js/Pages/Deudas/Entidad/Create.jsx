import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Layout from '../../../Components/Layout';
import { useState } from 'react';
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
    const [siafSearch, setSiafSearch] = useState({
        anoEje: new Date().getFullYear().toString(),
        secEjec: '',
        expediente: '',
        j_captcha: '',
    });
    const [showSiafSearch, setShowSiafSearch] = useState(false);
    const [captchaImage, setCaptchaImage] = useState('');
    const [searchingCode, setSearchingCode] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [searchSuccess, setSearchSuccess] = useState(false);
    const [siafResults, setSiafResults] = useState(null);

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

    const loadCaptcha = async () => {
        try {
            // Endpoint que proporciona la imagen del CAPTCHA
            const response = await fetch('/api/captcha', {
                method: 'GET'
            });
            const data = await response.json();

            if (data.success && data.captcha) {
                setCaptchaImage(data.captcha);
            } else {
                setSearchError('Error al cargar el CAPTCHA');
            }
        } catch (error) {
            console.error('Error al cargar CAPTCHA:', error);
            setSearchError('Error al cargar el CAPTCHA: ' + error.message);
        }
    };

    const handleSiafSearch = async (e) => {
        if (e) e.preventDefault();
        setSearchError('');
        setSearchingCode(true);

        try {
            // Validar que todos los campos requeridos estén completos
            if (!siafSearch.secEjec || !siafSearch.expediente || !siafSearch.j_captcha) {
                setSearchError('Por favor completa todos los campos requeridos');
                setSearchingCode(false);
                return;
            }

            console.log('Iniciando búsqueda SIAF con:', {
                anoEje: siafSearch.anoEje,
                secEjec: siafSearch.secEjec,
                expediente: siafSearch.expediente,
                codigo_siaf: data.codigo_siaf
            });
            console.log('Token CSRF usado:', csrfToken ? `[${csrfToken.substring(0, 20)}...]` : 'no encontrado');

            // Hacer la búsqueda en el servicio SIAF
            const response = await fetch('/api/siaf/consultar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    anoEje: siafSearch.anoEje,
                    secEjec: siafSearch.secEjec,
                    expediente: siafSearch.expediente,
                    j_captcha: siafSearch.j_captcha,
                    codigo_siaf: data.codigo_siaf
                })
            });

            console.log('Respuesta del servidor:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error al consultar el servicio SIAF: ${response.status}`);
            }

            const result = await response.json();
            console.log('Resultado:', result);

            if (result.success && result.data) {
                // Mostrar los resultados en una tabla en lugar de autocompletar
                setSiafResults(result.data);
                setSearchSuccess(true);
                setSearchError('');

                // Guardar la información del SIAF en el formulario principal
                if (result.data.info_siaf) {
                    console.log('📥 Actualizando campos SIAF con:', {
                        estado_siaf: 'C',
                        fase_siaf: result.data.info_siaf.fase || '',
                        estado_expediente: result.data.info_siaf.estado || '',
                        fecha_proceso: result.data.info_siaf.fechaProceso || '',
                    });

                    setData('estado_siaf', 'C');
                    setData('fase_siaf', result.data.info_siaf.fase || '');
                    setData('estado_expediente', result.data.info_siaf.estado || '');
                    setData('fecha_proceso', result.data.info_siaf.fechaProceso || '');
                }
            } else {
                setSearchError(result.message || 'No se encontraron datos para el código SIAF especificado');
                setSiafResults(null);
            }
        } catch (error) {
            setSearchError('Error al conectar con el servicio SIAF: ' + error.message);
            console.error('Error detallado:', error);
        } finally {
            setSearchingCode(false);
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
                                        onClick={() => {
                                            if (!data.codigo_siaf) {
                                                setSearchError('Por favor ingresa un código SIAF primero');
                                            } else {
                                                setSearchError('');
                                                setShowSiafSearch(!showSiafSearch);
                                                if (!showSiafSearch) {
                                                    loadCaptcha();
                                                }
                                            }
                                        }}
                                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
                                    >
                                        Buscar
                                    </button>
                                </div>
                                {errors.codigo_siaf && <p className="mt-1 text-sm text-red-600">{errors.codigo_siaf}</p>}
                            </div>
                        </div>

                        {/* Formulario de Búsqueda SIAF */}
                        {showSiafSearch && (
                            <div className="mt-6 p-6 rounded-xl border border-yellow-200 bg-yellow-50">
                                <h3 className="text-base font-semibold text-slate-900 mb-4">Búsqueda de Código SIAF</h3>
                                <div className="space-y-4">
                                    {searchSuccess && (
                                        <div className="p-4 rounded-lg bg-green-100 border border-green-300 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-sm text-green-700 font-medium">¡Búsqueda exitosa! Resultados encontrados.</p>
                                        </div>
                                    )}

                                    {/* Mostrar tabla de resultados */}
                                    {searchSuccess && siafResults && siafResults.datos && (
                                        <div className="mt-4 space-y-4">
                                            {/* Información del SIAF extraída */}
                                            {siafResults.info_siaf && (
                                                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
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
                                            <div className="overflow-x-auto mt-4">
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
                                            </div>
                                        )}
                                    {searchError && (
                                        <div className="p-4 rounded-lg bg-red-100 border border-red-300">
                                            <p className="text-sm text-red-700">{searchError}</p>
                                        </div>
                                    )}

                                    {/* Año de Ejecución */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Año de Ejecución *</label>
                                        <select
                                            value={siafSearch.anoEje}
                                            onChange={(e) => setSiafSearch({ ...siafSearch, anoEje: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                        >
                                            {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009].map((year) => (
                                                <option key={year} value={year.toString()}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Código de Unidad Ejecutora + Expediente */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Código de Unidad Ejecutora *</label>
                                            <input
                                                type="text"
                                                value={siafSearch.secEjec}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    if (value.length <= 6) {
                                                        setSiafSearch({ ...siafSearch, secEjec: value });
                                                    }
                                                }}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                                placeholder="Ej: 001234"
                                                maxLength="6"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Ingrese un Expediente *</label>
                                            <input
                                                type="text"
                                                value={siafSearch.expediente}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, '');
                                                    if (value.length <= 10) {
                                                        setSiafSearch({ ...siafSearch, expediente: value });
                                                    }
                                                }}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                                placeholder="Ej: 2024000001"
                                                maxLength="10"
                                            />
                                        </div>
                                    </div>

                                    {/* CAPTCHA */}
                                    <div className="space-y-3">
                                        <label className="block text-sm font-medium text-slate-700">Verificación CAPTCHA *</label>
                                        {captchaImage && (
                                            <div className="space-y-2">
                                                <div className="bg-slate-100 p-2 rounded-lg inline-block">
                                                    <img
                                                        src={captchaImage}
                                                        alt="CAPTCHA"
                                                        className="h-16 w-auto"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={loadCaptcha}
                                                    className="block text-xs text-[#0EA5E9] hover:text-[#0284C7] font-medium"
                                                >
                                                    ↻ Cambiar imagen
                                                </button>
                                            </div>
                                        )}
                                        <input
                                            type="text"
                                            value={siafSearch.j_captcha}
                                            onChange={(e) => setSiafSearch({ ...siafSearch, j_captcha: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                            placeholder="Ingrese el código de la imagen (mayúsculas o minúsculas)"
                                            maxLength="5"
                                        />
                                    </div>

                                    {/* Botones de búsqueda */}
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleSiafSearch}
                                            disabled={searchingCode}
                                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {searchingCode ? 'Consultando...' : 'Consultar SIAF'}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={searchingCode}
                                            onClick={() => {
                                                setShowSiafSearch(false);
                                                setSearchSuccess(false);
                                                setSiafResults(null);
                                                setSiafSearch({
                                                    anoEje: new Date().getFullYear().toString(),
                                                    secEjec: '',
                                                    expediente: '',
                                                    j_captcha: '',
                                                });
                                                setSearchError('');
                                            }}
                                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
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
                            <Link href="/deudas/create" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
