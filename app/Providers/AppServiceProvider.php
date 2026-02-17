<?php

namespace App\Providers;

use App\Services\WhatsApp\Contracts\WhatsAppProviderInterface;
use App\Services\WhatsApp\Providers\DefaultWhatsAppProvider;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(WhatsAppProviderInterface::class, DefaultWhatsAppProvider::class);
    }

    public function boot(): void
    {
        if (config('app.env') === 'production') {
        URL::forceScheme('https');
    }
    }
}
