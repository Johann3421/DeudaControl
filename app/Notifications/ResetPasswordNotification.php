<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as BaseResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends BaseResetPassword
{
    protected function buildMailMessage($url)
    {
        return (new MailMessage)
            ->subject('Restablecer contraseña - DeudaControl')
            ->line('Recibiste este correo porque se solicitó un restablecimiento de contraseña para tu cuenta.')
            ->action('Restablecer contraseña', $url)
            ->line('Si no realizaste esta solicitud, puedes ignorar este mensaje.')
            ->line('Este enlace expira en 60 minutos.');
    }
}
