<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deudas', function (Blueprint $table) {
            $table->enum('tipo_deuda', ['particular', 'entidad', 'alquiler'])
                ->default('particular')
                ->after('id');

            // Make cliente_id nullable for entity-type debts
            $table->unsignedBigInteger('cliente_id')->nullable()->change();

            $table->index('tipo_deuda');
            $table->index(['user_id', 'tipo_deuda', 'estado']);
        });

        // Set all existing debts as 'particular'
        DB::table('deudas')->whereNull('tipo_deuda')->update(['tipo_deuda' => 'particular']);
    }

    public function down(): void
    {
        Schema::table('deudas', function (Blueprint $table) {
            $table->dropIndex(['tipo_deuda']);
            $table->dropIndex(['user_id', 'tipo_deuda', 'estado']);
            $table->dropColumn('tipo_deuda');
        });
    }
};
