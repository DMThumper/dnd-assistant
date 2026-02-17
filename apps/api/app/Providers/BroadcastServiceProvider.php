<?php

namespace App\Providers;

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class BroadcastServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Broadcast routes are defined in web.php with custom CORS middleware
        // Here we only load the channel authorization callbacks
        require base_path('routes/channels.php');
    }
}
