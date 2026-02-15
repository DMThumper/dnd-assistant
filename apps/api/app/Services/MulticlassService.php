<?php

namespace App\Services;

use App\Models\Character;
use App\Models\CharacterClass;
use App\Models\RuleSystem;

class MulticlassService
{
    /**
     * Spellcasting progression types by class
     */
    private const SPELLCASTING_TYPES = [
        'bard' => 'full',
        'cleric' => 'full',
        'druid' => 'full',
        'sorcerer' => 'full',
        'wizard' => 'full',
        'paladin' => 'half',
        'ranger' => 'half',
        'artificer' => 'half',
        'fighter' => 'third', // Eldritch Knight subclass
        'rogue' => 'third',   // Arcane Trickster subclass
        'warlock' => 'pact',  // Uses Pact Magic, not standard slots
    ];

    /**
     * D&D 5e Multiclass Spell Slot Table
     */
    private const MULTICLASS_SPELL_SLOTS = [
        1 => ['1st' => 2],
        2 => ['1st' => 3],
        3 => ['1st' => 4, '2nd' => 2],
        4 => ['1st' => 4, '2nd' => 3],
        5 => ['1st' => 4, '2nd' => 3, '3rd' => 2],
        6 => ['1st' => 4, '2nd' => 3, '3rd' => 3],
        7 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 1],
        8 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 2],
        9 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 1],
        10 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2],
        11 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1],
        12 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1],
        13 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1, '7th' => 1],
        14 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1, '7th' => 1],
        15 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1, '7th' => 1, '8th' => 1],
        16 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1, '7th' => 1, '8th' => 1],
        17 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 2, '6th' => 1, '7th' => 1, '8th' => 1, '9th' => 1],
        18 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 3, '6th' => 1, '7th' => 1, '8th' => 1, '9th' => 1],
        19 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 3, '6th' => 2, '7th' => 1, '8th' => 1, '9th' => 1],
        20 => ['1st' => 4, '2nd' => 3, '3rd' => 3, '4th' => 3, '5th' => 3, '6th' => 2, '7th' => 2, '8th' => 1, '9th' => 1],
    ];

    /**
     * Check if character can multiclass into a specific class
     */
    public function canMulticlassInto(Character $character, string $targetClassSlug): array
    {
        $ruleSystem = $this->getRuleSystem($character);
        if (!$ruleSystem) {
            return [
                'can_multiclass' => false,
                'reason' => 'Система правил не найдена',
            ];
        }

        // Check if multiclassing is enabled for the campaign
        $campaign = $character->campaign;
        if (!($campaign->settings['multiclassing'] ?? true)) {
            return [
                'can_multiclass' => false,
                'reason' => 'Мультиклассирование отключено в этой кампании',
            ];
        }

        // Check if already in this class
        $classLevels = $character->class_levels ?? [];
        if (isset($classLevels[$targetClassSlug])) {
            return [
                'can_multiclass' => true,
                'reason' => 'Уже имеет уровни в этом классе',
                'current_levels' => $classLevels[$targetClassSlug],
            ];
        }

        // Get prerequisites for target class
        $prereqs = $ruleSystem->getMulticlassPrerequisites($targetClassSlug);
        if (!$prereqs) {
            return [
                'can_multiclass' => true,
                'reason' => 'Нет требований для мультикласса',
            ];
        }

        // Check prerequisites
        $abilities = $character->abilities;
        $failedPrereqs = [];

        foreach ($prereqs as $ability => $required) {
            if ($ability === 'or') {
                // Handle OR conditions
                $orMet = false;
                foreach ($prereqs['or'] as $orAbility => $orRequired) {
                    if (($abilities[$orAbility] ?? 0) >= $orRequired) {
                        $orMet = true;
                        break;
                    }
                }
                if (!$orMet) {
                    $orOptions = [];
                    foreach ($prereqs['or'] as $orAbility => $orRequired) {
                        $orOptions[] = "{$orAbility} >= {$orRequired}";
                    }
                    $failedPrereqs[] = 'Требуется: ' . implode(' или ', $orOptions);
                }
                continue;
            }

            if (($abilities[$ability] ?? 0) < $required) {
                $failedPrereqs[] = "{$ability} >= {$required} (текущее: {$abilities[$ability]})";
            }
        }

        // Also check current class prerequisites (must meet to multiclass OUT)
        $currentClass = $character->class_slug;
        $currentPrereqs = $ruleSystem->getMulticlassPrerequisites($currentClass);
        if ($currentPrereqs) {
            foreach ($currentPrereqs as $ability => $required) {
                if ($ability === 'or') {
                    continue; // Already handled
                }
                if (($abilities[$ability] ?? 0) < $required) {
                    $failedPrereqs[] = "Текущий класс требует: {$ability} >= {$required}";
                }
            }
        }

        if (!empty($failedPrereqs)) {
            return [
                'can_multiclass' => false,
                'reason' => 'Не выполнены требования',
                'failed_prerequisites' => $failedPrereqs,
            ];
        }

        return [
            'can_multiclass' => true,
            'reason' => 'Выполнены все требования',
            'proficiencies_gained' => $ruleSystem->getMulticlassProficiencies($targetClassSlug),
        ];
    }

    /**
     * Calculate combined spell slots for multiclass spellcaster
     */
    public function getMulticlassSpellSlots(Character $character): array
    {
        $classLevels = $character->class_levels ?? [];

        if (empty($classLevels)) {
            // Single class - use class spell slots directly
            $class = CharacterClass::where('slug', $character->class_slug)->first();
            if ($class && $class->spell_slots) {
                return $class->spell_slots[(string) $character->level] ?? [];
            }
            return [];
        }

        // Calculate effective spellcaster level
        $spellcasterLevel = 0;
        $hasWarlock = false;
        $warlockLevel = 0;

        foreach ($classLevels as $classSlug => $level) {
            $type = self::SPELLCASTING_TYPES[$classSlug] ?? null;

            if (!$type) {
                continue;
            }

            if ($type === 'pact') {
                // Warlock uses Pact Magic, calculated separately
                $hasWarlock = true;
                $warlockLevel = $level;
                continue;
            }

            // Check if the character has the spellcasting subclass for third-casters
            $subclasses = $character->subclasses ?? [];
            if ($type === 'third') {
                // Only count if they have the spellcasting subclass
                $hasSpellcastingSubclass = isset($subclasses[$classSlug]) &&
                    in_array($subclasses[$classSlug], ['eldritch-knight', 'arcane-trickster']);
                if (!$hasSpellcastingSubclass) {
                    continue;
                }
            }

            switch ($type) {
                case 'full':
                    $spellcasterLevel += $level;
                    break;
                case 'half':
                    $spellcasterLevel += floor($level / 2);
                    break;
                case 'third':
                    $spellcasterLevel += floor($level / 3);
                    break;
            }
        }

        $slots = [];

        // Get standard spellcasting slots
        if ($spellcasterLevel > 0) {
            $slots['standard'] = self::MULTICLASS_SPELL_SLOTS[$spellcasterLevel] ?? [];
        }

        // Add Warlock Pact Magic slots (calculated separately)
        if ($hasWarlock && $warlockLevel > 0) {
            $slots['pact_magic'] = $this->getWarlockPactSlots($warlockLevel);
        }

        return $slots;
    }

    /**
     * Get Warlock Pact Magic slots
     */
    private function getWarlockPactSlots(int $level): array
    {
        $slotLevel = min(5, ceil($level / 2)); // Max 5th level slots
        $numSlots = match (true) {
            $level >= 17 => 4,
            $level >= 11 => 3,
            $level >= 2 => 2,
            default => 1,
        };

        return [
            'level' => $slotLevel,
            'slots' => $numSlots,
            'recharge' => 'short_rest',
        ];
    }

    /**
     * Get proficiencies gained when multiclassing into a class
     */
    public function getMulticlassProficiencies(Character $character, string $classSlug): array
    {
        $ruleSystem = $this->getRuleSystem($character);
        if (!$ruleSystem) {
            return [];
        }

        return $ruleSystem->getMulticlassProficiencies($classSlug);
    }

    /**
     * Get total character level from class levels
     */
    public function getTotalLevel(Character $character): int
    {
        $classLevels = $character->class_levels ?? [];

        if (empty($classLevels)) {
            return $character->level;
        }

        return array_sum($classLevels);
    }

    /**
     * Check if character is multiclassed
     */
    public function isMulticlassed(Character $character): bool
    {
        $classLevels = $character->class_levels ?? [];
        return count($classLevels) > 1;
    }

    /**
     * Get class breakdown for display
     */
    public function getClassBreakdown(Character $character): array
    {
        $classLevels = $character->class_levels ?? [];

        if (empty($classLevels)) {
            return [
                [
                    'slug' => $character->class_slug,
                    'level' => $character->level,
                    'primary' => true,
                ],
            ];
        }

        $breakdown = [];
        $isPrimary = true;

        // Sort by level descending
        arsort($classLevels);

        foreach ($classLevels as $slug => $level) {
            $class = CharacterClass::where('slug', $slug)->first();
            $breakdown[] = [
                'slug' => $slug,
                'name' => $class ? $class->getTranslation('name', 'ru') : $slug,
                'level' => $level,
                'primary' => $isPrimary,
            ];
            $isPrimary = false;
        }

        return $breakdown;
    }

    /**
     * Get rule system for character
     */
    private function getRuleSystem(Character $character): ?RuleSystem
    {
        return $character->campaign?->setting?->ruleSystem;
    }
}
