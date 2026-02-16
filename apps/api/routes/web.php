<?php

use App\Http\Middleware\BroadcastCors;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'D&D Assistant API',
        'version' => 'v1',
        'documentation' => '/api/v1',
    ]);
});

// Broadcasting auth endpoint with CORS for local development
// BroadcastCors middleware handles OPTIONS preflight and adds CORS headers
Broadcast::routes(['middleware' => [BroadcastCors::class, 'auth:api']]);
