<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Services\AmortizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    protected AmortizationService $amortizationService;

    public function __construct(AmortizationService $amortizationService)
    {
        $this->middleware('auth:api');
        $this->amortizationService = $amortizationService;
    }

    public function index(): JsonResponse
    {
        $loans = auth('api')->user()->companies()
            ->with('loans')
            ->get()
            ->pluck('loans')
            ->flatten()
            ->paginate(15);

        return response()->json($loans);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'client_id' => 'required|exists:clients,id',
            'principal_amount' => 'required|numeric|min:0.01',
            'interest_rate' => 'required|numeric|min:0',
            'loan_term_months' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'amortization_type' => 'required|in:french,german,american',
        ]);

        // Create loan
        $loan = Loan::create([
            ...$validated,
            'balance_remaining' => $validated['principal_amount'],
            'status' => 'active',
        ]);

        // Generate payment schedule
        $schedule = $this->amortizationService->calculate(
            $validated['amortization_type'],
            $validated['principal_amount'],
            $validated['interest_rate'],
            $validated['loan_term_months'],
            $validated['start_date']
        );

        // Save payment schedules
        foreach ($schedule as $payment) {
            $loan->paymentSchedules()->create($payment);
        }

        return response()->json([
            'message' => 'Loan created successfully',
            'loan' => $loan->load('paymentSchedules'),
        ], 201);
    }

    public function show(Loan $loan): JsonResponse
    {
        return response()->json(
            $loan->load(['client', 'paymentSchedules', 'payments', 'refinancing', 'communications'])
        );
    }

    public function update(Request $request, Loan $loan): JsonResponse
    {
        if ($loan->status !== 'active') {
            return response()->json(['message' => 'Cannot modify non-active loans'], 422);
        }

        $validated = $request->validate([
            'interest_rate' => 'numeric|min:0',
        ]);

        $loan->update($validated);

        return response()->json([
            'message' => 'Loan updated successfully',
            'loan' => $loan,
        ]);
    }

    public function destroy(Loan $loan): JsonResponse
    {
        if ($loan->status !== 'active') {
            return response()->json(['message' => 'Cannot delete non-active loans'], 422);
        }

        $loan->delete();
        return response()->json(['message' => 'Loan deleted successfully']);
    }
}
