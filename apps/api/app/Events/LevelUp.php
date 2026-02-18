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
 * Broadcast when a character levels up
 */
class LevelUp implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Character $character,
        public int $previousLevel,
        public int $newLevel,
        public ?string $classSlug = null,  // For multiclass - which class got the level
        public array $newFeatures = []
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
        // Only send essential data to avoid Pusher payload limit (~10KB)
        // Frontend should refetch character data after receiving this event
        return [
            'character_id' => $this->character->id,
            'character_name' => $this->character->getTranslation('name', 'ru'),
            'campaign_id' => $this->character->campaign_id,
            'previous_level' => $this->previousLevel,
            'new_level' => $this->newLevel,
            'class_slug' => $this->classSlug,
            // Only feature names to keep payload small
            'new_feature_names' => array_map(fn($f) => $f['name'] ?? '', $this->newFeatures),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'character.level_up';
    }
}
