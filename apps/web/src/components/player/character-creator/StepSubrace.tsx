"use client";

import type { Race } from "@/types/character-creation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { formatModifier } from "@/types/character-creation";

interface StepSubraceProps {
  parentRace: Race;
  subraces: Race[];
  selectedSubrace: Race | null;
  onSelectSubrace: (subrace: Race | null) => void;
}

export function StepSubrace({
  parentRace,
  subraces,
  selectedSubrace,
  onSelectSubrace,
}: StepSubraceProps) {
  // Format ability bonuses for display
  const formatBonuses = (race: Race): string => {
    const bonuses = race.ability_bonuses;
    const parts: string[] = [];

    const abilityNames: Record<string, string> = {
      strength: "СИЛ",
      dexterity: "ЛОВ",
      constitution: "ТЕЛ",
      intelligence: "ИНТ",
      wisdom: "МДР",
      charisma: "ХАР",
    };

    for (const [ability, value] of Object.entries(bonuses)) {
      if (ability !== "choice" && typeof value === "number" && value !== 0) {
        parts.push(`${abilityNames[ability]} ${formatModifier(10 + value * 2).replace("+", "+")}`);
      }
    }

    if (bonuses.choice) {
      parts.push(`+${bonuses.choice.amount} к ${bonuses.choice.count} хар.`);
    }

    return parts.join(", ");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Выберите подрасу</h2>
        <p className="text-sm text-muted-foreground">
          Как {parentRace.name}, вы можете выбрать одну из подрас, каждая из которых даёт уникальные способности.
        </p>
      </div>

      {/* Parent race summary with traits */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">{parentRace.name}</span>
          <Badge variant="secondary" className="text-xs">
            {formatBonuses(parentRace)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Скорость {parentRace.speed.walk} м
          </Badge>
        </div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Базовые черты (применяются ко всем подрасам)
        </div>
        <div className="space-y-2">
          {parentRace.traits.map((trait) => (
            <div key={trait.key} className="text-sm pl-3 border-l-2 border-amber-500/30">
              <span className="font-medium text-amber-400">{trait.name}</span>
              <p className="text-muted-foreground mt-0.5">
                {trait.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Subrace list */}
      <div className="grid gap-3">
        {/* Option to skip subrace selection */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedSubrace === null
              ? "ring-2 ring-primary bg-primary/5"
              : "hover:bg-accent/50"
          }`}
          onClick={() => onSelectSubrace(null)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Без подрасы</h3>
              {selectedSubrace === null && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Использовать только базовые черты расы {parentRace.name}.
            </p>
          </CardContent>
        </Card>

        {subraces.map((subrace) => {
          const isSelected = selectedSubrace?.slug === subrace.slug;

          return (
            <Card
              key={subrace.slug}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => onSelectSubrace(subrace)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{subrace.name}</h3>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {subrace.description}
                    </p>
                  </div>
                </div>

                {/* Subrace stats */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {formatBonuses(subrace)}
                  </Badge>
                  {subrace.speed.walk !== parentRace.speed.walk && (
                    <Badge variant="outline" className="text-xs">
                      Скорость {subrace.speed.walk} м
                    </Badge>
                  )}
                </div>

                {/* Subrace traits with descriptions */}
                {subrace.traits.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Черты подрасы
                    </div>
                    {subrace.traits.map((trait) => (
                      <div key={trait.key} className="text-sm pl-3 border-l-2 border-amber-500/50">
                        <span className="font-medium text-amber-500">{trait.name}</span>
                        <p className="text-muted-foreground mt-0.5">
                          {trait.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}
