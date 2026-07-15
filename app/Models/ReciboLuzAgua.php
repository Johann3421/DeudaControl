<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReciboLuzAgua extends Model
{
    use HasFactory;

    protected $table = 'recibos_luz_agua';

    protected $fillable = [
        'tipo',
        'numero_suministro',
        'fecha_emision',
        'fecha_vencimiento',
        'monto',
        'estado',
        'mes_recibo',
        'alertado',
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_vencimiento' => 'date',
        'monto' => 'decimal:2',
        'alertado' => 'boolean',
    ];
}
