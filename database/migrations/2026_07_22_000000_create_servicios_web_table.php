<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('servicios_web', function (Blueprint $table) {
            $table->id();
            $table->string('tipo');           // hosting, dominio, ssl, email, otro
            $table->string('proveedor');      // GoDaddy, Namecheap, Cloudflare, etc.
            $table->string('nombre');         // dominio.com o nombre del servicio
            $table->date('fecha_vencimiento');
            $table->decimal('monto', 10, 2)->nullable();
            $table->string('moneda', 3)->default('USD'); // USD o PEN
            $table->string('periodo')->default('anual'); // mensual, anual, bianual
            $table->string('estado')->default('activo'); // activo, vencido, cancelado
            $table->boolean('alertado')->default(false);
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('servicios_web');
    }
};
