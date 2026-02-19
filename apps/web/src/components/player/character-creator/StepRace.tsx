"use client";

import type { Race } from "@/types/character-creation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight } from "lucide-react";
import { formatModifier } from "@/types/character-creation";

interface StepRaceProps {
  races: Race[];
  subraces: { [parentSlug: string]: Race[] };
  selectedRace: Race | null;
  onSelectRace: (race: Race) => void;
}

export function StepRace({
  races,
  subraces,
  selectedRace,
  onSelectRace,
}: StepRaceProps) {

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
        <h2 className="text-xl font-semibold mb-2">Выберите расу</h2>
        <p className="text-sm text-muted-foreground">
          Раса определяет врождённые способности, черты и бонусы к характеристикам вашего персонажа.
        </p>
      </div>

      {/* Race list */}
      <div className="grid gap-3">
        {races.map((race) => {
          const isSelected = selectedRace?.slug === race.slug;
          const raceSubraces = subraces[race.slug] || [];

          return (
            <Card
              key={race.slug}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => onSelectRace(race)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{race.name}</h3>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                      {raceSubraces.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {raceSubraces.length} подрас
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {race.description}
                    </p>
                  </div>
                  {raceSubraces.length > 0 && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
                  )}
                </div>

                {/* Race stats */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {formatBonuses(race)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Скорость {race.speed.walk} м
                  </Badge>
                </div>

                {/* Race traits with descriptions */}
                <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Расовые черты
                  </div>
                  {race.traits.map((trait) => (
                    <div key={trait.key} className="text-sm pl-3 border-l-2 border-amber-500/50">
                      <span className="font-medium text-amber-500">{trait.name}</span>
                      <p className="text-muted-foreground mt-0.5">
                        {trait.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected race indicator */}
      {selectedRace && subraces[selectedRace.slug]?.length > 0 && (
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-center">
            <span className="font-medium text-primary">{selectedRace.name}</span>
            {" — "}
            <span className="text-muted-foreground">
              на следующем шаге выберите подрасу
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
