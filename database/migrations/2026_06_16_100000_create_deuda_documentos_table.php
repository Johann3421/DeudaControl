<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deuda_documentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deuda_id')->constrained()->onDelete('cascade');
            $table->string('titulo', 100);
            $table->string('path');
            $table->string('mime', 50)->nullable();
            $table->unsignedInteger('size')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deuda_documentos');
    }
};
