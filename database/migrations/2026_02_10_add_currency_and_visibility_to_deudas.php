<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Agregar currency_code a deudas si no existe
        if (!Schema::hasColumn('deudas', 'currency_code')) {
            Schema::table('deudas', function (Blueprint $table) {
                $table->string('currency_code', 3)->default('PEN')->after('monto_pendiente');
            });
        }

        // Agregar currency_code a pagos si no existe
        if (Schema::hasTable('pagos') && !Schema::hasColumn('pagos', 'currency_code')) {
            Schema::table('pagos', function (Blueprint $table) {
                $table->string('currency_code', 3)->default('PEN')->after('monto');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('deudas', 'currency_code')) {
            Schema::table('deudas', function (Blueprint $table) {
                $table->dropColumn('currency_code');
            });
        }

        if (Schema::hasTable('pagos') && Schema::hasColumn('pagos', 'currency_code')) {
            Schema::table('pagos', function (Blueprint $table) {
                $table->dropColumn('currency_code');
            });
        }
    }
};
