<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PagoOC extends Model
{
    protected $table = 'pagos_oc';

    protected $fillable = [
        'orden_compra_id',
        'monto',
        'fecha_pago',
        'metodo_pago',
        'referencia',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'monto'      => 'decimal:2',
            'fecha_pago' => 'date',
        ];
    }

    public function ordenCompra(): BelongsTo
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }
}
