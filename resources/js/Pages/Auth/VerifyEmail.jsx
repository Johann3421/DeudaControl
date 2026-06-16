import { Head, Link, router } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function VerifyEmail() {
    const handleResend = () => {
        router.post('/email/verification-notification');
    };

    return (
        <Layout title="Verifica tu correo">
            <Head title="Verifica tu correo" />
            <div className="max-w-md mx-auto text-center py-16">
                <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mt-6">Verifica tu correo</h1>
                <p className="text-sm text-slate-500 mt-3">
                    Antes de continuar, revisa tu correo y haz click en el enlace de verificación.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    Si no recibiste el correo, podemos enviarte otro.
                </p>
                <div className="mt-6 flex flex-col gap-3 items-center">
                    <button
                        onClick={handleResend}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors"
                    >
                        Reenviar correo de verificación
                    </button>
                    <Link
                        href="/dashboard"
                        className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Volver al inicio
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
