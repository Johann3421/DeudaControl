<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entidad extends Model
{
    use HasFactory;

    protected $table = 'entidades';

    protected $fillable = [
        'user_id',
        'razon_social',
        'ruc',
        'tipo',
        'contacto_nombre',
        'contacto_telefono',
        'contacto_email',
        'direccion',
        'notas',
        'estado',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function deudaEntidades(): HasMany
    {
        return $this->hasMany(DeudaEntidad::class);
    }

    public function getNombreCortoAttribute(): string
    {
        return $this->razon_social;
    }
}
