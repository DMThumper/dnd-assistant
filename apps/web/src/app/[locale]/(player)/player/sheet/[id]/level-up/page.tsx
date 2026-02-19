"use client";

import { useParams } from "next/navigation";
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
import { usePlayerSession } from "@/contexts/PlayerSessionContext";
import { useLevelUp } from "@/hooks/useLevelUp";
import { FeatChoicesStep, SubclassChoicesStep } from "@/components/player/level-up";
import {
  getStepName,
  getAbilityName,
  formatFeatureWithCalculatedValues
} from "@/lib/level-up-utils";
import { ALL_ABILITIES, ALL_SKILLS, DRUID_CANTRIPS } from "@/types/level-up";

export default function LevelUpPage() {
  const params = useParams();
  const characterId = Number(params.id);
  const { isConnected: isSessionConnected } = usePlayerSession();

  const {
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
    setHpMethod,
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

    // Submit
    submitLevelUp,
  } = useLevelUp({ characterId });

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
        <Button variant="outline" onClick={goBack}>
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
              {character.name} &rarr; Уровень {options.new_level}
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
          <HpStep
            options={options}
            hpMethod={hpMethod}
            setHpMethod={setHpMethod}
            hpRoll={hpRoll}
            hpManualInput={hpManualInput}
            setHpManualInput={setHpManualInput}
            isRolling={isRolling}
            rollHp={rollHp}
            getHpIncrease={getHpIncrease}
            getHitDieMax={getHitDieMax}
            getManualRollValue={getManualRollValue}
          />
        )}

        {/* Class Step (Multiclass) */}
        {currentStep === "class" && options.class_options.multiclass_enabled && (
          <ClassStep
            options={options}
            choices={choices}
            setChoices={setChoices}
          />
        )}

        {/* Subclass Step */}
        {currentStep === "subclass" && options.subclass_required && options.subclass_options && (
          <SubclassStep
            options={options}
            selectedSubclass={selectedSubclass}
            setSelectedSubclass={setSelectedSubclass}
          />
        )}

        {/* Subclass Choices Step */}
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
          <AsiStep
            options={options}
            asiType={asiType}
            setAsiType={setAsiType}
            asiAllocation={asiAllocation}
            getTotalAsiPoints={getTotalAsiPoints}
            canIncreaseAbility={canIncreaseAbility}
            increaseAbility={increaseAbility}
            decreaseAbility={decreaseAbility}
            selectedFeat={selectedFeat}
            setSelectedFeat={setSelectedFeat}
          />
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
          <FeaturesStep options={options} />
        )}

        {/* Confirm Step */}
        {currentStep === "confirm" && (
          <ConfirmStep
            options={options}
            getHpIncrease={getHpIncrease}
            selectedSubclass={selectedSubclass}
            subclassChoices={subclassChoices}
            getSelectedSubclassData={getSelectedSubclassData}
            asiType={asiType}
            asiAllocation={asiAllocation}
            getTotalAsiPoints={getTotalAsiPoints}
            selectedFeat={selectedFeat}
            featChoices={featChoices}
            getSelectedFeatData={getSelectedFeatData}
          />
        )}
      </div>

      {/* Bottom navigation */}
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

// HP Step Component
interface HpStepProps {
  options: NonNullable<ReturnType<typeof useLevelUp>["options"]>;
  hpMethod: "average" | "manual" | "auto";
  setHpMethod: (method: "average" | "manual" | "auto") => void;
  hpRoll: number | null;
  hpManualInput: string;
  setHpManualInput: (value: string) => void;
  isRolling: boolean;
  rollHp: () => void;
  getHpIncrease: () => number;
  getHitDieMax: () => number;
  getManualRollValue: () => number | null;
}

function HpStep({
  options,
  hpMethod,
  setHpMethod,
  hpRoll,
  hpManualInput,
  setHpManualInput,
  isRolling,
  rollHp,
  getHpIncrease,
  getHitDieMax,
  getManualRollValue,
}: HpStepProps) {
  return (
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
          onValueChange={(v) => setHpMethod(v as "average" | "manual" | "auto")}
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

          {/* Manual input option */}
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

        {/* Manual input */}
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
                  if (val === "") {
                    setHpManualInput("");
                    return;
                  }
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
  );
}

// Class Step Component
interface ClassStepProps {
  options: NonNullable<ReturnType<typeof useLevelUp>["options"]>;
  choices: { class?: string };
  setChoices: React.Dispatch<React.SetStateAction<{ class?: string }>>;
}

function ClassStep({ options, choices, setChoices }: ClassStepProps) {
  return (
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
  );
}

// Subclass Step Component
interface SubclassStepProps {
  options: NonNullable<ReturnType<typeof useLevelUp>["options"]>;
  selectedSubclass: string | null;
  setSelectedSubclass: (slug: string) => void;
}

