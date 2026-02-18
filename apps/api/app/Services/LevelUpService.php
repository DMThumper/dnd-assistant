<?php

namespace App\Services;

use App\Events\LevelUp;
use App\Models\Character;
use App\Models\CharacterClass;
use App\Models\Feat;
use App\Models\RuleSystem;
use Illuminate\Support\Collection;

class LevelUpService
{
    /**
     * Check if character can level up based on XP
     * Inactive characters can always level up (for experimentation)
     */
    public function canLevelUp(Character $character): array
    {
        $ruleSystem = $this->getRuleSystem($character);
        if (!$ruleSystem) {
            return [
                'can_level_up' => false,
                'reason' => 'Система правил не найдена',
            ];
        }

        $maxLevel = $ruleSystem->level_range['max'] ?? 20;
        if ($character->level >= $maxLevel) {
            return [
                'can_level_up' => false,
                'reason' => 'Достигнут максимальный уровень',
                'current_level' => $character->level,
                'max_level' => $maxLevel,
            ];
        }

        $nextLevelXp = $ruleSystem->getXpForLevel($character->level + 1);

        // Inactive characters can always level up (for experimentation/preparation)
        if (!$character->is_active) {
            return [
                'can_level_up' => true,
                'current_level' => $character->level,
                'current_xp' => $character->experience_points,
                'next_level' => $character->level + 1,
                'xp_required' => $nextLevelXp,
                'xp_remaining' => 0,
                'inactive_mode' => true,
            ];
        }

        $canLevel = $ruleSystem->canLevelUp($character->level, $character->experience_points);

        return [
            'can_level_up' => $canLevel,
            'current_level' => $character->level,
            'current_xp' => $character->experience_points,
            'next_level' => $character->level + 1,
            'xp_required' => $nextLevelXp,
            'xp_remaining' => max(0, $nextLevelXp - $character->experience_points),
        ];
    }

    /**
     * Get level up options for a character
     */
    public function getLevelUpOptions(Character $character): array
    {
        $ruleSystem = $this->getRuleSystem($character);
        if (!$ruleSystem) {
            return ['error' => 'Система правил не найдена'];
        }

        $newLevel = $character->level + 1;
        $classLevels = $character->class_levels ?? [];

        // Determine primary class (for single class characters)
        $primaryClassSlug = $character->class_slug;
        $isMulticlass = !empty($classLevels) && count($classLevels) > 1;

        // Calculate proficiency bonus for new level
        $proficiencyBonus = floor(($newLevel - 1) / 4) + 2;

        $options = [
            'new_level' => $newLevel,
            'proficiency_bonus' => $proficiencyBonus,
            'hp_options' => $this->getHpOptions($character, $ruleSystem),
            'class_options' => $this->getClassOptions($character, $ruleSystem, $newLevel),
            'asi_available' => $this->isAsiLevel($newLevel, $primaryClassSlug),
            'features' => [],
        ];

        // If ASI level, get options
        if ($options['asi_available']) {
            $options['asi_options'] = $this->getAsiOptions($character, $ruleSystem);
        }

        // Get features for current class at new level
        if ($primaryClassSlug) {
            $class = CharacterClass::where('slug', $primaryClassSlug)->first();
            if ($class) {
                $levelInClass = ($classLevels[$primaryClassSlug] ?? $character->level) + 1;
                $options['features'] = $this->getClassFeaturesAtLevel($class, $levelInClass);
                $options['hp_options']['hit_die'] = $class->hit_die;

                // Check if this level requires subclass selection
                $subclassLevel = (int) ($class->subclass_level ?? 0);
                $existingSubclasses = $character->subclasses ?? [];
                $hasSubclass = isset($existingSubclasses[$primaryClassSlug]);

                if ($subclassLevel > 0 && $levelInClass === $subclassLevel && !$hasSubclass) {
                    $options['subclass_required'] = true;
                    $options['subclass_name'] = $class->getTranslation('subclass_name', 'ru') ?? 'Подкласс';
                    $options['subclass_options'] = $this->getSubclassOptions($character, $primaryClassSlug);
                }

                // Add subclass features for existing subclass at new level
                if ($hasSubclass) {
                    $subclassSlug = $existingSubclasses[$primaryClassSlug];
                    $subclass = CharacterClass::where('slug', $subclassSlug)->first();
                    if ($subclass) {
                        $subclassFeatures = $this->getClassFeaturesAtLevel($subclass, $levelInClass);
                        foreach ($subclassFeatures as $feature) {
                            $feature['source'] = 'subclass';
                            $feature['subclass'] = $subclass->getTranslation('name', 'ru');
                            $options['features'][] = $feature;
                        }
                    }
                }
            }
        }

        return $options;
    }

