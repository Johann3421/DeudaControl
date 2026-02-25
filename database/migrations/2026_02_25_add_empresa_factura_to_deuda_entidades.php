<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deuda_entidades', function (Blueprint $table) {
            $table->string('empresa_factura')->nullable()->after('estado_seguimiento');
            $table->string('unidad_ejecutora', 150)->nullable()->after('empresa_factura');
        });
    }

    public function down(): void
    {
        Schema::table('deuda_entidades', function (Blueprint $table) {
            $table->dropColumn(['empresa_factura', 'unidad_ejecutora']);
        });
    }
};
