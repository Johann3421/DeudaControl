<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('razon_social', 200);
            $table->string('ruc', 20)->nullable();
            $table->enum('tipo', ['publica', 'privada'])->default('publica');
            $table->string('contacto_nombre', 150)->nullable();
            $table->string('contacto_telefono', 20)->nullable();
            $table->string('contacto_email', 150)->nullable();
            $table->text('direccion')->nullable();
            $table->text('notas')->nullable();
            $table->enum('estado', ['activa', 'inactiva'])->default('activa');
            $table->timestamps();

            $table->index(['user_id', 'estado']);
            $table->index('ruc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entidades');
    }
};
