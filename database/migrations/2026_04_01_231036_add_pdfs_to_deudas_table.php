<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('deudas', function (Blueprint $table) {
            $table->string('factura_pdf')->nullable();
            $table->string('guia_pdf')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deudas', function (Blueprint $table) {
            $table->dropColumn(['factura_pdf', 'guia_pdf']);
        });
    }
};
