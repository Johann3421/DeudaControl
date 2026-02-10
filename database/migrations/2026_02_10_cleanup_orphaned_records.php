<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Eliminar pagos que corresponden a deudas huérfanas
        DB::statement('DELETE FROM pagos WHERE deuda_id NOT IN (SELECT id FROM deudas)');
        
        // Eliminar deudas sin user_id o con user_id inválido
        DB::statement('DELETE FROM deudas WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM users)');
        
        // Eliminar deudas_entidad huérfanas si la tabla existe
        if (Schema::hasTable('deudas_entidad')) {
            DB::statement('DELETE FROM deudas_entidad WHERE deuda_id NOT IN (SELECT id FROM deudas)');
        }
        
        // Eliminar deudas_alquiler huérfanas si la tabla existe
        if (Schema::hasTable('deudas_alquiler')) {
            DB::statement('DELETE FROM deudas_alquiler WHERE deuda_id NOT IN (SELECT id FROM deudas)');
        }
        
        // Elminar historial huérfano si la tabla existe
        if (Schema::hasTable('deudas_historial')) {
            DB::statement('DELETE FROM deudas_historial WHERE deuda_id NOT IN (SELECT id FROM deudas)');
        }
    }

    public function down(): void
    {
        // Esta es una migración de limpieza, no hay rollback seguro
    }
};
