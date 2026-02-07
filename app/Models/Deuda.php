<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Deuda extends Model
{
    use HasFactory;

    protected $table = 'deudas';

    protected $fillable = [
        'user_id',
        'cliente_id',
        'descripcion',
        'monto_total',
        'monto_pendiente',
        'tasa_interes',
        'fecha_inicio',
        'fecha_vencimiento',
        'estado',
        'frecuencia_pago',
        'numero_cuotas',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'monto_total' => 'decimal:2',
            'monto_pendiente' => 'decimal:2',
            'tasa_interes' => 'decimal:2',
            'fecha_inicio' => 'date',
            'fecha_vencimiento' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }

    public function getTotalPagadoAttribute(): float
    {
        return (float) $this->pagos()->sum('monto');
    }

    public function getPorcentajePagadoAttribute(): float
    {
        if ($this->monto_total <= 0) return 0;
        return round(($this->total_pagado / $this->monto_total) * 100, 1);
    }

    public function getEstaVencidaAttribute(): bool
    {
        return $this->estado === 'activa'
            && $this->fecha_vencimiento
            && $this->fecha_vencimiento->isPast();
    }
}
