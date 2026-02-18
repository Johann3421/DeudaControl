<?php

use App\Http\Controllers\Admin\MaintenancePanelController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\StatsController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeudaAlquilerController;
use App\Http\Controllers\DeudaController;
use App\Http\Controllers\DeudaEntidadController;
use App\Http\Controllers\DeudaParticularController;
use App\Http\Controllers\DiagnosticController;
use App\Http\Controllers\DiagnosticSiafController;
use App\Http\Controllers\EntidadController;
use App\Http\Controllers\InmuebleController;
use App\Http\Controllers\MaintenanceController;
use App\Http\Controllers\MovimientoController;
use App\Http\Controllers\PagoController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SiafController;
use App\Http\Controllers\SiafIntegrationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect('/dashboard')
        : redirect('/login');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);
});

// Health check endpoint (sin autenticación, para diagnosticar)
Route::get('/api/health', function () {
    return response()->json(['status' => 'ok', 'message' => 'API is working']);
});

// Maintenance endpoints (protegidos por token, sin autenticación)
Route::prefix('maintenance')->group(function () {
    Route::get('/cleanup', [MaintenanceController::class, 'cleanup'])->name('maintenance.cleanup');
    Route::get('/status', [MaintenanceController::class, 'status'])->name('maintenance.status');
    Route::get('/test-siaf', [MaintenanceController::class, 'testSiafProxy'])->name('maintenance.test-siaf');
});

// SIAF API Routes - Test endpoint (para debugging)
Route::prefix('api')->group(function () {
    Route::post('/siaf/test', function () {
        return response()->json(['status' => 'ok', 'message' => 'SIAF test endpoint working']);
    });

    // Diagnóstico SIAF (sin autenticación por si hay problemas de sesión)
    Route::get('/diagnostic/siaf/status', [DiagnosticSiafController::class, 'status'])->name('api.diagnostic.siaf');
    Route::get('/diagnostic/siaf/config', [DiagnosticController::class, 'siafConfig'])->name('api.diagnostic.siaf.config');
});

// SIAF API Routes (requieren autenticación)
Route::prefix('api')->middleware('auth')->group(function () {
    Route::get('/captcha', [SiafController::class, 'generarCaptcha']);
    Route::post('/siaf/consultar', [SiafController::class, 'consultar']);
    
    // Nuevas rutas para integración directa de SIAF (ventana modal)
    Route::get('/siaf/embedded-form', [SiafIntegrationController::class, 'embeddedForm']);
    Route::post('/siaf/execute-query', [SiafIntegrationController::class, 'executeQuery']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('clientes', ClienteController::class);
    Route::resource('deudas', DeudaController::class);

    // Type-specific debt routes
    Route::prefix('deudas')->name('deudas.')->group(function () {
        // Particular
        Route::get('particular/create', [DeudaParticularController::class, 'create'])->name('particular.create');
        Route::post('particular', [DeudaParticularController::class, 'store'])->name('particular.store');
        Route::get('{deuda}/particular/edit', [DeudaParticularController::class, 'edit'])->name('particular.edit');
        Route::put('{deuda}/particular', [DeudaParticularController::class, 'update'])->name('particular.update');

        // Entidad
        Route::get('entidad/create', [DeudaEntidadController::class, 'create'])->name('entidad.create');
        Route::post('entidad', [DeudaEntidadController::class, 'store'])->name('entidad.store');
        Route::get('{deuda}/entidad/show', [DeudaEntidadController::class, 'show'])->name('entidad.show');
        Route::get('{deuda}/entidad/edit', [DeudaEntidadController::class, 'edit'])->name('entidad.edit');
        Route::put('{deuda}/entidad', [DeudaEntidadController::class, 'update'])->name('entidad.update');
        Route::patch('entidad/{deudaEntidad}/seguimiento', [DeudaEntidadController::class, 'cambiarSeguimiento'])->name('entidad.seguimiento');

        // Alquiler
        Route::get('alquiler/create', [DeudaAlquilerController::class, 'create'])->name('alquiler.create');
        Route::post('alquiler', [DeudaAlquilerController::class, 'store'])->name('alquiler.store');
        Route::get('{deuda}/alquiler/show', [DeudaAlquilerController::class, 'show'])->name('alquiler.show');
        Route::get('{deuda}/alquiler/edit', [DeudaAlquilerController::class, 'edit'])->name('alquiler.edit');
        Route::put('{deuda}/alquiler', [DeudaAlquilerController::class, 'update'])->name('alquiler.update');
        Route::post('{deuda}/alquiler/recibo', [DeudaAlquilerController::class, 'generarRecibo'])->name('alquiler.generar-recibo');
        Route::patch('alquiler/recibo/{recibo}/pagar', [DeudaAlquilerController::class, 'pagarRecibo'])->name('alquiler.pagar-recibo');
    });

    // Entidades (institutional)
    Route::resource('entidades', EntidadController::class);

    // Inmuebles (properties)
    Route::resource('inmuebles', InmuebleController::class)->except(['show']);

    Route::get('/pagos', [PagoController::class, 'index'])->name('pagos.index');
    Route::get('/pagos/create', [PagoController::class, 'create'])->name('pagos.create');
    Route::post('/pagos', [PagoController::class, 'store'])->name('pagos.store');
    Route::delete('/pagos/{pago}', [PagoController::class, 'destroy'])->name('pagos.destroy');

    Route::get('/movimientos', [MovimientoController::class, 'index'])->name('movimientos.index');

    // Admin routes
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/roles', [RoleController::class, 'index'])->name('roles.index');
        Route::patch('/roles/{user}', [RoleController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{user}', [RoleController::class, 'destroy'])->name('roles.destroy');

        Route::get('/stats', [StatsController::class, 'index'])->name('stats.index');

        Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');

        Route::get('/diagnostic/siaf', [DiagnosticController::class, 'siaf'])->name('diagnostic.siaf');

        // Maintenance Panel (visual, no SSH needed)
        Route::get('/maintenance', [MaintenancePanelController::class, 'index'])->name('maintenance.index');
        Route::post('/maintenance/clear-all', [MaintenancePanelController::class, 'clearAll'])->name('maintenance.clearAll');
        Route::post('/maintenance/clear-cache', [MaintenancePanelController::class, 'clearCache'])->name('maintenance.clearCache');
        Route::post('/maintenance/clear-config', [MaintenancePanelController::class, 'clearConfig'])->name('maintenance.clearConfig');
        Route::post('/maintenance/clear-views', [MaintenancePanelController::class, 'clearViews'])->name('maintenance.clearViews');
        Route::post('/maintenance/test-siaf', [MaintenancePanelController::class, 'testSiafProxy'])->name('maintenance.testSiaf');
        Route::get('/maintenance/logs', [MaintenancePanelController::class, 'viewLogs'])->name('maintenance.logs');
        Route::post('/maintenance/clear-logs', [MaintenancePanelController::class, 'clearLogs'])->name('maintenance.clearLogs');
    });
});
