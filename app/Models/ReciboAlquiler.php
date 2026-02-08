<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReciboAlquiler extends Model
{
    use HasFactory;

    protected $table = 'recibos_alquiler';

    protected $fillable = [
        'deuda_alquiler_id',
        'numero_recibo',
        'monto',
        'periodo_inicio',
        'periodo_fin',
        'estado',
        'fecha_pago',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
            'periodo_inicio' => 'date',
            'periodo_fin' => 'date',
            'fecha_pago' => 'date',
        ];
    }

    public function deudaAlquiler(): BelongsTo
    {
        return $this->belongsTo(DeudaAlquiler::class, 'deuda_alquiler_id');
    }

    public function getEstaVencidoAttribute(): bool
    {
        return $this->estado === 'pendiente' && $this->periodo_fin->isPast();
    }
}
