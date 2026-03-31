<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deuda_entidades', function (Blueprint $table) {
            $table->string('pdf_oc')->nullable()->after('unidad_ejecutora');
        });
    }

    public function down(): void
    {
        Schema::table('deuda_entidades', function (Blueprint $table) {
            $table->dropColumn('pdf_oc');
        });
    }
};
