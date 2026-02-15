<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'D&D Assistant API',
        'version' => 'v1',
        'documentation' => '/api/v1',
    ]);
});

// Broadcasting auth endpoint
// Uses auth:api for Bearer token authentication
Broadcast::routes(['middleware' => ['auth:api']]);