    /**
     * Process level up with player choices
     * Inactive characters get XP auto-granted to reach the next level
     */
    public function processLevelUp(Character $character, array $choices): Character
    {
        $ruleSystem = $this->getRuleSystem($character);
        if (!$ruleSystem) {
            throw new \Exception('Система правил не найдена');
        }

        // For inactive characters, auto-grant XP to reach next level
        if (!$character->is_active) {
            $nextLevelXp = $ruleSystem->getXpForLevel($character->level + 1);
            if ($character->experience_points < $nextLevelXp) {
                $character->experience_points = $nextLevelXp;
            }
        } elseif (!$ruleSystem->canLevelUp($character->level, $character->experience_points)) {
            throw new \Exception('Недостаточно опыта для повышения уровня');
        }

        $previousLevel = $character->level;
        $newLevel = $character->level + 1;

        // HP increase
        $hpIncrease = $this->calculateHpIncrease($character, $choices);

        // Update class levels
        $classLevels = $character->class_levels ?? [];
        $levelingClass = $choices['class'] ?? $character->class_slug;

        // Initialize class_levels for the leveling class if not present
        if (empty($classLevels) || !isset($classLevels[$levelingClass])) {
            // For the primary class, initialize from current character level
            if ($levelingClass === $character->class_slug) {
                $classLevels[$levelingClass] = $character->level;
            } else {
                // For a new multiclass, start at 0 (will be incremented below)
                $classLevels[$levelingClass] = 0;
            }
        }
        $classLevels[$levelingClass]++;

        // Update proficiency bonus
        $proficiencyBonus = floor(($newLevel - 1) / 4) + 2;

        // Process ASI/Feat choice
        $asiChoices = $character->asi_choices ?? [];
        if (!empty($choices['asi'])) {
            $asiChoices[] = [
                'level' => $newLevel,
                'type' => $choices['asi']['type'], // 'asi' or 'feat'
                'choices' => $choices['asi']['choices'] ?? null, // {strength: 2} or {feat: 'great-weapon-master'}
            ];

            // Apply ASI to abilities if type is 'asi'
            if ($choices['asi']['type'] === 'asi' && !empty($choices['asi']['choices'])) {
                $abilities = $character->abilities;
                foreach ($choices['asi']['choices'] as $ability => $increase) {
                    if (isset($abilities[$ability])) {
                        $abilities[$ability] = min(20, $abilities[$ability] + $increase);
                    }
                }
                $character->abilities = $abilities;
            }

            // Add feat to features if type is 'feat'
            if ($choices['asi']['type'] === 'feat' && !empty($choices['asi']['choices']['feat'])) {
                $featSlug = $choices['asi']['choices']['feat'];
                $feat = Feat::where('slug', $featSlug)->first();
                if ($feat) {
                    $features = $character->features ?? [];
                    $features[] = [
                        'source' => 'feat',
                        'name' => $feat->getTranslation('name', 'ru'),
                        'description' => $feat->getTranslation('description', 'ru'),
                        'slug' => $feat->slug,
                        'benefits' => $feat->benefits,
                    ];
                    $character->features = $features;
                }
            }
        }

        // Update hit dice remaining
        $hitDiceRemaining = $character->hit_dice_remaining ?? [];
        $class = CharacterClass::where('slug', $levelingClass)->first();
        if ($class) {
            $hitDie = $class->hit_die;
            $hitDiceRemaining[$hitDie] = ($hitDiceRemaining[$hitDie] ?? 0) + 1;
        }

        // Apply updates
        $character->level = $newLevel;
        $character->max_hp += $hpIncrease;
        $character->current_hp += $hpIncrease; // Heal by HP increase amount
        // proficiency_bonus is calculated, not stored
        $character->class_levels = $classLevels;
        $character->asi_choices = $asiChoices;
        $character->hit_dice_remaining = $hitDiceRemaining;

        // Handle subclass selection if at appropriate level
        if (!empty($choices['subclass'])) {
            $subclasses = $character->subclasses ?? [];
            $subclasses[$levelingClass] = $choices['subclass'];
            $character->subclasses = $subclasses;

            // Add subclass features to character's features
            $subclass = CharacterClass::where('slug', $choices['subclass'])->first();
            if ($subclass) {
                // Calculate level in the specific class (for multiclass support)
                $levelInClass = $classLevels[$levelingClass] ?? $newLevel;

                // Use the model's method to get features
                $levelFeatures = $subclass->getFeaturesAtLevel($levelInClass);

                if (!empty($levelFeatures)) {
                    $features = $character->features ?? [];
                    foreach ($levelFeatures as $feature) {
                        $features[] = [
                            'source' => 'subclass',
                            'subclass' => $subclass->getTranslation('name', 'ru'),
                            'name' => $feature['name'] ?? '',
                            'description' => $feature['description'] ?? '',
                            'type' => $feature['type'] ?? 'feature',
                            'level' => $newLevel,
                        ];
                    }
                    $character->features = $features;
                }
            }
        }

        // Add new features
        if (!empty($choices['features'])) {
            $features = $character->features ?? [];
            foreach ($choices['features'] as $feature) {
                $features[] = $feature;
            }
            $character->features = $features;
        }

        $character->save();

        // Broadcast level up event
        broadcast(new LevelUp(
            $character,
            $previousLevel,
            $newLevel,
            $levelingClass,
            $choices['features'] ?? []
        ));

        return $character;
    }

