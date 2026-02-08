<?php

namespace App\Providers;

use App\Services\WhatsApp\Contracts\WhatsAppProviderInterface;
use App\Services\WhatsApp\Providers\DefaultWhatsAppProvider;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(WhatsAppProviderInterface::class, DefaultWhatsAppProvider::class);
    }

    public function boot(): void
    {
        //
    }
}
