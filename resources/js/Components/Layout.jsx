import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';

const NAVIGATION_GROUPS = [
    {
        title: 'Principal',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
            { name: 'Clientes', href: '/clientes', icon: 'clients' },
            { name: 'Ordenes', href: '/ordenes', icon: 'ordenes' },
        ]
    },
    {
        title: 'Finanzas',
        items: [
            { name: 'Deudas', href: '/deudas', icon: 'debts' },
            { name: 'Pagos', href: '/pagos', icon: 'payments' },
            { name: 'Movimientos', href: '/movimientos', icon: 'history' },
            { name: 'Entidades', href: '/entidades', icon: 'entities' },
        ]
    },
    {
        title: 'Servicios',
        items: [
            { name: 'Inmuebles', href: '/inmuebles', icon: 'properties' },
            { name: 'Luz y Agua', href: '/luz-agua', icon: 'luz_agua' },
            { name: 'Servicios Web', href: '/servicios-web', icon: 'servicios_web' },
        ]
    },
    {
        title: 'Sistema',
        items: [
            { name: 'Utilidades', href: '/utilidades', icon: 'utilidades' },
            { name: 'Historial', href: '/historial', icon: 'historial' },
        ]
    }
];

const ADMIN_NAVIGATION = [
    { name: 'Gestionar Roles', href: '/admin/roles', icon: 'admin' },
    { name: 'Estadísticas', href: '/admin/stats', icon: 'stats' },
    { name: 'Configuración', href: '/admin/settings', icon: 'settings' },
    { name: 'Mantenimiento', href: '/admin/maintenance', icon: 'maintenance' },
    { name: 'Crear Usuario', href: '/admin/users/create', icon: 'userCreate' },
];

function DashboardIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    );
}

function ClientsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function DebtsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}

function PaymentsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
    );
}

function EntitiesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    );
}

function PropertiesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );
}

function HistoryIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function UtilidadesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    );
}

function OrdenesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

function AdminIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <path d="M12 1v6" />
            <path d="M12 17v6" />
            <path d="M4.22 4.22l4.24 4.24" />
            <path d="M15.54 15.54l4.24 4.24" />
            <path d="M1 12h6" />
            <path d="M17 12h6" />
            <path d="M4.22 19.78l4.24-4.24" />
            <path d="M15.54 8.46l4.24-4.24" />
        </svg>
    );
}

function StatsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}

function SettingsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24" />
        </svg>
    );
}

function MaintenanceIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
    );
}

function HistorialIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
    );
}

function UserCreateIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
    );
}

function LuzAguaIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            <path d="M12 2v0a8 8 0 0 0-8 8c0 4.4 3.6 8 8 8s8-3.6 8-8a8 8 0 0 0-8-8z" className="opacity-40" />
        </svg>
    );
}

function ServiciosWebIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}

function ChevronLeftIcon({ className = "w-4 h-4" }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
        </svg>
    );
}

const ICONS = {
    dashboard: DashboardIcon,
    clients: ClientsIcon,
    debts: DebtsIcon,
    payments: PaymentsIcon,
    entities: EntitiesIcon,
    properties: PropertiesIcon,
    history: HistoryIcon,
    utilidades: UtilidadesIcon,
    ordenes: OrdenesIcon,
    admin: AdminIcon,
    stats: StatsIcon,
    settings: SettingsIcon,
    maintenance: MaintenanceIcon,
    historial: HistorialIcon,
    userCreate: UserCreateIcon,
    luz_agua: LuzAguaIcon,
    servicios_web: ServiciosWebIcon,
};

