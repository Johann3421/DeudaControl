<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    private function authorize(): void
    {
        if (!Auth::user()->esPrivilegiado()) {
            abort(403, 'No tienes permisos para acceder a esta área.');
        }
    }

    public function create()
    {
        $this->authorize();

        return Inertia::render('Admin/Users/Create');
    }

    public function store(Request $request)
    {
        $this->authorize();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'rol' => ['required', 'in:usuario,superadmin'],
            'activo' => ['boolean'],
        ], [
            'name.required' => 'El nombre es obligatorio.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Ingresa un correo electrónico válido.',
            'email.unique' => 'Este correo ya está registrado.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
            'rol.in' => 'El rol debe ser usuario o superadmin.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'rol' => $validated['rol'],
            'activo' => $validated['activo'] ?? true,
        ]);

        return redirect()
            ->route('admin.roles.index')
            ->with('success', "Usuario {$user->name} creado correctamente.");
    }
}
