<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deuda_entidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deuda_id')->constrained('deudas')->onDelete('cascade');
            $table->foreignId('entidad_id')->constrained('entidades')->onDelete('cascade');
            $table->string('orden_compra', 100);
            $table->date('fecha_emision');
            $table->string('producto_servicio', 255);
            $table->string('codigo_siaf', 50)->nullable();
            $table->date('fecha_limite_pago');
            $table->enum('estado_seguimiento', ['emitido', 'enviado', 'observado', 'pagado'])->default('emitido');
            $table->boolean('cerrado')->default(false);
            $table->timestamps();

            $table->unique('deuda_id');
            $table->index(['entidad_id', 'estado_seguimiento']);
            $table->index('codigo_siaf');
            $table->index('fecha_limite_pago');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deuda_entidades');
    }
};
