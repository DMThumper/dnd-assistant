"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type { Character, LevelUpOptionsResponse, LevelUpChoices, SpellPreview } from "@/types/game";
import { cn, formatModifier, calculateModifier } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Sparkles,
  TrendingUp,
  Dices,
  Calculator,
  PenLine,
  Swords,
  Check,
  Crown,
  Brain,
  Radio,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { usePlayerSession } from "@/contexts/PlayerSessionContext";

// Step type
type LevelUpStep = "hp" | "class" | "subclass" | "subclass_choices" | "asi" | "feat_choices" | "features" | "confirm";

// Feat choices structure
interface FeatChoicesState {
  ability?: string; // chosen ability for +1
  saving_throw?: string; // chosen saving throw proficiency
  skill_proficiencies?: string[]; // chosen skill proficiencies
  skill_expertise?: string[]; // chosen skill expertise
  languages?: string[]; // chosen languages
  cantrip?: string; // chosen cantrip slug
  spell?: string; // chosen spell slug
}

// Subclass choices structure
interface SubclassChoicesState {
  terrain?: string;
  bonus_cantrip?: string;
}

export default function LevelUpPage() {
  const router = useRouter();
  const params = useParams();
  const characterId = Number(params.id);

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

  // WebSocket subscription is maintained by PlayerSessionContext at layout level
  // No need for local subscription here
  const { isConnected: isSessionConnected } = usePlayerSession();

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [charResponse, optionsResponse] = await Promise.all([
        api.getCharacter(characterId),
        api.getLevelUpOptions(characterId),
      ]);

      setCharacter(charResponse.data.character);
      setOptions(optionsResponse.data);

      // HP method defaults to "average" — player chooses how to determine HP

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
  const getSelectedFeatData = () => {
    if (!selectedFeat || !options?.asi_options?.feats) return null;
    return options.asi_options.feats.find(f => f.slug === selectedFeat) || null;
  };

  // Check if selected feat requires additional choices
  const selectedFeatRequiresChoices = (): boolean => {
    const feat = getSelectedFeatData();
    if (!feat?.benefits) return false;

    const b = feat.benefits;
    // Requires choice if:
    // - ability_increase with choice: true or options array
    // - saving_throw_proficiency with choice: true
    // - skill_proficiency > 0
    // - skill_expertise > 0
    // - languages > 0
    // - cantrip with choice: true (and available_cantrips exists)
    // - spell with choice: true (and available_spells exists)
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
  };

  // Validate feat choices are complete
  const areFeatChoicesComplete = (): boolean => {
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
  };

  // Get selected subclass data
  const getSelectedSubclassData = () => {
    if (!selectedSubclass || !options?.subclass_options) return null;
    return options.subclass_options.find(s => s.slug === selectedSubclass) || null;
  };

  // Check if selected subclass requires additional choices
  const selectedSubclassRequiresChoices = (): boolean => {
    const subclass = getSelectedSubclassData();
    if (!subclass?.choices) return false;
    return !!(subclass.choices.terrain?.required || subclass.choices.bonus_cantrip?.required);
  };

  // Get available steps
  const getSteps = (): LevelUpStep[] => {
    const steps: LevelUpStep[] = ["hp"];

    // Add class step only if multiclass is enabled
    if (options?.class_options.multiclass_enabled) {
      steps.push("class");
    }

    // Add subclass step if required (e.g., Rogue archetype at level 3)
    if (options?.subclass_required && options.subclass_options && options.subclass_options.length > 0) {
      steps.push("subclass");
    }

    // Add subclass choices step if selected subclass requires choices (terrain, bonus cantrip)
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
  };

  const steps = options ? getSteps() : [];
  const currentStepIndex = steps.indexOf(currentStep);

  // Navigation
  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    } else {
      router.back();
    }
  };

  // Roll HP
  const rollHp = () => {
    if (!options) return;

    setIsRolling(true);

    // Simulate dice roll with animation delay
    const dieMax = parseInt(options.hp_options.hit_die.replace("d", ""));
    const rolled = Math.floor(Math.random() * dieMax) + 1;

    setTimeout(() => {
      setHpRoll(rolled);
      setIsRolling(false);
    }, 500);
  };

  // Get max value for the hit die
  const getHitDieMax = (): number => {
    if (!options) return 0;
    // Handle both "d10" and "D10" formats
    return parseInt(options.hp_options.hit_die.toLowerCase().replace("d", "")) || 0;
  };

  // Parse and validate manual HP input
  const getManualRollValue = (): number | null => {
    if (!hpManualInput || hpManualInput.trim() === "") return null;
    const value = parseInt(hpManualInput, 10);
    if (isNaN(value) || value < 1) return null;
    const max = getHitDieMax();
    // Clamp to max if we have one, otherwise just accept >= 1
    if (max > 0 && value > max) return max;
    return value;
  };

  // Calculate total HP increase
  const getHpIncrease = (): number => {
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
  };

  // ASI allocation helpers
  const getTotalAsiPoints = () => {
    return Object.values(asiAllocation).reduce((sum, val) => sum + val, 0);
  };

  const canIncreaseAbility = (key: string) => {
    const ability = options?.asi_options?.asi.abilities.find((a) => a.key === key);
    if (!ability || !ability.can_increase) return false;
    if (getTotalAsiPoints() >= (options?.asi_options?.asi.points || 2)) return false;
    if ((asiAllocation[key] || 0) >= (options?.asi_options?.asi.max_per_ability || 2)) return false;
    return true;
  };

  const increaseAbility = (key: string) => {
    if (!canIncreaseAbility(key)) return;
    setAsiAllocation((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const decreaseAbility = (key: string) => {
    if ((asiAllocation[key] || 0) <= 0) return;
    setAsiAllocation((prev) => ({
      ...prev,
      [key]: prev[key] - 1,
    }));
  };

  // Can proceed to next step
  const canProceed = (): boolean => {
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
        // Validate terrain choice if required
        if (subclass.choices.terrain?.required && !subclassChoices.terrain) {
          return false;
        }
        // Validate bonus cantrip choice if required
        if (subclass.choices.bonus_cantrip?.required && !subclassChoices.bonus_cantrip) {
          return false;
        }
        return true;
      }
      case "asi":
        if (asiType === "asi") {
          return getTotalAsiPoints() === (options?.asi_options?.asi.points || 2);
        }
        // Feat selection - must select a feat
        return selectedFeat !== null;
      case "feat_choices":
        // Must have feat data with benefits to make choices
        const featData = getSelectedFeatData();
        if (!featData || !featData.benefits) {
          // No benefits means no choices required, can proceed
          return true;
        }
        return areFeatChoicesComplete();
      case "features":
        return true;
      case "confirm":
        return true;
      default:
        return true;
    }
  };

  // Submit level up
  const submitLevelUp = async () => {
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
        // Add subclass-specific choices (terrain, bonus cantrip)
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
          // Debug: log what we're sending
          console.log("Level Up - Feat choices being sent:", {
            selectedFeat,
            featChoices,
          });

          finalChoices.asi = {
            type: "feat",
            choices: {
              feat: selectedFeat,
              // Include feat-specific choices - only set if defined
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

      // Redirect first, then show toast (toast persists across navigation)
      // Use replace so user can't go back to level-up page
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
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !character || !options) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <p className="text-destructive mb-4">{error || "Данные не найдены"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-500/5 to-transparent">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <h1 className="font-bold text-lg">Повышение уровня</h1>
              {isSessionConnected && (
                <Badge
                  variant="outline"
                  className="bg-green-500/10 border-green-500/30 text-green-400 text-xs"
                  title="Подключено к сессии"
                >
                  <Radio className="h-3 w-3 animate-pulse" />
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {character.name} → Уровень {options.new_level}
            </p>
          </div>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Progress */}
        <div className="px-4 pb-3">
          <Progress value={((currentStepIndex + 1) / steps.length) * 100} className="h-2" />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>Шаг {currentStepIndex + 1} из {steps.length}</span>
            <span>{getStepName(currentStep)}</span>
          </div>
        </div>
      </div>

      {/* Content - extra padding for bottom nav */}
      <div className="p-4 pb-32 space-y-4">
        {/* HP Step */}
        {currentStep === "hp" && (
          <Card className="border-yellow-500/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-red-500" />
                <CardTitle>Прибавка здоровья</CardTitle>
              </div>
              <CardDescription>
                Ваша кость здоровья: <Badge variant="outline">{options.hp_options.hit_die}</Badge>
                {" · "}Модификатор ТЕЛ: <Badge variant="outline">{formatModifier(options.hp_options.constitution_modifier)}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={hpMethod}
                onValueChange={(v) => {
                  setHpMethod(v as "average" | "manual" | "auto");
                  if (v === "average") {
                    setHpRoll(null);
                    setHpManualInput("");
                  } else if (v === "manual") {
                    setHpRoll(null);
                  } else if (v === "auto") {
                    setHpManualInput("");
                  }
                }}
                className="space-y-3"
              >
                {/* Average option */}
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    hpMethod === "average"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setHpMethod("average")}
                >
                  <RadioGroupItem value="average" id="average" />
                  <Calculator className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <Label htmlFor="average" className="font-medium cursor-pointer">
                      Среднее значение
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Надёжный выбор, без риска
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-green-500">
                    +{options.hp_options.average_hp}
                  </div>
                </div>

                {/* Manual input option - for physical dice */}
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    hpMethod === "manual"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setHpMethod("manual")}
                >
                  <RadioGroupItem value="manual" id="manual" />
                  <PenLine className="h-5 w-5 text-purple-500" />
                  <div className="flex-1">
                    <Label htmlFor="manual" className="font-medium cursor-pointer">
                      Ввести бросок
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Бросил {options.hp_options.hit_die} за столом? Введи результат!
                    </p>
                  </div>
                  {hpMethod === "manual" && getManualRollValue() !== null ? (
                    <div className="text-2xl font-bold text-purple-500">
                      +{getHpIncrease()}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-purple-500 border-purple-500/50">🎲</Badge>
                  )}
                </div>

                {/* Auto roll option */}
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    hpMethod === "auto"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setHpMethod("auto")}
                >
                  <RadioGroupItem value="auto" id="auto" />
                  <Dices className="h-5 w-5 text-amber-500" />
                  <div className="flex-1">
                    <Label htmlFor="auto" className="font-medium cursor-pointer">
                      Онлайн бросок
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {options.hp_options.hit_die}{formatModifier(options.hp_options.constitution_modifier)}
                      {" · "}от {options.hp_options.min_hp} до {options.hp_options.max_roll}
                    </p>
                  </div>
                  {hpMethod === "auto" && hpRoll !== null ? (
                    <div className="text-2xl font-bold text-amber-500">
                      +{getHpIncrease()}
                    </div>
                  ) : (
                    <Badge variant="outline">?</Badge>
                  )}
                </div>
              </RadioGroup>

              {/* Manual input for physical dice */}
              {hpMethod === "manual" && (
                <div className="flex flex-col items-center gap-4 pt-4">
                  <div className="w-full max-w-xs space-y-2">
                    <Label htmlFor="hp-manual" className="text-center block text-muted-foreground">
                      Результат броска {options.hp_options.hit_die} (1–{getHitDieMax()})
                    </Label>
                    <Input
                      id="hp-manual"
                      type="number"
                      min={1}
                      max={getHitDieMax()}
                      value={hpManualInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Allow empty input for clearing
                        if (val === "") {
                          setHpManualInput("");
                          return;
                        }
                        // Parse and clamp value
                        const num = parseInt(val, 10);
                        if (!isNaN(num)) {
                          const clamped = Math.max(1, Math.min(getHitDieMax(), num));
                          setHpManualInput(clamped.toString());
                        }
                      }}
                      placeholder={`1–${getHitDieMax()}`}
                      className="text-center text-3xl h-16 bg-zinc-800 border-zinc-700 text-zinc-100 font-bold"
                      autoFocus
                    />
                  </div>

                  {getManualRollValue() !== null && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Итого HP:</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-bold text-purple-400">{getManualRollValue()}</span>
                        <span className="text-xl text-muted-foreground">
                          {formatModifier(options.hp_options.constitution_modifier)}
                        </span>
                        <span className="text-xl">=</span>
                        <span className="text-4xl font-bold text-green-500">
                          +{getHpIncrease()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auto roll button */}
              {hpMethod === "auto" && (
                <div className="flex flex-col items-center gap-4 pt-4">
                  <Button
                    onClick={rollHp}
                    disabled={isRolling}
                    size="lg"
                    className="w-full max-w-xs bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  >
                    {isRolling ? (
                      <>
                        <Dices className="mr-2 h-5 w-5 animate-spin" />
                        Бросаю...
                      </>
                    ) : hpRoll !== null ? (
                      <>
                        <Dices className="mr-2 h-5 w-5" />
                        Перебросить
                      </>
                    ) : (
                      <>
                        <Dices className="mr-2 h-5 w-5" />
                        Бросить {options.hp_options.hit_die}
                      </>
                    )}
                  </Button>

                  {hpRoll !== null && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Выпало:</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-bold">{hpRoll}</span>
                        <span className="text-xl text-muted-foreground">
                          {formatModifier(options.hp_options.constitution_modifier)}
                        </span>
                        <span className="text-xl">=</span>
                        <span className="text-4xl font-bold text-green-500">
                          +{getHpIncrease()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Class Step (Multiclass) */}
        {currentStep === "class" && options.class_options.multiclass_enabled && (
          <Card className="border-purple-500/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Swords className="h-6 w-6 text-purple-500" />
                <CardTitle>Выбор класса</CardTitle>
              </div>
              <CardDescription>
                Выберите класс для повышения уровня
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(options.class_options.available_classes).map(([slug, opt]) => (
                <div
                  key={slug}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                    choices.class === slug
                      ? "border-primary bg-primary/5"
                      : opt.meets_prerequisites
                        ? "border-border hover:border-primary/50"
                        : "border-border opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (opt.meets_prerequisites) {
                      setChoices((prev) => ({ ...prev, class: slug }));
                    }
                  }}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      choices.class === slug ? "border-primary bg-primary" : "border-muted-foreground"
                    )}
                  >
                    {choices.class === slug && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{opt.name || slug}</p>
                    {opt.current && (
                      <Badge variant="secondary" className="text-xs">Текущий класс</Badge>
                    )}
                    {!opt.meets_prerequisites && opt.prerequisites && (
                      <p className="text-xs text-destructive">
                        Требуется: {Object.entries(opt.prerequisites)
                          .filter(([key, val]) => key !== 'or' && typeof val === 'number')
                          .map(([ability, value]) => `${getAbilityName(ability)} ${value}+`)
                          .join(', ')}
                        {opt.prerequisites.or && typeof opt.prerequisites.or === 'object' && (
                          <> или {Object.entries(opt.prerequisites.or)
                            .map(([ability, value]) => `${getAbilityName(ability)} ${value}+`)
                            .join(' или ')}</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Subclass Step */}
        {currentStep === "subclass" && options.subclass_required && options.subclass_options && (
          <Card className="border-amber-500/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-amber-500" />
                <CardTitle>{options.subclass_name || "Выбор подкласса"}</CardTitle>
              </div>
              <CardDescription>
                Выберите специализацию для вашего класса
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {options.subclass_options.map((subclass) => {
                // Get features for current level
                const currentLevelFeatures = subclass.level_features?.[String(options.new_level)] || [];

                return (
                <div
                  key={subclass.slug}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    selectedSubclass === subclass.slug
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setSelectedSubclass(subclass.slug)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                        selectedSubclass === subclass.slug ? "border-primary bg-primary" : "border-muted-foreground"
                      )}
                    >
                      {selectedSubclass === subclass.slug && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-lg">{subclass.name}</p>
                      {subclass.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {subclass.description}
                        </p>
                      )}

                      {/* Show features for current level */}
                      {currentLevelFeatures.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-amber-500 font-medium">
                            Способности {options.new_level} уровня:
                          </p>
                          {currentLevelFeatures.map((feature, idx) => {
                            const formatted = formatFeatureWithCalculatedValues(feature, options.new_level);
                            const hasResource = feature.type === 'resource' && formatted.calculatedValues?.total;

                            return (
                              <div key={idx} className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                                <p className="text-sm font-medium text-amber-400">{feature.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {formatted.description}
                                </p>
                                {/* Show calculated resource values */}
                                {hasResource && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                      Запас: {formatted.calculatedValues?.total}
                                    </span>
                                    {formatted.calculatedValues?.maxPerUse && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                        Макс. за раз: {formatted.calculatedValues.maxPerUse}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Subclass Choices Step (terrain, bonus cantrip for Circle of the Land) */}
        {currentStep === "subclass_choices" && selectedSubclass && (
          <SubclassChoicesStep
            subclass={getSelectedSubclassData()}
            subclassChoices={subclassChoices}
            setSubclassChoices={setSubclassChoices}
            characterKnownSpells={character.known_spells || []}
          />
        )}

        {/* ASI Step */}
        {currentStep === "asi" && options.asi_available && options.asi_options && (
          <Card className="border-blue-500/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-500" />
                <CardTitle>Улучшение характеристик</CardTitle>
              </div>
              <CardDescription>
                Распределите {options.asi_options.asi.points} очка между характеристиками
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ASI type selection */}
              <RadioGroup
                value={asiType}
                onValueChange={(v) => setAsiType(v as "asi" | "feat")}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="asi" id="asi-type" />
                  <Label htmlFor="asi-type">Характеристики</Label>
                </div>
                {options.asi_options.feats_enabled && (
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="feat" id="feat-type" />
                    <Label htmlFor="feat-type">Черта</Label>
                  </div>
                )}
              </RadioGroup>

              <Separator />

              {asiType === "asi" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Распределено:</span>
                    <Badge
                      variant={getTotalAsiPoints() === options.asi_options.asi.points ? "default" : "outline"}
                      className={cn(
                        getTotalAsiPoints() === options.asi_options.asi.points && "bg-green-500"
                      )}
                    >
                      {getTotalAsiPoints()} / {options.asi_options.asi.points}
                    </Badge>
                  </div>

                  {options.asi_options.asi.abilities.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Характеристики не найдены</p>
                    </div>
                  ) : (
                    options.asi_options.asi.abilities.map((ability) => {
                      const allocated = asiAllocation[ability.key] || 0;
                      const newValue = ability.current + allocated;
                      const newMod = calculateModifier(newValue);
                      const currentMod = calculateModifier(ability.current);
                      const modChanged = allocated > 0 && newMod !== currentMod;

                      return (
                        <div
                          key={ability.key}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-colors",
                            allocated > 0
                              ? "bg-green-500/10 border border-green-500/30"
                              : "bg-muted/30"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{ability.name}</p>
                              {!ability.can_increase && (
                                <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/50">
                                  MAX
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">
                                {ability.current}
                              </span>
                              {allocated > 0 && (
                                <>
                                  <span className="text-green-500">→ {newValue}</span>
                                  {modChanged && (
                                    <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/50 text-green-400">
                                      {formatModifier(currentMod)} → {formatModifier(newMod)}
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => decreaseAbility(ability.key)}
                              disabled={allocated <= 0}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-mono text-lg font-bold">
                              {allocated > 0 ? `+${allocated}` : "0"}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => increaseAbility(ability.key)}
                              disabled={!canIncreaseAbility(ability.key)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {asiType === "feat" && (
                <div className="space-y-3">
                  {!options.asi_options?.feats || options.asi_options.feats.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Crown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Нет доступных черт</p>
                      <p className="text-sm">Выберите улучшение характеристик</p>
                    </div>
                  ) : (
                    options.asi_options.feats.map((feat) => (
                      <div
                        key={feat.slug}
                        className={cn(
                          "p-4 rounded-lg border cursor-pointer transition-all",
                          selectedFeat === feat.slug
                            ? "border-purple-500 bg-purple-500/10"
                            : feat.available
                              ? "border-border hover:border-purple-500/50"
                              : "border-border opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => {
                          if (feat.available) {
                            setSelectedFeat(feat.slug);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                              selectedFeat === feat.slug
                                ? "border-purple-500 bg-purple-500"
                                : "border-muted-foreground"
                            )}
                          >
                            {selectedFeat === feat.slug && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{feat.name}</p>
                              {feat.repeatable && (
                                <Badge variant="outline" className="text-xs text-blue-500 border-blue-500/50">
                                  Можно брать повторно
                                </Badge>
                              )}
                              {feat.already_taken && !feat.repeatable && (
                                <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/50">
                                  Уже взята
                                </Badge>
                              )}
                            </div>

                            {/* Failed prerequisites */}
                            {!feat.meets_prerequisites && feat.failed_prerequisites && feat.failed_prerequisites.length > 0 && (
                              <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                                <p className="text-xs text-red-400 font-medium mb-1">Не выполнены требования:</p>
                                <ul className="text-xs text-red-300 space-y-0.5">
                                  {feat.failed_prerequisites.map((prereq, idx) => (
                                    <li key={idx}>• {prereq}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Description */}
                            <p className="text-sm text-muted-foreground mt-2">
                              {feat.description}
                            </p>

                            {/* Benefits summary */}
                            {feat.benefits && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {feat.benefits.ability_increase && (
                                  <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                                    +{feat.benefits.ability_increase.amount} к характеристике
                                  </Badge>
                                )}
                                {feat.benefits.ac_bonus && (
                                  <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                                    +{feat.benefits.ac_bonus} КД
                                  </Badge>
                                )}
                                {feat.benefits.initiative_bonus && (
                                  <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                                    +{feat.benefits.initiative_bonus} инициатива
                                  </Badge>
                                )}
                                {feat.benefits.speed_bonus && (
                                  <Badge variant="secondary" className="text-xs bg-cyan-500/20 text-cyan-400">
                                    +{feat.benefits.speed_bonus} м скорость
                                  </Badge>
                                )}
                                {feat.benefits.hp_per_level && (
                                  <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-400">
                                    +{feat.benefits.hp_per_level} ОЗ/уровень
                                  </Badge>
                                )}
                                {feat.benefits.skill_proficiency && (
                                  <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400">
                                    +{feat.benefits.skill_proficiency} навык
                                  </Badge>
                                )}
                                {feat.benefits.skill_expertise && (
                                  <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400">
                                    Экспертиза
                                  </Badge>
                                )}
                                {feat.benefits.cantrips && (
                                  <Badge variant="secondary" className="text-xs bg-indigo-500/20 text-indigo-400">
                                    +{feat.benefits.cantrips} заговор
                                  </Badge>
                                )}
                                {feat.benefits.spells && feat.benefits.spells.length > 0 && (
                                  <Badge variant="secondary" className="text-xs bg-indigo-500/20 text-indigo-400">
                                    +{feat.benefits.spells.length} заклинание
                                  </Badge>
                                )}
                                {feat.benefits.languages && (
                                  <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-400">
                                    +{feat.benefits.languages} язык
                                  </Badge>
                                )}
                                {feat.benefits.luck_points && (
                                  <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400">
                                    {feat.benefits.luck_points} очков удачи
                                  </Badge>
                                )}
                                {feat.benefits.passive_bonus && (
                                  <Badge variant="secondary" className="text-xs bg-teal-500/20 text-teal-400">
                                    +{feat.benefits.passive_bonus} пассивное восприятие
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feat Choices Step */}
        {currentStep === "feat_choices" && selectedFeat && (
          <FeatChoicesStep
            feat={getSelectedFeatData()}
            featChoices={featChoices}
            setFeatChoices={setFeatChoices}
            character={character}
          />
        )}

        {/* Features Step */}
        {currentStep === "features" && options.features.length > 0 && (
          <Card className="border-emerald-500/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-emerald-500" />
                <CardTitle>Новые способности</CardTitle>
              </div>
              <CardDescription>
                На уровне {options.new_level} вы получаете
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {options.features.map((feature, index) => {
                const formatted = formatFeatureWithCalculatedValues(feature, options.new_level);
                const hasResource = feature.type === 'resource' && formatted.calculatedValues?.total;

                return (
                  <div key={index} className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <h3 className="font-semibold text-emerald-400">{feature.name}</h3>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {formatted.description}
                    </p>
                    {/* Show calculated resource values */}
                    {hasResource && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          Запас: {formatted.calculatedValues?.total}
                        </span>
                        {formatted.calculatedValues?.maxPerUse && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Макс. за раз: {formatted.calculatedValues.maxPerUse}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Confirm Step */}
        {currentStep === "confirm" && (
          <Card className="border-green-500/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Check className="h-6 w-6 text-green-500" />
                <CardTitle>Подтверждение</CardTitle>
              </div>
              <CardDescription>
                Проверьте ваши выборы перед применением
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Новый уровень</span>
                  <Badge className="bg-yellow-500 text-black">{options.new_level}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">HP увеличение</span>
                  <span className="text-green-500 font-bold">+{getHpIncrease()}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Бонус мастерства</span>
                  <span className="font-bold">{formatModifier(options.proficiency_bonus)}</span>
                </div>

                {options.subclass_required && selectedSubclass && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">{options.subclass_name || "Подкласс"}</span>
                      <Badge variant="outline" className="bg-amber-500/20 border-amber-500/30">
                        {options.subclass_options?.find((s) => s.slug === selectedSubclass)?.name || selectedSubclass}
                      </Badge>
                    </div>
                    {/* Show subclass choices if any */}
                    {(subclassChoices.terrain || subclassChoices.bonus_cantrip) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {subclassChoices.terrain && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            🌍 {getSelectedSubclassData()?.choices?.terrain?.options.find(o => o.key === subclassChoices.terrain)?.name}
                          </Badge>
                        )}
                        {subclassChoices.bonus_cantrip && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            ✨ {DRUID_CANTRIPS.find(c => c.slug === subclassChoices.bonus_cantrip)?.name || subclassChoices.bonus_cantrip}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {options.asi_available && asiType === "asi" && getTotalAsiPoints() > 0 && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground mb-2">Улучшения характеристик:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(asiAllocation)
                        .filter(([, val]) => val > 0)
                        .map(([key, val]) => (
                          <Badge key={key} variant="outline">
                            {getAbilityName(key)} +{val}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {options.asi_available && asiType === "feat" && selectedFeat && (
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <p className="text-muted-foreground mb-2">Черта:</p>
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 mb-3">
                      {options.asi_options?.feats?.find((f) => f.slug === selectedFeat)?.name || selectedFeat}
                    </Badge>

                    {/* Show feat benefits summary */}
                    <div className="space-y-2 text-sm">
                      {featChoices.ability && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            +{getSelectedFeatData()?.benefits?.ability_increase?.amount || 1} {ALL_ABILITIES.find(a => a.key === featChoices.ability)?.name}
                          </Badge>
                        </div>
                      )}
                      {featChoices.saving_throw && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Спасбросок: {ALL_ABILITIES.find(a => a.key === featChoices.saving_throw)?.name}
                          </Badge>
                        </div>
                      )}
                      {featChoices.skill_proficiencies && featChoices.skill_proficiencies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {featChoices.skill_proficiencies.map(sk => (
                            <Badge key={sk} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              ● {ALL_SKILLS.find(s => s.key === sk)?.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {featChoices.skill_expertise && featChoices.skill_expertise.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {featChoices.skill_expertise.map(sk => (
                            <Badge key={sk} className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              ◆ {ALL_SKILLS.find(s => s.key === sk)?.name} (экспертиза)
                            </Badge>
                          ))}
                        </div>
                      )}
                      {/* Show other feat benefits from the feat data */}
                      {getSelectedFeatData()?.benefits?.initiative_bonus && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          +{getSelectedFeatData()?.benefits?.initiative_bonus} Инициатива
                        </Badge>
                      )}
                      {getSelectedFeatData()?.benefits?.ac_bonus && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          +{getSelectedFeatData()?.benefits?.ac_bonus} КД
                        </Badge>
                      )}
                      {getSelectedFeatData()?.benefits?.hp_per_level && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          +{getSelectedFeatData()?.benefits?.hp_per_level} ОЗ за уровень
                        </Badge>
                      )}
                      {getSelectedFeatData()?.benefits?.luck_points && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          {getSelectedFeatData()?.benefits?.luck_points} очков удачи
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {options.features.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground mb-2">Новые способности:</p>
                    <div className="flex flex-wrap gap-2">
                      {options.features.map((f, i) => (
                        <Badge key={i} variant="outline" className="bg-emerald-500/10">
                          {f.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom navigation - high z-index to be above player nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div className="w-full max-w-2xl bg-background border-t p-4">
          <div className="flex gap-3 max-w-md mx-auto">
          <Button
            variant="outline"
            className="flex-1"
            onClick={goBack}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>

          {currentStep === "confirm" ? (
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              onClick={submitLevelUp}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Применяю...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Повысить уровень!
                </>
              )}
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={goNext}
              disabled={!canProceed()}
            >
              Далее
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Feat Choices Step Component
interface FeatChoicesStepProps {
  feat: {
    slug: string;
    name: string;
    description: string;
    benefits?: {
      ability_increase?: { amount: number; choice?: boolean; options?: string[] };
      saving_throw_proficiency?: { choice: boolean } | string;
      skill_proficiency?: number;
      skill_expertise?: number;
      languages?: number;
      cantrip?: { choice: boolean; attack_roll_required?: boolean };
      spell?: { choice: boolean; level?: number; school?: string };
      spells?: string[];
    };
    available_cantrips?: SpellPreview[];
    available_spells?: SpellPreview[];
  } | null;
  featChoices: FeatChoicesState;
  setFeatChoices: React.Dispatch<React.SetStateAction<FeatChoicesState>>;
  character: Character | null;
}

const ALL_ABILITIES = [
  { key: "strength", name: "Сила" },
  { key: "dexterity", name: "Ловкость" },
  { key: "constitution", name: "Телосложение" },
  { key: "intelligence", name: "Интеллект" },
  { key: "wisdom", name: "Мудрость" },
  { key: "charisma", name: "Харизма" },
];

const ALL_SKILLS = [
  { key: "acrobatics", name: "Акробатика", ability: "dexterity" },
  { key: "animal_handling", name: "Уход за животными", ability: "wisdom" },
  { key: "arcana", name: "Магия", ability: "intelligence" },
  { key: "athletics", name: "Атлетика", ability: "strength" },
  { key: "deception", name: "Обман", ability: "charisma" },
  { key: "history", name: "История", ability: "intelligence" },
  { key: "insight", name: "Проницательность", ability: "wisdom" },
  { key: "intimidation", name: "Запугивание", ability: "charisma" },
  { key: "investigation", name: "Расследование", ability: "intelligence" },
  { key: "medicine", name: "Медицина", ability: "wisdom" },
  { key: "nature", name: "Природа", ability: "intelligence" },
  { key: "perception", name: "Внимательность", ability: "wisdom" },
  { key: "performance", name: "Выступление", ability: "charisma" },
  { key: "persuasion", name: "Убеждение", ability: "charisma" },
  { key: "religion", name: "Религия", ability: "intelligence" },
  { key: "sleight_of_hand", name: "Ловкость рук", ability: "dexterity" },
  { key: "stealth", name: "Скрытность", ability: "dexterity" },
  { key: "survival", name: "Выживание", ability: "wisdom" },
];

function FeatChoicesStep({ feat, featChoices, setFeatChoices, character }: FeatChoicesStepProps) {
  // Debug logging
  console.log("FeatChoicesStep rendering:", { feat, featChoices, hasBenefits: !!feat?.benefits });

  if (!feat) {
    return (
      <Card className="border-red-500/30">
        <CardContent className="py-8 text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-red-500/50" />
          <p className="text-red-400">Ошибка: данные черты не найдены</p>
          <p className="text-sm text-muted-foreground mt-1">
            Попробуйте вернуться и выбрать черту заново
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!feat.benefits) {
    return (
      <Card className="border-yellow-500/30">
        <CardContent className="py-8 text-center">
          <Crown className="h-12 w-12 mx-auto mb-4 text-yellow-500/50" />
          <p className="text-yellow-400">Черта: {feat.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Эта черта не требует дополнительных выборов
          </p>
        </CardContent>
      </Card>
    );
  }

  const benefits = feat.benefits;
  const existingSkillProficiencies = character?.skill_proficiencies || [];
  const existingSkillExpertise = character?.skill_expertise || [];

  // Determine which abilities are available for selection
  const availableAbilities = benefits.ability_increase?.options
    ? ALL_ABILITIES.filter(a => benefits.ability_increase!.options!.includes(a.key))
    : ALL_ABILITIES;

  // Available skills for proficiency (exclude already proficient)
  const availableSkillsForProficiency = ALL_SKILLS.filter(
    s => !existingSkillProficiencies.includes(s.key)
  );

  // Available skills for expertise (must be proficient + not already expertise)
  const availableSkillsForExpertise = ALL_SKILLS.filter(
    s => (existingSkillProficiencies.includes(s.key) || (featChoices.skill_proficiencies || []).includes(s.key))
      && !existingSkillExpertise.includes(s.key)
  );

  const toggleSkillProficiency = (skillKey: string) => {
    const current = featChoices.skill_proficiencies || [];
    const max = benefits.skill_proficiency || 0;

    if (current.includes(skillKey)) {
      setFeatChoices(prev => ({
        ...prev,
        skill_proficiencies: current.filter(s => s !== skillKey),
      }));
    } else if (current.length < max) {
      setFeatChoices(prev => ({
        ...prev,
        skill_proficiencies: [...current, skillKey],
      }));
    }
  };

  const toggleSkillExpertise = (skillKey: string) => {
    const current = featChoices.skill_expertise || [];
    const max = benefits.skill_expertise || 0;

    if (current.includes(skillKey)) {
      setFeatChoices(prev => ({
        ...prev,
        skill_expertise: current.filter(s => s !== skillKey),
      }));
    } else if (current.length < max) {
      setFeatChoices(prev => ({
        ...prev,
        skill_expertise: [...current, skillKey],
      }));
    }
  };

  return (
    <Card className="border-purple-500/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-purple-500" />
          <CardTitle>Выбор для черты: {feat.name}</CardTitle>
        </div>
        <CardDescription>
          Сделайте необходимые выборы для этой черты
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ability Choice */}
        {(benefits.ability_increase?.choice || (benefits.ability_increase?.options && benefits.ability_increase.options.length > 0)) && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Увеличить характеристику на +{benefits.ability_increase?.amount || 1}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {availableAbilities.map(ability => {
                const currentValue = character?.abilities?.[ability.key as keyof typeof character.abilities] || 10;
                const isSelected = featChoices.ability === ability.key;
                const isMaxed = currentValue >= 20;

                return (
                  <div
                    key={ability.key}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-purple-500 bg-purple-500/10"
                        : isMaxed
                          ? "border-border opacity-50 cursor-not-allowed"
                          : "border-border hover:border-purple-500/50"
                    )}
                    onClick={() => {
                      if (!isMaxed) {
                        setFeatChoices(prev => ({
                          ...prev,
                          ability: ability.key,
                          // For Resilient, saving throw matches ability
                          saving_throw: ability.key,
                        }));
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ability.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{currentValue}</span>
                        {isSelected && (
                          <span className="text-green-500">→ {currentValue + (benefits.ability_increase?.amount || 1)}</span>
                        )}
                        {isMaxed && (
                          <Badge variant="outline" className="text-xs text-yellow-500">MAX</Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-purple-500 mt-1" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show saving throw proficiency note for Resilient */}
            {benefits.saving_throw_proficiency && typeof benefits.saving_throw_proficiency === 'object' && featChoices.ability && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-sm text-green-400">
                  ✓ Вы получите владение спасброском {ALL_ABILITIES.find(a => a.key === featChoices.ability)?.name}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Skill Proficiency Choice */}
        {benefits.skill_proficiency && benefits.skill_proficiency > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Выберите навыки для владения
              </Label>
              <Badge variant={
                (featChoices.skill_proficiencies?.length || 0) === benefits.skill_proficiency
                  ? "default" : "outline"
              } className={cn(
                (featChoices.skill_proficiencies?.length || 0) === benefits.skill_proficiency && "bg-green-500"
              )}>
                {featChoices.skill_proficiencies?.length || 0} / {benefits.skill_proficiency}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {availableSkillsForProficiency.map(skill => {
                const isSelected = (featChoices.skill_proficiencies || []).includes(skill.key);
                const canSelect = isSelected || (featChoices.skill_proficiencies || []).length < benefits.skill_proficiency!;

                return (
                  <div
                    key={skill.key}
                    className={cn(
                      "p-2 rounded-lg border cursor-pointer transition-all text-sm",
                      isSelected
                        ? "border-purple-500 bg-purple-500/10"
                        : canSelect
                          ? "border-border hover:border-purple-500/50"
                          : "border-border opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => canSelect && toggleSkillProficiency(skill.key)}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && <Check className="h-3 w-3 text-purple-500" />}
                      <span>{skill.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skill Expertise Choice */}
        {benefits.skill_expertise && benefits.skill_expertise > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Выберите навыки для экспертизы
              </Label>
              <Badge variant={
                (featChoices.skill_expertise?.length || 0) === benefits.skill_expertise
                  ? "default" : "outline"
              } className={cn(
                (featChoices.skill_expertise?.length || 0) === benefits.skill_expertise && "bg-green-500"
              )}>
                {featChoices.skill_expertise?.length || 0} / {benefits.skill_expertise}
              </Badge>
            </div>
            {availableSkillsForExpertise.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Сначала выберите навык для владения выше, чтобы получить для него экспертизу
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSkillsForExpertise.map(skill => {
                  const isSelected = (featChoices.skill_expertise || []).includes(skill.key);
                  const canSelect = isSelected || (featChoices.skill_expertise || []).length < benefits.skill_expertise!;

                  return (
                    <div
                      key={skill.key}
                      className={cn(
                        "p-2 rounded-lg border cursor-pointer transition-all text-sm",
                        isSelected
                          ? "border-amber-500 bg-amber-500/10"
                          : canSelect
                            ? "border-border hover:border-amber-500/50"
                            : "border-border opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => canSelect && toggleSkillExpertise(skill.key)}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="h-3 w-3 text-amber-500" />}
                        <span>{skill.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">◆ x2</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Cantrip Choice */}
        {benefits.cantrip && typeof benefits.cantrip === 'object' && benefits.cantrip.choice && feat.available_cantrips && (
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="text-indigo-500">✨</span>
              Выберите заговор
            </Label>
            {benefits.cantrip.attack_roll_required && (
              <p className="text-sm text-muted-foreground">
                Заговор должен требовать броска атаки
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
              {feat.available_cantrips.map(cantrip => {
                const isSelected = featChoices.cantrip === cantrip.slug;
                const isKnown = (character?.known_spells || []).some(
                  s => (typeof s === 'object' && s !== null && 'slug' in s ? (s as { slug: string }).slug : s) === cantrip.slug
                );

                return (
                  <div
                    key={cantrip.slug}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10"
                        : isKnown
                          ? "border-border opacity-50 cursor-not-allowed"
                          : "border-border hover:border-indigo-500/50"
                    )}
                    onClick={() => {
                      if (!isKnown) {
                        setFeatChoices(prev => ({ ...prev, cantrip: cantrip.slug }));
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cantrip.name}</span>
                        {cantrip.school && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {cantrip.school}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isKnown && <Badge variant="secondary" className="text-xs">Уже знаете</Badge>}
                        {isSelected && <Check className="h-4 w-4 text-indigo-500" />}
                      </div>
                    </div>

                    {/* Spell parameters */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {cantrip.casting_time && (
                        <span>⏱ {cantrip.casting_time}</span>
                      )}
                      {cantrip.range && (
                        <span>📏 {cantrip.range}</span>
                      )}
                      {cantrip.duration && cantrip.duration !== "Мгновенная" && (
                        <span>⏳ {cantrip.duration}</span>
                      )}
                      {cantrip.effects?.damage && (
                        <span className="text-red-400">
                          ⚔ {cantrip.effects.damage.dice} {cantrip.effects.damage.type}
                        </span>
                      )}
                      {cantrip.effects?.healing && (
                        <span className="text-green-400">
                          💚 {cantrip.effects.healing.dice}
                        </span>
                      )}
                      {cantrip.effects?.save && (
                        <span className="text-yellow-400">
                          🎯 СП {cantrip.effects.save.ability}
                        </span>
                      )}
                    </div>

                    {cantrip.classes && cantrip.classes.length > 0 && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {cantrip.classes.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {feat.available_cantrips.length === 0 && (
              <p className="text-sm text-yellow-500">
                Нет доступных заговоров для выбора
              </p>
            )}
          </div>
        )}

        {/* Spell Choice */}
        {benefits.spell && typeof benefits.spell === 'object' && benefits.spell.choice && feat.available_spells && (
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="text-violet-500">📜</span>
              Выберите заклинание {benefits.spell.level && `${benefits.spell.level} уровня`}
            </Label>
            {benefits.spell.school && (
              <p className="text-sm text-muted-foreground">
                Школа: {benefits.spell.school}
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
              {feat.available_spells.map(spell => {
                const isSelected = featChoices.spell === spell.slug;
                const isKnown = (character?.known_spells || []).some(
                  s => (typeof s === 'object' && s !== null && 'slug' in s ? (s as { slug: string }).slug : s) === spell.slug
                );

                return (
                  <div
                    key={spell.slug}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-violet-500 bg-violet-500/10"
                        : isKnown
                          ? "border-border opacity-50 cursor-not-allowed"
                          : "border-border hover:border-violet-500/50"
                    )}
                    onClick={() => {
                      if (!isKnown) {
                        setFeatChoices(prev => ({ ...prev, spell: spell.slug }));
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{spell.name}</span>
                        {spell.school && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {spell.school}
                          </Badge>
                        )}
                        {spell.level !== undefined && spell.level > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {spell.level} ур.
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isKnown && <Badge variant="secondary" className="text-xs">Уже знаете</Badge>}
                        {isSelected && <Check className="h-4 w-4 text-violet-500" />}
                      </div>
                    </div>

                    {/* Spell parameters */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {spell.casting_time && (
                        <span>⏱ {spell.casting_time}</span>
                      )}
                      {spell.range && (
                        <span>📏 {spell.range}</span>
                      )}
                      {spell.duration && spell.duration !== "Мгновенная" && (
                        <span>⏳ {spell.duration}</span>
                      )}
                      {spell.effects?.damage && (
                        <span className="text-red-400">
                          ⚔ {spell.effects.damage.dice} {spell.effects.damage.type}
                        </span>
                      )}
                      {spell.effects?.healing && (
                        <span className="text-green-400">
                          💚 {spell.effects.healing.dice}
                        </span>
                      )}
                      {spell.effects?.save && (
                        <span className="text-yellow-400">
                          🎯 СП {spell.effects.save.ability}
                        </span>
                      )}
                    </div>

                    {spell.classes && spell.classes.length > 0 && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {spell.classes.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary of what will be gained */}
        <Separator />
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Вы получите:</Label>
          <div className="flex flex-wrap gap-2">
            {featChoices.ability && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                +{benefits.ability_increase?.amount || 1} {ALL_ABILITIES.find(a => a.key === featChoices.ability)?.name}
              </Badge>
            )}
            {benefits.saving_throw_proficiency && featChoices.ability && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                Спасбросок: {ALL_ABILITIES.find(a => a.key === featChoices.ability)?.name}
              </Badge>
            )}
            {(featChoices.skill_proficiencies || []).map(sk => (
              <Badge key={sk} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                ● {ALL_SKILLS.find(s => s.key === sk)?.name}
              </Badge>
            ))}
            {(featChoices.skill_expertise || []).map(sk => (
              <Badge key={sk} className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                ◆ {ALL_SKILLS.find(s => s.key === sk)?.name}
              </Badge>
            ))}
            {featChoices.cantrip && feat.available_cantrips && (
              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                ✨ {feat.available_cantrips.find(c => c.slug === featChoices.cantrip)?.name}
              </Badge>
            )}
            {featChoices.spell && feat.available_spells && (
              <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                📜 {feat.available_spells.find(s => s.slug === featChoices.spell)?.name}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Subclass Choices Step Component (terrain, bonus cantrip for Circle of the Land)
interface SubclassChoicesStepProps {
  subclass: {
    slug: string;
    name: string;
    description?: string;
    choices?: {
      terrain?: {
        required: boolean;
        feature_name: string;
        options: Array<{ key: string; name: string; spells?: string[] }>;
      };
      bonus_cantrip?: {
        required: boolean;
        feature_name: string;
        from_class: string;
        count: number;
        available_cantrips?: Array<{ slug: string; name: string }>;
      };
    };
  } | null;
  subclassChoices: SubclassChoicesState;
  setSubclassChoices: React.Dispatch<React.SetStateAction<SubclassChoicesState>>;
  characterKnownSpells: Array<{ slug: string; name: string; level: number; is_cantrip?: boolean } | string>;
}

// Default druid cantrips (fallback if not provided by API)
const DRUID_CANTRIPS = [
  { slug: "druidcraft", name: "Искусство друидов" },
  { slug: "guidance", name: "Указание" },
  { slug: "mending", name: "Починка" },
  { slug: "poison-spray", name: "Ядовитые брызги" },
  { slug: "produce-flame", name: "Сотворение пламени" },
  { slug: "resistance", name: "Сопротивление" },
  { slug: "shillelagh", name: "Дубинка" },
  { slug: "thorn-whip", name: "Терновый кнут" },
  { slug: "primal-savagery", name: "Дикость природы" },
  { slug: "magic-stone", name: "Волшебный камень" },
  { slug: "mold-earth", name: "Придание формы земле" },
  { slug: "gust", name: "Порыв ветра" },
  { slug: "control-flames", name: "Управление пламенем" },
  { slug: "shape-water", name: "Придание формы воде" },
  { slug: "infestation", name: "Заражение" },
  { slug: "frostbite", name: "Обморожение" },
  { slug: "thunderclap", name: "Громовой удар" },
];

function SubclassChoicesStep({ subclass, subclassChoices, setSubclassChoices, characterKnownSpells }: SubclassChoicesStepProps) {
  if (!subclass) {
    return (
      <Card className="border-red-500/30">
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-red-500/50" />
          <p className="text-red-400">Ошибка: данные подкласса не найдены</p>
        </CardContent>
      </Card>
    );
  }

  if (!subclass.choices) {
    return (
      <Card className="border-yellow-500/30">
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-yellow-500/50" />
          <p className="text-yellow-400">Подкласс: {subclass.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Этот подкласс не требует дополнительных выборов
          </p>
        </CardContent>
      </Card>
    );
  }

  const { terrain, bonus_cantrip } = subclass.choices;

  // Get available cantrips from API
  const availableCantrips = bonus_cantrip?.available_cantrips || [];

  // Extract known cantrip slugs (handle both object and string formats)
  const knownCantripSlugs = characterKnownSpells
    .filter(spell => {
      if (typeof spell === 'string') return true;
      if (typeof spell === 'object' && spell && 'level' in spell) {
        return spell.level === 0;
      }
      return false;
    })
    .map(spell => typeof spell === 'object' && spell && 'slug' in spell ? spell.slug : spell as string);

  // Filter out cantrips the character already knows
  const selectableCantrips = availableCantrips.filter(
    c => !knownCantripSlugs.includes(c.slug)
  );

  return (
    <Card className="border-green-500/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-green-500" />
          <CardTitle>Выбор для {subclass.name}</CardTitle>
        </div>
        <CardDescription>
          Сделайте необходимые выборы для вашего круга
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Terrain Selection */}
        {terrain && terrain.required && (
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="text-green-500">🌍</span>
              {terrain.feature_name}
            </Label>
            <p className="text-sm text-muted-foreground">
              Выберите тип местности, который определит ваши заклинания круга
            </p>
            <RadioGroup
              value={subclassChoices.terrain || ""}
              onValueChange={(value) => setSubclassChoices(prev => ({ ...prev, terrain: value }))}
              className="grid gap-3"
            >
              {terrain.options.map(option => (
                <div
                  key={option.key}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    subclassChoices.terrain === option.key
                      ? "border-green-500 bg-green-500/10"
                      : "border-border hover:border-green-500/50"
                  )}
                  onClick={() => setSubclassChoices(prev => ({ ...prev, terrain: option.key }))}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <RadioGroupItem value={option.key} id={`terrain-${option.key}`} />
                    <Label htmlFor={`terrain-${option.key}`} className="cursor-pointer font-semibold">
                      {option.name}
                    </Label>
                    {subclassChoices.terrain === option.key && (
                      <Check className="h-4 w-4 text-green-500 ml-auto" />
                    )}
                  </div>
                  {option.spells && option.spells.length > 0 && (
                    <p className="text-xs text-muted-foreground ml-6">
                      {option.spells.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {terrain && subclassChoices.terrain && (
          <Separator />
        )}

        {/* Bonus Cantrip Selection */}
        {bonus_cantrip && bonus_cantrip.required && (
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="text-green-500">✨</span>
              {bonus_cantrip.feature_name}
            </Label>
            <p className="text-sm text-muted-foreground">
              Выберите дополнительный заговор друида
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {selectableCantrips.map(cantrip => {
                const isSelected = subclassChoices.bonus_cantrip === cantrip.slug;

                return (
                  <div
                    key={cantrip.slug}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-green-500 bg-green-500/10"
                        : "border-border hover:border-green-500/50"
                    )}
                    onClick={() => setSubclassChoices(prev => ({ ...prev, bonus_cantrip: cantrip.slug }))}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{cantrip.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectableCantrips.length === 0 && (
              <p className="text-sm text-yellow-500">
                Вы уже знаете все доступные заговоры друида
              </p>
            )}
          </div>
        )}

        {/* Summary */}
        {(subclassChoices.terrain || subclassChoices.bonus_cantrip) && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Ваш выбор:</Label>
              <div className="flex flex-wrap gap-2">
                {subclassChoices.terrain && terrain && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    🌍 {terrain.options.find(o => o.key === subclassChoices.terrain)?.name}
                  </Badge>
                )}
                {subclassChoices.bonus_cantrip && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    ✨ {availableCantrips.find(c => c.slug === subclassChoices.bonus_cantrip)?.name}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to get ability name in Russian
function getAbilityName(key: string): string {
  const names: Record<string, string> = {
    strength: 'СИЛ',
    dexterity: 'ЛОВ',
    constitution: 'ТЕЛ',
    intelligence: 'ИНТ',
    wisdom: 'МДР',
    charisma: 'ХАР',
  };
  return names[key] || key;
}

// Helper to evaluate resource formulas
function evaluateFormula(formula: string, level: number, proficiencyBonus?: number): number {
  if (!formula) return 0;

  // Replace variables
  let expr = formula
    .replace(/level/g, String(level))
    .replace(/proficiency_bonus/g, String(proficiencyBonus || Math.floor((level - 1) / 4) + 2));

  // Handle math functions
  expr = expr.replace(/ceil\(([^)]+)\)/g, (_, inner) => {
    try {
      // Evaluate the inner expression safely
      const value = Function(`"use strict"; return (${inner})`)();
      return String(Math.ceil(value));
    } catch {
      return "0";
    }
  });

  expr = expr.replace(/floor\(([^)]+)\)/g, (_, inner) => {
    try {
      const value = Function(`"use strict"; return (${inner})`)();
      return String(Math.floor(value));
    } catch {
      return "0";
    }
  });

  // Evaluate the final expression
  try {
    return Function(`"use strict"; return (${expr})`)();
  } catch {
    return 0;
  }
}

// Helper to format feature description with calculated values
function formatFeatureWithCalculatedValues(
  feature: {
    name: string;
    description?: string;
    short_description?: string;
    type?: string;
    resource_max_formula?: string;
    resource_use_max_formula?: string;
    resource_die?: string;
  },
  level: number
): {
  description: string;
  calculatedValues?: {
    total?: string;
    maxPerUse?: string;
  };
} {
  // Use short_description if available, otherwise description
  let description = feature.short_description || feature.description || "";

  // Calculate values if this is a resource type
  const calculatedValues: { total?: string; maxPerUse?: string } = {};

  if (feature.resource_max_formula) {
    const total = evaluateFormula(feature.resource_max_formula, level);
    const die = feature.resource_die || "";
    calculatedValues.total = `${total}${die}`;

    // Replace text patterns with calculated values
    description = description
      .replace(/5 × уровень друида d6/g, `${total}d6`)
      .replace(/5 × уровень/g, String(total))
      .replace(/level \* 5/g, String(total));
  }

  if (feature.resource_use_max_formula) {
    const maxPerUse = evaluateFormula(feature.resource_use_max_formula, level);
    calculatedValues.maxPerUse = String(maxPerUse);

    // Replace text patterns
    description = description
      .replace(/половина уровня/g, String(maxPerUse))
      .replace(/макс\. за раз = половина уровня/g, `макс. за раз: ${maxPerUse}`)
      .replace(/ceil\(level \/ 2\)/g, String(maxPerUse));
  }

  return { description, calculatedValues };
}

// Helper to get step name
function getStepName(step: LevelUpStep): string {
  switch (step) {
    case "feat_choices":
      return "Выбор черты";
    case "hp":
      return "Здоровье";
    case "class":
      return "Класс";
    case "subclass":
      return "Подкласс";
    case "subclass_choices":
      return "Выбор круга";
    case "asi":
      return "Характеристики";
    case "features":
      return "Способности";
    case "confirm":
      return "Подтверждение";
    default:
      return "";
  }
}
