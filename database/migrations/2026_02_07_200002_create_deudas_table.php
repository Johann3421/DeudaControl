<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deudas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('cliente_id')->constrained('clientes')->onDelete('cascade');
            $table->string('descripcion', 255);
            $table->decimal('monto_total', 12, 2);
            $table->decimal('monto_pendiente', 12, 2);
            $table->decimal('tasa_interes', 5, 2)->default(0);
            $table->date('fecha_inicio');
            $table->date('fecha_vencimiento')->nullable();
            $table->enum('estado', ['activa', 'pagada', 'vencida', 'cancelada'])->default('activa');
            $table->enum('frecuencia_pago', ['semanal', 'quincenal', 'mensual', 'unico'])->default('mensual');
            $table->integer('numero_cuotas')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'estado']);
            $table->index(['cliente_id', 'estado']);
            $table->index('fecha_vencimiento');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deudas');
    }
};
