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
 * Broadcast when XP is awarded to a character
 */
class XPAwarded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Character $character,
        public int $xpAmount,
        public string $reason = '',
        public bool $canLevelUp = false
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
            'character_name' => $this->character->getTranslation('name', 'ru'),
            'campaign_id' => $this->character->campaign_id,
            'xp_amount' => $this->xpAmount,
            'total_xp' => $this->character->experience_points,
            'current_level' => $this->character->level,
            'reason' => $this->reason,
            'can_level_up' => $this->canLevelUp,
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'xp.awarded';
    }
}
