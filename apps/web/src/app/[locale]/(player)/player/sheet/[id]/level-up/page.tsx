"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type { Character, LevelUpOptionsResponse, LevelUpChoices } from "@/types/game";
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
} from "lucide-react";
import { toast } from "sonner";

// Step type
type LevelUpStep = "hp" | "class" | "asi" | "features" | "confirm";

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

  // ASI state
  const [asiType, setAsiType] = useState<"asi" | "feat">("asi");
  const [asiAllocation, setAsiAllocation] = useState<Record<string, number>>({});

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

  // Get available steps
  const getSteps = (): LevelUpStep[] => {
    const steps: LevelUpStep[] = ["hp"];

    // Add class step only if multiclass is enabled
    if (options?.class_options.multiclass_enabled) {
      steps.push("class");
    }

    // Add ASI step if available
    if (options?.asi_available) {
      steps.push("asi");
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
      case "asi":
        if (asiType === "asi") {
          return getTotalAsiPoints() === (options?.asi_options?.asi.points || 2);
        }
        return true; // feat selection
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

      // Add ASI choice
      if (options.asi_available) {
        if (asiType === "asi") {
          finalChoices.asi = {
            type: "asi",
            choices: asiAllocation,
          };
        }
        // TODO: feat selection
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
                    >
                      {getTotalAsiPoints()} / {options.asi_options.asi.points}
                    </Badge>
                  </div>

                  {options.asi_options.asi.abilities.map((ability) => (
                    <div
                      key={ability.key}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{ability.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Текущее: {ability.current}
                          {(asiAllocation[ability.key] || 0) > 0 && (
                            <span className="text-green-500 ml-1">
                              → {ability.current + (asiAllocation[ability.key] || 0)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => decreaseAbility(ability.key)}
                          disabled={(asiAllocation[ability.key] || 0) <= 0}
                        >
                          -
                        </Button>
                        <span className="w-6 text-center font-mono">
                          {asiAllocation[ability.key] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => increaseAbility(ability.key)}
                          disabled={!canIncreaseAbility(ability.key)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {asiType === "feat" && (
                <div className="text-center py-8 text-muted-foreground">
                  <Crown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Черты пока не реализованы</p>
                  <p className="text-sm">Выберите улучшение характеристик</p>
                </div>
              )}
            </CardContent>
          </Card>
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
              {options.features.map((feature, index) => (
                <div key={index} className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <h3 className="font-semibold text-emerald-400">{feature.name}</h3>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
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

                {options.asi_available && asiType === "asi" && getTotalAsiPoints() > 0 && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-muted-foreground mb-2">Улучшения характеристик:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(asiAllocation)
                        .filter(([, val]) => val > 0)
                        .map(([key, val]) => (
                          <Badge key={key} variant="outline">
                            {key} +{val}
                          </Badge>
                        ))}
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
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
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

// Helper to get step name
function getStepName(step: LevelUpStep): string {
  switch (step) {
    case "hp":
      return "Здоровье";
    case "class":
      return "Класс";
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
