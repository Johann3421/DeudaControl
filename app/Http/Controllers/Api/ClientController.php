<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function indexByCompany(Company $company): JsonResponse
    {
        $this->authorize('view', $company);
        $clients = $company->clients()->paginate(15);
        return response()->json($clients);
    }

    public function store(Request $request, Company $company): JsonResponse
    {
        $this->authorize('update', $company);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:clients',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'identification' => 'required|unique:clients',
            'status' => 'sometimes|in:active,inactive',
        ]);

        $client = $company->clients()->create($validated);

        return response()->json([
            'message' => 'Client created successfully',
            'client' => $client,
        ], 201);
    }

    public function show(Client $client): JsonResponse
    {
        return response()->json($client->load(['loans', 'communications']));
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'string|max:255',
            'last_name' => 'string|max:255',
            'email' => 'email|unique:clients,email,' . $client->id,
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'status' => 'in:active,inactive',
        ]);

        $client->update($validated);

        return response()->json([
            'message' => 'Client updated successfully',
            'client' => $client,
        ]);
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();
        return response()->json(['message' => 'Client deleted successfully']);
    }
}
