import { useForm, Head, Link } from '@inertiajs/react';
import { useState } from 'react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Iniciar Sesion" />
            <div className="flex min-h-screen">
                {/* Left panel - Brand */}
                <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] bg-[#0F172A] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0EA5E9]/20 via-transparent to-[#8B5CF6]/10" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-[#0EA5E9]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8B5CF6]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative flex flex-col justify-between w-full p-10">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0EA5E9] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/25">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">DeudaControl</span>
                        </div>

                        {/* Center content */}
                        <div className="space-y-6">
                            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
                                Gestiona tus finanzas<br />
                                <span className="text-[#0EA5E9]">con precision</span>
                            </h2>
                            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
                                Controla deudas, registra pagos y mantiene un historial financiero claro y organizado.
                            </p>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                    <div className="text-2xl font-bold text-white">100%</div>
                                    <div className="text-xs text-slate-400 mt-1">Control total</div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                    <div className="text-2xl font-bold text-[#0EA5E9]">24/7</div>
                                    <div className="text-xs text-slate-400 mt-1">Acceso en linea</div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom */}
                        <p className="text-xs text-slate-600">Sistema de Control de Deudas v1.0</p>
                    </div>
                </div>

                {/* Right panel - Form */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-[#F8FAFC]">
                    <div className="w-full max-w-md">
                        {/* Mobile logo */}
                        <div className="lg:hidden flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-xl bg-[#0EA5E9] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <span className="text-slate-900 font-bold text-xl">DeudaControl</span>
                        </div>

                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-slate-900">Bienvenido de vuelta</h1>
                            <p className="text-slate-500 mt-2">Ingresa tus credenciales para continuar</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Correo electronico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className={`
                                        w-full px-4 py-3 rounded-xl border text-sm transition-all duration-150 outline-none
                                        bg-white text-slate-900 placeholder-slate-400
                                        ${errors.email
                                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                            : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'
                                        }
                                    `}
                                    placeholder="tu@email.com"
                                    autoComplete="email"
                                    autoFocus
                                />
                                {errors.email && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Contrasena
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
                                        placeholder="Tu contrasena"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Remember */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-[#0EA5E9] focus:ring-[#0EA5E9]/20"
                                    />
                                    <span className="text-sm text-slate-600">Recordarme</span>
                                </label>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="
                                    w-full py-3 px-4 rounded-xl text-sm font-semibold text-white
                                    bg-[#0EA5E9] hover:bg-[#0284C7] active:bg-[#0369A1]
                                    transition-all duration-150 shadow-lg shadow-[#0EA5E9]/25
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    focus:outline-none focus:ring-4 focus:ring-[#0EA5E9]/20
                                "
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Ingresando...
                                    </span>
                                ) : (
                                    'Iniciar sesion'
                                )}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-sm text-slate-500">
                            No tienes una cuenta?{' '}
                            <Link href="/register" className="font-medium text-[#0EA5E9] hover:text-[#0284C7] transition-colors">
                                Registrate aqui
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
