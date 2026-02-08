<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeudaAlquiler extends Model
{
    use HasFactory;

    protected $table = 'deuda_alquileres';

    protected $fillable = [
        'deuda_id',
        'inmueble_id',
        'monto_mensual',
        'periodicidad',
        'fecha_inicio_contrato',
        'fecha_corte',
        'servicios_incluidos',
    ];

    protected function casts(): array
    {
        return [
            'monto_mensual' => 'decimal:2',
            'fecha_inicio_contrato' => 'date',
            'fecha_corte' => 'date',
            'servicios_incluidos' => 'array',
        ];
    }

    public function deuda(): BelongsTo
    {
        return $this->belongsTo(Deuda::class);
    }

    public function inmueble(): BelongsTo
    {
        return $this->belongsTo(Inmueble::class);
    }

    public function recibos(): HasMany
    {
        return $this->hasMany(ReciboAlquiler::class, 'deuda_alquiler_id');
    }

    public function recibosPendientes(): HasMany
    {
        return $this->recibos()->where('estado', 'pendiente');
    }

    public function getTotalPendienteRecibosAttribute(): float
    {
        return (float) $this->recibosPendientes()->sum('monto');
    }
}
