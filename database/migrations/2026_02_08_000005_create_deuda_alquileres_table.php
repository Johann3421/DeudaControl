<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deuda_alquileres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deuda_id')->constrained('deudas')->onDelete('cascade');
            $table->foreignId('inmueble_id')->constrained('inmuebles')->onDelete('cascade');
            $table->decimal('monto_mensual', 12, 2);
            $table->enum('periodicidad', ['mensual', 'bimestral', 'trimestral'])->default('mensual');
            $table->date('fecha_inicio_contrato');
            $table->date('fecha_corte')->nullable();
            $table->json('servicios_incluidos')->nullable();
            $table->timestamps();

            $table->unique('deuda_id');
            $table->index(['inmueble_id']);
            $table->index('fecha_corte');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deuda_alquileres');
    }
};
