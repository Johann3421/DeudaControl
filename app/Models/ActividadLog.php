<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ActividadLog extends Model
{
    protected $fillable = [
        'user_id',
        'accion',
        'entidad_tipo',
        'entidad_id',
        'descripcion',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Registra una acción en el historial de actividad.
     */
    public static function registrar(
        string $accion,
        string $entidad_tipo,
        ?int $entidad_id,
        string $descripcion
    ): void {
        static::create([
            'user_id'      => Auth::id(),
            'accion'       => $accion,
            'entidad_tipo' => $entidad_tipo,
            'entidad_id'   => $entidad_id,
            'descripcion'  => $descripcion,
        ]);
    }
}
