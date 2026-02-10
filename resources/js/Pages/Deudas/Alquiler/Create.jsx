import Layout from '../../../Components/Layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { getAvailableCurrencies, getCurrencySymbol } from '../../../helpers/currencyHelper';

const SERVICIOS_OPCIONES = [
    { value: 'agua', label: 'Agua' },
    { value: 'luz', label: 'Luz' },
    { value: 'internet', label: 'Internet' },
    { value: 'gas', label: 'Gas' },
    { value: 'limpieza', label: 'Limpieza' },
];

export default function Create({ clientes, inmuebles }) {
    const currencies = getAvailableCurrencies();
    const { data, setData, post, processing, errors } = useForm({
        cliente_id: '',
        inmueble_id: '',
        descripcion: '',
        monto_mensual: '',
        currency_code: 'PEN',
        periodicidad: 'mensual',
        fecha_inicio_contrato: '',
        fecha_corte: '',
        servicios_incluidos: [],
        notas: '',
    });

    const handleServicioToggle = (servicio) => {
        const actuales = [...data.servicios_incluidos];
        const index = actuales.indexOf(servicio);
        if (index > -1) {
            actuales.splice(index, 1);
        } else {
            actuales.push(servicio);
        }
        setData('servicios_incluidos', actuales);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/deudas/alquiler');
    };

    return (
        <Layout>
            <Head title="Nueva Deuda - Alquiler" />

            <div className="max-w-2xl mx-auto py-8 px-4">
                {/* Encabezado */}
                <div className="mb-6">
                    <Link
                        href="/deudas/create"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Volver a selección de tipo
                    </Link>

                    <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Alquiler
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Nueva Deuda - Alquiler</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Registra una nueva deuda de alquiler con sus datos de contrato.
                    </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    {/* Inquilino */}
                    <div>
                        <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700 mb-1">
                            Inquilino <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="cliente_id"
                            value={data.cliente_id}
                            onChange={(e) => setData('cliente_id', e.target.value)}
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-shadow ${
                                errors.cliente_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Seleccionar inquilino...</option>
                            {clientes.map((cliente) => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nombre} {cliente.apellido}
                                </option>
                            ))}
                        </select>
                        {errors.cliente_id && (
                            <p className="mt-1 text-xs text-red-600">{errors.cliente_id}</p>
                        )}
                    </div>

                    {/* Inmueble */}
                    <div>
                        <label htmlFor="inmueble_id" className="block text-sm font-medium text-gray-700 mb-1">
                            Inmueble <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="inmueble_id"
                            value={data.inmueble_id}
                            onChange={(e) => setData('inmueble_id', e.target.value)}
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-shadow ${
                                errors.inmueble_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Seleccionar inmueble...</option>
                            {inmuebles.map((inmueble) => (
                                <option key={inmueble.id} value={inmueble.id}>
                                    {inmueble.nombre} — {inmueble.direccion}
                                </option>
                            ))}
                        </select>
                        {errors.inmueble_id && (
                            <p className="mt-1 text-xs text-red-600">{errors.inmueble_id}</p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="descripcion"
                            type="text"
                            value={data.descripcion}
                            onChange={(e) => setData('descripcion', e.target.value)}
                            placeholder="Ej: Alquiler departamento Centro"
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-shadow ${
                                errors.descripcion ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                        />
                        {errors.descripcion && (
                            <p className="mt-1 text-xs text-red-600">{errors.descripcion}</p>
                        )}
                    </div>

                    {/* Monto Mensual y Moneda */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="monto_mensual" className="block text-sm font-medium text-gray-700 mb-1">
                                Monto Mensual <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                                    {getCurrencySymbol(data.currency_code)}
                                </span>
                                <input
                                    id="monto_mensual"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.monto_mensual}
                                    onChange={(e) => setData('monto_mensual', e.target.value)}
                                    placeholder="0.00"
                                    className={`w-full rounded-xl border pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-shadow ${
                                        errors.monto_mensual ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                    }`}
                                />
                            </div>
                            {errors.monto_mensual && (
                                <p className="mt-1 text-xs text-red-600">{errors.monto_mensual}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="currency_code" className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Moneda <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="currency_code"
                                value={data.currency_code}
                                onChange={(e) => setData('currency_code', e.target.value)}
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-shadow border-gray-300`}
                            >
                                {currencies.map((curr) => (
                                    <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="periodicidad" className="block text-sm font-medium text-gray-700 mb-1">
                                Periodicidad <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="periodicidad"
                                value={data.periodicidad}
                                onChange={(e) => setData('periodicidad', e.target.value)}
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-shadow ${
                                    errors.periodicidad ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                            >
                                <option value="mensual">Mensual</option>
                                <option value="bimestral">Bimestral</option>
                                <option value="trimestral">Trimestral</option>
                            </select>
                            {errors.periodicidad && (
                                <p className="mt-1 text-xs text-red-600">{errors.periodicidad}</p>
                            )}
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fecha_inicio_contrato" className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Inicio del Contrato <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="fecha_inicio_contrato"
                                type="date"
                                value={data.fecha_inicio_contrato}
                                onChange={(e) => setData('fecha_inicio_contrato', e.target.value)}
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-shadow ${
                                    errors.fecha_inicio_contrato ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                            />
                            {errors.fecha_inicio_contrato && (
                                <p className="mt-1 text-xs text-red-600">{errors.fecha_inicio_contrato}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="fecha_corte" className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Corte <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                            </label>
                            <input
                                id="fecha_corte"
                                type="date"
                                value={data.fecha_corte}
                                onChange={(e) => setData('fecha_corte', e.target.value)}
                                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-shadow ${
                                    errors.fecha_corte ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                            />
                            {errors.fecha_corte && (
                                <p className="mt-1 text-xs text-red-600">{errors.fecha_corte}</p>
                            )}
                        </div>
                    </div>

                    {/* Servicios Incluidos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Servicios Incluidos
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {SERVICIOS_OPCIONES.map((servicio) => {
                                const isChecked = data.servicios_incluidos.includes(servicio.value);
                                return (
                                    <label
                                        key={servicio.value}
                                        className={`inline-flex items-center gap-2 cursor-pointer rounded-xl border px-4 py-2 text-sm transition-all ${
                                            isChecked
                                                ? 'border-[#0EA5E9] bg-sky-50 text-[#0EA5E9] font-medium'
                                                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleServicioToggle(servicio.value)}
                                            className="sr-only"
                                        />
                                        <span className={`w-4 h-4 rounded flex items-center justify-center border ${
                                            isChecked
                                                ? 'bg-[#0EA5E9] border-[#0EA5E9]'
                                                : 'border-gray-400'
                                        }`}>
                                            {isChecked && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </span>
                                        {servicio.label}
                                    </label>
                                );
                            })}
                        </div>
                        {errors.servicios_incluidos && (
                            <p className="mt-1 text-xs text-red-600">{errors.servicios_incluidos}</p>
                        )}
                    </div>

                    {/* Notas */}
                    <div>
                        <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
                            Notas <span className="text-gray-400 text-xs font-normal">(opcional)</span>
                        </label>
                        <textarea
                            id="notas"
                            value={data.notas}
                            onChange={(e) => setData('notas', e.target.value)}
                            rows={3}
                            placeholder="Información adicional sobre el contrato de alquiler..."
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent transition-shadow resize-none ${
                                errors.notas ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                        />
                        {errors.notas && (
                            <p className="mt-1 text-xs text-red-600">{errors.notas}</p>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <Link
                            href="/deudas/create"
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-[#0EA5E9] hover:bg-[#0284C7] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Guardando...
                                </span>
                            ) : (
                                'Crear Deuda de Alquiler'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
