<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'loan_id',
        'payment_date',
        'principal_paid',
        'interest_paid',
        'total_paid',
        'balance_remaining',
        'status',
    ];

    protected $casts = [
        'principal_paid' => 'decimal:2',
        'interest_paid' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'balance_remaining' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }
}

