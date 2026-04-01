<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Deuda;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'csrf_token' => csrf_token(),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'rol' => $request->user()->rol,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'notificaciones' => function () use ($request) {
                if ($request->user() && $request->user()->rol === 'superadmin') {
                    $deudas = Deuda::where('estado', 'activa')
                        ->whereNotNull('fecha_vencimiento')
                        ->where('fecha_vencimiento', '<=', now()->addDays(7))
                        ->orderBy('fecha_vencimiento', 'asc')
                        ->get();
                    
                    return $deudas->map(function ($d) {
                        return [
                            'id' => $d->id,
                            'descripcion' => $d->descripcion,
                            'fecha_vencimiento' => $d->fecha_vencimiento->format('Y-m-d'),
                            'esta_vencida' => $d->fecha_vencimiento->isPast(),
                            'monto_pendiente' => $d->monto_pendiente,
                            'currency_code' => $d->currency_code,
                            'tipo_deuda' => $d->tipo_deuda,
                        ];
                    });
                }
                return [];
            },
        ];
    }
}
