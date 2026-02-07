<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
            $table->date('payment_date');
            $table->decimal('principal_paid', 12, 2);
            $table->decimal('interest_paid', 12, 2);
            $table->decimal('total_paid', 12, 2);
            $table->decimal('balance_remaining', 12, 2);
            $table->enum('status', ['completed', 'pending'])->default('completed');
            $table->timestamps();
            $table->index('loan_id');
            $table->index('payment_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
