<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Handle CORS preflight for /broadcasting/* routes in local development
// Only handle OPTIONS here - actual requests will be handled by Laravel
$isBroadcastingRoute = str_starts_with($_SERVER['REQUEST_URI'] ?? '', '/broadcasting/');
$isLocalOrigin = ($_SERVER['HTTP_ORIGIN'] ?? '') === 'http://localhost:3000';

if ($isBroadcastingRoute && $isLocalOrigin && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: http://localhost:3000');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Socket-Id');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
