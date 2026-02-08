<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recibos_alquiler', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deuda_alquiler_id')->constrained('deuda_alquileres')->onDelete('cascade');
            $table->string('numero_recibo', 50);
            $table->decimal('monto', 12, 2);
            $table->date('periodo_inicio');
            $table->date('periodo_fin');
            $table->enum('estado', ['pendiente', 'pagado', 'vencido', 'cancelado'])->default('pendiente');
            $table->date('fecha_pago')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index(['deuda_alquiler_id', 'estado']);
            $table->index(['periodo_inicio', 'periodo_fin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recibos_alquiler');
    }
};
