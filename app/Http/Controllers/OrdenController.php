<?php

namespace App\Http\Controllers;

use App\Models\DeudaEntidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OrdenController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $query = DeudaEntidad::with([
            'deuda:id,user_id,monto_total,monto_pendiente,currency_code,estado,fecha_vencimiento',
            'entidad:id,razon_social,ruc',
        ]);

        // Super-admin sees all; normal user only their own
        if ($user->rol !== 'superadmin') {
            $query->whereHas('deuda', fn($q) => $q->where('user_id', $user->id));
        }

        $ordenes = $query->orderByRaw('fecha_limite_pago IS NULL, fecha_limite_pago ASC')->get();

        return Inertia::render('Ordenes/Index', [
            'ordenes' => $ordenes,
        ]);
    }

    public function uploadPdf(Request $request, DeudaEntidad $orden)
    {
        $user = Auth::user();

        // Authorization
        if ($user->rol !== 'superadmin' && $orden->deuda->user_id !== $user->id) {
            abort(403);
        }

        $request->validate([
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ], [
            'pdf.required' => 'Selecciona un archivo PDF.',
            'pdf.mimes'    => 'El archivo debe ser un PDF.',
            'pdf.max'      => 'El PDF no puede superar los 10 MB.',
        ]);

        // Delete previous PDF if any
        if ($orden->pdf_oc && Storage::disk('public')->exists($orden->pdf_oc)) {
            Storage::disk('public')->delete($orden->pdf_oc);
        }

        $path = $request->file('pdf')->store("ordenes/{$orden->id}", 'public');

        $orden->update(['pdf_oc' => $path]);

        return back()->with('success', 'PDF de la orden subido correctamente.');
    }

    public function viewPdf(DeudaEntidad $orden)
    {
        $user = Auth::user();

        if ($user->rol !== 'superadmin' && $orden->deuda->user_id !== $user->id) {
            abort(403);
        }

        if (!$orden->pdf_oc || !Storage::disk('public')->exists($orden->pdf_oc)) {
            abort(404, 'El archivo PDF no existe o fue eliminado.');
        }

        return response()->file(Storage::disk('public')->path($orden->pdf_oc));
    }

    public function deletePdf(DeudaEntidad $orden)
    {
        $user = Auth::user();

        if ($user->rol !== 'superadmin' && $orden->deuda->user_id !== $user->id) {
            abort(403);
        }

        if ($orden->pdf_oc && Storage::disk('public')->exists($orden->pdf_oc)) {
            Storage::disk('public')->delete($orden->pdf_oc);
        }

        $orden->update(['pdf_oc' => null]);

        return back()->with('success', 'PDF eliminado.');
    }
}
