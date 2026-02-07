<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deuda_id')->constrained('deudas')->onDelete('cascade');
            $table->decimal('monto', 12, 2);
            $table->date('fecha_pago');
            $table->enum('metodo_pago', ['efectivo', 'transferencia', 'tarjeta', 'cheque', 'otro'])->default('efectivo');
            $table->string('referencia', 100)->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index('deuda_id');
            $table->index('fecha_pago');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
