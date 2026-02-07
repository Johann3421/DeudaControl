<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    protected $fillable = [
        'company_id',
        'client_id',
        'principal_amount',
        'interest_rate',
        'loan_term_months',
        'start_date',
        'end_date',
        'balance_remaining',
        'status',
        'amortization_type',
    ];

    protected $casts = [
        'principal_amount' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'balance_remaining' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function paymentSchedules(): HasMany
    {
        return $this->hasMany(PaymentSchedule::class);
    }

    public function refinancing(): HasMany
    {
        return $this->hasMany(Refinancing::class);
    }

    public function communications(): HasMany
    {
        return $this->hasMany(Communication::class);
    }
}

