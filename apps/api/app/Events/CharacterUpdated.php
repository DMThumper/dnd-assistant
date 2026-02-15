<?php

namespace App\Events;

use App\Models\Character;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when character data is updated (HP, conditions, resources, etc.)
 */
class CharacterUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Character $character,
        public string $updateType = 'general',
        public array $changes = []
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('character.' . $this->character->id),
            new PrivateChannel('campaign.' . $this->character->campaign_id),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'character_id' => $this->character->id,
            'campaign_id' => $this->character->campaign_id,
            'update_type' => $this->updateType,
            'changes' => $this->changes,
            'character' => $this->character->formatForApi(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'character.updated';
    }
}
