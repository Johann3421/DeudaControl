<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as BaseVerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends BaseVerifyEmail
{
    protected function buildMailMessage($url)
    {
        return (new MailMessage)
            ->subject('Verifica tu correo electrónico - DeudaControl')
            ->line('Bienvenido a DeudaControl. Haz click en el siguiente botón para verificar tu correo.')
            ->action('Verificar correo', $url)
            ->line('Si no creaste esta cuenta, puedes ignorar este mensaje.');
    }
}
