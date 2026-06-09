import { useState, useEffect, useRef } from 'react';

export default function SearchInput({
    value: controlledValue,
    onChange,
    placeholder = 'Buscar...',
    loading = false,
    className = '',
}) {
    const inputRef = useRef(null);
    const [internalValue, setInternalValue] = useState(controlledValue || '');
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    // Sync internal value when controlled value changes externally
    useEffect(() => {
        if (controlledValue !== undefined && controlledValue !== internalValue) {
            setInternalValue(controlledValue);
        }
    }, [controlledValue]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        if (onChange) {
            onChange(newValue);
        } else {
            setInternalValue(newValue);
        }
    };

    const handleClear = () => {
        if (onChange) {
            onChange('');
        } else {
            setInternalValue('');
        }
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && value) {
            handleClear();
        }
    };

    // Global keyboard shortcut: "/" to focus the search input
    useEffect(() => {
        const handleGlobalKey = (e) => {
            if (
                e.key === '/' &&
                document.activeElement?.tagName !== 'INPUT' &&
                document.activeElement?.tagName !== 'TEXTAREA' &&
                document.activeElement?.tagName !== 'SELECT' &&
                !document.activeElement?.isContentEditable
            ) {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        };
        window.addEventListener('keydown', handleGlobalKey);
        return () => window.removeEventListener('keydown', handleGlobalKey);
    }, []);

    return (
        <div className={`relative flex-1 ${className}`}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 outline-none transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                {loading ? (
                    <svg className="w-4 h-4 text-[#0EA5E9] animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                ) : value ? (
                    <button
                        onClick={handleClear}
                        className="p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Limpiar busqueda (Esc)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                ) : (
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200">
                        /
                    </kbd>
                )}
            </div>
        </div>
    );
}
