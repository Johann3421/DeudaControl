import { Head, Link } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function Forbidden() {
    return (
        <Layout title="Acceso denegado">
            <Head title="403 - Acceso denegado" />
            <div className="max-w-md mx-auto text-center py-16">
                <div className="text-8xl font-bold text-slate-200">403</div>
                <h1 className="text-2xl font-bold text-slate-900 mt-4">Acceso denegado</h1>
                <p className="text-sm text-slate-500 mt-2">
                    No tienes permisos para acceder a esta página.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block mt-6 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] transition-colors"
                >
                    Volver al inicio
                </Link>
            </div>
        </Layout>
    );
}
