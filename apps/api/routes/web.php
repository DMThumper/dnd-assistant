<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'D&D Assistant API',
        'version' => 'v1',
        'documentation' => '/api/v1',
    ]);
});
