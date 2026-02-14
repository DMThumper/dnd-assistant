<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerifyEmailMailable extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $verificationUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(
                config('mail.from.address', 'noreply@dnd-assistant.local'),
                config('mail.from.name', 'D&D Assistant')
            ),
            subject: 'Подтвердите ваш email - D&D Assistant',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verify-email',
            with: [
                'verificationUrl' => $this->verificationUrl,
            ],
        );
    }
}
