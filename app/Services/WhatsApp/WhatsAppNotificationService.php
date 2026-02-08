<?php

namespace App\Services\WhatsApp;

use App\Models\Deuda;
use App\Models\Notificacion;
use App\Services\WhatsApp\Contracts\WhatsAppProviderInterface;
use Illuminate\Support\Facades\Log;

class WhatsAppNotificationService
{
    public function __construct(
        private WhatsAppProviderInterface $provider
    ) {}

    public function enviarRecordatorioVencimiento(Deuda $deuda): ?Notificacion
    {
        $destinatario = $this->obtenerDestinatario($deuda);
        if (!$destinatario) {
            return null;
        }

        $mensaje = $this->construirMensajeVencimiento($deuda);

        $notificacion = Notificacion::create([
            'user_id' => $deuda->user_id,
            'deuda_id' => $deuda->id,
            'canal' => 'whatsapp',
            'estado' => 'pendiente',
            'mensaje' => $mensaje,
            'destinatario' => $destinatario,
        ]);

        $enviado = $this->provider->send($destinatario, $mensaje);

        if ($enviado) {
            $notificacion->marcarEnviada();
        } else {
            $notificacion->marcarFallida('Error al enviar mensaje WhatsApp');
        }

        return $notificacion;
    }

    public function enviarNotificacionGrupo(string $groupId, string $mensaje, Deuda $deuda): ?Notificacion
    {
        $notificacion = Notificacion::create([
            'user_id' => $deuda->user_id,
            'deuda_id' => $deuda->id,
            'canal' => 'whatsapp',
            'estado' => 'pendiente',
            'mensaje' => $mensaje,
            'destinatario' => $groupId,
        ]);

        $enviado = $this->provider->sendToGroup($groupId, $mensaje);

        if ($enviado) {
            $notificacion->marcarEnviada();
        } else {
            $notificacion->marcarFallida('Error al enviar mensaje al grupo WhatsApp');
        }

        return $notificacion;
    }

    private function obtenerDestinatario(Deuda $deuda): ?string
    {
        if ($deuda->esParticular() || $deuda->esAlquiler()) {
            return $deuda->cliente?->telefono;
        }

        if ($deuda->esEntidad()) {
            $extension = $deuda->deudaEntidad;
            return $extension?->entidad?->contacto_telefono;
        }

        return null;
    }

    private function construirMensajeVencimiento(Deuda $deuda): string
    {
        $tipo = match ($deuda->tipo_deuda) {
            'particular' => 'prestamo',
            'entidad' => 'deuda con entidad',
            'alquiler' => 'alquiler',
            default => 'deuda',
        };

        $nombreDeudor = $this->obtenerNombreDeudor($deuda);
        $fechaVencimiento = $deuda->fecha_vencimiento?->format('d/m/Y') ?? 'sin fecha';
        $montoPendiente = number_format($deuda->monto_pendiente, 2);

        return "Recordatorio de pago:\n\n"
            . "Tipo: {$tipo}\n"
            . "Deudor: {$nombreDeudor}\n"
            . "Descripcion: {$deuda->descripcion}\n"
            . "Monto pendiente: \${$montoPendiente}\n"
            . "Fecha de vencimiento: {$fechaVencimiento}\n\n"
            . "Por favor, realizar el pago a la brevedad posible.";
    }

    private function obtenerNombreDeudor(Deuda $deuda): string
    {
        if ($deuda->esParticular() || $deuda->esAlquiler()) {
            return $deuda->cliente?->nombre_completo ?? 'N/A';
        }

        if ($deuda->esEntidad()) {
            return $deuda->deudaEntidad?->entidad?->razon_social ?? 'N/A';
        }

        return 'N/A';
    }
}
