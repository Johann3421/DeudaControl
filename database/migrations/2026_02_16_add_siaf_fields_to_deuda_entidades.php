<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deuda_entidades', function (Blueprint $table) {
            // Estado SIAF: C=Compromiso, D=Devengado, G=Girado, R=Rechazada
            $table->char('estado_siaf', 1)->nullable()->after('codigo_siaf')
                ->comment('C=Compromiso, D=Devengado, G=Girado, R=Rechazada');

            // Fase del expediente (extrae del SIAF)
            $table->string('fase_siaf', 10)->nullable()->after('estado_siaf');

            // Estado del expediente (extrae del SIAF)
            $table->string('estado_expediente', 50)->nullable()->after('fase_siaf');

            // Fecha de proceso (extrae del SIAF)
            $table->dateTime('fecha_proceso', precision: 0)->nullable()->after('estado_expediente');
        });
    }

    public function down(): void
    {
        Schema::table('deuda_entidades', function (Blueprint $table) {
            $table->dropColumn(['estado_siaf', 'fase_siaf', 'estado_expediente', 'fecha_proceso']);
        });
    }
};