function SubclassStep({ options, selectedSubclass, setSelectedSubclass }: SubclassStepProps) {
  return (
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
        {options.subclass_options?.map((subclass) => {
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
  );
}

// ASI Step Component
interface AsiStepProps {
  options: NonNullable<ReturnType<typeof useLevelUp>["options"]>;
  asiType: "asi" | "feat";
  setAsiType: (type: "asi" | "feat") => void;
  asiAllocation: Record<string, number>;
  getTotalAsiPoints: () => number;
  canIncreaseAbility: (key: string) => boolean;
  increaseAbility: (key: string) => void;
  decreaseAbility: (key: string) => void;
  selectedFeat: string | null;
  setSelectedFeat: (slug: string) => void;
}

function AsiStep({
  options,
  asiType,
  setAsiType,
  asiAllocation,
  getTotalAsiPoints,
  canIncreaseAbility,
  increaseAbility,
  decreaseAbility,
  selectedFeat,
  setSelectedFeat,
}: AsiStepProps) {
  return (
    <Card className="border-blue-500/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-500" />
          <CardTitle>Улучшение характеристик</CardTitle>
        </div>
        <CardDescription>
          Распределите {options.asi_options?.asi.points || 2} очка между характеристиками
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
          {options.asi_options?.feats_enabled && (
            <div className="flex items-center gap-2">
              <RadioGroupItem value="feat" id="feat-type" />
              <Label htmlFor="feat-type">Черта</Label>
            </div>
          )}
        </RadioGroup>

        <Separator />

        {asiType === "asi" && options.asi_options && (
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
                            <span className="text-green-500">&rarr; {newValue}</span>
                            {modChanged && (
                              <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/50 text-green-400">
                                {formatModifier(currentMod)} &rarr; {formatModifier(newMod)}
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
          <FeatSelectionList
            options={options}
            selectedFeat={selectedFeat}
            setSelectedFeat={setSelectedFeat}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Feat Selection List Component
interface FeatSelectionListProps {
  options: NonNullable<ReturnType<typeof useLevelUp>["options"]>;
  selectedFeat: string | null;
  setSelectedFeat: (slug: string) => void;
}

function FeatSelectionList({ options, selectedFeat, setSelectedFeat }: FeatSelectionListProps) {
  if (!options.asi_options?.feats || options.asi_options.feats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Crown className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Нет доступных черт</p>
        <p className="text-sm">Выберите улучшение характеристик</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {options.asi_options.feats.map((feat) => (
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

              {!feat.meets_prerequisites && feat.failed_prerequisites && feat.failed_prerequisites.length > 0 && (
                <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400 font-medium mb-1">Не выполнены требования:</p>
                  <ul className="text-xs text-red-300 space-y-0.5">
                    {feat.failed_prerequisites.map((prereq, idx) => (
                      <li key={idx}>&bull; {prereq}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-2">
                {feat.description}
              </p>

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
      ))}
    </div>
  );
}

// Features Step Component
interface FeaturesStepProps {
  options: NonNullable<ReturnType<typeof useLevelUp>["options"]>;
}

function FeaturesStep({ options }: FeaturesStepProps) {
  return (
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
  );
}

// Confirm Step Component
interface ConfirmStepProps {
  options: NonNullable<ReturnType<typeof useLevelUp>["options"]>;
  getHpIncrease: () => number;
  selectedSubclass: string | null;
  subclassChoices: { terrain?: string; bonus_cantrip?: string };
  getSelectedSubclassData: () => { name?: string; choices?: { terrain?: { options: Array<{ key: string; name: string }> } } } | null;
  asiType: "asi" | "feat";
  asiAllocation: Record<string, number>;
  getTotalAsiPoints: () => number;
  selectedFeat: string | null;
  featChoices: { ability?: string; saving_throw?: string; skill_proficiencies?: string[]; skill_expertise?: string[] };
  getSelectedFeatData: () => { benefits?: { ability_increase?: { amount: number }; initiative_bonus?: number; ac_bonus?: number; hp_per_level?: number; luck_points?: number } } | null;
}

function ConfirmStep({
  options,
  getHpIncrease,
  selectedSubclass,
  subclassChoices,
  getSelectedSubclassData,
  asiType,
  asiAllocation,
  getTotalAsiPoints,
  selectedFeat,
  featChoices,
  getSelectedFeatData,
}: ConfirmStepProps) {
  return (
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
              {(subclassChoices.terrain || subclassChoices.bonus_cantrip) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {subclassChoices.terrain && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      &earth; {getSelectedSubclassData()?.choices?.terrain?.options.find(o => o.key === subclassChoices.terrain)?.name}
                    </Badge>
                  )}
                  {subclassChoices.bonus_cantrip && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      &starf; {DRUID_CANTRIPS.find(c => c.slug === subclassChoices.bonus_cantrip)?.name || subclassChoices.bonus_cantrip}
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
                        &bull; {ALL_SKILLS.find(s => s.key === sk)?.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {featChoices.skill_expertise && featChoices.skill_expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {featChoices.skill_expertise.map(sk => (
                      <Badge key={sk} className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        &diams; {ALL_SKILLS.find(s => s.key === sk)?.name} (экспертиза)
                      </Badge>
                    ))}
                  </div>
                )}
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
  );
}
