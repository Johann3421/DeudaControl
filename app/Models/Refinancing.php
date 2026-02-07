<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Refinancing extends Model
{
    protected $fillable = [
        'loan_id',
        'refinanced_loan_id',
        'refinancing_date',
        'reason',
        'new_terms',
    ];

    protected $casts = [
        'new_terms' => 'array',
        'refinancing_date' => 'date',
    ];

    public function originalLoan(): BelongsTo
    {
        return $this->belongsTo(Loan::class, 'loan_id');
    }

    public function refinancedLoan(): BelongsTo
    {
        return $this->belongsTo(Loan::class, 'refinanced_loan_id');
    }
}

