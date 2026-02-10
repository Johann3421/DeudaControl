<?php

if (!function_exists('formatMoney')) {
    /**
     * Formatea un número como moneda
     *
     * @param float $amount Monto a formatear
     * @param string|null $currency Código de moneda (PEN, USD, etc)
     * @return string Monto formateado
     */
    function formatMoney($amount, $currency = null)
    {
        $currency = $currency ?? config('currency.default', 'PEN');
        $currencySymbol = config("currency.available.{$currency}.symbol", '$');

        return $currencySymbol . ' ' . number_format($amount, 2, ',', '.');
    }
}

if (!function_exists('getCurrencySymbol')) {
    /**
     * Obtiene el símbolo de una moneda
     *
     * @param string|null $currency Código de moneda
     * @return string Símbolo de la moneda
     */
    function getCurrencySymbol($currency = null)
    {
        $currency = $currency ?? config('currency.default', 'PEN');
        return config("currency.available.{$currency}.symbol", '$');
    }
}

if (!function_exists('getCurrencyName')) {
    /**
     * Obtiene el nombre de una moneda
     *
     * @param string|null $currency Código de moneda
     * @return string Nombre de la moneda
     */
    function getCurrencyName($currency = null)
    {
        $currency = $currency ?? config('currency.default', 'PEN');
        return config("currency.available.{$currency}.name", 'Desconocida');
    }
}

if (!function_exists('convertCurrency')) {
    /**
     * Convierte un monto de una moneda a otra
     *
     * @param float $amount Monto a convertir
     * @param string $fromCurrency Moneda origen
     * @param string $toCurrency Moneda destino
     * @return float Monto convertido
     */
    function convertCurrency($amount, $fromCurrency = 'PEN', $toCurrency = 'PEN')
    {
        if ($fromCurrency === $toCurrency) {
            return $amount;
        }

        $rates = config('currency.exchange_rates', []);

        if (!isset($rates[$fromCurrency]) || !isset($rates[$toCurrency])) {
            return $amount; // Si no existe la tasa, devolver el monto sin convertir
        }

        // Convertir a PEN primero (moneda base)
        $inPEN = $amount / $rates[$fromCurrency];

        // Luego convertir de PEN a la moneda destino
        return $inPEN * $rates[$toCurrency];
    }
}
