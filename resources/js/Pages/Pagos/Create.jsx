import { Head, Link, useForm } from '@inertiajs/react';
import Layout from '../../Components/Layout';
import { formatMoney, getAvailableCurrencies, getCurrencySymbol } from '../../helpers/currencyHelper';

export default function PagosCreate({ deudas, deuda_id }) {
    const currencies = getAvailableCurrencies();
    const { data, setData, post, processing, errors } = useForm({
        deuda_id: deuda_id || '',
        monto: '',
        currency_code: 'PEN',
        fecha_pago: new Date().toISOString().split('T')[0],
        metodo_pago: 'efectivo',
        referencia: '',
        notas: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/pagos');
    };

    const selectedDeuda = deudas.find(d => String(d.id) === String(data.deuda_id));

    return (
        <Layout title="Nuevo Pago">
            <Head title="Nuevo Pago" />
            <div className="max-w-2xl">
                <div className="mb-6">
                    <Link href="/pagos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a pagos
                    </Link>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Registrar Nuevo Pago</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Deuda *</label>
                            <select value={data.deuda_id} onChange={(e) => setData('deuda_id', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white ${errors.deuda_id ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}>
                                <option value="">Selecciona una deuda</option>
                                {deudas.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.cliente?.nombre} {d.cliente?.apellido} - {d.descripcion} (Pendiente: {formatMoney(d.monto_pendiente)})
                                    </option>
                                ))}
                            </select>
                            {errors.deuda_id && <p className="mt-1 text-sm text-red-600">{errors.deuda_id}</p>}
                        </div>

                        {selectedDeuda && (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-sky-50 border border-sky-100">
                                <div className="flex-1">
                                    <p className="text-xs text-sky-600">Saldo pendiente de esta deuda</p>
                                    <p className="text-lg font-bold text-sky-800">{formatMoney(selectedDeuda.monto_pendiente)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-sky-600">Monto total</p>
                                    <p className="text-sm font-medium text-sky-700">{formatMoney(selectedDeuda.monto_total)}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto del Pago *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">{getCurrencySymbol(data.currency_code)}</span>
                                    <input type="number" step="0.01" min="0.01" value={data.monto} onChange={(e) => setData('monto', e.target.value)}
                                        className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.monto ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`}
                                        placeholder="0.00" />
                                </div>
                                {errors.monto && <p className="mt-1 text-sm text-red-600">{errors.monto}</p>}
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
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Pago *</label>
                                <input type="date" value={data.fecha_pago} onChange={(e) => setData('fecha_pago', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${errors.fecha_pago ? 'border-red-300' : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'}`} />
                                {errors.fecha_pago && <p className="mt-1 text-sm text-red-600">{errors.fecha_pago}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Metodo de Pago</label>
                                <select value={data.metodo_pago} onChange={(e) => setData('metodo_pago', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 bg-white">
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Referencia</label>
                                <input type="text" value={data.referencia} onChange={(e) => setData('referencia', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                                    placeholder="Numero de recibo o referencia" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
                            <textarea value={data.notas} onChange={(e) => setData('notas', e.target.value)} rows={3}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 resize-none"
                                placeholder="Notas adicionales..." />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={processing}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors shadow-lg shadow-[#0EA5E9]/25 disabled:opacity-50">
                                {processing ? 'Guardando...' : 'Registrar Pago'}
                            </button>
                            <Link href="/pagos" className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
