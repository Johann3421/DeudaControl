import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';

// Polyfill para la Performance API requerida por jsPDF/html2canvas
// en navegadores o entornos que no la implementan completamente
if (typeof performance !== 'undefined') {
    if (typeof performance.clearMarks !== 'function')   performance.clearMarks   = () => {};
    if (typeof performance.mark !== 'function')         performance.mark         = () => {};
    if (typeof performance.measure !== 'function')      performance.measure      = () => {};
    if (typeof performance.getEntriesByName !== 'function') performance.getEntriesByName = () => [];
    if (typeof performance.getEntriesByType !== 'function') performance.getEntriesByType = () => [];
}

createInertiaApp({
    title: (title) => title ? `${title} - Control de Deudas` : 'Control de Deudas',
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
