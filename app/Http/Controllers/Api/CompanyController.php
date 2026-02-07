<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function index(): JsonResponse
    {
        $companies = auth('api')->user()->companies()->paginate(15);
        return response()->json($companies);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'legal_id' => 'required|unique:companies',
            'phone' => 'nullable|string',
            'email' => 'required|email',
            'logo_url' => 'nullable|url',
            'address' => 'nullable|string',
        ]);

        $company = auth('api')->user()->companies()->create($validated);

        return response()->json([
            'message' => 'Company created successfully',
            'company' => $company,
        ], 201);
    }

    public function show(Company $company): JsonResponse
    {
        $this->authorize('view', $company);
        return response()->json($company);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $this->authorize('update', $company);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'legal_id' => 'unique:companies,legal_id,' . $company->id,
            'phone' => 'nullable|string',
            'email' => 'email',
            'logo_url' => 'nullable|url',
            'address' => 'nullable|string',
        ]);

        $company->update($validated);

        return response()->json([
            'message' => 'Company updated successfully',
            'company' => $company,
        ]);
    }

    public function destroy(Company $company): JsonResponse
    {
        $this->authorize('delete', $company);
        $company->delete();

        return response()->json(['message' => 'Company deleted successfully']);
    }
}
