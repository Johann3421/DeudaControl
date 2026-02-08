import { Head, Link } from '@inertiajs/react';
import Layout from '../../Components/Layout';

const DEBT_TYPES = [
    {
        key: 'particular',
        title: 'Particular',
        description: 'Deuda con cliente individual. Prestamos personales, compras, etc.',
        href: '/deudas/particular/create',
        accent: {
            bg: 'bg-amber-50',
            border: 'hover:border-amber-300',
            icon: 'text-amber-500',
            iconBg: 'bg-amber-50',
            iconBgHover: 'group-hover:bg-amber-500',
            badge: 'bg-amber-100 text-amber-700',
        },
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        ),
    },
    {
        key: 'entidad',
        title: 'Entidad',
        description: 'Deuda con entidad publica o privada. Ordenes de compra, servicios.',
        href: '/deudas/entidad/create',
        accent: {
            bg: 'bg-violet-50',
            border: 'hover:border-violet-300',
            icon: 'text-violet-500',
            iconBg: 'bg-violet-50',
            iconBgHover: 'group-hover:bg-violet-500',
            badge: 'bg-violet-100 text-violet-700',
        },
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M3 10h18" />
                <path d="M5 6l7-3 7 3" />
                <path d="M4 10v11" />
                <path d="M20 10v11" />
                <path d="M8 14v4" />
                <path d="M12 14v4" />
                <path d="M16 14v4" />
            </svg>
        ),
    },
    {
        key: 'alquiler',
        title: 'Alquiler',
        description: 'Deuda recurrente por alquiler de inmueble. Control por recibo.',
        href: '/deudas/alquiler/create',
        accent: {
            bg: 'bg-emerald-50',
            border: 'hover:border-emerald-300',
            icon: 'text-emerald-500',
            iconBg: 'bg-emerald-50',
            iconBgHover: 'group-hover:bg-emerald-500',
            badge: 'bg-emerald-100 text-emerald-700',
        },
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    },
];

export default function CreateSelector() {
    return (
        <Layout title="Nueva Deuda">
            <Head title="Nueva Deuda" />
            <div className="max-w-3xl">
                <div className="mb-6">
                    <Link href="/deudas" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                        Volver a deudas
                    </Link>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-slate-900">Nueva Deuda</h2>
                    <p className="text-sm text-slate-500 mt-1">Selecciona el tipo de deuda que deseas registrar</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {DEBT_TYPES.map((type) => (
                        <Link
                            key={type.key}
                            href={type.href}
                            className={`group flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200 ${type.accent.border} hover:shadow-md transition-all duration-200`}
                        >
                            <div className={`w-14 h-14 rounded-2xl ${type.accent.iconBg} flex items-center justify-center ${type.accent.iconBgHover} transition-colors mb-4`}>
                                <span className={`${type.accent.icon} group-hover:text-white transition-colors`}>
                                    {type.icon}
                                </span>
                            </div>

                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${type.accent.badge} mb-3`}>
                                {type.title}
                            </span>

                            <p className="text-sm text-slate-500 leading-relaxed">
                                {type.description}
                            </p>

                            <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#0EA5E9] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                                Crear
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
