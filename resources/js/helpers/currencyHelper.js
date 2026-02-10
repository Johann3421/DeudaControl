/**
 * Formatea un número como moneda
 * @param {number} amount - Monto a formatear
 * @param {string} currency - Código de moneda (PEN, USD, etc)
 * @returns {string} Monto formateado
 */
export const formatMoney = (amount, currency = 'PEN') => {
    const currencies = {
        PEN: { symbol: 'S/', name: 'Soles Peruanos' },
        USD: { symbol: '$', name: 'Dólares Estadounidenses' },
        EUR: { symbol: '€', name: 'Euros' },
        BRL: { symbol: 'R$', name: 'Reales Brasileños' },
        COP: { symbol: '$', name: 'Pesos Colombianos' },
        CLP: { symbol: '$', name: 'Pesos Chilenos' },
        ARS: { symbol: '$', name: 'Pesos Argentinos' },
        MXN: { symbol: '$', name: 'Pesos Mexicanos' },
    };

    const currencyData = currencies[currency] || currencies['PEN'];
    const formatted = Number(amount).toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return `${currencyData.symbol} ${formatted}`;
};

/**
 * Obtiene el símbolo de una moneda
 * @param {string} currency - Código de moneda
 * @returns {string} Símbolo de la moneda
 */
export const getCurrencySymbol = (currency = 'PEN') => {
    const symbols = {
        PEN: 'S/',
        USD: '$',
        EUR: '€',
        BRL: 'R$',
        COP: '$',
        CLP: '$',
        ARS: '$',
        MXN: '$',
    };

    return symbols[currency] || 'S/';
};

/**
 * Obtiene el nombre de una moneda
 * @param {string} currency - Código de moneda
 * @returns {string} Nombre de la moneda
 */
export const getCurrencyName = (currency = 'PEN') => {
    const names = {
        PEN: 'Soles Peruanos',
        USD: 'Dólares Estadounidenses',
        EUR: 'Euros',
        BRL: 'Reales Brasileños',
        COP: 'Pesos Colombianos',
        CLP: 'Pesos Chilenos',
        ARS: 'Pesos Argentinos',
        MXN: 'Pesos Mexicanos',
    };

    return names[currency] || 'Desconocida';
};

/**
 * Convierte un monto de una moneda a otra
 * @param {number} amount - Monto a convertir
 * @param {string} fromCurrency - Moneda origen
 * @param {string} toCurrency - Moneda destino
 * @returns {number} Monto convertido
 */
export const convertCurrency = (amount, fromCurrency = 'PEN', toCurrency = 'PEN') => {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    const rates = {
        PEN: 1.0,
        USD: 0.27,
        EUR: 0.29,
        BRL: 1.35,
        COP: 1.08,
        CLP: 2.25,
        ARS: 4.62,
        MXN: 4.68,
    };

    if (!rates[fromCurrency] || !rates[toCurrency]) {
        return amount;
    }

    // Convertir a PEN primero (moneda base)
    const inPEN = amount / rates[fromCurrency];

    // Luego convertir de PEN a la moneda destino
    return inPEN * rates[toCurrency];
};

/**
 * Obtiene la lista de monedas disponibles
 * @returns {Array} Lista de objeto con code y name
 */
export const getAvailableCurrencies = () => {
    return [
        { code: 'PEN', name: 'Soles Peruanos' },
        { code: 'USD', name: 'Dólares Estadounidenses' },
        { code: 'EUR', name: 'Euros' },
        { code: 'BRL', name: 'Reales Brasileños' },
        { code: 'COP', name: 'Pesos Colombianos' },
        { code: 'CLP', name: 'Pesos Chilenos' },
        { code: 'ARS', name: 'Pesos Argentinos' },
        { code: 'MXN', name: 'Pesos Mexicanos' },
    ];
};
