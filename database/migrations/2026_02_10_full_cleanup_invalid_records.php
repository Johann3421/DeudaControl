<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Primero, eliminar todos los pagos
        DB::statement('TRUNCATE TABLE pagos');
        
        // Luego, obtener los IDs de usuarios reales
        $usuario_ids = DB::table('users')->pluck('id')->toArray();
        
        if (empty($usuario_ids)) {
            // Si no hay usuarios, eliminar todas las deudas
            DB::statement('TRUNCATE TABLE deudas');
        } else {
            // Eliminar solo deudas que NO pertenecen a usuarios válidos
            DB::table('deudas')
                ->whereNotIn('user_id', $usuario_ids)
                ->delete();
        }
    }

    public function down(): void
    {
        // No hay rollback para limpieza de datos
    }
};

