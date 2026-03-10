<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ordenes_compra', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('numero_oc', 50)->unique();
            $table->string('cliente', 200);
            $table->date('fecha_oc');
            $table->date('fecha_entrega')->nullable();
            $table->enum('estado', ['pendiente', 'entregado', 'facturado', 'pagado'])->default('pendiente');
            $table->decimal('total_oc', 12, 2);
            $table->string('currency_code', 10)->default('PEN');
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ordenes_compra');
    }
};