export default function Layout({ children, title }) {
    const { auth, flash, notificaciones = [] } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const currentPath = usePage().url;

    const toggleCollapse = () => {
        setSidebarCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
    };

    const refreshCsrf = () => router.reload({ only: [] });

    useEffect(() => {
        const onFocus = () => refreshCsrf();
        window.addEventListener('focus', onFocus);
        const keepAlive = setInterval(refreshCsrf, 90 * 60 * 1000);
        return () => {
            window.removeEventListener('focus', onFocus);
            clearInterval(keepAlive);
        };
    }, []);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden antialiased">
            {/* Mobile backdrop overlay with smooth fade */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 bg-[#0F172A] transform transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
                lg:translate-x-0 lg:static lg:inset-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
                w-64
            `}>
                <div className="flex flex-col h-full relative">
                    {/* Desktop Collapse Toggle Button */}
                    <button
                        onClick={toggleCollapse}
                        className="hidden lg:flex absolute -right-3.5 top-5 z-50 w-7 h-7 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-full items-center justify-center shadow-lg transition-transform duration-200"
                        title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
                    >
                        <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Header / Brand */}
                    <div className={`flex items-center h-16 border-b border-slate-800/80 ${sidebarCollapsed ? 'lg:justify-center lg:px-0 px-5' : 'px-5'} justify-between`}>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] flex items-center justify-center shadow-lg shadow-[#0EA5E9]/30 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="1" x2="12" y2="23" />
                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            {(!sidebarCollapsed || sidebarOpen) && (
                                <span className="text-white font-bold text-lg tracking-tight truncate animate-fade-in">
                                    DeudaControl
                                </span>
                            )}
                        </div>

                        {/* Mobile close button */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>

                    {/* Navigation list */}
                    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
                        {NAVIGATION_GROUPS.map((group) => (
                            <div key={group.title} className="space-y-1">
                                {(!sidebarCollapsed || sidebarOpen) ? (
                                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/90 mb-1.5 truncate">
                                        {group.title}
                                    </p>
                                ) : (
                                    <div className="h-2" />
                                )}

                                {group.items.map((item) => {
                                    const isActive = currentPath.startsWith(item.href);
                                    const Icon = ICONS[item.icon];
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            title={sidebarCollapsed ? item.name : undefined}
                                            className={`
                                                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                                ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}
                                                ${isActive
                                                    ? 'bg-[#0EA5E9] text-white shadow-lg shadow-[#0EA5E9]/25 font-semibold'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                                }
                                            `}
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <Icon />
                                            {(!sidebarCollapsed || sidebarOpen) && (
                                                <span className="truncate">{item.name}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}

                        {/* Admin section */}
                        {(auth.user.rol === 'superadmin' || auth.user.rol === 'jefe') && (
                            <div className="space-y-1 pt-3 border-t border-slate-800/80">
                                {(!sidebarCollapsed || sidebarOpen) ? (
                                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-amber-500/90 mb-1.5 truncate">
                                        Administración
                                    </p>
                                ) : (
                                    <div className="h-2" />
                                )}

                                {ADMIN_NAVIGATION.map((item) => {
                                    const isActive = currentPath.startsWith(item.href);
                                    const Icon = ICONS[item.icon];
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            title={sidebarCollapsed ? item.name : undefined}
                                            className={`
                                                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                                ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}
                                                ${isActive
                                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25 font-semibold'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                                }
                                            `}
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <Icon />
                                            {(!sidebarCollapsed || sidebarOpen) && (
                                                <span className="truncate">{item.name}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </nav>

                    {/* Footer User Info */}
                    <div className={`p-3 border-t border-slate-800/80 ${sidebarCollapsed ? 'lg:p-2' : ''}`}>
                        <div className={`flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 border border-slate-800/60 ${sidebarCollapsed ? 'lg:justify-center lg:p-2' : ''}`}>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0EA5E9]/30 to-[#0EA5E9]/10 border border-[#0EA5E9]/30 flex items-center justify-center text-[#0EA5E9] font-bold text-sm shrink-0">
                                {auth.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            {(!sidebarCollapsed || sidebarOpen) && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{auth.user?.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate capitalize">{auth.user?.rol || 'Usuario'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content wrapper */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 px-4 sm:px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Mobile trigger */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100/80 lg:hidden transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        </button>

                        {title && (
                            <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate">
                                {title}
                            </h1>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Notifications Menu */}
                        {(auth.user?.rol === 'superadmin' || auth.user?.rol === 'jefe') && (
                            <div className="relative">
                                <button
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors relative"
                                    title="Notificaciones"
                                >
                                    <BellIcon />
                                    {notificaciones.length > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                                    )}
                                </button>

                                {notificationsOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Deudas por Vencer</h3>
                                                <span className="text-xs text-[#0EA5E9] font-bold bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">{notificaciones.length}</span>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                                                {notificaciones.length === 0 ? (
                                                    <div className="px-4 py-6 text-center text-xs text-slate-400">
                                                        No hay notificaciones pendientes.
                                                    </div>
                                                ) : (
                                                    notificaciones.map((notif) => (
                                                        <Link key={notif.id} href={`/deudas/${notif.id}`} className="block px-4 py-3 hover:bg-slate-50/80 transition-colors">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-xs font-semibold text-slate-800 truncate" title={notif.descripcion}>
                                                                        {notif.descripcion}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-xs font-bold text-slate-900">
                                                                            S/ {parseFloat(notif.monto_pendiente).toFixed(2)}
                                                                        </span>
                                                                        <span className="text-slate-300">•</span>
                                                                        <span className="text-[10px] text-slate-400 capitalize">{notif.tipo_deuda}</span>
                                                                    </div>
                                                                </div>
                                                                <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                                                                    {notif.fecha_vencimiento}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* User Menu Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100/80 transition-colors text-slate-700"
                            >
                                <div className="w-8 h-8 rounded-lg bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 flex items-center justify-center text-[#0EA5E9] font-bold text-sm">
                                    {auth.user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden sm:inline text-xs font-semibold text-slate-700 truncate max-w-28">
                                    {auth.user?.name}
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400 hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                            </button>

                            {userMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <p className="text-xs font-bold text-slate-800 truncate">{auth.user?.name}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{auth.user?.email}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content View */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {/* Flash Toast alerts */}
                    {flash?.success && (
                        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                <span>{flash.success}</span>
                            </div>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                <span>{flash.error}</span>
                            </div>
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}
