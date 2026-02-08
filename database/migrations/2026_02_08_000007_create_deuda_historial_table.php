<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deuda_historial', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deuda_id')->constrained('deudas')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('evento', 100);
            $table->json('datos_anteriores')->nullable();
            $table->json('datos_nuevos')->nullable();
            $table->text('descripcion')->nullable();
            $table->timestamps();

            $table->index(['deuda_id', 'created_at']);
            $table->index('evento');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deuda_historial');
    }
};
