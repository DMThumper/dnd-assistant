<?php

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\Character;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Character>
 */
class CharacterFactory extends Factory
{
    protected $model = Character::class;

    public function definition(): array
    {
        $maxHp = $this->faker->numberBetween(8, 50);

        return [
            'user_id' => User::factory(),
            'campaign_id' => Campaign::factory(),
            'name' => ['ru' => $this->faker->name()],
            'backstory' => ['ru' => $this->faker->paragraph()],
            'race_slug' => 'human',
            'class_slug' => 'fighter',
            'level' => 1,
            'experience_points' => 0,
            'abilities' => [
                'strength' => $this->faker->numberBetween(8, 18),
                'dexterity' => $this->faker->numberBetween(8, 18),
                'constitution' => $this->faker->numberBetween(8, 18),
                'intelligence' => $this->faker->numberBetween(8, 18),
                'wisdom' => $this->faker->numberBetween(8, 18),
                'charisma' => $this->faker->numberBetween(8, 18),
            ],
            'current_hp' => $maxHp,
            'max_hp' => $maxHp,
            'temp_hp' => 0,
            'armor_class' => $this->faker->numberBetween(10, 18),
            'speed' => ['walk' => 9],
            'inspiration' => false,
            'skill_proficiencies' => ['athletics', 'perception'],
            'skill_expertise' => [],
            'saving_throw_proficiencies' => ['strength', 'constitution'],
            'proficiencies' => [
                'armor' => ['light', 'medium', 'heavy', 'shields'],
                'weapons' => ['simple', 'martial'],
                'tools' => [],
                'languages' => ['Общий'],
            ],
            'death_saves' => ['successes' => 0, 'failures' => 0],
            'hit_dice_remaining' => ['d10' => 1],
            'features' => [],
            'class_resources' => [],
            'currency' => ['cp' => 0, 'sp' => 0, 'ep' => 0, 'gp' => 15, 'pp' => 0],
            'is_alive' => true,
            'is_active' => true,
            'death_info' => null,
            'stats' => ['sessions_played' => 0],
            'conditions' => [],
            'custom_rules' => [],
            'inventory' => [],
            'equipment' => [],
            'prepared_spells' => [],
            'known_spells' => [],
            'spell_slots_remaining' => [],
            'class_levels' => ['fighter' => 1],
            'subclasses' => [],
            'asi_choices' => [],
        ];
    }

    /**
     * Set character as alive
     */
    public function alive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_alive' => true,
            'death_info' => null,
        ]);
    }

    /**
     * Set character as dead
     */
    public function dead(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_alive' => false,
            'is_active' => false,
            'current_hp' => 0,
            'death_info' => [
                'killed_by' => 'Гоблин-вожак',
                'killing_blow' => '12 урона рубящего',
                'cause' => 'combat',
                'session_number' => 1,
                'death_date' => now()->toDateString(),
                'last_words' => null,
                'revived' => false,
            ],
        ]);
    }

    /**
     * Set character as active
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    /**
     * Set character as inactive
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    /**
     * Set custom owner
     */
    public function forOwner(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
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
     * Set character level
     */
    public function level(int $level): static
    {
        return $this->state(fn (array $attributes) => [
            'level' => $level,
            'hit_dice_remaining' => ['d10' => $level],
        ]);
    }

    /**
     * Set character HP
     */
    public function withHp(int $current, int $max, int $temp = 0): static
    {
        return $this->state(fn (array $attributes) => [
            'current_hp' => $current,
            'max_hp' => $max,
            'temp_hp' => $temp,
        ]);
    }

    /**
     * Add conditions to character
     */
    public function withConditions(array $conditions): static
    {
        return $this->state(fn (array $attributes) => [
            'conditions' => $conditions,
        ]);
    }

    /**
     * Add custom rules to character
     */
    public function withCustomRules(array $rules): static
    {
        return $this->state(fn (array $attributes) => [
            'custom_rules' => $rules,
        ]);
    }

    /**
     * Set character currency
     */
    public function withCurrency(int $gp = 0, int $sp = 0, int $cp = 0): static
    {
        return $this->state(fn (array $attributes) => [
            'currency' => [
                'cp' => $cp,
                'sp' => $sp,
                'ep' => 0,
                'gp' => $gp,
                'pp' => 0,
            ],
        ]);
    }

    /**
     * Set inspiration
     */
    public function withInspiration(bool $value = true): static
    {
        return $this->state(fn (array $attributes) => [
            'inspiration' => $value,
        ]);
    }
}
