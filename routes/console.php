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

// Comando manual para sincronizar y agregar todos los vendedores al grupo de WhatsApp
Artisan::command('whatsapp:sync-participants', function () {
    $adminInstance = 'sekaitech';
    $groupId = config('services.whatsapp.group_id') ?: env('WHATSAPP_GROUP_ID');
    $apiUrl = rtrim(config('services.evolution.url'), '/');
    $apiKey = config('services.evolution.apikey');

    if (!$groupId) {
        $this->error("El ID del grupo de WhatsApp no está configurado.");
        return;
    }

    $instances = \App\Models\WhatsappInstance::all();
    if ($instances->isEmpty()) {
        $this->info("No hay instancias registradas en la base de datos.");
        return;
    }

    $this->info("Iniciando sincronización de " . $instances->count() . " participantes...");

    foreach ($instances as $instance) {
        if (!$instance->phone) {
            continue;
        }

        $participantJid = $instance->phone . '@s.whatsapp.net';
        $this->info("Intentando agregar a {$instance->name} ({$participantJid})...");

        try {
            $addResponse = Http::withHeaders([
                'apikey' => $apiKey,
                'Content-Type' => 'application/json'
            ])->post("{$apiUrl}/group/updateParticipant/{$adminInstance}?groupJid={$groupId}", [
                'action' => 'add',
                'participants' => [$participantJid]
            ]);

            $this->line("Respuesta: " . $addResponse->body());
        } catch (\Exception $e) {
            $this->error("Error al intentar agregar: " . $e->getMessage());
        }
    }

    $this->info("Sincronización finalizada.");
})->purpose('Agrega a todos los vendedores registrados al grupo de WhatsApp');

