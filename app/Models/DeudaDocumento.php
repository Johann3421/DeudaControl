<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeudaDocumento extends Model
{
    use HasFactory;

    protected $table = 'deuda_documentos';

    protected $fillable = [
        'deuda_id',
        'titulo',
        'path',
        'mime',
        'size',
        'uploaded_by',
    ];

    public function deuda(): BelongsTo
    {
        return $this->belongsTo(Deuda::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
