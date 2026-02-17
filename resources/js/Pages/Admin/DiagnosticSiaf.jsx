import { Head } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function DiagnosticSiaf({ diagnostics, logLines, timestamp }) {
    const getStatusBadge = (status) => {
        if (status === true) return <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">✓ OK</span>;
        if (status === false) return <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">✗ Error</span>;
        return <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">⚠ Revisar</span>;
    };

    const Section = ({ title, children }) => (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {children}
        </div>
    );

    const Item = ({ label, value, status }) => (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
            <span className="text-sm text-slate-600 font-medium">{label}</span>
            <div className="flex items-center gap-3">
                {value && <span className="text-sm text-slate-900">{value}</span>}
                {status !== undefined && getStatusBadge(status)}
            </div>
        </div>
    );

    return (
        <Layout title="Diagnóstico SIAF">
            <Head title="Diagnóstico SIAF" />
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Diagnóstico SIAF</h1>
                        <p className="text-sm text-slate-500 mt-1">Evaluación del sistema para integración SIAF</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-600">Última evaluación</p>
                        <p className="text-lg font-semibold text-slate-900">{timestamp}</p>
                    </div>
                </div>

                {/* DIRECTORIOS */}
                <Section title="📁 Verificación de Directorios">
                    <Item
                        label="storage/app"
                        status={diagnostics.directorios.storage_app.existe && diagnostics.directorios.storage_app.escribible}
                        value={diagnostics.directorios.storage_app.path}
                    />
                    <Item
                        label="Existe"
                        status={diagnostics.directorios.storage_app.existe}
                        value={diagnostics.directorios.storage_app.existe ? 'Sí' : 'No'}
                    />
                    <Item
                        label="Escribible"
                        status={diagnostics.directorios.storage_app.escribible}
                        value={diagnostics.directorios.storage_app.escribible ? 'Sí' : 'No'}
                    />

                    <div className="pt-4 mt-4 border-t-2 border-slate-200">
                        <h4 className="font-semibold text-slate-900 mb-3">storage/app/siaf</h4>
                        <Item
                            label="Existe"
                            status={diagnostics.directorios.siaf.existe}
                            value={diagnostics.directorios.siaf.existe ? 'Sí' : 'No (se creará automáticamente)'}
                        />
                        {diagnostics.directorios.siaf.existe && (
                            <Item
                                label="Escribible"
                                status={diagnostics.directorios.siaf.escribible}
                                value={diagnostics.directorios.siaf.escribible ? 'Sí' : 'No'}
                            />
                        )}
                        <Item
                            label="Path"
                            value={diagnostics.directorios.siaf.path}
                        />
                    </div>

                    <div className="pt-4 mt-4 border-t-2 border-slate-200">
                        <h4 className="font-semibold text-slate-900 mb-3">storage/logs</h4>
                        <Item
                            label="Existe"
                            status={diagnostics.directorios.logs.existe}
                            value={diagnostics.directorios.logs.existe ? 'Sí' : 'No'}
                        />
                        <Item
                            label="Escribible"
                            status={diagnostics.directorios.logs.escribible}
                            value={diagnostics.directorios.logs.escribible ? 'Sí' : 'No'}
                        />
                    </div>
                </Section>

                {/* EXTENSIONES PHP */}
                <Section title="🔧 Extensiones PHP Requeridas">
                    {Object.entries(diagnostics.extensiones_php).map(([ext, loaded]) => (
                        <Item
                            key={ext}
                            label={ext.charAt(0).toUpperCase() + ext.slice(1)}
                            status={loaded}
                            value={loaded ? 'Instalada' : 'No instalada'}
                        />
                    ))}
                </Section>

                {/* cURL INFO */}
                {diagnostics.curl_info && (
                    <Section title="📡 Información cURL">
                        <Item
                            label="Versión"
                            value={diagnostics.curl_info.version}
                        />
                        <Item
                            label="SSL Version"
                            value={diagnostics.curl_info.ssl_version}
                        />
                    </Section>
                )}

                {/* cURL HTTPS */}
                {diagnostics.curl_https && (
                    <Section title="🔒 Prueba de Conexión HTTPS">
                        <Item
                            label="Conectividad HTTPS"
                            status={diagnostics.curl_https.funcional}
                            value={diagnostics.curl_https.funcional ? 'Funcional' : 'Error'}
                        />
                        {diagnostics.curl_https.http_code > 0 && (
                            <Item
                                label="Código HTTP"
                                value={`${diagnostics.curl_https.http_code}`}
                            />
                        )}
                        {diagnostics.curl_https.error && diagnostics.curl_https.error !== 'N/A' && (
                            <Item
                                label="Error cURL"
                                value={diagnostics.curl_https.error}
                            />
                        )}
                    </Section>
                )}

                {/* CAPTCHA SIAF */}
                <Section title="🔐 Estado del CAPTCHA SIAF">
                    <Item
                        label="Status"
                        status={diagnostics.captcha_siaf.success}
                        value={diagnostics.captcha_siaf.success ? 'Exitoso' : 'Error'}
                    />
                    <Item
                        label="Mensaje"
                        value={diagnostics.captcha_siaf.message}
                    />
                    {diagnostics.captcha_siaf.imagen_size > 0 && (
                        <Item
                            label="Tamaño de Imagen"
                            value={`${(diagnostics.captcha_siaf.imagen_size / 1024).toFixed(2)} KB`}
                        />
                    )}

                    {diagnostics.captcha_siaf.cookie_file && (
                        <div className="pt-4 mt-4 border-t-2 border-slate-200">
                            <h4 className="font-semibold text-slate-900 mb-3">Archivo de Cookies</h4>
                            <Item
                                label="Path"
                                value={diagnostics.captcha_siaf.cookie_file.path}
                            />
                            <Item
                                label="Existe"
                                status={diagnostics.captcha_siaf.cookie_file.existe}
                                value={diagnostics.captcha_siaf.cookie_file.existe ? 'Sí' : 'No'}
                            />
                            {diagnostics.captcha_siaf.cookie_file.size > 0 && (
                                <Item
                                    label="Tamaño"
                                    value={`${diagnostics.captcha_siaf.cookie_file.size} bytes`}
                                />
                            )}
                        </div>
                    )}
                </Section>

                {/* SERVER INFO */}
                <Section title="🖥️ Información del Servidor">
                    <Item
                        label="PHP Version"
                        value={diagnostics.servidor.php_version}
                    />
                    <Item
                        label="Laravel Version"
                        value={diagnostics.servidor.laravel_version}
                    />
                    <Item
                        label="Sistema Operativo"
                        value={diagnostics.servidor.sistema_operativo}
                    />
                    <Item
                        label="Directorio Base"
                        value={diagnostics.servidor.directorio_base}
                    />
                </Section>

                {/* LOGS CONFIG */}
                <Section title="📝 Configuración de Logs">
                    <Item
                        label="Canal por Defecto"
                        value={diagnostics.logs.canal_por_defecto}
                    />
                    <Item
                        label="Nivel de Log"
                        value={diagnostics.logs.nivel}
                    />
                    <Item
                        label="Archivo Log Existe"
                        status={diagnostics.logs.log_existe}
                        value={diagnostics.logs.log_existe ? 'Sí' : 'No'}
                    />
                </Section>

                {/* ÚLTIMAS LÍNEAS DE LOG */}
                {logLines.length > 0 && (
                    <Section title="📋 Últimas Líneas del Log">
                        <div className="bg-slate-900 p-4 rounded font-mono text-xs text-slate-100 max-h-96 overflow-y-auto space-y-1">
                            {logLines.map((line, i) => (
                                <div key={i} className="text-slate-400 hover:text-slate-200 transition-colors">
                                    {line.trim()}
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* RESUMEN */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 Resumen</h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>✓ Todos los directorios necesarios están configurados correctamente</li>
                        <li>✓ Las extensiones PHP requeridas están instaladas</li>
                        <li>✓ La conexión HTTPS funciona correctamente</li>
                        {diagnostics.captcha_siaf.success && (
                            <>
                                <li>✓ El CAPTCHA de SIAF se obtiene exitosamente</li>
                                <li>✓ El sistema está <strong>LISTO para producción</strong></li>
                            </>
                        )}
                        {!diagnostics.captcha_siaf.success && (
                            <li className="text-red-700">✗ Hay problemas con la obtención del CAPTCHA - revisa los detalles arriba</li>
                        )}
                    </ul>
                </div>

                {/* RECOMENDACIONES */}
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
                    <h3 className="text-lg font-semibold text-yellow-900 mb-3">💡 Recomendaciones</h3>
                    <ul className="space-y-2 text-sm text-yellow-800">
                        <li>1. Verifica que todos los estados muestra "✓ OK" en verde</li>
                        <li>2. Si el CAPTCHA SIAF muestra error, revisa el archivo de log (abajo)</li>
                        <li>3. En producción, asegúrate que storage/app/siaf tiene permisos 755</li>
                        <li>4. Si cURL HTTPS no funciona, contacta a tu proveedor de hosting</li>
                        <li>5. Ejecuta este diagnóstico regularmente para detectar problemas temprano</li>
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
