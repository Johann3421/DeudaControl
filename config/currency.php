<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Configuración de Monedas
    |--------------------------------------------------------------------------
    |
    | Aquí puedes configurar la moneda por defecto y sus símbolos
    |
    */

    'default' => env('APP_CURRENCY', 'PEN'),

    'symbol' => env('APP_CURRENCY_SYMBOL', 'S/'),

    'name' => env('APP_CURRENCY_NAME', 'Soles Peruanos'),

    /*
    |--------------------------------------------------------------------------
    | Monedas Disponibles
    |--------------------------------------------------------------------------
    |
    | Aquí puedes agregar más monedas disponibles en tu aplicación
    |
    */

    'available' => [
        'PEN' => [
            'name' => 'Soles Peruanos',
            'symbol' => 'S/',
        ],
        'USD' => [
            'name' => 'Dólares Estadounidenses',
            'symbol' => '$',
        ],
        'EUR' => [
            'name' => 'Euros',
            'symbol' => '€',
        ],
        'BRL' => [
            'name' => 'Reales Brasileños',
            'symbol' => 'R$',
        ],
        'COP' => [
            'name' => 'Pesos Colombianos',
            'symbol' => '$',
        ],
        'CLP' => [
            'name' => 'Pesos Chilenos',
            'symbol' => '$',
        ],
        'ARS' => [
            'name' => 'Pesos Argentinos',
            'symbol' => '$',
        ],
        'MXN' => [
            'name' => 'Pesos Mexicanos',
            'symbol' => '$',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Tasas de Cambio
    |--------------------------------------------------------------------------
    |
    | Tasas de cambio respecto a PEN (Soles Peruanos)
    | Estas son tasas aproximadas y deberían actualizar las desde una API
    |
    */

    'exchange_rates' => [
        'PEN' => 1.0,
        'USD' => 0.27,
        'EUR' => 0.29,
        'BRL' => 1.35,
        'COP' => 1.08,
        'CLP' => 2.25,
        'ARS' => 4.62,
        'MXN' => 4.68,
    ],
];
