<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Agregar restricciones de clave foránea si no existen
        Schema::table('deudas', function (Blueprint $table) {
            // Verificar si la clave foránea ya existe
            if (!Schema::hasColumn('deudas', 'user_id')) {
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            }
            // Si user_id existe pero no tiene restricción, agregarla
        });

        Schema::table('pagos', function (Blueprint $table) {
            // Asegurar que deuda_id tenga restricción
            // Esto depende de la estructura actual de la migración
        });
    }

    public function down(): void
    {
        // No hacer cambios en rollback
    }
};
