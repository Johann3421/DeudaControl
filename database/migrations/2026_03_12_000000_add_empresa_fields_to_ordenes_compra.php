<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes_compra', function (Blueprint $table) {
            $table->string('empresa_factura', 200)->nullable()->after('cliente');
            $table->string('entidad_recibe',  200)->nullable()->after('empresa_factura');
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_compra', function (Blueprint $table) {
            $table->dropColumn(['empresa_factura', 'entidad_recibe']);
        });
    }
};
