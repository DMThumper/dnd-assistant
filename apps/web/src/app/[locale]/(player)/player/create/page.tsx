"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, ApiClientError } from "@/lib/api";
import type {
  CharacterCreationData,
  Race,
  CharacterClass,
  Abilities,
  WizardState,
} from "@/types/character-creation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";

// Step components
import { StepRace } from "@/components/player/character-creator/StepRace";
import { StepClass } from "@/components/player/character-creator/StepClass";
import { StepAbilities } from "@/components/player/character-creator/StepAbilities";
import { StepSkills } from "@/components/player/character-creator/StepSkills";
import { StepSpells } from "@/components/player/character-creator/StepSpells";
import { StepDetails } from "@/components/player/character-creator/StepDetails";

// Base steps (spells step will be inserted dynamically for spellcasters)
const BASE_STEPS = [
  { key: "race", label: "Раса" },
  { key: "class", label: "Класс" },
  { key: "abilities", label: "Характеристики" },
  { key: "skills", label: "Навыки" },
  // spells step inserted here for spellcasters
  { key: "details", label: "Детали" },
];

const DEFAULT_ABILITIES: Abilities = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

export default function CharacterCreatePage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = Number(searchParams.get("campaign"));

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creationData, setCreationData] = useState<CharacterCreationData | null>(null);

  const [wizardState, setWizardState] = useState<WizardState>({
    step: 0,
    race: null,
    subrace: null,
    characterClass: null,
    abilities: DEFAULT_ABILITIES,
    abilityBonusChoices: {},
    skillProficiencies: [],
    selectedSpells: [],
    name: "",
    backstory: "",
  });

  // Dynamically build steps based on whether class is a spellcaster
  const isSpellcaster = wizardState.characterClass?.is_spellcaster ?? false;
  const STEPS = isSpellcaster
    ? [
        { key: "race", label: "Раса" },
        { key: "class", label: "Класс" },
        { key: "abilities", label: "Характеристики" },
        { key: "skills", label: "Навыки" },
        { key: "spells", label: "Заклинания" },
        { key: "details", label: "Детали" },
      ]
    : BASE_STEPS;

  useEffect(() => {
    if (!campaignId) {
      router.push("/player");
      return;
    }

    const fetchData = async () => {
      try {
        const response = await api.getCharacterCreationData(campaignId);
        setCreationData(response.data);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить данные для создания персонажа");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [campaignId, router]);

  const updateWizardState = (updates: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    const currentStepKey = STEPS[wizardState.step]?.key;

    switch (currentStepKey) {
      case "race":
        return wizardState.race !== null;
      case "class":
        return wizardState.characterClass !== null;
      case "abilities":
        return true; // Abilities are always valid (default values)
      case "skills":
        if (!wizardState.characterClass) return false;
        const requiredSkills = wizardState.characterClass.skill_choices;
        // Filter out racial skills from the count (they don't count toward class choices)
        const race = wizardState.subrace || wizardState.race;
        const racialSkills = race?.skill_proficiencies || [];
        const classSkillsSelected = wizardState.skillProficiencies.filter(
          (sk) => !racialSkills.includes(sk)
        );
        return classSkillsSelected.length >= requiredSkills;
      case "spells":
        if (!wizardState.characterClass) return false;
        // Check cantrip and spell limits
        const cantripLimit = wizardState.characterClass.spell_slots?.["1"]?.cantrips ?? 0;
        const spellLimit = wizardState.characterClass.spells_known?.["1"] ?? 0;
        const cantrips = creationData?.spells.filter(
          (s) => s.level === 0 && s.classes.includes(wizardState.characterClass!.slug)
        ) ?? [];
        const selectedCantrips = wizardState.selectedSpells.filter((slug) =>
          cantrips.some((s) => s.slug === slug)
        );
        const selectedLeveledSpells = wizardState.selectedSpells.filter((slug) =>
          !cantrips.some((s) => s.slug === slug)
        );
        return selectedCantrips.length >= cantripLimit && selectedLeveledSpells.length >= spellLimit;
      case "details":
        return wizardState.name.trim().length >= 2;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (wizardState.step < STEPS.length - 1 && canProceed()) {
      updateWizardState({ step: wizardState.step + 1 });
    }
  };

  const handleBack = () => {
    if (wizardState.step > 0) {
      updateWizardState({ step: wizardState.step - 1 });
    } else {
      router.push(`/player/campaigns/${campaignId}`);
    }
  };

  const handleSubmit = async () => {
    if (!wizardState.race || !wizardState.characterClass || !wizardState.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Calculate final abilities with racial bonuses
      const finalAbilities = { ...wizardState.abilities };
      const race = wizardState.subrace || wizardState.race;

      // Apply fixed racial bonuses
      for (const [ability, bonus] of Object.entries(race.ability_bonuses)) {
        if (ability !== "choice" && typeof bonus === "number") {
          finalAbilities[ability as keyof Abilities] += bonus;
        }
      }

      // Apply chosen bonuses
      for (const [ability, bonus] of Object.entries(wizardState.abilityBonusChoices)) {
        finalAbilities[ability as keyof Abilities] += bonus;
      }

      const response = await api.createCharacter(campaignId, {
        name: wizardState.name.trim(),
        race_slug: race.slug,
        class_slug: wizardState.characterClass.slug,
        abilities: finalAbilities,
        skill_proficiencies: wizardState.skillProficiencies,
        backstory: wizardState.backstory.trim() || undefined,
        selected_spells: wizardState.selectedSpells.length > 0 ? wizardState.selectedSpells : undefined,
      });

      // Store active character and redirect
      localStorage.setItem("dnd-player-active-character", String(response.data.character.id));
      router.push(`/player/sheet/${response.data.character.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Не удалось создать персонажа");
      }
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !creationData) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push("/player")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
      </div>
    );
  }

  if (!creationData) {
    return null;
  }

  const progress = ((wizardState.step + 1) / STEPS.length) * 100;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with progress */}
      <div className="sticky top-14 z-30 bg-card border-b border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold">Создание персонажа</h1>
          <span className="text-sm text-muted-foreground">
            {wizardState.step + 1} / {STEPS.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2">
          {STEPS.map((step, index) => (
            <span
              key={step.key}
              className={`text-xs ${
                index === wizardState.step
                  ? "text-primary font-medium"
                  : index < wizardState.step
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
              }`}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 p-4 pb-24">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {STEPS[wizardState.step]?.key === "race" && (
          <StepRace
            races={creationData.races}
            subraces={creationData.subraces}
            selectedRace={wizardState.race}
            selectedSubrace={wizardState.subrace}
            onSelectRace={(race) => updateWizardState({ race, subrace: null, abilityBonusChoices: {}, skillProficiencies: [] })}
            onSelectSubrace={(subrace) => updateWizardState({ subrace, skillProficiencies: [] })}
          />
        )}

        {STEPS[wizardState.step]?.key === "class" && (
          <StepClass
            classes={creationData.classes}
            selectedClass={wizardState.characterClass}
            onSelectClass={(characterClass) =>
              updateWizardState({ characterClass, skillProficiencies: [], selectedSpells: [] })
            }
          />
        )}

        {STEPS[wizardState.step]?.key === "abilities" && (
          <StepAbilities
            rules={creationData.rules}
            race={wizardState.subrace || wizardState.race}
            method={creationData.campaign.ability_method}
            abilities={wizardState.abilities}
            abilityBonusChoices={wizardState.abilityBonusChoices}
            onAbilitiesChange={(abilities) => updateWizardState({ abilities })}
            onBonusChoicesChange={(choices) => updateWizardState({ abilityBonusChoices: choices })}
          />
        )}

        {STEPS[wizardState.step]?.key === "skills" && wizardState.characterClass && (
          <StepSkills
            rules={creationData.rules}
            characterClass={wizardState.characterClass}
            race={wizardState.subrace || wizardState.race}
            selectedSkills={wizardState.skillProficiencies}
            onSkillsChange={(skills) => updateWizardState({ skillProficiencies: skills })}
          />
        )}

        {STEPS[wizardState.step]?.key === "spells" && wizardState.characterClass && creationData.spells && (
          <StepSpells
            spells={creationData.spells}
            characterClass={wizardState.characterClass}
            selectedSpells={wizardState.selectedSpells}
            onSpellsChange={(spells) => updateWizardState({ selectedSpells: spells })}
          />
        )}

        {STEPS[wizardState.step]?.key === "details" && (
          <StepDetails
            name={wizardState.name}
            backstory={wizardState.backstory}
            race={wizardState.subrace || wizardState.race}
            characterClass={wizardState.characterClass}
            abilities={wizardState.abilities}
            abilityBonusChoices={wizardState.abilityBonusChoices}
            onNameChange={(name) => updateWizardState({ name })}
            onBackstoryChange={(backstory) => updateWizardState({ backstory })}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button variant="outline" onClick={handleBack} className="flex-1">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {wizardState.step === 0 ? "Отмена" : "Назад"}
          </Button>

          {wizardState.step < STEPS.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              Далее
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Создать
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
