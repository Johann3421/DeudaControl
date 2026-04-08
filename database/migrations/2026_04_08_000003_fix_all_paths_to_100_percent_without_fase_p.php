<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Resetea todas las deudas de entidad que están marcadas como completadas
     * sin que el Jefe haya asignado la fase SIAF 'P'.
     *
     * Cubre: estado=pagada/pagado_banco, monto_pendiente=0,
     *        estado_seguimiento=pagado, estado_siaf='B'
     */
    public function up(): void
    {
        // 1. Deudas en tabla 'deudas': volver a activa con 5% pendiente
        DB::statement("
            UPDATE deudas
            SET estado = 'activa',
                monto_pendiente = ROUND(CAST(monto_total AS numeric) * 0.05, 2)
            WHERE tipo_deuda = 'entidad'
              AND (
                  estado IN ('pagada', 'pagado_banco')
                  OR monto_pendiente = 0
              )
              AND id IN (
                  SELECT deuda_id FROM deuda_entidades
                  WHERE (fase_siaf IS NULL OR fase_siaf <> 'P')
              )
        ");

        // 2. deuda_entidades: resetear seguimiento, cerrado y estado_siaf='B'
        DB::statement("
            UPDATE deuda_entidades
            SET estado_seguimiento = 'emitido',
                cerrado = false,
                estado_siaf = CASE WHEN estado_siaf = 'B' THEN 'G' ELSE estado_siaf END
            WHERE (fase_siaf IS NULL OR fase_siaf <> 'P')
              AND (
                  estado_seguimiento = 'pagado'
                  OR cerrado = true
                  OR estado_siaf = 'B'
              )
        ");
    }

    public function down(): void
    {
        // No reversible de forma segura
    }
};
