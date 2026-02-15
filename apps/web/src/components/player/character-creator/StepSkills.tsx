"use client";

import type { CharacterClass, Race, RulesInfo } from "@/types/character-creation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface StepSkillsProps {
  rules: RulesInfo;
  characterClass: CharacterClass;
  race: Race | null;
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
}

export function StepSkills({
  rules,
  characterClass,
  race,
  selectedSkills,
  onSkillsChange,
}: StepSkillsProps) {
  const maxSkills = characterClass.skill_choices;

  // Get class skill options
  const classSkillOptions = characterClass.skill_options || [];

  // Get racial skill proficiencies (fixed)
  const racialSkills = race?.skill_proficiencies || [];

  // Get ability name for skill
  const getAbilityName = (key: string): string => {
    const names: Record<string, string> = {
      strength: "СИЛ",
      dexterity: "ЛОВ",
      constitution: "ТЕЛ",
      intelligence: "ИНТ",
      wisdom: "МДР",
      charisma: "ХАР",
    };
    return names[key] || key;
  };

  // Handle skill toggle
  const handleSkillToggle = (skillKey: string) => {
    if (racialSkills.includes(skillKey)) {
      // Can't toggle racial skills
      return;
    }

    if (selectedSkills.includes(skillKey)) {
      // Remove skill
      onSkillsChange(selectedSkills.filter((s) => s !== skillKey));
    } else if (selectedSkills.length < maxSkills) {
      // Add skill
      onSkillsChange([...selectedSkills, skillKey]);
    }
  };

  // Check if skill is available from class
  const isClassSkill = (skillKey: string): boolean => {
    return classSkillOptions.includes(skillKey);
  };

  // Check if skill is granted by race
  const isRacialSkill = (skillKey: string): boolean => {
    return racialSkills.includes(skillKey);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Выберите навыки</h2>
        <p className="text-sm text-muted-foreground">
          Выберите {maxSkills} навыков из списка доступных для вашего класса.
          {racialSkills.length > 0 && (
            <span className="text-primary ml-1">
              Навыки от расы уже включены.
            </span>
          )}
        </p>
      </div>

      {/* Selection counter */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <span className="text-sm font-medium">Выбрано навыков:</span>
        <Badge
          variant={selectedSkills.length === maxSkills ? "default" : "secondary"}
          className="text-lg px-3"
        >
          {selectedSkills.length} / {maxSkills}
        </Badge>
      </div>

      {/* Racial skills info */}
      {racialSkills.length > 0 && (
        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm">
            <strong>{race?.name}:</strong> Владение навыками{" "}
            {racialSkills
              .map((sk: string) => rules.skills.find((s) => s.key === sk)?.name || sk)
              .join(", ")}
          </p>
        </div>
      )}

      {/* Skills grid */}
      <div className="grid gap-2">
        {rules.skills.map((skill) => {
          const isSelected = selectedSkills.includes(skill.key);
          const isRacial = isRacialSkill(skill.key);
          const isAvailable = isClassSkill(skill.key);
          const canSelect = isAvailable && !isRacial && (isSelected || selectedSkills.length < maxSkills);

          return (
            <Card
              key={skill.key}
              className={`transition-all ${
                isRacial
                  ? "ring-2 ring-primary bg-primary/10 cursor-default"
                  : isSelected
                    ? "ring-2 ring-primary bg-primary/5 cursor-pointer"
                    : isAvailable && canSelect
                      ? "cursor-pointer hover:bg-accent/50"
                      : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => canSelect && handleSkillToggle(skill.key)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected || isRacial
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      }`}
                    >
                      {(isSelected || isRacial) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({getAbilityName(skill.ability)})
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isRacial && (
                      <Badge variant="secondary" className="text-xs">
                        {race?.name}
                      </Badge>
                    )}
                    {!isAvailable && !isRacial && (
                      <Badge variant="outline" className="text-xs opacity-50">
                        Недоступен
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Class skill list reminder */}
      <div className="text-xs text-muted-foreground">
        <p className="font-medium mb-1">
          Доступные навыки для {characterClass.name}:
        </p>
        <p>
          {classSkillOptions
            .map((sk) => rules.skills.find((s) => s.key === sk)?.name || sk)
            .join(", ")}
        </p>
      </div>
    </div>
  );
}
