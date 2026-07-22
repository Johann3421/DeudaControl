<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServicioWeb extends Model
{
    use HasFactory;

    protected $table = 'servicios_web';

    protected $fillable = [
        'tipo',
        'proveedor',
        'nombre',
        'fecha_vencimiento',
        'monto',
        'moneda',
        'periodo',
        'estado',
        'alertado',
        'notas',
    ];

    protected $casts = [
        'fecha_vencimiento' => 'date',
        'monto' => 'decimal:2',
        'alertado' => 'boolean',
    ];
}
