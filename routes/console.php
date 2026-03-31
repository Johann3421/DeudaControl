<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Notificar al grupo de WhatsApp sobre deudas y órdenes próximas a vencer
// Se ejecuta todos los días a las 8:00 AM
Schedule::command('notificaciones:vencimientos')->dailyAt('08:00');
