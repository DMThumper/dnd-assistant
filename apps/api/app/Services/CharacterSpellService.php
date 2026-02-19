<?php

namespace App\Services;

use App\Events\CharacterUpdated;
use App\Models\Character;
use App\Models\CharacterClass;
use App\Models\Setting;
use App\Models\Spell;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CharacterSpellService
{
    /**
     * Get the full spellbook for a character
     * Returns all spells with full data, slot info, and concentration status
     */
    public function getSpellbook(Character $character): array
    {
        $campaign = $character->campaign;
        $setting = $campaign->setting;

        // Get character's class(es) and determine spellcasting info
        $characterClass = CharacterClass::where('slug', $character->class_slug)->first();

        if (!$characterClass || !$characterClass->is_spellcaster) {
            return [
                'is_spellcaster' => false,
                'cantrips' => [],
                'known_spells' => [],
                'prepared_spells' => [],
                'circle_spells' => [],
                'circle_terrain' => null,
                'spell_slots' => [],
                'concentration_spell' => null,
                'spellcasting_ability' => null,
                'spell_save_dc' => 0,
                'spell_attack_bonus' => 0,
                'max_prepared' => 0,
                'is_prepared_caster' => false,
            ];
        }

        // Get spellcasting ability modifier
        $spellcastingAbility = $characterClass->spellcasting_ability;
        $abilityMod = $character->getAbilityModifier($spellcastingAbility);
        $proficiencyBonus = $character->getProficiencyBonus();

        // Calculate spell save DC and attack bonus
        $spellSaveDc = 8 + $proficiencyBonus + $abilityMod;
        $spellAttackBonus = $proficiencyBonus + $abilityMod;

        // Determine if this is a prepared caster (cleric, druid, paladin, wizard)
        $preparedCasters = ['cleric', 'druid', 'paladin', 'wizard'];
        $isPreparedCaster = in_array($character->class_slug, $preparedCasters);

        // Calculate max prepared spells
        $maxPrepared = 0;
        if ($isPreparedCaster) {
            // Prepared casters: ability mod + level (minimum 1)
            $maxPrepared = max(1, $abilityMod + $character->level);

            // Paladin/Ranger are half-casters: ability mod + half level
            if (in_array($character->class_slug, ['paladin', 'ranger'])) {
                $maxPrepared = max(1, $abilityMod + floor($character->level / 2));
            }
        }

        // Get spell slots for current level
        $slotData = $characterClass->getSpellSlotsAtLevel($character->level);
        $spellSlots = $this->formatSpellSlots($slotData, $character->spell_slots_remaining ?? []);

        // Get full spell data for known/prepared spells
        // Handle both formats: array of slugs or array of objects with 'slug' key
        $knownSpellSlugs = $this->extractSpellSlugs($character->known_spells ?? []);
        $preparedSpellSlugs = $this->extractSpellSlugs($character->prepared_spells ?? []);

        // Get all spells the character knows
        $allSpellSlugs = array_unique(array_merge($knownSpellSlugs, $preparedSpellSlugs));
        $spells = Spell::whereIn('slug', $allSpellSlugs)->get();

        // Separate cantrips and leveled spells
        $cantrips = [];
        $knownSpells = [];
        $preparedSpells = [];

        foreach ($spells as $spell) {
            $spellData = $spell->getForSetting($setting);

            if ($spell->isCantrip()) {
                $cantrips[] = $spellData;
            } else {
                if (in_array($spell->slug, $knownSpellSlugs)) {
                    $knownSpells[] = $spellData;
                }
                if (in_array($spell->slug, $preparedSpellSlugs)) {
                    $preparedSpells[] = $spellData;
                }
            }
        }

        // Sort spells by level, then name
        $sortSpells = fn($a, $b) => $a['level'] === $b['level']
            ? strcmp($a['name'], $b['name'])
            : $a['level'] <=> $b['level'];

        usort($cantrips, $sortSpells);
        usort($knownSpells, $sortSpells);
        usort($preparedSpells, $sortSpells);

        // Get circle spells for Circle of the Land druids
        $circleSpells = [];
        $circleTerrain = null;
        if ($character->class_slug === 'druid') {
            $circleData = $this->getCircleSpells($character, $characterClass, $setting);
            $circleSpells = $circleData['spells'];
            $circleTerrain = $circleData['terrain'];
        }

        return [
            'is_spellcaster' => true,
            'cantrips' => $cantrips,
            'known_spells' => $knownSpells,
            'prepared_spells' => $preparedSpells,
            'circle_spells' => $circleSpells,
            'circle_terrain' => $circleTerrain,
            'spell_slots' => $spellSlots,
            'concentration_spell' => $character->concentration_spell,
            'spellcasting_ability' => $spellcastingAbility,
            'spell_save_dc' => $spellSaveDc,
            'spell_attack_bonus' => $spellAttackBonus,
            'max_prepared' => $maxPrepared,
            'is_prepared_caster' => $isPreparedCaster,
        ];
    }

    /**
     * Get circle spells for druids with circle subclasses
     * These are always prepared and don't count against prepared limit
     * Supports: Circle of the Land (with terrain), Circle of Wildfire (without terrain)
     */
    private function getCircleSpells(Character $character, CharacterClass $characterClass, Setting $setting): array
    {
        $subclasses = $character->subclasses ?? [];

        // Check if character has a druid subclass
        $druidSubclass = $subclasses['druid'] ?? null;
        if (!$druidSubclass || !isset($druidSubclass['subclass'])) {
            return ['spells' => [], 'terrain' => null];
        }

        $subclassSlug = $druidSubclass['subclass'];

        // Get the subclass model to fetch its circle_spells
        $subclassModel = CharacterClass::where('slug', $subclassSlug)->first();
        if (!$subclassModel || empty($subclassModel->circle_spells)) {
            return ['spells' => [], 'terrain' => null];
        }

        $circleSpells = $subclassModel->circle_spells;
        $circleName = null;
        $availableSpellSlugs = [];

        // Handle Circle of the Land (has terrain selection)
        if ($subclassSlug === 'circle-of-the-land') {
            if (!isset($druidSubclass['terrain'])) {
                return ['spells' => [], 'terrain' => null];
            }

            $terrain = $druidSubclass['terrain'];
            if (!isset($circleSpells[$terrain])) {
                return ['spells' => [], 'terrain' => $terrain];
            }

            $terrainData = $circleSpells[$terrain];
            $circleName = $terrainData['name']['ru'] ?? $terrain;

            // Circle of the Land spells are gained at druid levels 3, 5, 7, 9
            $levelThresholds = [3, 5, 7, 9];
            foreach ($levelThresholds as $threshold) {
                if ($character->level >= $threshold && isset($terrainData[(string)$threshold])) {
                    $availableSpellSlugs = array_merge($availableSpellSlugs, $terrainData[(string)$threshold]);
                }
            }
        }
        // Handle Circle of Wildfire (and other circles with direct level-based spells)
        else {
            $circleName = $circleSpells['name']['ru'] ?? $subclassModel->getTranslation('name', 'ru');

            // Wildfire spells are gained at druid levels 2, 3, 5, 7, 9
            $levelThresholds = [2, 3, 5, 7, 9];
            foreach ($levelThresholds as $threshold) {
                if ($character->level >= $threshold && isset($circleSpells[(string)$threshold])) {
                    $availableSpellSlugs = array_merge($availableSpellSlugs, $circleSpells[(string)$threshold]);
                }
            }
        }

        if (empty($availableSpellSlugs)) {
            return ['spells' => [], 'terrain' => $circleName];
        }

        // Get full spell data
        $spells = Spell::whereIn('slug', $availableSpellSlugs)->get();
        $spellData = $spells->map(fn($spell) => $spell->getForSetting($setting))->toArray();

        // Sort by level, then name
        usort($spellData, fn($a, $b) => $a['level'] === $b['level']
            ? strcmp($a['name'], $b['name'])
            : $a['level'] <=> $b['level']);

        return [
            'spells' => $spellData,
            'terrain' => $circleName,
        ];
    }

    /**
     * Extract spell slugs from array
     * Handles both formats: array of strings or array of objects with 'slug' key
     */
    private function extractSpellSlugs(array $spells): array
    {
        $slugs = array_map(function ($spell) {
            if (is_string($spell)) {
                return $spell;
            }
            if (is_array($spell) && isset($spell['slug'])) {
                return $spell['slug'];
            }
            return null;
        }, $spells);

        return array_filter($slugs, fn($slug) => $slug !== null);
    }

    /**
     * Format spell slots with current/max values
     */
    private function formatSpellSlots(array $classSlots, array $remaining): array
    {
        $formatted = [];

        foreach ($classSlots as $key => $max) {
            // Skip cantrips from slot tracking
            if ($key === 'cantrips') {
                continue;
            }

            // Convert key format (e.g., "1st" -> "1", or "1" -> "1")
            $level = preg_replace('/[^0-9]/', '', $key);
            if (empty($level)) continue;

            $current = $remaining[$level] ?? $remaining[$key] ?? $max;

            $formatted[$level] = [
                'max' => $max,
                'remaining' => $current,
            ];
        }

        return $formatted;
    }

    /**
     * Use a spell slot of a specific level
     */
    public function useSlot(Character $character, int $level): Character
    {
        $remaining = $character->spell_slots_remaining ?? [];

        $key = (string) $level;
        $current = $remaining[$key] ?? 0;

        if ($current <= 0) {
            throw new \Exception("Нет доступных слотов {$level} уровня");
        }

        $remaining[$key] = $current - 1;
        $character->spell_slots_remaining = $remaining;
        $character->save();

        broadcast(new CharacterUpdated($character, 'spell_slots', [
            'action' => 'use',
            'level' => $level,
            'remaining' => $remaining[$key],
        ]));

        return $character;
    }

    /**
     * Restore spell slot(s)
     */
    public function restoreSlot(Character $character, int $level, int $count = 1): Character
    {
        $remaining = $character->spell_slots_remaining ?? [];

        // Get max slots for this level from class
        $characterClass = CharacterClass::where('slug', $character->class_slug)->first();
        $classSlots = $characterClass?->getSpellSlotsAtLevel($character->level) ?? [];

        $key = (string) $level;
        $maxKey = "{$level}st"; // Try "1st", "2nd", etc. format
        if ($level === 2) $maxKey = "2nd";
        if ($level === 3) $maxKey = "3rd";
        if ($level >= 4) $maxKey = "{$level}th";

        $max = $classSlots[$key] ?? $classSlots[$maxKey] ?? 0;
        $current = $remaining[$key] ?? 0;

        $remaining[$key] = min($max, $current + $count);
        $character->spell_slots_remaining = $remaining;
        $character->save();

        broadcast(new CharacterUpdated($character, 'spell_slots', [
            'action' => 'restore',
            'level' => $level,
            'remaining' => $remaining[$key],
        ]));

        return $character;
    }

    /**
     * Take a rest and restore spell slots
     * Short rest: class-specific recovery (Wizard Arcane Recovery, etc.)
     * Long rest: restore all slots
     */
    public function takeRest(Character $character, string $type): Character
    {
        $characterClass = CharacterClass::where('slug', $character->class_slug)->first();

        if ($type === 'long') {
            // Long rest: restore all spell slots (for spellcasters)
            if ($characterClass && $characterClass->is_spellcaster) {
                $classSlots = $characterClass->getSpellSlotsAtLevel($character->level);
                $restored = [];

                foreach ($classSlots as $key => $max) {
                    if ($key === 'cantrips') continue;
                    $level = preg_replace('/[^0-9]/', '', $key);
                    if (!empty($level)) {
                        $restored[$level] = $max;
                    }
                }

                $character->spell_slots_remaining = $restored;
            }

            // Clear concentration on long rest (new day)
            $character->concentration_spell = null;

            // Reset short rest recovery abilities on long rest
            $character->short_rest_recovery_used = [];

            // Restore class resources that recharge on long rest
            $this->restoreClassResources($character, 'long_rest');
        } elseif ($type === 'short') {
            // Restore class resources that recharge on short rest
            $this->restoreClassResources($character, 'short_rest');
        }

        $character->save();

        broadcast(new CharacterUpdated($character, 'rest', [
            'type' => $type,
            'spell_slots_remaining' => $character->spell_slots_remaining,
            'class_resources' => $character->class_resources,
        ]));

        return $character;
    }

    /**
     * Restore class resources based on rest type
     */
    private function restoreClassResources(Character $character, string $rechargeType): void
    {
        $classResources = $character->class_resources ?? [];
        $level = $character->level;
        $proficiencyBonus = $character->getProficiencyBonus();

        foreach ($classResources as &$resource) {
            $resourceRecharge = $resource['recharge'] ?? 'long_rest';

            // Long rest restores everything, short rest only restores short_rest resources
            if ($rechargeType === 'long_rest' || $resourceRecharge === $rechargeType) {
                // Recalculate max in case level changed
                if (isset($resource['max_formula'])) {
                    $resource['max'] = $this->evaluateResourceFormula(
                        $resource['max_formula'],
                        $level,
                        $proficiencyBonus
                    );
                    if (isset($resource['use_max_formula'])) {
                        $resource['use_max'] = $this->evaluateResourceFormula(
                            $resource['use_max_formula'],
                            $level,
                            $proficiencyBonus
                        );
                    }
                }
                $resource['current'] = $resource['max'];
            }
        }

        $character->class_resources = $classResources;
    }

    /**
     * Evaluate a resource formula
     */
    private function evaluateResourceFormula(string $formula, int $level, int $proficiencyBonus): int
    {
        $expression = str_replace(
            ['level', 'proficiency_bonus', 'proficiency'],
            [(string) $level, (string) $proficiencyBonus, (string) $proficiencyBonus],
            $formula
        );

        if (preg_match('/ceil\((.+)\)/', $expression, $matches)) {
            return (int) ceil(eval("return {$matches[1]};"));
        }
        if (preg_match('/floor\((.+)\)/', $expression, $matches)) {
            return (int) floor(eval("return {$matches[1]};"));
        }

        return (int) eval("return {$expression};");
    }

    /**
     * Get available short rest recovery options for a character
     * Checks features for type: resource_modifier, modifies: short_rest
     */
    public function getShortRestRecoveryOptions(Character $character): array
    {
        $features = $character->features ?? [];
        $usedRecoveries = $character->short_rest_recovery_used ?? [];
        $options = [];

        foreach ($features as $feature) {
            if (($feature['type'] ?? '') !== 'resource_modifier') continue;
            if (($feature['modifies'] ?? '') !== 'short_rest') continue;

            $key = $feature['key'] ?? $feature['name'] ?? 'unknown';
            $isUsed = in_array($key, $usedRecoveries);

            // Calculate max recovery based on formula
            $formula = $feature['spell_slots_recovery'] ?? null;
            $maxRecovery = 0;

            if ($formula) {
                // Simple formula parser (supports ceil/floor/level)
                $level = $character->level;
                $expression = str_replace('level', (string) $level, $formula);

                // Handle ceil() and floor()
                if (preg_match('/ceil\((.+)\)/', $expression, $matches)) {
                    $maxRecovery = (int) ceil(eval("return {$matches[1]};"));
                } elseif (preg_match('/floor\((.+)\)/', $expression, $matches)) {
                    $maxRecovery = (int) floor(eval("return {$matches[1]};"));
                } else {
                    $maxRecovery = (int) eval("return {$expression};");
                }
            }

            $options[] = [
                'key' => $key,
                'name' => $feature['name'] ?? 'Восстановление',
                'description' => $feature['description'] ?? '',
                'max_slot_levels' => $maxRecovery,
                'is_used' => $isUsed,
                'available' => !$isUsed && $maxRecovery > 0,
            ];
        }

        return $options;
    }

    /**
     * Use a short rest recovery ability to restore spell slots
     * @param array $slotsToRestore Array of slot levels to restore, e.g. [1, 1, 2] = two 1st level + one 2nd level
     */
    public function useShortRestRecovery(Character $character, string $recoveryKey, array $slotsToRestore): Character
    {
        // Find the recovery ability
        $options = $this->getShortRestRecoveryOptions($character);
        $recovery = collect($options)->firstWhere('key', $recoveryKey);

        if (!$recovery) {
            throw new \Exception("Способность восстановления не найдена");
        }

        if ($recovery['is_used']) {
            throw new \Exception("Эта способность уже была использована. Требуется продолжительный отдых.");
        }

        // Calculate total slot levels being restored
        $totalLevels = array_sum($slotsToRestore);
        if ($totalLevels > $recovery['max_slot_levels']) {
            throw new \Exception("Суммарный уровень слотов ({$totalLevels}) превышает лимит ({$recovery['max_slot_levels']})");
        }

        // Get max slots from class
        $characterClass = CharacterClass::where('slug', $character->class_slug)->first();
        $classSlots = $characterClass ? $characterClass->getSpellSlotsAtLevel($character->level) : [];

        // Restore the slots
        $remaining = $character->spell_slots_remaining ?? [];

        foreach ($slotsToRestore as $slotLevel) {
            $key = (string) $slotLevel;
            $classKey = $slotLevel . 'st';
            if ($slotLevel == 2) $classKey = '2nd';
            if ($slotLevel == 3) $classKey = '3rd';
            if ($slotLevel >= 4) $classKey = $slotLevel . 'th';

            $maxSlots = $classSlots[$classKey] ?? 0;
            $current = $remaining[$key] ?? 0;

            if ($current >= $maxSlots) {
                throw new \Exception("Слот {$slotLevel} уровня уже полностью восстановлен");
            }

            $remaining[$key] = min($maxSlots, $current + 1);
        }

        $character->spell_slots_remaining = $remaining;

        // Mark recovery as used
        $usedRecoveries = $character->short_rest_recovery_used ?? [];
        $usedRecoveries[] = $recoveryKey;
        $character->short_rest_recovery_used = $usedRecoveries;

        $character->save();

        broadcast(new CharacterUpdated($character, 'spell_recovery', [
            'recovery_key' => $recoveryKey,
            'slots_restored' => $slotsToRestore,
            'spell_slots_remaining' => $character->spell_slots_remaining,
        ]));

        return $character;
    }

    /**
     * Update prepared spells for a character
     */
    public function updatePreparedSpells(Character $character, array $spellSlugs): Character
    {
        $characterClass = CharacterClass::where('slug', $character->class_slug)->first();

        // Validate that character is a prepared caster
        $preparedCasters = ['cleric', 'druid', 'paladin', 'wizard'];
        if (!in_array($character->class_slug, $preparedCasters)) {
            throw new \Exception("Этот класс не готовит заклинания");
        }

        // Calculate max prepared
        $spellcastingAbility = $characterClass->spellcasting_ability;
        $abilityMod = $character->getAbilityModifier($spellcastingAbility);
        $maxPrepared = max(1, $abilityMod + $character->level);

        if (in_array($character->class_slug, ['paladin', 'ranger'])) {
            $maxPrepared = max(1, $abilityMod + floor($character->level / 2));
        }

        // Filter out cantrips from count (cantrips don't count against prepared)
        $leveledSpells = collect($spellSlugs)->filter(function($slug) {
            $spell = Spell::where('slug', $slug)->first();
            return $spell && !$spell->isCantrip();
        })->values()->toArray();

        if (count($leveledSpells) > $maxPrepared) {
            throw new \Exception("Превышен лимит подготовленных заклинаний ({$maxPrepared})");
        }

        // Validate all spells exist and are available to class
        foreach ($spellSlugs as $slug) {
            $spell = Spell::where('slug', $slug)->first();
            if (!$spell) {
                throw new \Exception("Заклинание не найдено: {$slug}");
            }

            // Check if class has access to this spell
            $classes = $spell->classes ?? [];
            if (!in_array($character->class_slug, $classes)) {
                throw new \Exception("Класс не имеет доступа к заклинанию: {$spell->getTranslation('name', 'ru')}");
            }
        }

        $character->prepared_spells = $spellSlugs;
        $character->save();

        broadcast(new CharacterUpdated($character, 'prepared_spells', [
            'prepared_spells' => $spellSlugs,
            'count' => count($leveledSpells),
            'max' => $maxPrepared,
        ]));

        return $character;
    }

    /**
     * Start concentrating on a spell
     */
    public function startConcentration(Character $character, string $spellSlug): Character
    {
        $spell = Spell::where('slug', $spellSlug)->first();

        if (!$spell) {
            throw new \Exception("Заклинание не найдено");
        }

        if (!$spell->concentration) {
            throw new \Exception("Это заклинание не требует концентрации");
        }

        // Set concentration (replaces any existing)
        $character->concentration_spell = [
            'spell_slug' => $spell->slug,
            'spell_name' => $spell->getTranslation('name', 'ru'),
            'started_at' => Carbon::now()->toISOString(),
            'duration' => $spell->duration,
        ];
        $character->save();

        broadcast(new CharacterUpdated($character, 'concentration', [
            'action' => 'start',
            'spell' => $character->concentration_spell,
        ]));

        return $character;
    }

    /**
     * End concentration
     */
    public function endConcentration(Character $character): Character
    {
        $previousSpell = $character->concentration_spell;

        $character->concentration_spell = null;
        $character->save();

        broadcast(new CharacterUpdated($character, 'concentration', [
            'action' => 'end',
            'previous_spell' => $previousSpell,
        ]));

        return $character;
    }

    /**
     * Get available spells for a character's class that they can prepare
     * (Used for prepared spell selection UI)
     */
    public function getAvailableSpells(Character $character): Collection
    {
        $campaign = $character->campaign;
        $setting = $campaign->setting;

        // Get all spells available for this class in this setting
        $spells = Spell::whereJsonContains('classes', $character->class_slug)
            ->whereHas('settings', function($q) use ($setting) {
                $q->where('setting_id', $setting->id);
            })
            ->get();

        // Filter by level (can only prepare spells up to highest slot level)
        $characterClass = CharacterClass::where('slug', $character->class_slug)->first();
        $classSlots = $characterClass?->getSpellSlotsAtLevel($character->level) ?? [];

        // Find highest slot level available
        $maxSlotLevel = 0;
        foreach (array_keys($classSlots) as $key) {
            if ($key === 'cantrips') continue;
            $level = (int) preg_replace('/[^0-9]/', '', $key);
            $maxSlotLevel = max($maxSlotLevel, $level);
        }

        return $spells->filter(function($spell) use ($maxSlotLevel) {
            return $spell->level <= $maxSlotLevel;
        })->map(function($spell) use ($setting) {
            return $spell->getForSetting($setting);
        })->values();
    }
}
