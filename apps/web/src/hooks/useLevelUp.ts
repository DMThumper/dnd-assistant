"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type { Character, LevelUpOptionsResponse, LevelUpChoices } from "@/types/game";
import type { LevelUpStep, FeatChoicesState, SubclassChoicesState, FeatData, SubclassData } from "@/types/level-up";
import { toast } from "sonner";

interface UseLevelUpOptions {
  characterId: number;
}

export function useLevelUp({ characterId }: UseLevelUpOptions) {
  const router = useRouter();

  // Core data state
  const [character, setCharacter] = useState<Character | null>(null);
  const [options, setOptions] = useState<LevelUpOptionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<LevelUpStep>("hp");
  const [choices, setChoices] = useState<LevelUpChoices>({});

  // HP step state
  const [hpMethod, setHpMethod] = useState<"average" | "manual" | "auto">("average");
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const [hpManualInput, setHpManualInput] = useState("");
  const [isRolling, setIsRolling] = useState(false);

  // Subclass state
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(null);
  const [subclassChoices, setSubclassChoices] = useState<SubclassChoicesState>({});

  // ASI state
  const [asiType, setAsiType] = useState<"asi" | "feat">("asi");
  const [asiAllocation, setAsiAllocation] = useState<Record<string, number>>({});
  const [selectedFeat, setSelectedFeat] = useState<string | null>(null);
  const [featChoices, setFeatChoices] = useState<FeatChoicesState>({});

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [charResponse, optionsResponse] = await Promise.all([
        api.getCharacter(characterId),
        api.getLevelUpOptions(characterId),
      ]);

      setCharacter(charResponse.data.character);
      setOptions(optionsResponse.data);

      // Initialize class choice for multiclass
      if (charResponse.data.character.class_slug) {
        setChoices((prev) => ({
          ...prev,
          class: charResponse.data.character.class_slug!,
        }));
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Не удалось загрузить данные");
      }
    } finally {
      setIsLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Get selected feat object
  const getSelectedFeatData = useCallback((): FeatData | null => {
    if (!selectedFeat || !options?.asi_options?.feats) return null;
    return options.asi_options.feats.find(f => f.slug === selectedFeat) || null;
  }, [selectedFeat, options?.asi_options?.feats]);

  // Check if selected feat requires additional choices
  const selectedFeatRequiresChoices = useCallback((): boolean => {
    const feat = getSelectedFeatData();
    if (!feat?.benefits) return false;

    const b = feat.benefits;
    return !!(
      (b.ability_increase?.choice) ||
      (b.ability_increase?.options && b.ability_increase.options.length > 0) ||
      (b.saving_throw_proficiency && typeof b.saving_throw_proficiency === 'object' && 'choice' in b.saving_throw_proficiency) ||
      (b.skill_proficiency && b.skill_proficiency > 0) ||
      (b.skill_expertise && b.skill_expertise > 0) ||
      (b.languages && b.languages > 0) ||
      (b.cantrip && typeof b.cantrip === 'object' && 'choice' in b.cantrip && feat.available_cantrips && feat.available_cantrips.length > 0) ||
      (b.spell && typeof b.spell === 'object' && 'choice' in b.spell && feat.available_spells && feat.available_spells.length > 0)
    );
  }, [getSelectedFeatData]);

  // Validate feat choices are complete
  const areFeatChoicesComplete = useCallback((): boolean => {
    const feat = getSelectedFeatData();
    if (!feat?.benefits) return true;

    const b = feat.benefits;

    // Check ability choice
    if (b.ability_increase?.choice || (b.ability_increase?.options && b.ability_increase.options.length > 0)) {
      if (!featChoices.ability) return false;
    }

    // Check saving throw choice (tied to ability for Resilient)
    if (b.saving_throw_proficiency && typeof b.saving_throw_proficiency === 'object' && 'choice' in b.saving_throw_proficiency) {
      if (!featChoices.saving_throw && !featChoices.ability) return false;
    }

    // Check skill proficiency choices
    if (b.skill_proficiency && b.skill_proficiency > 0) {
      if (!featChoices.skill_proficiencies || featChoices.skill_proficiencies.length < b.skill_proficiency) return false;
    }

    // Check skill expertise choices
    if (b.skill_expertise && b.skill_expertise > 0) {
      if (!featChoices.skill_expertise || featChoices.skill_expertise.length < b.skill_expertise) return false;
    }

    // Check language choices
    if (b.languages && b.languages > 0) {
      if (!featChoices.languages || featChoices.languages.length < b.languages) return false;
    }

    // Check cantrip choice
    if (b.cantrip && typeof b.cantrip === 'object' && b.cantrip.choice && feat.available_cantrips && feat.available_cantrips.length > 0) {
      if (!featChoices.cantrip) return false;
    }

    // Check spell choice
    if (b.spell && typeof b.spell === 'object' && b.spell.choice && feat.available_spells && feat.available_spells.length > 0) {
      if (!featChoices.spell) return false;
    }

    return true;
  }, [getSelectedFeatData, featChoices]);

  // Get selected subclass data
  const getSelectedSubclassData = useCallback((): SubclassData | null => {
    if (!selectedSubclass || !options?.subclass_options) return null;
    return options.subclass_options.find(s => s.slug === selectedSubclass) || null;
  }, [selectedSubclass, options?.subclass_options]);

  // Check if selected subclass requires additional choices
  const selectedSubclassRequiresChoices = useCallback((): boolean => {
    const subclass = getSelectedSubclassData();
    if (!subclass?.choices) return false;
    return !!(subclass.choices.terrain?.required || subclass.choices.bonus_cantrip?.required);
  }, [getSelectedSubclassData]);

  // Get available steps
  const getSteps = useCallback((): LevelUpStep[] => {
    const steps: LevelUpStep[] = ["hp"];

    // Add class step only if multiclass is enabled
    if (options?.class_options.multiclass_enabled) {
      steps.push("class");
    }

    // Add subclass step if required
    if (options?.subclass_required && options.subclass_options && options.subclass_options.length > 0) {
      steps.push("subclass");
    }

    // Add subclass choices step if selected subclass requires choices
    if (selectedSubclass && selectedSubclassRequiresChoices()) {
      steps.push("subclass_choices");
    }

    // Add ASI step if available
    if (options?.asi_available) {
      steps.push("asi");
    }

    // Add feat choices step if a feat with choices is selected
    if (asiType === "feat" && selectedFeat && selectedFeatRequiresChoices()) {
      steps.push("feat_choices");
    }

    // Add features step if there are features
    if (options?.features && options.features.length > 0) {
      steps.push("features");
    }

    steps.push("confirm");
    return steps;
  }, [options, selectedSubclass, selectedSubclassRequiresChoices, asiType, selectedFeat, selectedFeatRequiresChoices]);

  const steps = options ? getSteps() : [];
  const currentStepIndex = steps.indexOf(currentStep);

  // Navigation
  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  }, [currentStepIndex, steps]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    } else {
      router.back();
    }
  }, [currentStepIndex, steps, router]);

  // HP methods
  const getHitDieMax = useCallback((): number => {
    if (!options) return 0;
    return parseInt(options.hp_options.hit_die.toLowerCase().replace("d", "")) || 0;
  }, [options]);

  const getManualRollValue = useCallback((): number | null => {
    if (!hpManualInput || hpManualInput.trim() === "") return null;
    const value = parseInt(hpManualInput, 10);
    if (isNaN(value) || value < 1) return null;
    const max = getHitDieMax();
    if (max > 0 && value > max) return max;
    return value;
  }, [hpManualInput, getHitDieMax]);

  const getHpIncrease = useCallback((): number => {
    if (!options) return 0;

    const conMod = options.hp_options.constitution_modifier;

    if (hpMethod === "average") {
      return options.hp_options.average_hp;
    }

    if (hpMethod === "manual") {
      const manualValue = getManualRollValue();
      if (manualValue !== null) {
        return Math.max(1, manualValue + conMod);
      }
      return 0;
    }

    // "auto" method
    if (hpRoll !== null) {
      return Math.max(1, hpRoll + conMod);
    }

    return 0;
  }, [options, hpMethod, hpRoll, getManualRollValue]);

  const rollHp = useCallback(() => {
    if (!options) return;

    setIsRolling(true);

    const dieMax = parseInt(options.hp_options.hit_die.replace("d", ""));
    const rolled = Math.floor(Math.random() * dieMax) + 1;

    setTimeout(() => {
      setHpRoll(rolled);
      setIsRolling(false);
    }, 500);
  }, [options]);

  const handleHpMethodChange = useCallback((method: "average" | "manual" | "auto") => {
    setHpMethod(method);
    if (method === "average") {
      setHpRoll(null);
      setHpManualInput("");
    } else if (method === "manual") {
      setHpRoll(null);
    } else if (method === "auto") {
      setHpManualInput("");
    }
  }, []);

  // ASI allocation helpers
  const getTotalAsiPoints = useCallback(() => {
    return Object.values(asiAllocation).reduce((sum, val) => sum + val, 0);
  }, [asiAllocation]);

  const canIncreaseAbility = useCallback((key: string) => {
    const ability = options?.asi_options?.asi.abilities.find((a) => a.key === key);
    if (!ability || !ability.can_increase) return false;
    if (getTotalAsiPoints() >= (options?.asi_options?.asi.points || 2)) return false;
    if ((asiAllocation[key] || 0) >= (options?.asi_options?.asi.max_per_ability || 2)) return false;
    return true;
  }, [options, asiAllocation, getTotalAsiPoints]);

  const increaseAbility = useCallback((key: string) => {
    if (!canIncreaseAbility(key)) return;
    setAsiAllocation((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  }, [canIncreaseAbility]);

  const decreaseAbility = useCallback((key: string) => {
    if ((asiAllocation[key] || 0) <= 0) return;
    setAsiAllocation((prev) => ({
      ...prev,
      [key]: prev[key] - 1,
    }));
  }, [asiAllocation]);

  // Can proceed to next step
  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case "hp":
        if (hpMethod === "average") return true;
        if (hpMethod === "manual") return getManualRollValue() !== null;
        if (hpMethod === "auto") return hpRoll !== null;
        return false;
      case "class":
        return !!choices.class;
      case "subclass":
        return selectedSubclass !== null;
      case "subclass_choices": {
        const subclass = getSelectedSubclassData();
        if (!subclass?.choices) return true;
        if (subclass.choices.terrain?.required && !subclassChoices.terrain) {
          return false;
        }
        if (subclass.choices.bonus_cantrip?.required && !subclassChoices.bonus_cantrip) {
          return false;
        }
        return true;
      }
      case "asi":
        if (asiType === "asi") {
          return getTotalAsiPoints() === (options?.asi_options?.asi.points || 2);
        }
        return selectedFeat !== null;
      case "feat_choices":
        const featData = getSelectedFeatData();
        if (!featData || !featData.benefits) {
          return true;
        }
        return areFeatChoicesComplete();
      case "features":
      case "confirm":
        return true;
      default:
        return true;
    }
  }, [currentStep, hpMethod, hpRoll, choices.class, selectedSubclass, subclassChoices, asiType, selectedFeat, options, getManualRollValue, getSelectedSubclassData, getTotalAsiPoints, getSelectedFeatData, areFeatChoicesComplete]);

  // Submit level up
  const submitLevelUp = useCallback(async () => {
    if (!character || !options) return;

    setIsSubmitting(true);

    try {
      const finalChoices: LevelUpChoices = {
        ...choices,
      };

      // Add HP choice
      if (hpMethod === "manual") {
        const manualValue = getManualRollValue();
        if (manualValue !== null) {
          finalChoices.hp_roll = manualValue;
        }
      } else if (hpMethod === "auto" && hpRoll !== null) {
        finalChoices.hp_roll = hpRoll;
      }

      // Add subclass choice
      if (options.subclass_required && selectedSubclass) {
        finalChoices.subclass = selectedSubclass;
        if (subclassChoices.terrain) {
          finalChoices.subclass_terrain = subclassChoices.terrain;
        }
        if (subclassChoices.bonus_cantrip) {
          finalChoices.subclass_bonus_cantrip = subclassChoices.bonus_cantrip;
        }
      }

      // Add ASI choice
      if (options.asi_available) {
        if (asiType === "asi") {
          finalChoices.asi = {
            type: "asi",
            choices: asiAllocation,
          };
        } else if (asiType === "feat" && selectedFeat) {
          finalChoices.asi = {
            type: "feat",
            choices: {
              feat: selectedFeat,
              ability_increase: featChoices.ability || undefined,
              saving_throw_proficiency: featChoices.saving_throw || featChoices.ability || undefined,
              skill_proficiencies: featChoices.skill_proficiencies,
              skill_expertise: featChoices.skill_expertise,
              languages: featChoices.languages,
            },
          };
        }
      }

      // Add features
      if (options.features.length > 0) {
        finalChoices.features = options.features;
      }

      const response = await api.levelUp(characterId, finalChoices);

      router.replace(`/player/sheet/${characterId}`);
      toast.success(response.message || `Поздравляем! Теперь вы ${options.new_level} уровня!`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось повысить уровень");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [character, options, choices, hpMethod, hpRoll, selectedSubclass, subclassChoices, asiType, asiAllocation, selectedFeat, featChoices, characterId, router, getManualRollValue]);

  return {
    // Core data
    character,
    options,
    isLoading,
    error,
    isSubmitting,

    // Wizard navigation
    currentStep,
    steps,
    currentStepIndex,
    goNext,
    goBack,
    canProceed,

    // HP step
    hpMethod,
    setHpMethod: handleHpMethodChange,
    hpRoll,
    hpManualInput,
    setHpManualInput,
    isRolling,
    rollHp,
    getHpIncrease,
    getHitDieMax,
    getManualRollValue,

    // Class step
    choices,
    setChoices,

    // Subclass step
    selectedSubclass,
    setSelectedSubclass,
    subclassChoices,
    setSubclassChoices,
    getSelectedSubclassData,

    // ASI step
    asiType,
    setAsiType,
    asiAllocation,
    getTotalAsiPoints,
    canIncreaseAbility,
    increaseAbility,
    decreaseAbility,

    // Feat step
    selectedFeat,
    setSelectedFeat,
    featChoices,
    setFeatChoices,
    getSelectedFeatData,
    selectedFeatRequiresChoices,
    areFeatChoicesComplete,

    // Submit
    submitLevelUp,
  };
}
