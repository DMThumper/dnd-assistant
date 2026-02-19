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
            \Log::info('LevelUp ASI/Feat choices received:', ['asi' => $choices['asi']]);

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
            $featType = $choices['asi']['type'] ?? '';
            $featSlugFromChoices = $choices['asi']['choices']['feat'] ?? null;
            \Log::info('Checking feat condition:', ['type' => $featType, 'feat_slug' => $featSlugFromChoices]);

            if ($choices['asi']['type'] === 'feat' && !empty($choices['asi']['choices']['feat'])) {
                $featSlug = $choices['asi']['choices']['feat'];
                $feat = Feat::where('slug', $featSlug)->first();
                \Log::info('Feat lookup:', ['slug' => $featSlug, 'found' => $feat ? true : false]);

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
                    \Log::info('Feat added to features:', ['feat_name' => $feat->getTranslation('name', 'ru')]);

                    // Apply feat benefits to character stats
                    \Log::info('Applying feat benefits with choices:', ['choices' => $choices['asi']['choices'] ?? []]);
                    $this->applyFeatBenefits($character, $feat, $choices['asi']['choices'] ?? []);
                }
            } else {
                \Log::info('Feat condition not met', [
                    'asi_type' => $choices['asi']['type'] ?? 'not set',
                    'has_feat' => isset($choices['asi']['choices']['feat']),
                    'feat_value' => $choices['asi']['choices']['feat'] ?? 'not set',
                ]);
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

            // Store subclass as object with optional extra data (terrain, bonus_cantrip, etc.)
            $subclassData = [
                'subclass' => $choices['subclass'],
            ];

            // Handle terrain choice for Circle of the Land
            if (!empty($choices['subclass_terrain'])) {
                $subclassData['terrain'] = $choices['subclass_terrain'];
            }

            // Handle bonus cantrip choice - add to known_spells
            if (!empty($choices['subclass_bonus_cantrip'])) {
                $subclassData['bonus_cantrip'] = $choices['subclass_bonus_cantrip'];

                // Add cantrip to character's known spells (as object with full data)
                $knownSpells = $character->known_spells ?? [];
                $cantripSlug = $choices['subclass_bonus_cantrip'];

                // Check if already known (by slug)
                $alreadyKnown = collect($knownSpells)->contains(function ($spell) use ($cantripSlug) {
                    return is_array($spell) ? ($spell['slug'] ?? null) === $cantripSlug : $spell === $cantripSlug;
                });

                if (!$alreadyKnown) {
                    // Load spell data from database
                    $spell = \App\Models\Spell::where('slug', $cantripSlug)->first();
                    if ($spell) {
                        $knownSpells[] = [
                            'slug' => $spell->slug,
                            'name' => $spell->getTranslation('name', 'ru'),
                            'level' => $spell->level,
                            'is_cantrip' => $spell->level === 0,
                        ];
                        $character->known_spells = $knownSpells;
                    }
                }
            }

            $subclasses[$levelingClass] = $subclassData;

            // Handle circle spells based on terrain - add to always_prepared_spells
            if (!empty($choices['subclass_terrain'])) {
                $subclass = CharacterClass::where('slug', $choices['subclass'])->first();
                if ($subclass && !empty($subclass->circle_spells[$choices['subclass_terrain']])) {
                    $terrainSpells = $subclass->circle_spells[$choices['subclass_terrain']];
                    $alwaysPrepared = $character->always_prepared_spells ?? [];

                    // Add spells for each level threshold
                    foreach ($terrainSpells as $levelKey => $spells) {
                        if ($levelKey === 'name' || !is_array($spells)) continue;
                        // Add spells if character level meets threshold
                        $spellLevel = (int) $levelKey;
                        if ($newLevel >= $spellLevel) {
                            foreach ($spells as $spellSlug) {
                                if (!in_array($spellSlug, $alwaysPrepared)) {
                                    $alwaysPrepared[] = $spellSlug;
                                }
                            }
                        }
                    }
                    $character->always_prepared_spells = $alwaysPrepared;
                }
            }
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
                        $featureData = [
                            'source' => 'subclass',
                            'subclass' => $subclass->getTranslation('name', 'ru'),
                            'name' => $feature['name'] ?? '',
                            'description' => $feature['description'] ?? '',
                            'type' => $feature['type'] ?? 'feature',
                            'key' => $feature['key'] ?? null,
                            'level' => $newLevel,
                        ];

                        // Copy short_description if available
                        if (isset($feature['short_description'])) {
                            $featureData['short_description'] = $feature['short_description'];
                        }

                        // Copy resource properties if this is a resource-type feature
                        if (($feature['type'] ?? '') === 'resource') {
                            foreach (['resource_key', 'resource_name', 'resource_die', 'resource_max_formula', 'resource_use_max_formula', 'recharge'] as $prop) {
                                if (isset($feature[$prop])) {
                                    $featureData[$prop] = $feature[$prop];
                                }
                            }
                            // Initialize class resource
                            $this->initializeClassResource($character, $feature, $newLevel);
                        }

                        $features[] = $featureData;
                    }
                    $character->features = $features;
                }
            }
        }

        // Add new features (class features from level up)
        if (!empty($choices['features'])) {
            $features = $character->features ?? [];
            foreach ($choices['features'] as $feature) {
                // Ensure source is set
                if (!isset($feature['source'])) {
                    $feature['source'] = 'class';
                }

                // Ensure level is set
                if (!isset($feature['level'])) {
                    $feature['level'] = $newLevel;
                }

                // Initialize class resource if this is a resource-type feature
                if (($feature['type'] ?? '') === 'resource' && isset($feature['resource_key'])) {
                    $this->initializeClassResource($character, $feature, $newLevel);
                }

                $features[] = $feature;
            }
            $character->features = $features;
        }

        // Update spell slots for spellcasters
        $this->updateSpellSlots($character, $classLevels);

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

            $result = [
                'slug' => $data['slug'],
                'name' => $data['name'],
                'description' => $data['description'],
                'level_features' => $data['level_features'] ?? [],
            ];

            // Check for required choices at level 2 (subclass selection level for druids)
            $levelFeatures = $data['level_features']['2'] ?? [];
            $choices = [];

            foreach ($levelFeatures as $feature) {
                if (($feature['type'] ?? '') === 'choice') {
                    $choiceType = $feature['choice_type'] ?? null;

                    if ($choiceType === 'terrain' && !empty($subclass->circle_spells)) {
                        // Terrain-based circle spells (Circle of the Land)
                        $terrainOptions = [];
                        foreach ($subclass->circle_spells as $key => $value) {
                            if ($key !== 'name' && is_array($value) && isset($value['name'])) {
                                // Collect spell slugs for this terrain
                                $spellSlugs = [];
                                foreach ($value as $levelKey => $spells) {
                                    if ($levelKey !== 'name' && is_array($spells)) {
                                        $spellSlugs = array_merge($spellSlugs, $spells);
                                    }
                                }

                                // Load spell names from database
                                $spellNames = [];
                                if (!empty($spellSlugs)) {
                                    $spells = \App\Models\Spell::whereIn('slug', $spellSlugs)->get();
                                    foreach ($spells as $spell) {
                                        $spellNames[] = $spell->getTranslation('name', 'ru');
                                    }
                                }

                                $terrainOptions[] = [
                                    'key' => $key,
                                    'name' => $value['name']['ru'] ?? $key,
                                    'spells' => $spellNames,
                                ];
                            }
                        }
                        $choices['terrain'] = [
                            'required' => true,
                            'feature_name' => $feature['name'] ?? 'Заклинания круга',
                            'options' => $terrainOptions,
                        ];
                    } elseif ($choiceType === 'cantrip') {
                        // Bonus cantrip choice - load available cantrips
                        $fromClass = $feature['choice_from'] ?? $subclass->parent_slug ?? 'druid';

                        // Get all cantrips for this class
                        $availableCantrips = \App\Models\Spell::where('level', 0)
                            ->whereJsonContains('classes', $fromClass)
                            ->orderBy('sort_order')
                            ->get()
                            ->map(fn($spell) => [
                                'slug' => $spell->slug,
                                'name' => $spell->getTranslation('name', 'ru'),
                            ])
                            ->values()
                            ->all();

                        $choices['bonus_cantrip'] = [
                            'required' => true,
                            'feature_name' => $feature['name'] ?? 'Дополнительный заговор',
                            'from_class' => $fromClass,
                            'count' => $feature['choice_count'] ?? 1,
                            'available_cantrips' => $availableCantrips,
                        ];
                    }
                }
            }

            if (!empty($choices)) {
                $result['choices'] = $choices;
            }

            // Include circle_spells info if present
            if (!empty($subclass->circle_spells)) {
                $result['has_circle_spells'] = true;
            }

            return $result;
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
            'race_slug' => $character->race_slug,
        ];

        return $feats->map(function (Feat $feat) use ($setting, $takenFeats, $characterData) {
            $data = $feat->getForSetting($setting);
            $alreadyTaken = in_array($feat->slug, $takenFeats);
            $canTake = !$alreadyTaken || $feat->repeatable;
            $meetsPrerequisites = $feat->meetsPrerequisites($characterData);
            $failedPrerequisites = $this->getFailedPrerequisites($feat, $characterData);

            $result = [
                'slug' => $data['slug'],
                'name' => $data['name'],
                'description' => $data['description'],
                'prerequisites' => $data['prerequisites'],
                'benefits' => $data['benefits'],
                'repeatable' => $data['repeatable'],
                'available' => $canTake && $meetsPrerequisites,
                'already_taken' => $alreadyTaken,
                'meets_prerequisites' => $meetsPrerequisites,
                'failed_prerequisites' => $failedPrerequisites,
            ];

            // Load available cantrips for feats that grant cantrip choice
            $benefits = $data['benefits'] ?? [];
            if (!empty($benefits['cantrip']['choice'])) {
                $attackRollRequired = $benefits['cantrip']['attack_roll_required'] ?? false;

                // Get all cantrips from all spellcasting classes
                $query = \App\Models\Spell::where('level', 0);

                // Filter by attack roll requirement if needed
                // Attack roll cantrips have damage but no save in effects
                if ($attackRollRequired) {
                    $query->whereNotNull('effects')
                          ->whereJsonContainsKey('effects->damage')
                          ->whereNull('effects->save');
                }

                $availableCantrips = $query
                    ->orderBy('sort_order')
                    ->get()
                    ->map(fn($spell) => [
                        'slug' => $spell->slug,
                        'name' => $spell->getTranslation('name', 'ru'),
                        'classes' => $spell->classes,
                        'school' => $spell->school,
                        'casting_time' => $spell->casting_time,
                        'range' => $spell->range,
                        'duration' => $spell->duration,
                        'components' => $spell->components,
                        'effects' => $spell->effects,
                        'description' => $spell->getTranslation('description', 'ru'),
                    ])
                    ->values()
                    ->all();

                $result['available_cantrips'] = $availableCantrips;
            }

            // Load available spells for feats that grant spell choice
            if (!empty($benefits['spell']['choice'])) {
                $spellLevel = $benefits['spell']['level'] ?? 1;
                $fromSchool = $benefits['spell']['school'] ?? null;

                $query = \App\Models\Spell::where('level', $spellLevel);

                if ($fromSchool) {
                    $query->where('school', $fromSchool);
                }

                $availableSpells = $query
                    ->orderBy('sort_order')
                    ->get()
                    ->map(fn($spell) => [
                        'slug' => $spell->slug,
                        'name' => $spell->getTranslation('name', 'ru'),
                        'level' => $spell->level,
                        'classes' => $spell->classes,
                        'school' => $spell->school,
                        'casting_time' => $spell->casting_time,
                        'range' => $spell->range,
                        'duration' => $spell->duration,
                        'components' => $spell->components,
                        'effects' => $spell->effects,
                        'description' => $spell->getTranslation('description', 'ru'),
                    ])
                    ->values()
                    ->all();

                $result['available_spells'] = $availableSpells;
            }

            return $result;
        })->values()->all();
    }

    /**
     * Get list of failed prerequisites for a feat
     */
    private function getFailedPrerequisites(Feat $feat, array $characterData): array
    {
        $failed = [];
        $prerequisites = $feat->prerequisites ?? [];

        if (empty($prerequisites)) {
            return $failed;
        }

        $abilityNames = [
            'strength' => 'Сила',
            'dexterity' => 'Ловкость',
            'constitution' => 'Телосложение',
            'intelligence' => 'Интеллект',
            'wisdom' => 'Мудрость',
            'charisma' => 'Харизма',
        ];

        // Check ability score requirements
        if (isset($prerequisites['ability'])) {
            foreach ($prerequisites['ability'] as $ability => $minScore) {
                $current = $characterData['abilities'][$ability] ?? 0;
                if ($current < $minScore) {
                    $abilityName = $abilityNames[$ability] ?? $ability;
                    $failed[] = "{$abilityName} {$minScore}+ (у вас {$current})";
                }
            }
        }

        // Check proficiency requirements
        if (isset($prerequisites['proficiency'])) {
            $proficiency = $prerequisites['proficiency'];
            $characterProficiencies = $characterData['proficiencies'] ?? [];
            if (!in_array($proficiency, $characterProficiencies)) {
                $failed[] = "Владение: {$proficiency}";
            }
        }

        // Check spellcasting requirement
        if (isset($prerequisites['spellcasting']) && $prerequisites['spellcasting']) {
            if (!($characterData['is_spellcaster'] ?? false)) {
                $failed[] = 'Способность накладывать заклинания';
            }
        }

        // Check race requirement
        if (isset($prerequisites['race'])) {
            $allowedRaces = $prerequisites['race'];
            $characterRace = $characterData['race_slug'] ?? '';
            if (!in_array($characterRace, $allowedRaces)) {
                $raceNames = implode(', ', $allowedRaces);
                $failed[] = "Раса: {$raceNames}";
            }
        }

        return $failed;
    }

    /**
     * Apply feat benefits to character stats
     */
    private function applyFeatBenefits(Character $character, Feat $feat, array $featChoices): void
    {
        $benefits = $feat->benefits ?? [];

        if (empty($benefits)) {
            return;
        }

        // Store bonuses in character's feat_bonuses field
        $featBonuses = $character->feat_bonuses ?? [];

        // Initiative bonus (e.g., Alert +5)
        if (isset($benefits['initiative_bonus'])) {
            $featBonuses['initiative'] = ($featBonuses['initiative'] ?? 0) + $benefits['initiative_bonus'];
        }

        // AC bonus (e.g., Dual Wielder +1)
        if (isset($benefits['ac_bonus'])) {
            $featBonuses['ac'] = ($featBonuses['ac'] ?? 0) + $benefits['ac_bonus'];
        }

        // Speed bonus (e.g., Mobile +3m)
        if (isset($benefits['speed_bonus'])) {
            $speed = $character->speed ?? [];
            $speed['walk'] = ($speed['walk'] ?? 9) + $benefits['speed_bonus'];
            $character->speed = $speed;
        }

        // HP per level (e.g., Tough +2/level, retroactive)
        if (isset($benefits['hp_per_level'])) {
            $bonusHp = $benefits['hp_per_level'] * $character->level;
            $character->max_hp += $bonusHp;
            $character->current_hp += $bonusHp;
            $featBonuses['hp_per_level'] = ($featBonuses['hp_per_level'] ?? 0) + $benefits['hp_per_level'];
        }

        // Passive bonus (e.g., Observant +5 to passive Perception/Investigation)
        if (isset($benefits['passive_bonus'])) {
            $featBonuses['passive_perception'] = ($featBonuses['passive_perception'] ?? 0) + $benefits['passive_bonus'];
            $featBonuses['passive_investigation'] = ($featBonuses['passive_investigation'] ?? 0) + $benefits['passive_bonus'];
        }

        // Luck points (e.g., Lucky: 3 points)
        if (isset($benefits['luck_points'])) {
            $classResources = $character->class_resources ?? [];
            $classResources[] = [
                'name' => 'Очки удачи',
                'source' => $feat->slug,
                'current' => $benefits['luck_points'],
                'max' => $benefits['luck_points'],
                'recharge' => 'long_rest',
            ];
            $character->class_resources = $classResources;
        }

        // Sorcery points (e.g., Metamagic Adept: 2 points)
        if (isset($benefits['sorcery_points'])) {
            $classResources = $character->class_resources ?? [];
            // Check if character already has sorcery points
            $found = false;
            foreach ($classResources as &$resource) {
                if ($resource['name'] === 'Очки чародейства') {
                    $resource['max'] += $benefits['sorcery_points'];
                    $resource['current'] += $benefits['sorcery_points'];
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $classResources[] = [
                    'name' => 'Очки чародейства (черта)',
                    'source' => $feat->slug,
                    'current' => $benefits['sorcery_points'],
                    'max' => $benefits['sorcery_points'],
                    'recharge' => 'long_rest',
                ];
            }
            $character->class_resources = $classResources;
        }

        // Fixed ability increase (e.g., Actor: +1 CHA)
        if (isset($benefits['ability_increase']) && isset($benefits['ability_increase']['ability'])) {
            $ability = $benefits['ability_increase']['ability'];
            $amount = $benefits['ability_increase']['amount'] ?? 1;
            $abilities = $character->abilities;
            $abilities[$ability] = min(20, ($abilities[$ability] ?? 10) + $amount);
            $character->abilities = $abilities;
        }

        // Ability increase from choice (passed from frontend)
        \Log::info('Checking ability_increase choice:', [
            'has_ability_increase' => isset($featChoices['ability_increase']),
            'ability_increase_value' => $featChoices['ability_increase'] ?? 'not set',
            'featChoices' => $featChoices,
        ]);

        if (isset($featChoices['ability_increase'])) {
            $ability = $featChoices['ability_increase'];
            $amount = $benefits['ability_increase']['amount'] ?? 1;
            $abilities = $character->abilities;
            $oldValue = $abilities[$ability] ?? 10;
            $abilities[$ability] = min(20, $oldValue + $amount);
            $character->abilities = $abilities;
            \Log::info('Applied ability increase:', [
                'ability' => $ability,
                'amount' => $amount,
                'old_value' => $oldValue,
                'new_value' => $abilities[$ability],
            ]);
        }

        // Languages
        if (isset($benefits['languages']) && isset($featChoices['languages'])) {
            $proficiencies = $character->proficiencies ?? [];
            $proficiencies['languages'] = array_merge(
                $proficiencies['languages'] ?? [],
                $featChoices['languages']
            );
            $character->proficiencies = $proficiencies;
        }

        // Skill proficiency from choice
        if (isset($featChoices['skill_proficiencies'])) {
            $skillProficiencies = $character->skill_proficiencies ?? [];
            $character->skill_proficiencies = array_unique(array_merge(
                $skillProficiencies,
                $featChoices['skill_proficiencies']
            ));
        }

        // Skill expertise from choice
        if (isset($featChoices['skill_expertise'])) {
            $skillExpertise = $character->skill_expertise ?? [];
            $character->skill_expertise = array_unique(array_merge(
                $skillExpertise,
                $featChoices['skill_expertise']
            ));
        }

        // Saving throw proficiency from choice
        if (isset($featChoices['saving_throw_proficiency'])) {
            $savingThrowProficiencies = $character->saving_throw_proficiencies ?? [];
            $character->saving_throw_proficiencies = array_unique(array_merge(
                $savingThrowProficiencies,
                [$featChoices['saving_throw_proficiency']]
            ));
        }

        // Cantrip from choice (e.g., Spell Sniper, Magic Initiate)
        if (isset($featChoices['cantrip']) && !empty($featChoices['cantrip'])) {
            $cantripSlug = $featChoices['cantrip'];
            $spell = \App\Models\Spell::where('slug', $cantripSlug)->first();

            if ($spell) {
                $knownSpells = $character->known_spells ?? [];

                // Check if not already known
                $alreadyKnown = collect($knownSpells)->contains(function ($s) use ($cantripSlug) {
                    return is_array($s) ? ($s['slug'] ?? null) === $cantripSlug : $s === $cantripSlug;
                });

                if (!$alreadyKnown) {
                    $knownSpells[] = [
                        'slug' => $spell->slug,
                        'name' => $spell->getTranslation('name', 'ru'),
                        'level' => $spell->level,
                        'is_cantrip' => true,
                        'source' => 'feat:' . $feat->slug,
                    ];
                    $character->known_spells = $knownSpells;
                    \Log::info('Added cantrip from feat:', ['cantrip' => $cantripSlug, 'feat' => $feat->slug]);
                }
            }
        }

        // Spell from choice (e.g., Fey Touched, Shadow Touched)
        if (isset($featChoices['spell']) && !empty($featChoices['spell'])) {
            $spellSlug = $featChoices['spell'];
            $spell = \App\Models\Spell::where('slug', $spellSlug)->first();

            if ($spell) {
                $knownSpells = $character->known_spells ?? [];

                // Check if not already known
                $alreadyKnown = collect($knownSpells)->contains(function ($s) use ($spellSlug) {
                    return is_array($s) ? ($s['slug'] ?? null) === $spellSlug : $s === $spellSlug;
                });

                if (!$alreadyKnown) {
                    $knownSpells[] = [
                        'slug' => $spell->slug,
                        'name' => $spell->getTranslation('name', 'ru'),
                        'level' => $spell->level,
                        'is_cantrip' => false,
                        'source' => 'feat:' . $feat->slug,
                    ];
                    $character->known_spells = $knownSpells;
                    \Log::info('Added spell from feat:', ['spell' => $spellSlug, 'feat' => $feat->slug]);
                }
            }
        }

        // Store feat bonuses
        $character->feat_bonuses = $featBonuses;
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

    /**
     * Update spell slots for spellcasters based on class levels
     */
    private function updateSpellSlots(Character $character, array $classLevels): void
    {
        $totalSlots = [];

        foreach ($classLevels as $classSlug => $level) {
            $class = CharacterClass::where('slug', $classSlug)->first();
            if (!$class || !$class->is_spellcaster || !$class->spell_slots) {
                continue;
            }

            $slotsAtLevel = $class->getSpellSlotsAtLevel($level);
            foreach ($slotsAtLevel as $slotLevel => $count) {
                // slotLevel is like "1st", "2nd", etc. - convert to int
                $slotInt = (int) $slotLevel;
                $totalSlots[$slotInt] = ($totalSlots[$slotInt] ?? 0) + $count;
            }
        }

        // If character is a spellcaster but has no slots yet (new to spellcasting)
        // or if spell slots changed, update remaining slots
        if (!empty($totalSlots)) {
            $character->spell_slots_remaining = $totalSlots;
        }
    }

    /**
     * Initialize a class resource from a feature with type 'resource'
     */
    private function initializeClassResource(Character $character, array $feature, int $level): void
    {
        $resourceKey = $feature['resource_key'] ?? null;
        if (!$resourceKey) return;

        $classResources = $character->class_resources ?? [];

        // Check if resource already exists
        foreach ($classResources as $resource) {
            if (($resource['key'] ?? '') === $resourceKey) {
                return; // Already initialized
            }
        }

        // Calculate max value from formula
        $maxFormula = $feature['resource_max_formula'] ?? '0';
        $proficiencyBonus = $character->getProficiencyBonus();
        $maxValue = $this->evaluateResourceFormula($maxFormula, $level, $proficiencyBonus);

        // Calculate max use per activation (if applicable)
        $useMaxFormula = $feature['resource_use_max_formula'] ?? null;
        $useMax = $useMaxFormula
            ? $this->evaluateResourceFormula($useMaxFormula, $level, $proficiencyBonus)
            : null;

        $classResources[] = [
            'key' => $resourceKey,
            'name' => $feature['resource_name'] ?? $feature['name'] ?? 'Resource',
            'source' => $feature['key'] ?? 'unknown',
            'current' => $maxValue,
            'max' => $maxValue,
            'max_formula' => $maxFormula,
            'die' => $feature['resource_die'] ?? null,
            'use_max' => $useMax,
            'use_max_formula' => $useMaxFormula,
            'recharge' => $feature['recharge'] ?? 'long_rest',
        ];

        $character->class_resources = $classResources;
    }

    /**
     * Evaluate a resource formula (e.g., "level * 5", "ceil(level / 2)", "proficiency_bonus")
     */
    private function evaluateResourceFormula(string $formula, int $level, int $proficiencyBonus): int
    {
        // Replace variables
        $expression = str_replace(
            ['level', 'proficiency_bonus', 'proficiency'],
            [(string) $level, (string) $proficiencyBonus, (string) $proficiencyBonus],
            $formula
        );

        // Handle ceil() and floor()
        if (preg_match('/ceil\((.+)\)/', $expression, $matches)) {
            return (int) ceil(eval("return {$matches[1]};"));
        }
        if (preg_match('/floor\((.+)\)/', $expression, $matches)) {
            return (int) floor(eval("return {$matches[1]};"));
        }

        // Simple expression
        return (int) eval("return {$expression};");
    }
}
