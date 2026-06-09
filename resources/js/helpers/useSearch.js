import { router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for debounced search-as-you-type with Inertia.
 *
 * - `buscar` is local state, initialized from `filters.buscar` on mount.
 * - Fires `router.get` 300ms after the user stops typing.
 * - Preserves all other URL params (estado, tipo, etc.) when searching.
 * - Only fires when the value actually changes (prevents redundant requests).
 * - No sync from server props to avoid race conditions with out-of-order responses.
 *
 * @param {string} routeName - Inertia route (e.g. '/clientes')
 * @param {object} filters - filters prop from server (used for initial value)
 * @param {number} debounceMs
 * @returns {{ buscar, setBuscar }}
 */
export default function useSearch(routeName, filters = {}, debounceMs = 300) {
    const initial = filters?.buscar || '';
    const [buscar, setBuscar] = useState(initial);
    const debounceRef = useRef(null);
    const lastSubmittedRef = useRef(initial);

    useEffect(() => {
        // Skip if the value hasn't changed since last submission
        if (buscar === lastSubmittedRef.current) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            lastSubmittedRef.current = buscar;

            // Build params from current URL, preserving all filters
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
