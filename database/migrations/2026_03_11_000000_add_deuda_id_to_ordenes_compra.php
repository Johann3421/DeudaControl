<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes_compra', function (Blueprint $table) {
            $table->foreignId('deuda_id')
                  ->nullable()
                  ->after('user_id')
                  ->constrained('deudas')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('ordenes_compra', function (Blueprint $table) {
            $table->dropForeign(['deuda_id']);
            $table->dropColumn('deuda_id');
        });
    }
};
