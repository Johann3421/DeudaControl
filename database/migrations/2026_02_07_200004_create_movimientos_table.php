<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('tipo', ['ingreso', 'egreso', 'pago_recibido', 'prestamo_otorgado', 'ajuste']);
            $table->string('referencia_tipo', 50)->nullable(); // 'deuda', 'pago', 'manual'
            $table->unsignedBigInteger('referencia_id')->nullable();
            $table->decimal('monto', 12, 2);
            $table->string('descripcion', 255);
            $table->timestamps();

            $table->index(['user_id', 'tipo']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos');
    }
};
