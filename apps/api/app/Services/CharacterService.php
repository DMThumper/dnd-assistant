<?php

namespace App\Services;

use App\Events\CharacterUpdated;
use App\Events\ConditionChanged;
use App\Events\CustomRuleChanged;
use App\Events\ItemReceived;
use App\Events\XPAwarded;
use App\Models\Character;
use App\Models\RuleSystem;
use Illuminate\Support\Str;

class CharacterService
{
    /**
     * Modify character HP (damage, healing, temp HP)
     */
    public function modifyHp(Character $character, int $amount, string $type = 'damage'): Character
    {
        $changes = ['previous_hp' => $character->current_hp, 'previous_temp' => $character->temp_hp];

        switch ($type) {
            case 'damage':
                $remaining = $amount;

                // First, reduce temp HP
                if ($character->temp_hp > 0) {
                    $tempReduction = min($character->temp_hp, $remaining);
                    $character->temp_hp -= $tempReduction;
                    $remaining -= $tempReduction;
                }

                // Then reduce current HP
                if ($remaining > 0) {
                    $character->current_hp = max(0, $character->current_hp - $remaining);
                }
                break;

            case 'healing':
                // Healing cannot exceed max HP
                $character->current_hp = min($character->max_hp, $character->current_hp + $amount);
                break;

            case 'temp_hp':
                // Temp HP doesn't stack - use higher value
                $character->temp_hp = max($character->temp_hp, $amount);
                break;

            case 'set':
                // Directly set HP (for DM overrides)
                $character->current_hp = max(0, min($character->max_hp, $amount));
                break;
        }

        $character->save();

        $changes['new_hp'] = $character->current_hp;
        $changes['new_temp'] = $character->temp_hp;
        $changes['type'] = $type;
        $changes['amount'] = $amount;

        broadcast(new CharacterUpdated($character, 'hp', $changes));

        return $character;
    }

    /**
     * Award XP to a character
     */
    public function awardXp(Character $character, int $amount, string $reason = ''): array
    {
        $previousXp = $character->experience_points;
        $previousLevel = $character->level;

        $character->experience_points += $amount;
        $character->save();

        // Check if can level up
        $ruleSystem = $this->getRuleSystem($character);
        $canLevelUp = $ruleSystem ? $ruleSystem->canLevelUp($character->level, $character->experience_points) : false;

        broadcast(new XPAwarded($character, $amount, $reason, $canLevelUp));

        return [
            'previous_xp' => $previousXp,
            'new_xp' => $character->experience_points,
            'xp_added' => $amount,
            'previous_level' => $previousLevel,
            'current_level' => $character->level,
            'can_level_up' => $canLevelUp,
        ];
    }

    /**
     * Add a D&D standard condition
     */
    public function addCondition(Character $character, array $condition): Character
    {
        $conditions = $character->conditions ?? [];

        // Check if condition already exists
        $existingIndex = collect($conditions)->search(fn ($c) => $c['key'] === $condition['key']);

        if ($existingIndex !== false) {
            // Update existing condition
            $conditions[$existingIndex] = array_merge($conditions[$existingIndex], $condition);
        } else {
            // Add new condition with timestamp
            $condition['applied_at'] = now()->toISOString();
            $conditions[] = $condition;
        }

        $character->conditions = $conditions;
        $character->save();

        broadcast(new ConditionChanged($character, 'added', $condition, $conditions));

        return $character;
    }

    /**
     * Remove a D&D standard condition
     */
    public function removeCondition(Character $character, string $conditionKey): Character
    {
        $conditions = $character->conditions ?? [];
        $removed = null;

        $conditions = array_values(array_filter($conditions, function ($c) use ($conditionKey, &$removed) {
            if ($c['key'] === $conditionKey) {
                $removed = $c;
                return false;
            }
            return true;
        }));

        $character->conditions = $conditions;
        $character->save();

        if ($removed) {
            broadcast(new ConditionChanged($character, 'removed', $removed, $conditions));
        }

        return $character;
    }

    /**
     * Add a custom rule (perk/affliction)
     */
    public function addCustomRule(Character $character, array $ruleData): Character
    {
        $customRules = $character->custom_rules ?? [];

        // Generate ID if not provided
        if (empty($ruleData['id'])) {
            $ruleData['id'] = (string) Str::uuid();
        }

        $ruleData['applied_at'] = now()->toISOString();
        $customRules[] = $ruleData;

        $character->custom_rules = $customRules;
        $character->save();

        broadcast(new CustomRuleChanged($character, 'added', $ruleData, $customRules));

        return $character;
    }

