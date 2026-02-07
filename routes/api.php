<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\CommunicationController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LoanController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentScheduleController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Authentication routes (public)
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:api')->group(function () {
        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/profile', [AuthController::class, 'profile']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);

        // Companies
        Route::apiResource('companies', CompanyController::class);

        // Clients
        Route::get('/companies/{company}/clients', [ClientController::class, 'indexByCompany']);
        Route::post('/companies/{company}/clients', [ClientController::class, 'store']);
        Route::get('/clients/{client}', [ClientController::class, 'show']);
        Route::put('/clients/{client}', [ClientController::class, 'update']);
        Route::delete('/clients/{client}', [ClientController::class, 'destroy']);

        // Loans
        Route::apiResource('loans', LoanController::class);

        // Payments
        Route::get('/loans/{loan}/payments', [PaymentController::class, 'indexByLoan']);
        Route::post('/loans/{loan}/payments', [PaymentController::class, 'store']);
        Route::get('/payments/{payment}', [PaymentController::class, 'show']);
        Route::delete('/payments/{payment}', [PaymentController::class, 'destroy']);

        // Payment Schedules
        Route::get('/loans/{loan}/schedules', [PaymentScheduleController::class, 'indexByLoan']);
        Route::get('/payment-schedules/upcoming', [PaymentScheduleController::class, 'upcomingPayments']);
        Route::get('/payment-schedules/overdue', [PaymentScheduleController::class, 'overduePayments']);

        // Communications
        Route::get('/loans/{loan}/communications', [CommunicationController::class, 'indexByLoan']);
        Route::post('/loans/{loan}/communications', [CommunicationController::class, 'store']);
        Route::delete('/communications/{communication}', [CommunicationController::class, 'destroy']);

        // Reports
        Route::get('/reports', [ReportController::class, 'index']);
        Route::post('/reports', [ReportController::class, 'store']);
        Route::get('/reports/{report}', [ReportController::class, 'show']);
        Route::delete('/reports/{report}', [ReportController::class, 'destroy']);

        // Dashboard
        Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);
        Route::get('/dashboard/recent-payments', [DashboardController::class, 'recentPayments']);
        Route::get('/dashboard/client-statistics', [DashboardController::class, 'clientStatistics']);
    });
});
