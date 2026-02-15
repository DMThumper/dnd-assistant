<?php

namespace Database\Factories;

use App\Models\RuleSystem;
use App\Models\Setting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Setting>
 */
class SettingFactory extends Factory
{
    protected $model = Setting::class;

    public function definition(): array
    {
        return [
            'rule_system_id' => RuleSystem::factory(),
            'name' => ['ru' => $this->faker->words(2, true)],
            'description' => ['ru' => $this->faker->sentence()],
            'slug' => $this->faker->unique()->slug(),
            'is_system' => false,
            'icon' => 'castle',
            'color' => '#8B0000',
            'sort_order' => 0,
        ];
    }

    /**
     * Configure as a system preset (Eberron style)
     */
    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_system' => true,
            'slug' => 'eberron-test',
            'name' => ['ru' => 'Эберрон (тест)'],
        ]);
    }

    /**
     * Set custom rule system
     */
    public function forRuleSystem(RuleSystem $ruleSystem): static
    {
        return $this->state(fn (array $attributes) => [
            'rule_system_id' => $ruleSystem->id,
        ]);
    }
}
