<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recibos_luz_agua', function (Blueprint $table) {
            $table->id();
            $table->string('tipo'); // 'luz' o 'agua'
            $table->string('numero_suministro');
            $table->date('fecha_emision');
            $table->date('fecha_vencimiento');
            $table->decimal('monto', 10, 2);
            $table->string('estado')->default('pendiente'); // 'pendiente', 'pagado'
            $table->string('mes_recibo'); // Formato 'YYYY-MM'
            $table->boolean('alertado')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recibos_luz_agua');
    }
};
