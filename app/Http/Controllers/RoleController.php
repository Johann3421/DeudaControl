<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RoleController extends Controller
{
    private function authorize()
    {
        if (Auth::user()->rol !== 'superadmin') {
            abort(403, 'No tienes permisos para acceder a esta área.');
        }
    }

    public function index()
    {
        $this->authorize();
        $usuarios = User::orderBy('rol', 'desc')->orderBy('name')->paginate(15);

        return Inertia::render('Admin/Roles/Index', [
            'usuarios' => $usuarios,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $this->authorize();
        $validated = $request->validate([
            'rol' => ['required', 'in:usuario,superadmin'],
        ]);

        $user->update($validated);

        return back()->with('success', "Rol actualizado para {$user->name}.");
    }

    public function destroy(User $user)
    {
        $this->authorize();
        if ($user->id === Auth::id()) {
            return back()->with('error', 'No puedes eliminar tu propia cuenta.');
        }

        $user->delete();

        return back()->with('success', "Usuario {$user->name} eliminado.");
    }
}
