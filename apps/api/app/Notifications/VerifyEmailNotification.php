<?php

namespace App\Notifications;

use App\Mail\VerifyEmailMailable;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): VerifyEmailMailable
    {
        return (new VerifyEmailMailable($this->verificationUrl($notifiable)))
            ->to($notifiable->email);
    }

    /**
     * Build the verification URL that points to the frontend
     */
    protected function verificationUrl(object $notifiable): string
    {
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');

        // Create signed API URL
        $apiUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(60),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        // Extract signature and expires from API URL
        $parsedUrl = parse_url($apiUrl);
        parse_str($parsedUrl['query'] ?? '', $queryParams);

        // Build frontend URL with verification params
        return $frontendUrl . '/ru/verify-email?' . http_build_query([
            'id' => $notifiable->getKey(),
            'hash' => sha1($notifiable->getEmailForVerification()),
            'expires' => $queryParams['expires'] ?? '',
            'signature' => $queryParams['signature'] ?? '',
        ]);
    }
}
