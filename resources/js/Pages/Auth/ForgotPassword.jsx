import { useForm, Head, Link } from '@inertiajs/react';

export default function ForgotPassword() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <>
            <Head title="Recuperar contraseña" />
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
                            <p className="text-sm text-slate-500 mt-2">
                                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
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
                                    className={`
                                        w-full px-4 py-3 rounded-xl border text-sm transition-all duration-150 outline-none
                                        bg-white text-slate-900 placeholder-slate-400
                                        ${errors.email
                                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                            : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'
                                        }
                                    `}
                                    placeholder="tu@email.com"
                                    autoFocus
                                />
                                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
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
                                {processing ? 'Enviando...' : 'Enviar enlace de recuperación'}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-500">
                            <Link href="/login" className="font-medium text-[#0EA5E9] hover:text-[#0284C7] transition-colors">
                                Volver a iniciar sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
