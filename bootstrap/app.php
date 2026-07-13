<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        // 👇 ESTA PARTE ES LA IMPORTANTE
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR |
                     Request::HEADER_X_FORWARDED_HOST |
                     Request::HEADER_X_FORWARDED_PORT |
                     Request::HEADER_X_FORWARDED_PROTO |
                     Request::HEADER_X_FORWARDED_AWS_ELB
        );

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        // Excluir rutas API de verificación CSRF.
        // Razón: las APIs públicas (alertas, chatbot, diagnostic) usan autenticación
        // por token estático (X-Alertas-Token o query string) — no usan sesión.
        // CSRF solo aplica a requests con sesión. Las rutas maintenance/* también
        // usan token en query string. La seguridad se mantiene por el token.
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'maintenance/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function ($response, $exception, $request) {
            if (! $request->expectsJson() && ! $request->header('X-Inertia')) {
                return $response;
            }

            if ($exception instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                return \Inertia\Inertia::render('Errors/NotFound')->toResponse($request)->setStatusCode(404);
            }

            if ($exception instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException
                || $exception instanceof \Illuminate\Auth\Access\AuthorizationException) {
                return \Inertia\Inertia::render('Errors/Forbidden')->toResponse($request)->setStatusCode(403);
            }

            return $response;
        });
    })->create();
