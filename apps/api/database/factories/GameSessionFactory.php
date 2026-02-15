<?php

namespace Database\Factories;

use App\Models\Act;
use App\Models\GameSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GameSession>
 */
class GameSessionFactory extends Factory
{
    protected $model = GameSession::class;

    public function definition(): array
    {
        return [
            'act_id' => Act::factory(),
            'number' => 1,
            'name' => ['ru' => 'Сессия ' . $this->faker->numberBetween(1, 20) . ': ' . $this->faker->words(3, true)],
            'summary' => null,
            'status' => GameSession::STATUS_PLANNED,
            'played_at' => null,
            'sort_order' => 0,
        ];
    }

    /**
     * Set the session as planned
     */
    public function planned(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => GameSession::STATUS_PLANNED,
            'played_at' => null,
        ]);
    }

    /**
     * Set the session as active
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => GameSession::STATUS_ACTIVE,
            'played_at' => now()->toDateString(),
        ]);
    }

    /**
     * Set the session as completed
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => GameSession::STATUS_COMPLETED,
            'played_at' => $this->faker->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
            'summary' => ['ru' => $this->faker->paragraph()],
        ]);
    }

    /**
     * Set custom act
     */
    public function forAct(Act $act): static
    {
        return $this->state(fn (array $attributes) => [
            'act_id' => $act->id,
        ]);
    }

    /**
     * Set session number
     */
    public function number(int $number): static
    {
        return $this->state(fn (array $attributes) => [
            'number' => $number,
            'sort_order' => $number - 1,
        ]);
    }

    /**
     * Set played date
     */
    public function playedOn(string $date): static
    {
        return $this->state(fn (array $attributes) => [
            'played_at' => $date,
        ]);
    }
}
