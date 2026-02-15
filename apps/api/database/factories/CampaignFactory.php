<?php

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Campaign>
 */
class CampaignFactory extends Factory
{
    protected $model = Campaign::class;

    public function definition(): array
    {
        $name = $this->faker->words(3, true);

        return [
            'setting_id' => Setting::factory(),
            'user_id' => User::factory(),
            'name' => ['ru' => $name],
            'description' => ['ru' => $this->faker->sentence()],
            'slug' => Str::slug($name) . '-' . $this->faker->unique()->randomNumber(4),
            'status' => Campaign::STATUS_ACTIVE,
            'settings' => [
                'starting_level' => 1,
                'ability_method' => 'point_buy',
                'hp_method' => 'average',
            ],
        ];
    }

    /**
     * Set campaign as active
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Campaign::STATUS_ACTIVE,
        ]);
    }

    /**
     * Set campaign as paused
     */
    public function paused(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Campaign::STATUS_PAUSED,
        ]);
    }

    /**
     * Set campaign as completed
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Campaign::STATUS_COMPLETED,
        ]);
    }

    /**
     * Set custom owner (DM)
     */
    public function forOwner(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }

    /**
     * Set custom setting
     */
    public function forSetting(Setting $setting): static
    {
        return $this->state(fn (array $attributes) => [
            'setting_id' => $setting->id,
        ]);
    }
}
