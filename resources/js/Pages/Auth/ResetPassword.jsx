import { useForm, Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/reset-password');
    };

    return (
        <>
            <Head title="Restablecer contraseña" />
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-900">Restablecer contraseña</h1>
                            <p className="text-sm text-slate-500 mt-2">
                                Ingresa tu nueva contraseña.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Correo electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Nueva contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className={`
                                            w-full px-4 py-3 pr-12 rounded-xl border text-sm transition-all duration-150 outline-none
                                            bg-white text-slate-900 placeholder-slate-400
                                            ${errors.password
                                                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                                : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'
                                            }
                                        `}
                                        placeholder="Mínimo 8 caracteres"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <div>
                                <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Confirmar contraseña
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white text-slate-900 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="
                                    w-full py-3 px-4 rounded-xl text-sm font-semibold text-white
                                    bg-[#0EA5E9] hover:bg-[#0284C7] active:bg-[#0369A1]
                                    transition-all duration-150 shadow-lg shadow-[#0EA5E9]/25
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                "
                            >
                                {processing ? 'Guardando...' : 'Restablecer contraseña'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
