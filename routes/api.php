<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WhatsappConnectionController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Webhook y endpoints públicos para Evolution API y n8n (bypassean CSRF)
Route::post('/webhooks/whatsapp-connection', [WhatsappConnectionController::class, 'webhook']);
Route::get('/whatsapp/active-instances', [WhatsappConnectionController::class, 'getActiveInstances']);
