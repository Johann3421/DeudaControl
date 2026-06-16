import { Head, Link } from '@inertiajs/react';
import Layout from '../../Components/Layout';

export default function NotFound() {
    return (
        <Layout title="Página no encontrada">
            <Head title="404 - Página no encontrada" />
            <div className="max-w-md mx-auto text-center py-16">
                <div className="text-8xl font-bold text-slate-200">404</div>
                <h1 className="text-2xl font-bold text-slate-900 mt-4">Página no encontrada</h1>
                <p className="text-sm text-slate-500 mt-2">
                    La página que buscas no existe o fue movida.
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
