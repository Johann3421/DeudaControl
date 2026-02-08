<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeudaEntidad extends Model
{
    use HasFactory;

    protected $table = 'deuda_entidades';

    protected $fillable = [
        'deuda_id',
        'entidad_id',
        'orden_compra',
        'fecha_emision',
        'producto_servicio',
        'codigo_siaf',
        'fecha_limite_pago',
        'estado_seguimiento',
        'cerrado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_emision' => 'date',
            'fecha_limite_pago' => 'date',
            'cerrado' => 'boolean',
        ];
    }

    public function deuda(): BelongsTo
    {
        return $this->belongsTo(Deuda::class);
    }

    public function entidad(): BelongsTo
    {
        return $this->belongsTo(Entidad::class);
    }

    public function estaEditable(): bool
    {
        return !$this->cerrado;
    }
}
