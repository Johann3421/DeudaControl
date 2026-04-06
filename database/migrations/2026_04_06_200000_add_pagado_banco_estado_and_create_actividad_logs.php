<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Ampliar el enum de estado en deudas para incluir 'pagado_banco' ─
        // PostgreSQL guarda el enum como un CHECK constraint.
        // Eliminamos el existente y lo recreamos con el nuevo valor.
        DB::statement("ALTER TABLE deudas DROP CONSTRAINT IF EXISTS deudas_estado_check");
        DB::statement("ALTER TABLE deudas ADD CONSTRAINT deudas_estado_check
            CHECK (estado IN ('activa','pagada','vencida','cancelada','pagado_banco'))");

        // ── 2. Ampliar estado_siaf para incluir 'B' (ya debería estar, but safety) ─
        DB::statement("ALTER TABLE deuda_entidades DROP CONSTRAINT IF EXISTS deuda_entidades_estado_siaf_check");
        DB::statement("ALTER TABLE deuda_entidades ADD CONSTRAINT deuda_entidades_estado_siaf_check
            CHECK (estado_siaf IN ('C','D','G','R','B'))");

        // ── 3. Crear tabla de log de actividad de usuarios ────────────────────
        Schema::create('actividad_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('accion', 50);          // creado, editado, eliminado, pago, etc.
            $table->string('entidad_tipo', 50);    // deuda, pago, utilidad, gasto, orden
            $table->unsignedBigInteger('entidad_id')->nullable();
            $table->string('descripcion', 500);
            $table->timestamps();

            $table->index(['entidad_tipo', 'entidad_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actividad_logs');

        DB::statement("ALTER TABLE deudas DROP CONSTRAINT IF EXISTS deudas_estado_check");
        DB::statement("ALTER TABLE deudas ADD CONSTRAINT deudas_estado_check
            CHECK (estado IN ('activa','pagada','vencida','cancelada'))");

        DB::statement("ALTER TABLE deuda_entidades DROP CONSTRAINT IF EXISTS deuda_entidades_estado_siaf_check");
        DB::statement("ALTER TABLE deuda_entidades ADD CONSTRAINT deuda_entidades_estado_siaf_check
            CHECK (estado_siaf IN ('C','D','G','R'))");
    }
};
