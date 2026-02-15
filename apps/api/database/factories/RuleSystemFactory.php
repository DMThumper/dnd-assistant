<?php

namespace Database\Factories;

use App\Models\RuleSystem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RuleSystem>
 */
class RuleSystemFactory extends Factory
{
    protected $model = RuleSystem::class;

    public function definition(): array
    {
        return [
            'name' => ['ru' => $this->faker->words(3, true)],
            'description' => ['ru' => $this->faker->sentence()],
            'slug' => $this->faker->unique()->slug(),
            'is_system' => false,
            'abilities' => [
                ['key' => 'strength', 'name' => 'Сила', 'short' => 'СИЛ'],
                ['key' => 'dexterity', 'name' => 'Ловкость', 'short' => 'ЛОВ'],
                ['key' => 'constitution', 'name' => 'Телосложение', 'short' => 'ТЕЛ'],
                ['key' => 'intelligence', 'name' => 'Интеллект', 'short' => 'ИНТ'],
                ['key' => 'wisdom', 'name' => 'Мудрость', 'short' => 'МДР'],
                ['key' => 'charisma', 'name' => 'Харизма', 'short' => 'ХАР'],
            ],
            'skills' => [
                ['key' => 'athletics', 'ability' => 'strength', 'name' => 'Атлетика'],
                ['key' => 'acrobatics', 'ability' => 'dexterity', 'name' => 'Акробатика'],
                ['key' => 'perception', 'ability' => 'wisdom', 'name' => 'Внимательность'],
            ],
            'dice' => ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'],
            'formulas' => [
                'ability_modifier' => 'floor((score - 10) / 2)',
                'proficiency_bonus' => 'floor((level - 1) / 4) + 2',
            ],
            'conditions' => [
                ['key' => 'blinded', 'name' => 'Ослеплён'],
                ['key' => 'poisoned', 'name' => 'Отравлен'],
                ['key' => 'stunned', 'name' => 'Ошеломлён'],
            ],
            'damage_types' => [
                ['key' => 'fire', 'name' => 'Огонь'],
                ['key' => 'cold', 'name' => 'Холод'],
                ['key' => 'slashing', 'name' => 'Рубящий'],
            ],
            'magic_schools' => [],
            'level_range' => ['min' => 1, 'max' => 20],
            'combat_rules' => [
                'initiative_type' => 'individual',
                'death_saves' => true,
                'death_save_successes' => 3,
                'death_save_failures' => 3,
            ],
            'character_creation' => [
                'methods' => ['point_buy', 'standard_array', 'roll'],
                'point_buy_budget' => 27,
                'standard_array' => [15, 14, 13, 12, 10, 8],
            ],
            'currency' => [
                'units' => [
                    ['key' => 'cp', 'name' => 'Медные', 'rate' => 1],
                    ['key' => 'sp', 'name' => 'Серебряные', 'rate' => 10],
                    ['key' => 'gp', 'name' => 'Золотые', 'rate' => 100],
                ],
            ],
            'units' => [
                'system' => 'metric',
                'distance' => 'м',
                'weight' => 'кг',
            ],
            'experience_table' => [
                '1' => 0,
                '2' => 300,
                '3' => 900,
                '4' => 2700,
                '5' => 6500,
            ],
        ];
    }

    /**
     * Configure as a system preset (D&D 5e style)
     */
    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_system' => true,
            'slug' => 'dnd-5e-test',
            'name' => ['ru' => 'D&D 5e (тест)'],
        ]);
    }
}
