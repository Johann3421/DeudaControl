<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gastos_oc', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_compra_id')->constrained('ordenes_compra')->onDelete('cascade');
            $table->enum('tipo_gasto', [
                'compra_producto',
                'transporte',
                'envio',
                'accesorios',
                'logistica',
                'otro',
            ]);
            $table->string('descripcion', 255)->nullable();
            $table->decimal('monto', 12, 2);
            $table->date('fecha')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gastos_oc');
    }
};
