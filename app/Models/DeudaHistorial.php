<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeudaHistorial extends Model
{
    use HasFactory;

    protected $table = 'deuda_historial';

    protected $fillable = [
        'deuda_id',
        'user_id',
        'evento',
        'datos_anteriores',
        'datos_nuevos',
        'descripcion',
    ];

    protected function casts(): array
    {
        return [
            'datos_anteriores' => 'array',
            'datos_nuevos' => 'array',
        ];
    }

    public function deuda(): BelongsTo
    {
        return $this->belongsTo(Deuda::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
