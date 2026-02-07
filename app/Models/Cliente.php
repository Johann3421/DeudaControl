<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    use HasFactory;

    protected $table = 'clientes';

    protected $fillable = [
        'user_id',
        'nombre',
        'apellido',
        'cedula',
        'telefono',
        'email',
        'direccion',
        'notas',
        'estado',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function deudas(): HasMany
    {
        return $this->hasMany(Deuda::class);
    }

    public function deudasActivas(): HasMany
    {
        return $this->hasMany(Deuda::class)->where('estado', 'activa');
    }

    public function getNombreCompletoAttribute(): string
    {
        return "{$this->nombre} {$this->apellido}";
    }

    public function getTotalDeudaAttribute(): float
    {
        return $this->deudas()->where('estado', 'activa')->sum('monto_pendiente');
    }
}
