<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GastoOC extends Model
{
    protected $table = 'gastos_oc';

    protected $fillable = [
        'orden_compra_id',
        'tipo_gasto',
        'cantidad',
        'descripcion',
        'monto',
        'fecha',
        'boleta_path',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
            'fecha' => 'date',
        ];
    }

    public function ordenCompra(): BelongsTo
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }
}
