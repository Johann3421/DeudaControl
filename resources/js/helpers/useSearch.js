import { router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for intelligent search-as-you-type with Inertia.
 *
 * Manages a debounced search state. Filter buttons can use the
 * current `buscar` value directly from state, ensuring they always
 * include the latest typed search term.
 *
 * @param {string} routeName - Inertia route (e.g. '/clientes')
 * @param {object} filters - filters prop from server
 * @param {number} debounceMs
 * @returns {{ buscar, setBuscar }}
 */
export default function useSearch(routeName, filters = {}, debounceMs = 300) {
    const [buscar, setBuscar] = useState(filters?.buscar || '');
    const debounceRef = useRef(null);
    const initialRender = useRef(true);

    // Sync from server props when they change (e.g. page reload, filter button click)
    useEffect(() => {
        if (filters?.buscar !== undefined) {
            setBuscar(filters.buscar || '');
        }
    }, [filters?.buscar]);

    // Debounced search triggered when `buscar` changes
    useEffect(() => {
        // Skip the initial render
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            const url = new URL(window.location.href);
            const params = {};
            url.searchParams.forEach((value, key) => {
                params[key] = value;
            });

            if (buscar) {
                params.buscar = buscar;
            } else {
                delete params.buscar;
            }

            router.get(routeName, params, {
                preserveState: true,
                preserveScroll: true,
            });
        }, debounceMs);

        return () => clearTimeout(debounceRef.current);
    }, [buscar]);

    return { buscar, setBuscar };
}
