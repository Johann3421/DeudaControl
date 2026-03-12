<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Deuda;

class OrdenCompra extends Model
{
    protected $table = 'ordenes_compra';

    protected $fillable = [
        'user_id',
        'deuda_id',
        'numero_oc',
        'cliente',
        'empresa_factura',
        'entidad_recibe',
        'fecha_oc',
        'fecha_entrega',
        'estado',
        'total_oc',
        'currency_code',
        'notas',
    ];

    protected function casts(): array
    {
        return [
            'total_oc'      => 'decimal:2',
            'fecha_oc'      => 'date',
            'fecha_entrega' => 'date',
        ];
    }

    // ---------- Relations ----------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function deuda(): BelongsTo
    {
        return $this->belongsTo(Deuda::class);
    }

    public function gastos(): HasMany
    {
        return $this->hasMany(GastoOC::class, 'orden_compra_id');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(PagoOC::class, 'orden_compra_id');
    }

    // ---------- Computed ----------

    /** Suma de todos los gastos (calculado en PHP, no guardado en DB) */
    public function getTotalGastosAttribute(): float
    {
        return (float) $this->gastos->sum('monto');
    }

    /** Total pagado */
    public function getTotalPagadoAttribute(): float
    {
        return (float) $this->pagos->sum('monto');
    }

    /** Utilidad = total_oc – total_gastos */
    public function getUtilidadAttribute(): float
    {
        return (float) $this->total_oc - $this->total_gastos;
    }

    /** % utilidad sobre ventas */
    public function getPorcentajeUtilidadAttribute(): float
    {
        if ((float) $this->total_oc == 0) return 0;
        return round(($this->utilidad / (float) $this->total_oc) * 100, 2);
    }

    /** Color semafórico */
    public function getColorUtilidadAttribute(): string
    {
        $pct = $this->porcentaje_utilidad;
        if ($pct > 20) return 'verde';
        if ($pct >= 5) return 'naranja';
        return 'rojo';
    }

    /** Deuda = monto_pendiente de la deuda vinculada (o total_oc – pagos OC) */
    public function getDeudaPendienteAttribute(): float
    {
        if ($this->deuda_id && $this->relationLoaded('deuda') && $this->deuda) {
            return (float) $this->deuda->monto_pendiente;
        }
        return max(0, (float) $this->total_oc - $this->total_pagado);
    }
}
