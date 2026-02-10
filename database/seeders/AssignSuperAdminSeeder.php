<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AssignSuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'johan12@gmail.com')->first();

        if ($user) {
            $user->update(['rol' => 'superadmin']);
            $this->command->info("✓ Rol 'superadmin' asignado a {$user->email}");
        } else {
            $this->command->warn("⚠ Usuario con email 'johan12@gmail.com' no encontrado.");
            $this->command->info("Crear el usuario primero en el registro de la aplicación.");
        }
    }
}
