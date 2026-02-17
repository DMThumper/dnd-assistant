<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BroadcastCors
{
    public function handle(Request $request, Closure $next): Response
    {
        // Allow any localhost port in development
        $origin = $request->header('Origin');
        $allowedOrigin = $this->isAllowedOrigin($origin) ? $origin : 'http://localhost:3000';

        // Handle preflight OPTIONS request
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Socket-Id')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        // Add CORS headers to actual response
        $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }

    private function isAllowedOrigin(?string $origin): bool
    {
        if (!$origin) {
            return false;
        }

        // Allow any localhost port in development
        if (preg_match('/^http:\/\/localhost:\d+$/', $origin)) {
            return true;
        }

        // Add production domains here
        $allowedDomains = [
            'http://localhost:3000',
        ];

        return in_array($origin, $allowedDomains);
    }
}
