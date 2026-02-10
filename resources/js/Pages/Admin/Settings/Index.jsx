import { Head } from '@inertiajs/react';
import Layout from '../../../Components/Layout';

export default function SettingsIndex({ app_name, timezone }) {
    const phpVersion = '8.2.12';
    
    return (
        <Layout title="Configuración">
            <Head title="Configuración" />
            <div className="space-y-5">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Configuración del Sistema</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Información y configuración general de la aplicación</p>
                </div>

                {/* Main Configuration Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* App Info */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Información de la Aplicación</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Nombre</p>
                                <p className="text-sm font-semibold text-slate-900">{app_name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Zona Horaria</p>
                                <p className="text-sm font-semibold text-slate-900">{timezone}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Estado</p>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                    <span className="w-2 h-2 rounded-full bg-green-600" />
                                    En Línea
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* System Requirements */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Requisitos del Sistema</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">PHP</p>
                                    <p className="text-sm font-semibold text-slate-900">{phpVersion}</p>
                                </div>
                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">✓ OK</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Laravel</p>
                                    <p className="text-sm font-semibold text-slate-900">11</p>
                                </div>
                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">✓ OK</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Base de Datos</p>
                                    <p className="text-sm font-semibold text-slate-900">MySQL</p>
                                </div>
                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">✓ OK</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Características Habilitadas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Multi-Moneda</p>
                                <p className="text-xs text-slate-500">8 monedas soportadas</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Sistema de Roles</p>
                                <p className="text-xs text-slate-500">Super Admin y Usuario</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Deudas por Tipo</p>
                                <p className="text-xs text-slate-500">Particular, Entidad, Alquiler</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Seguimiento de Pagos</p>
                                <p className="text-xs text-slate-500">Historial completo</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Gestión de Clientes</p>
                                <p className="text-xs text-slate-500">Base de datos completa</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Reportes</p>
                                <p className="text-xs text-slate-500">Estadísticas en tiempo real</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Important Info */}
                <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-blue-900">Configuración Global</p>
                            <p className="text-sm text-blue-700 mt-1">
                                Para cambiar la configuración de la aplicación (nombre, zona horaria, etc.), debes editar el archivo <code className="bg-blue-200 px-1.5 py-0.5 rounded">.env</code> en el servidor y contactar al administrador del sistema.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
