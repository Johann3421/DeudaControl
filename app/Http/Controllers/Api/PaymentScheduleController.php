<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentScheduleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function indexByLoan(Loan $loan): JsonResponse
    {
        $schedules = $loan->paymentSchedules()
            ->orderBy('payment_number')
            ->paginate(20);

        return response()->json($schedules);
    }

    public function upcomingPayments(): JsonResponse
    {
        $user = auth('api')->user();
        $upcomingPayments = $user->companies()
            ->with(['loans' => function ($query) {
                $query->where('status', 'active');
            }])
            ->get()
            ->pluck('loans')
            ->flatten()
            ->each(function ($loan) {
                return $loan->paymentSchedules()
                    ->where('status', 'pending')
                    ->where('due_date', '<=', now()->addMonth())
                    ->get();
            });

        return response()->json($upcomingPayments);
    }

    public function overduePayments(): JsonResponse
    {
        $user = auth('api')->user();
        $overduePayments = $user->companies()
            ->with(['loans' => function ($query) {
                $query->where('status', 'active');
            }])
            ->get()
            ->pluck('loans')
            ->flatten()
            ->map(function ($loan) {
                return $loan->paymentSchedules()
                    ->where('status', 'pending')
                    ->where('due_date', '<', now())
                    ->get();
            });

        return response()->json($overduePayments);
    }
}
