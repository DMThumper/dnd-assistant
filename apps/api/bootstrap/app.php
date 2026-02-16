<?php

use App\Http\Middleware\BackofficeAccess;
use App\Http\Middleware\BroadcastCors;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Trust all proxies (running behind Nginx/Coolify)
        $middleware->trustProxies(at: '*');

        // Add custom CORS for broadcasting (handles OPTIONS + adds headers)
        // This must run FIRST to catch preflight requests
        $middleware->prepend(BroadcastCors::class);

        // Register middleware aliases
        $middleware->alias([
            'backoffice' => BackofficeAccess::class,
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
