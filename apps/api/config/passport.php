<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Passport Guard
    |--------------------------------------------------------------------------
    */

    'guard' => 'web',

    /*
    |--------------------------------------------------------------------------
    | Encryption Keys
    |--------------------------------------------------------------------------
    */

    'private_key' => env('PASSPORT_PRIVATE_KEY_BASE64')
        ? base64_decode(env('PASSPORT_PRIVATE_KEY_BASE64'))
        : env('PASSPORT_PRIVATE_KEY'),

    'public_key' => env('PASSPORT_PUBLIC_KEY_BASE64')
        ? base64_decode(env('PASSPORT_PUBLIC_KEY_BASE64'))
        : env('PASSPORT_PUBLIC_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Passport Database Connection
    |--------------------------------------------------------------------------
    */

    'connection' => env('PASSPORT_CONNECTION'),

];
