<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'whatsapp' => [
        'api_url' => env('WHATSAPP_API_URL', ''),
        'api_token' => env('WHATSAPP_API_TOKEN', ''),
        'group_id' => env('WHATSAPP_GROUP_ID', ''),
    ],

    'siaf' => [
        'proxy_url' => env('SIAF_PROXY_URL', ''),
        'proxy_secret' => env('SIAF_PROXY_SECRET', ''),
        'timeout' => env('SIAF_TIMEOUT', 40),
        'connect_timeout' => env('SIAF_CONNECT_TIMEOUT', 25),
    ],

    'alertas' => [
        // ponytail: default mantiene compatibilidad con integraciones existentes (n8n, Chatwoot).
        // Para producción, sobrescribe con ALERTAS_TOKEN en .env / Dokploy.
        'token' => env('ALERTAS_TOKEN', 'Rd2GcVzGM3Bh8j0V+2XCriMqsdWqSSWv8mmdPyL8eMY='),
    ],

    'maintenance' => [
        // ponytail: default para retrocompatibilidad. En producción usar MAINTENANCE_TOKEN en env.
        'token' => env('MAINTENANCE_TOKEN', 'cleanup_2026_02_16_securekey'),
    ],

];
