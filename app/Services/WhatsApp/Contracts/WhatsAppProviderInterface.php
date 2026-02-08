<?php

namespace App\Services\WhatsApp\Contracts;

interface WhatsAppProviderInterface
{
    /**
     * Send a WhatsApp message.
     *
     * @param string $to Phone number or group ID
     * @param string $message Message content
     * @return bool Whether the message was sent successfully
     */
    public function send(string $to, string $message): bool;

    /**
     * Send a message to a WhatsApp group.
     *
     * @param string $groupId Group identifier
     * @param string $message Message content
     * @return bool Whether the message was sent successfully
     */
    public function sendToGroup(string $groupId, string $message): bool;
}
