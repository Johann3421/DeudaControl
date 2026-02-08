<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inmuebles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('nombre', 150);
            $table->text('direccion');
            $table->enum('tipo', ['casa', 'departamento', 'local', 'oficina', 'terreno', 'otro'])->default('otro');
            $table->text('descripcion')->nullable();
            $table->enum('estado', ['disponible', 'alquilado', 'mantenimiento'])->default('disponible');
            $table->timestamps();

            $table->index(['user_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inmuebles');
    }
};
