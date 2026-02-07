<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Communication;
use App\Models\Loan;
use Illuminate\Http\JsonResponse;
use Imagine\Http\Request;

class CommunicationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function indexByLoan(Loan $loan): JsonResponse
    {
        $communications = $loan->communications()->paginate(20);
        return response()->json($communications);
    }

    public function store(Request $request, Loan $loan): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:email,sms,notification',
            'content' => 'required|string',
        ]);

        $communication = $loan->communications()->create([
            ...$validated,
            'client_id' => $loan->client_id,
            'sent_date' => now(),
            'status' => 'sent',
        ]);

        return response()->json([
            'message' => 'Communication sent successfully',
            'communication' => $communication,
        ], 201);
    }

    public function destroy(Communication $communication): JsonResponse
    {
        $communication->delete();
        return response()->json(['message' => 'Communication deleted successfully']);
    }
}
