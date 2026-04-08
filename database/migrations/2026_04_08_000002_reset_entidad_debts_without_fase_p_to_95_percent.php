<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Restablece al 95% todas las deudas de entidad que están al 100%
     * pero no tienen la fase SIAF 'P' (Pagado en cuenta) asignada por el Jefe.
     */
    public function up(): void
    {
        // 1. Restablecer deudas de entidad al 95% si están al 100% sin fase P
        DB::statement("
            UPDATE deudas
            SET
                monto_pendiente = ROUND(monto_total * 0.05, 2),
                estado = 'activa'
            WHERE tipo_deuda = 'entidad'
              AND (estado IN ('pagada', 'pagado_banco') OR monto_pendiente = 0)
              AND id IN (
                  SELECT deuda_id
                  FROM deuda_entidades
                  WHERE fase_siaf IS DISTINCT FROM 'P'
              )
        ");

        // 2. Reabrir el campo cerrado en deuda_entidades para las mismas deudas
        DB::statement("
            UPDATE deuda_entidades
            SET cerrado = false
            WHERE cerrado = true
              AND fase_siaf IS DISTINCT FROM 'P'
        ");
    }

    public function down(): void
    {
        // No reversible de forma segura: los datos originales no se almacenan
    }
};
