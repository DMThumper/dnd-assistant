<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Upload Limits
    |--------------------------------------------------------------------------
    */

    'limits' => [
        'portrait' => [
            'max_size' => 10 * 1024 * 1024, // 10MB
            'allowed_types' => ['jpg', 'jpeg', 'png', 'webp'],
        ],
        'scene_background' => [
            'max_size' => 20 * 1024 * 1024, // 20MB
            'allowed_types' => ['jpg', 'jpeg', 'png', 'webp'],
        ],
        'scene_video' => [
            'max_size' => 500 * 1024 * 1024, // 500MB
            'allowed_types' => ['mp4'],
        ],
        'soundtrack' => [
            'max_size' => 50 * 1024 * 1024, // 50MB
            'allowed_types' => ['mp3', 'ogg', 'wav'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Image Conversions
    |--------------------------------------------------------------------------
    */

    'conversions' => [
        'portrait' => [
            'thumb' => ['width' => 200, 'height' => 200],
            'large' => ['width' => 600, 'height' => 600],
        ],
        'scene_background' => [
            'thumb' => ['width' => 400, 'height' => 225],
            'large' => ['width' => 1920, 'height' => 1080],
        ],
    ],

];
