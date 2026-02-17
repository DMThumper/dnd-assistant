<?php

use App\Http\Middleware\BroadcastCors;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'D&D Assistant API',
        'version' => 'v1',
        'documentation' => '/api/v1',
    ]);
});

// Broadcasting auth endpoint with CORS for local development
// Define manually to ensure correct middleware (Laravel 11+ changed Broadcast::routes behavior)
Route::match(['get', 'post'], '/broadcasting/auth', function (Request $request) {
    Log::info("[Broadcasting Auth] Request received", [
        'channel_name' => $request->input('channel_name'),
        'socket_id' => $request->input('socket_id'),
        'user_id' => $request->user()?->id,
        'user_name' => $request->user()?->name,
        'has_bearer' => $request->hasHeader('Authorization'),
    ]);

    try {
        $response = Broadcast::auth($request);
        Log::info("[Broadcasting Auth] Success", [
            'channel_name' => $request->input('channel_name'),
            'response_status' => 200,
        ]);
        return $response;
    } catch (\Exception $e) {
        Log::error("[Broadcasting Auth] Failed", [
            'channel_name' => $request->input('channel_name'),
            'error' => $e->getMessage(),
            'user_id' => $request->user()?->id,
        ]);
        throw $e;
    }
})->middleware(['broadcast.cors', 'auth:api'])->withoutMiddleware(['web']);
