import { Head, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { useState } from 'react';

export default function Maintenance({ systemInfo }) {
    const [loading, setLoading] = useState({});
    const [results, setResults] = useState({});
    const [logs, setLogs] = useState(null);
    const [logsFilter, setLogsFilter] = useState('siaf');

    const runAction = async (key, url, method = 'POST') => {
        setLoading(prev => ({ ...prev, [key]: true }));
        setResults(prev => ({ ...prev, [key]: null }));

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
                || document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            setResults(prev => ({ ...prev, [key]: data }));
        } catch (error) {
            setResults(prev => ({ ...prev, [key]: { success: false, message: 'Error de red: ' + error.message } }));
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const loadLogs = async () => {
        setLoading(prev => ({ ...prev, logs: true }));
        try {
            const response = await fetch('/admin/maintenance/logs', {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await response.json();
            setLogs(data);
        } catch (error) {
            setLogs({ success: false, message: error.message });
        } finally {
            setLoading(prev => ({ ...prev, logs: false }));
        }
    };

    const StatusBadge = ({ ok }) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {ok ? '✓ OK' : '✗ Error'}
        </span>
    );

    const ResultBox = ({ result }) => {
        if (!result) return null;
        return (
            <div className={`mt-3 p-4 rounded-lg border text-sm ${result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="font-semibold mb-1">{result.success ? '✓ Éxito' : '✗ Error'}</div>
                <div>{result.message}</div>
                {result.results && (
                    <pre className="mt-2 text-xs bg-white/60 p-2 rounded overflow-x-auto max-h-60 overflow-y-auto">
                        {JSON.stringify(result.results, null, 2)}
                    </pre>
                )}
                {result.siaf_config_after && (
                    <div className="mt-2 pt-2 border-t border-current/20">
                        <span className="font-semibold">SIAF Proxy URL después del recache: </span>
                        <code className="bg-white/50 px-1 rounded">{result.siaf_config_after.proxy_url}</code>
                    </div>
                )}
            </div>
        );
    };

    const ActionButton = ({ label, icon, onClick, color = 'blue', isLoading }) => (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                ${color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25' : ''}
                ${color === 'red' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/25' : ''}
                ${color === 'green' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/25' : ''}
                ${color === 'amber' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25' : ''}
                ${color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25' : ''}
            `}
        >
            {isLoading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            ) : (
                <span>{icon}</span>
            )}
            {isLoading ? 'Ejecutando...' : label}
        </button>
    );

    return (
        <Layout title="Mantenimiento del Sistema">
            <Head title="Mantenimiento" />
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">🛠️ Panel de Mantenimiento</h1>
                    <p className="text-sm text-slate-500 mt-1">Administra caché, configuración y conexión SIAF desde aquí</p>
                </div>

                {/* Estado del Sistema */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">📊 Estado del Sistema</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Entorno</span>
                                <span className={`font-bold ${systemInfo.app_env === 'production' ? 'text-green-700' : 'text-amber-700'}`}>
                                    {systemInfo.app_env}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Debug</span>
                                <StatusBadge ok={!systemInfo.app_debug} />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">PHP</span>
                                <span className="font-mono text-xs text-slate-700">{systemInfo.php_version}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Laravel</span>
                                <span className="font-mono text-xs text-slate-700">{systemInfo.laravel_version}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Config Cacheada</span>
                                <StatusBadge ok={systemInfo.config_cached} />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Rutas Cacheadas</span>
                                <StatusBadge ok={systemInfo.routes_cached} />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Session Driver</span>
                                <span className="font-mono text-xs text-slate-700">{systemInfo.session_driver}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Cache Driver</span>
                                <span className="font-mono text-xs text-slate-700">{systemInfo.cache_driver}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Storage Escribible</span>
                                <StatusBadge ok={systemInfo.storage_writable} />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Dir SIAF Escribible</span>
                                <StatusBadge ok={systemInfo.siaf_dir_writable} />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">cURL</span>
                                <StatusBadge ok={systemInfo.extensions?.curl} />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">GD (imágenes)</span>
                                <StatusBadge ok={systemInfo.extensions?.gd} />
                            </div>
                        </div>
                    </div>

                    {/* SIAF Proxy Config */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">🔗 Configuración Proxy SIAF</h3>
                        <div className="flex flex-wrap gap-4">
                            <div className="text-sm">
                                <span className="text-slate-500">URL: </span>
                                <code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{systemInfo.siaf_proxy_url}</code>
                            </div>
                            <div className="text-sm">
                                <span className="text-slate-500">Secret: </span>
                                <StatusBadge ok={systemInfo.siaf_proxy_secret_set} />
                            </div>
                        </div>
                        {systemInfo.siaf_proxy_url === '(no configurado)' && (
                            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                ⚠️ <strong>SIAF_PROXY_URL</strong> no está en la configuración. Agrega esta variable al <code>.env</code> de producción y luego haz click en "Limpiar Todo y Recachear".
                            </div>
                        )}
                    </div>
                </div>

                {/* Acciones de Caché */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">🧹 Limpieza de Caché</h2>
                    <p className="text-sm text-slate-500 mb-4">Equivalente a ejecutar comandos artisan por SSH. Usa "Limpiar Todo" si acabas de actualizar archivos.</p>

                    <div className="flex flex-wrap gap-3">
                        <ActionButton
                            label="Limpiar Todo y Recachear"
                            icon="🔄"
                            color="red"
                            isLoading={loading.clearAll}
                            onClick={() => runAction('clearAll', '/admin/maintenance/clear-all')}
                        />
                        <ActionButton
                            label="Config"
                            icon="⚙️"
                            color="amber"
                            isLoading={loading.clearConfig}
                            onClick={() => runAction('clearConfig', '/admin/maintenance/clear-config')}
                        />
                        <ActionButton
                            label="Vistas"
                            icon="👁️"
                            color="blue"
                            isLoading={loading.clearViews}
                            onClick={() => runAction('clearViews', '/admin/maintenance/clear-views')}
                        />
                        <ActionButton
                            label="Cache App"
                            icon="🗑️"
                            color="purple"
                            isLoading={loading.clearCache}
                            onClick={() => runAction('clearCache', '/admin/maintenance/clear-cache')}
                        />
                    </div>

                    <ResultBox result={results.clearAll} />
                    <ResultBox result={results.clearConfig} />
                    <ResultBox result={results.clearViews} />
                    <ResultBox result={results.clearCache} />
                </div>

                {/* Test SIAF Proxy */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">🌐 Test Proxy SIAF</h2>
                    <p className="text-sm text-slate-500 mb-4">Prueba si el servidor de producción puede conectar al Cloudflare Worker y obtener CAPTCHA del SIAF.</p>

                    <ActionButton
                        label="Probar Conexión SIAF"
                        icon="🔍"
                        color="green"
                        isLoading={loading.testSiaf}
                        onClick={() => runAction('testSiaf', '/admin/maintenance/test-siaf')}
                    />

                    <ResultBox result={results.testSiaf} />
                </div>

                {/* Logs */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">📋 Logs del Sistema</h2>
                    <p className="text-sm text-slate-500 mb-4">Ver las últimas líneas del log de Laravel para diagnosticar problemas.</p>

                    <div className="flex flex-wrap gap-3">
                        <ActionButton
                            label="Ver Logs"
                            icon="📄"
                            color="blue"
                            isLoading={loading.logs}
                            onClick={loadLogs}
                        />
                        <ActionButton
                            label="Limpiar Logs"
                            icon="🗑️"
                            color="red"
                            isLoading={loading.clearLogs}
                            onClick={() => runAction('clearLogs', '/admin/maintenance/clear-logs')}
                        />
                    </div>

                    <ResultBox result={results.clearLogs} />

                    {logs && logs.success && (
                        <div className="mt-4">
                            <div className="flex gap-2 mb-3">
                                <button
                                    onClick={() => setLogsFilter('siaf')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${logsFilter === 'siaf' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Solo SIAF ({logs.siaf_lines?.length || 0})
                                </button>
                                <button
                                    onClick={() => setLogsFilter('all')}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${logsFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    Todos ({logs.total_lines || 0})
                                </button>
                                <span className="text-xs text-slate-400 self-center ml-2">
                                    Tamaño: {logs.file_size ? (logs.file_size / 1024).toFixed(1) + ' KB' : '0 KB'}
                                </span>
                            </div>
                            <div className="bg-slate-900 p-4 rounded-lg font-mono text-xs text-slate-300 max-h-96 overflow-y-auto space-y-0.5">
                                {(logsFilter === 'siaf' ? (logs.siaf_lines || []) : (logs.lines || [])).map((line, i) => (
                                    <div
                                        key={i}
                                        className={`py-0.5 ${
                                            line.includes('ERROR') || line.includes('error') ? 'text-red-400' :
                                            line.includes('WARNING') || line.includes('warning') ? 'text-yellow-400' :
                                            line.includes('INFO') ? 'text-green-400' :
                                            'text-slate-400'
                                        }`}
                                    >
                                        {line}
                                    </div>
                                ))}
                                {((logsFilter === 'siaf' ? (logs.siaf_lines || []) : (logs.lines || [])).length === 0) && (
                                    <div className="text-slate-500 italic">No hay entradas de log{logsFilter === 'siaf' ? ' relacionadas con SIAF' : ''}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Guía Rápida */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                    <h2 className="text-lg font-semibold text-blue-900 mb-3">📖 Guía Rápida para Producción</h2>
                    <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
                        <li>Sube los archivos actualizados a cPanel (ZIP y extraer)</li>
                        <li>Abre esta página <code className="bg-blue-100 px-1 rounded">/admin/maintenance</code></li>
                        <li>Click en <strong>"Limpiar Todo y Recachear"</strong> — esto lee el <code>.env</code> fresco</li>
                        <li>Verifica que <strong>SIAF Proxy URL</strong> aparezca correctamente arriba</li>
                        <li>Click en <strong>"Probar Conexión SIAF"</strong> — Health y CAPTCHA deben ser OK</li>
                        <li>Si algo falla, click en <strong>"Ver Logs"</strong> → filtrar por <strong>"Solo SIAF"</strong></li>
                        <li>Ve a crear una deuda de entidad y verifica que el CAPTCHA real aparece</li>
                    </ol>
                </div>
            </div>
        </Layout>
    );
}
