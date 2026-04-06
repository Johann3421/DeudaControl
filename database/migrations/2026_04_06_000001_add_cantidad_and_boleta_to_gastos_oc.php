<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gastos_oc', function (Blueprint $table) {
            $table->integer('cantidad')->default(1)->after('tipo_gasto');
            $table->string('boleta_path', 500)->nullable()->after('fecha');
        });
    }

    public function down(): void
    {
        Schema::table('gastos_oc', function (Blueprint $table) {
            $table->dropColumn(['cantidad', 'boleta_path']);
        });
    }
};
