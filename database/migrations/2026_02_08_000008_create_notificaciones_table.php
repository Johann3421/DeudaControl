<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('deuda_id')->constrained('deudas')->onDelete('cascade');
            $table->enum('canal', ['whatsapp', 'email', 'sms'])->default('whatsapp');
            $table->enum('estado', ['pendiente', 'enviada', 'fallida'])->default('pendiente');
            $table->text('mensaje');
            $table->string('destinatario', 100);
            $table->timestamp('fecha_envio')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'estado']);
            $table->index(['deuda_id', 'canal']);
            $table->index('fecha_envio');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};