    /**
     * Update a custom rule
     */
    public function updateCustomRule(Character $character, string $ruleId, array $updates): Character
    {
        $customRules = $character->custom_rules ?? [];
        $updated = null;

        $customRules = array_map(function ($rule) use ($ruleId, $updates, &$updated) {
            if ($rule['id'] === $ruleId) {
                $updated = array_merge($rule, $updates);
                return $updated;
            }
            return $rule;
        }, $customRules);

        $character->custom_rules = $customRules;
        $character->save();

        if ($updated) {
            broadcast(new CustomRuleChanged($character, 'updated', $updated, $customRules));
        }

        return $character;
    }

    /**
     * Remove a custom rule
     */
    public function removeCustomRule(Character $character, string $ruleId): Character
    {
        $customRules = $character->custom_rules ?? [];
        $removed = null;

        $customRules = array_values(array_filter($customRules, function ($rule) use ($ruleId, &$removed) {
            if ($rule['id'] === $ruleId) {
                $removed = $rule;
                return false;
            }
            return true;
        }));

        $character->custom_rules = $customRules;
        $character->save();

        if ($removed) {
            broadcast(new CustomRuleChanged($character, 'removed', $removed, $customRules));
        }

        return $character;
    }

    /**
     * Give an item to a character
     */
    public function giveItem(Character $character, array $itemData, int $quantity = 1, string $source = ''): Character
    {
        $inventory = $character->inventory ?? [];

        // Check if item already exists (by slug or name)
        $identifier = $itemData['item_slug'] ?? $itemData['name'] ?? null;
        $existingIndex = collect($inventory)->search(function ($item) use ($identifier, $itemData) {
            if (isset($itemData['item_slug'])) {
                return ($item['item_slug'] ?? null) === $itemData['item_slug'];
            }
            return ($item['name'] ?? null) === ($itemData['name'] ?? null);
        });

        if ($existingIndex !== false) {
            // Stack items
            $inventory[$existingIndex]['quantity'] = ($inventory[$existingIndex]['quantity'] ?? 1) + $quantity;
        } else {
            // Add new item
            $itemData['quantity'] = $quantity;
            $inventory[] = $itemData;
        }

        $character->inventory = $inventory;
        $character->save();

        broadcast(new ItemReceived($character, $itemData, $quantity, $source));

        return $character;
    }

    /**
     * Remove an item from inventory
     */
    public function removeItem(Character $character, string $identifier, int $quantity = 1): Character
    {
        $inventory = $character->inventory ?? [];

        $inventory = array_values(array_filter(array_map(function ($item) use ($identifier, $quantity) {
            $matches = ($item['item_slug'] ?? null) === $identifier || ($item['name'] ?? null) === $identifier;

            if ($matches) {
                $newQty = ($item['quantity'] ?? 1) - $quantity;
                if ($newQty <= 0) {
                    return null; // Remove item
                }
                $item['quantity'] = $newQty;
            }

            return $item;
        }, $inventory)));

        $character->inventory = $inventory;
        $character->save();

        broadcast(new CharacterUpdated($character, 'inventory', ['removed' => $identifier, 'quantity' => $quantity]));

        return $character;
    }

    /**
     * Modify currency
     */
    public function modifyCurrency(Character $character, string $type, int $amount): Character
    {
        $currency = $character->currency ?? ['cp' => 0, 'sp' => 0, 'ep' => 0, 'gp' => 0, 'pp' => 0];

        if (isset($currency[$type])) {
            $currency[$type] = max(0, $currency[$type] + $amount);
        }

        $character->currency = $currency;
        $character->save();

        broadcast(new CharacterUpdated($character, 'currency', ['type' => $type, 'amount' => $amount]));

        return $character;
    }

    /**
     * Toggle inspiration
     */
    public function toggleInspiration(Character $character): Character
    {
        $character->inspiration = !$character->inspiration;
        $character->save();

        broadcast(new CharacterUpdated($character, 'inspiration', ['value' => $character->inspiration]));

        return $character;
    }

    /**
     * Get the rule system for a character
     */
    private function getRuleSystem(Character $character): ?RuleSystem
    {
        return $character->campaign?->setting?->ruleSystem;
    }
}