    /**
     * Get HP increase options
     */
    private function getHpOptions(Character $character, RuleSystem $ruleSystem): array
    {
        $campaign = $character->campaign;
        $hpMethod = $campaign->settings['hp_method'] ?? 'average';

        $class = CharacterClass::where('slug', $character->class_slug)->first();
        $hitDie = $class ? $class->hit_die : 'd8';
        $dieMax = (int) str_replace('d', '', $hitDie);

        $conMod = (int) floor((($character->abilities['constitution'] ?? 10) - 10) / 2);
        $average = floor($dieMax / 2) + 1 + $conMod;

        return [
            'method' => $hpMethod,
            'hit_die' => $hitDie,
            'constitution_modifier' => $conMod,
            'average_hp' => max(1, $average),
            'max_roll' => max(1, $dieMax + $conMod),
            'min_hp' => max(1, 1 + $conMod),
        ];
    }

    /**
     * Get available classes for level up (for multiclass)
     */
    private function getClassOptions(Character $character, RuleSystem $ruleSystem, int $newLevel): array
    {
        $campaign = $character->campaign;
        $multiclassEnabled = $campaign->settings['multiclassing'] ?? true;

        if (!$multiclassEnabled) {
            return [
                'multiclass_enabled' => false,
                'available_classes' => [$character->class_slug],
            ];
        }

        $currentClasses = array_keys($character->class_levels ?? [$character->class_slug => $character->level]);
        $availableClasses = [];

        // Get all BASE classes for this setting (exclude subclasses)
        $allClasses = CharacterClass::whereHas('settings', function ($q) use ($campaign) {
            $q->where('settings.id', $campaign->setting_id);
        })->whereNull('parent_slug')->get()->keyBy('slug');

        // Current classes are always available
        foreach ($currentClasses as $classSlug) {
            $class = $allClasses->get($classSlug);
            $availableClasses[$classSlug] = [
                'current' => true,
                'meets_prerequisites' => true,
                'name' => $class?->getTranslation('name', 'ru') ?? $classSlug,
            ];
        }

        // Check multiclass prerequisites for new classes
        foreach ($allClasses as $class) {
            if (isset($availableClasses[$class->slug])) {
                continue;
            }

            $prereqs = $ruleSystem->getMulticlassPrerequisites($class->slug);
            $meetsPrereqs = $this->meetsMulticlassPrerequisites($character, $prereqs);

            $availableClasses[$class->slug] = [
                'current' => false,
                'meets_prerequisites' => $meetsPrereqs,
                'prerequisites' => $prereqs,
                'name' => $class->getTranslation('name', 'ru'),
            ];
        }

        return [
            'multiclass_enabled' => true,
            'available_classes' => $availableClasses,
        ];
    }

