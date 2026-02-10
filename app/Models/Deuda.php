<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Deuda extends Model
{
    use HasFactory;

    protected $table = 'deudas';

    protected $fillable = [
        'user_id',
        'tipo_deuda',
        'cliente_id',
        'descripcion',
        'monto_total',
        'monto_pendiente',
        'currency_code',
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

    // --- Relationships ---

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

    public function historial(): HasMany
    {
        return $this->hasMany(DeudaHistorial::class);
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class);
    }

    public function deudaEntidad(): HasOne
    {
        return $this->hasOne(DeudaEntidad::class);
    }

    public function deudaAlquiler(): HasOne
    {
        return $this->hasOne(DeudaAlquiler::class);
    }

    // --- Scopes ---

    public function scopeParticular($query)
    {
        return $query->where('tipo_deuda', 'particular');
    }

    public function scopeEntidad($query)
    {
        return $query->where('tipo_deuda', 'entidad');
    }

    public function scopeAlquiler($query)
    {
        return $query->where('tipo_deuda', 'alquiler');
    }

    public function scopeDelUsuario($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // --- Accessors ---

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

    public function getTipoDeudaLabelAttribute(): string
    {
        return match ($this->tipo_deuda) {
            'particular' => 'Particular',
            'entidad' => 'Entidad',
            'alquiler' => 'Alquiler',
            default => 'Desconocido',
        };
    }

    public function esParticular(): bool
    {
        return $this->tipo_deuda === 'particular';
    }

    public function esEntidad(): bool
    {
        return $this->tipo_deuda === 'entidad';
    }

    public function esAlquiler(): bool
    {
        return $this->tipo_deuda === 'alquiler';
    }
}
