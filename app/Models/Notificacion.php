<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notificacion extends Model
{
    use HasFactory;

    protected $table = 'notificaciones';

    protected $fillable = [
        'user_id',
        'deuda_id',
        'canal',
        'estado',
        'mensaje',
        'destinatario',
        'fecha_envio',
        'error',
    ];

    protected function casts(): array
    {
        return [
            'fecha_envio' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function deuda(): BelongsTo
    {
        return $this->belongsTo(Deuda::class);
    }

    public function marcarEnviada(): void
    {
        $this->update([
            'estado' => 'enviada',
            'fecha_envio' => now(),
        ]);
    }

    public function marcarFallida(string $error): void
    {
        $this->update([
            'estado' => 'fallida',
            'error' => $error,
        ]);
    }
}
