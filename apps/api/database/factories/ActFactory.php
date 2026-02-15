<?php

namespace Database\Factories;

use App\Models\Act;
use App\Models\Campaign;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Act>
 */
class ActFactory extends Factory
{
    protected $model = Act::class;

    public function definition(): array
    {
        return [
            'campaign_id' => Campaign::factory(),
            'number' => 1,
            'name' => ['ru' => 'Акт ' . $this->faker->numberBetween(1, 10) . ': ' . $this->faker->words(3, true)],
            'description' => ['ru' => $this->faker->paragraph()],
            'intro' => ['ru' => $this->faker->paragraph()],
            'epilogue' => null,
            'status' => Act::STATUS_PLANNED,
            'sort_order' => 0,
        ];
    }

    /**
     * Set the act as planned
     */
    public function planned(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Act::STATUS_PLANNED,
        ]);
    }

    /**
     * Set the act as active
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Act::STATUS_ACTIVE,
        ]);
    }

    /**
     * Set the act as completed
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Act::STATUS_COMPLETED,
            'epilogue' => ['ru' => $this->faker->paragraph()],
        ]);
    }

    /**
     * Set custom campaign
     */
    public function forCampaign(Campaign $campaign): static
    {
        return $this->state(fn (array $attributes) => [
            'campaign_id' => $campaign->id,
        ]);
    }

    /**
     * Set act number
     */
    public function number(int $number): static
    {
        return $this->state(fn (array $attributes) => [
            'number' => $number,
            'sort_order' => $number - 1,
        ]);
    }
}
