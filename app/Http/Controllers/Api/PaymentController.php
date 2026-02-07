<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function indexByLoan(Loan $loan): JsonResponse
    {
        return response()->json(
            $loan->payments()->paginate(15)
        );
    }

    public function store(Request $request, Loan $loan): JsonResponse
    {
        if ($loan->status !== 'active') {
            return response()->json(['message' => 'Cannot add payments to inactive loans'], 422);
        }

        $validated = $request->validate([
            'payment_date' => 'required|date',
            'principal_paid' => 'required|numeric|min:0',
            'interest_paid' => 'required|numeric|min:0',
        ]);

        $total_paid = $validated['principal_paid'] + $validated['interest_paid'];
        $balance_remaining = max(0, $loan->balance_remaining - $validated['principal_paid']);

        $payment = $loan->payments()->create([
            ...$validated,
            'total_paid' => $total_paid,
            'balance_remaining' => $balance_remaining,
            'status' => 'completed',
        ]);

        // Update loan balance
        $loan->update(['balance_remaining' => $balance_remaining]);

        // Mark payment schedule as paid if match
        $loan->paymentSchedules()
            ->where('status', 'pending')
            ->where('amount', '<=', $total_paid)
            ->first()?->update(['status' => 'paid']);

        return response()->json([
            'message' => 'Payment recorded successfully',
            'payment' => $payment,
        ], 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json($payment);
    }

    public function destroy(Payment $payment): JsonResponse
    {
        // Restore loan balance
        $loan = $payment->loan;
        $loan->update([
            'balance_remaining' => $loan->balance_remaining + $payment->principal_paid
        ]);

        $payment->delete();
        return response()->json(['message' => 'Payment deleted successfully']);
    }
}
