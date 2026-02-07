<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function metrics(): JsonResponse
    {
        $user = auth('api')->user();
        $companies = $user->companies()->with('loans')->get();

        $totalLoans = $companies->sum(fn ($c) => $c->loans->count());
        $totalPrincipal = $companies->sum(fn ($c) => $c->loans->sum('principal_amount'));
        $totalPendingBalance = $companies->sum(fn ($c) => $c->loans->sum('balance_remaining'));
        $totalInterestEarned = $companies->sum(fn ($c) =>
            $c->loans->sum('interest_rate') * $c->loans->count()
        );

        $activeLoans = $companies->sum(fn ($c) =>
            $c->loans->where('status', 'active')->count()
        );

        $completedLoans = $companies->sum(fn ($c) =>
            $c->loans->where('status', 'completed')->count()
        );

        $defaultedLoans = $companies->sum(fn ($c) =>
            $c->loans->where('status', 'defaulted')->count()
        );

        return response()->json([
            'total_loans' => $totalLoans,
            'active_loans' => $activeLoans,
            'completed_loans' => $completedLoans,
            'defaulted_loans' => $defaultedLoans,
            'total_principal' => $totalPrincipal,
            'total_pending_balance' => $totalPendingBalance,
            'total_interest_earned' => $totalInterestEarned,
            'companies_count' => $companies->count(),
        ]);
    }

    public function recentPayments(): JsonResponse
    {
        $user = auth('api')->user();
        $recentPayments = $user->companies()
            ->with(['loans' => function ($query) {
                $query->with('payments');
            }])
            ->get()
            ->pluck('loans')
            ->flatten()
            ->pluck('payments')
            ->flatten()
            ->sortByDesc('payment_date')
            ->take(10);

        return response()->json($recentPayments);
    }

    public function clientStatistics(): JsonResponse
    {
        $user = auth('api')->user();
        $companies = $user->companies()->with(['clients' => function ($query) {
            $query->with('loans');
        }])->get();

        $clientStats = $companies->pluck('clients')
            ->flatten()
            ->map(fn ($client) => [
                'id' => $client->id,
                'name' => $client->first_name . ' ' . $client->last_name,
                'email' => $client->email,
                'loans_count' => $client->loans->count(),
                'total_borrowed' => $client->loans->sum('principal_amount'),
                'total_pending' => $client->loans->sum('balance_remaining'),
                'status' => $client->status,
            ]);

        return response()->json($clientStats);
    }
}
