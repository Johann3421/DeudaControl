import { useForm, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import Layout from '../../../Components/Layout';

const ROLES = [
    { value: 'usuario', label: 'Usuario' },
    { value: 'superadmin', label: 'Super Admin' },
];

export default function CreateUser() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        rol: 'usuario',
        activo: true,
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/users');
    };

    return (
        <Layout title="Crear Usuario">
            <Head title="Crear Usuario" />
            <div className="max-w-2xl mx-auto space-y-5">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/roles"
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Volver"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Crear nuevo usuario</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Asigna un rol y una contraseña temporal</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Nombre completo
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={`
                                w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 outline-none
                                bg-white text-slate-900 placeholder-slate-400
                                ${errors.name
                                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                    : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'
                                }
                            `}
                            placeholder="Juan Perez"
                            autoFocus
                        />
                        {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
                    </div>

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
                                w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 outline-none
                                bg-white text-slate-900 placeholder-slate-400
                                ${errors.email
                                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                    : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'
                                }
                            `}
                            placeholder="usuario@email.com"
                        />
                        {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className={`
                                    w-full px-4 py-2.5 pr-12 rounded-lg border text-sm transition-all duration-150 outline-none
                                    bg-white text-slate-900 placeholder-slate-400
                                    ${errors.password
                                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                        : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'
                                    }
                                `}
                                placeholder="Mínimo 8 caracteres, mayúsculas, minúsculas y números"
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
                            className="
                                w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 outline-none
                                bg-white text-slate-900 placeholder-slate-400
                                border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10
                            "
                            placeholder="Repite la contraseña"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="rol" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Rol
                            </label>
                            <select
                                id="rol"
                                value={data.rol}
                                onChange={(e) => setData('rol', e.target.value)}
                                className={`
                                    w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 outline-none
                                    bg-white text-slate-900
                                    ${errors.rol
                                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                        : 'border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10'
                                    }
                                `}
                            >
                                {ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            {errors.rol && <p className="mt-1.5 text-sm text-red-600">{errors.rol}</p>}
                        </div>

                        <div>
                            <label htmlFor="activo" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Estado
                            </label>
                            <select
                                id="activo"
                                value={data.activo ? '1' : '0'}
                                onChange={(e) => setData('activo', e.target.value === '1')}
                                className="
                                    w-full px-4 py-2.5 rounded-lg border text-sm transition-all duration-150 outline-none
                                    bg-white text-slate-900
                                    border-slate-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10
                                "
                            >
                                <option value="1">Activo</option>
                                <option value="0">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        <Link
                            href="/admin/roles"
                            className="px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="
                                px-5 py-2.5 rounded-lg text-sm font-semibold text-white
                                bg-[#0EA5E9] hover:bg-[#0284C7] active:bg-[#0369A1]
                                transition-all duration-150 shadow-lg shadow-[#0EA5E9]/25
                                disabled:opacity-50 disabled:cursor-not-allowed
                                focus:outline-none focus:ring-4 focus:ring-[#0EA5E9]/20
                            "
                        >
                            {processing ? 'Creando...' : 'Crear usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