    /**
     * Check if character meets multiclass prerequisites
     */
    private function meetsMulticlassPrerequisites(Character $character, ?array $prereqs): bool
    {
        if (!$prereqs) {
            return true;
        }

        $abilities = $character->abilities;
        $hasOr = isset($prereqs['or']);

        // Check non-OR prerequisites
        foreach ($prereqs as $ability => $required) {
            if ($ability === 'or') {
                continue;
            }
            if (($abilities[$ability] ?? 0) < $required) {
                // If there's an OR option, check that
                if ($hasOr) {
                    $orMet = false;
                    foreach ($prereqs['or'] as $orAbility => $orRequired) {
                        if (($abilities[$orAbility] ?? 0) >= $orRequired) {
                            $orMet = true;
                            break;
                        }
                    }
                    if (!$orMet) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Check if level grants ASI/Feat
     */
    private function isAsiLevel(int $level, ?string $classSlug): bool
    {
        // Standard D&D 5e ASI levels (most classes)
        $standardAsiLevels = [4, 8, 12, 16, 19];

        // Fighter gets extra ASIs
        if ($classSlug === 'fighter') {
            $standardAsiLevels = [4, 6, 8, 12, 14, 16, 19];
        }

        // Rogue gets extra ASI
        if ($classSlug === 'rogue') {
            $standardAsiLevels = [4, 8, 10, 12, 16, 19];
        }

        return in_array($level, $standardAsiLevels);
    }

    /**
     * Get ASI/Feat options
     */
    private function getAsiOptions(Character $character, RuleSystem $ruleSystem): array
    {
        $campaign = $character->campaign;
        $featsEnabled = $campaign->settings['feats'] ?? true;
        $abilities = $ruleSystem->abilities ?? [];

        $options = [
            'asi' => [
                'points' => 2,
                'max_per_ability' => 2,
                'abilities' => collect($abilities)->map(function ($ability) use ($character) {
                    $current = $character->abilities[$ability['key']] ?? 10;
                    return [
                        'key' => $ability['key'],
                        'name' => $ability['name'],
                        'current' => $current,
                        'can_increase' => $current < 20,
                    ];
                })->values()->all(),
            ],
            'feats_enabled' => $featsEnabled,
        ];

        // Get feats from setting
        if ($featsEnabled) {
            $options['feats'] = $this->getAvailableFeats($character);
        }

        return $options;
    }

    /**
     * Get class features at a specific level
     */
    private function getClassFeaturesAtLevel(CharacterClass $class, int $level): array
    {
        $levelFeatures = $class->level_features ?? [];
        return $levelFeatures[(string) $level] ?? [];
    }

    /**
     * Get available subclass options for a class
     */
    private function getSubclassOptions(Character $character, string $classSlug): array
    {
        $campaign = $character->campaign;
        $setting = $campaign->setting;

        // Get subclasses for this class from the setting
        $subclasses = $setting->characterClasses()
            ->where('parent_slug', $classSlug)
            ->orderBy('sort_order')
            ->get();

        return $subclasses->map(function (CharacterClass $subclass) use ($setting) {
            $data = $subclass->getForSetting($setting);
            return [
                'slug' => $data['slug'],
                'name' => $data['name'],
                'description' => $data['description'],
                'level_features' => $data['level_features'] ?? [],
            ];
        })->values()->all();
    }

    /**
     * Get available feats for a character
     */
    private function getAvailableFeats(Character $character): array
    {
        $campaign = $character->campaign;
        $setting = $campaign->setting;

        // Get already taken feats
        $takenFeats = collect($character->asi_choices ?? [])
            ->where('type', 'feat')
            ->pluck('choices.feat')
            ->filter()
            ->all();

        // Get feats from setting
        $feats = $setting->feats()
            ->orderBy('sort_order')
            ->get();

        // Build character data for prerequisite checking
        $characterData = [
            'abilities' => $character->abilities,
            'proficiencies' => array_merge(
                $character->proficiencies['armor'] ?? [],
                $character->proficiencies['weapons'] ?? [],
                $character->skill_proficiencies ?? []
            ),
            'is_spellcaster' => CharacterClass::where('slug', $character->class_slug)->first()?->is_spellcaster ?? false,
        ];

        return $feats->map(function (Feat $feat) use ($setting, $takenFeats, $characterData) {
            $data = $feat->getForSetting($setting);
            $alreadyTaken = in_array($feat->slug, $takenFeats);
            $canTake = !$alreadyTaken || $feat->repeatable;
            $meetsPrerequisites = $feat->meetsPrerequisites($characterData);

            return [
                'slug' => $data['slug'],
                'name' => $data['name'],
                'description' => $data['description'],
                'prerequisites' => $data['prerequisites'],
                'benefits' => $data['benefits'],
                'repeatable' => $data['repeatable'],
                'available' => $canTake && $meetsPrerequisites,
                'already_taken' => $alreadyTaken,
                'meets_prerequisites' => $meetsPrerequisites,
            ];
        })->values()->all();
    }

    /**
     * Calculate HP increase based on choices
     */
    private function calculateHpIncrease(Character $character, array $choices): int
    {
        $campaign = $character->campaign;
        $hpMethod = $campaign->settings['hp_method'] ?? 'average';

        $class = CharacterClass::where('slug', $choices['class'] ?? $character->class_slug)->first();
        $hitDie = $class ? $class->hit_die : 'd8';
        $dieMax = (int) str_replace('d', '', $hitDie);

        $conMod = (int) floor((($character->abilities['constitution'] ?? 10) - 10) / 2);

        if ($hpMethod === 'roll' && isset($choices['hp_roll'])) {
            // Use rolled value (validated to be within range)
            $roll = min($dieMax, max(1, $choices['hp_roll']));
            return max(1, $roll + $conMod);
        }

        // Default: average (rounded up)
        return max(1, floor($dieMax / 2) + 1 + $conMod);
    }

    /**
     * Get rule system for character
     */
    private function getRuleSystem(Character $character): ?RuleSystem
    {
        return $character->campaign?->setting?->ruleSystem;
    }
}
