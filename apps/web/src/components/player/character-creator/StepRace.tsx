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
  selectedSubrace: Race | null;
  onSelectRace: (race: Race) => void;
  onSelectSubrace: (subrace: Race | null) => void;
}

export function StepRace({
  races,
  subraces,
  selectedRace,
  selectedSubrace,
  onSelectRace,
  onSelectSubrace,
}: StepRaceProps) {
  const hasSubraces = selectedRace && subraces[selectedRace.slug]?.length > 0;

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
              onClick={() => {
                onSelectRace(race);
                onSelectSubrace(null);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{race.name}</h3>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
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

                {/* Race bonuses and traits */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {formatBonuses(race)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Скорость {race.speed.walk} м
                  </Badge>
                  {race.traits.slice(0, 2).map((trait) => (
                    <Badge key={trait.key} variant="outline" className="text-xs">
                      {trait.name}
                    </Badge>
                  ))}
                  {race.traits.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{race.traits.length - 2}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Subraces */}
      {hasSubraces && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">
            Выберите подрасу
          </h3>
          <div className="grid gap-3">
            {subraces[selectedRace.slug].map((subrace) => {
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
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{subrace.name}</h4>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {subrace.description}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {formatBonuses(subrace)}
                      </Badge>
                      {subrace.traits.map((trait) => (
                        <Badge key={trait.key} variant="outline" className="text-xs">
                          {trait.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected race details */}
      {selectedRace && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-3">
            Черты расы: {(selectedSubrace || selectedRace).name}
          </h3>
          <div className="space-y-3">
            {(selectedSubrace || selectedRace).traits.map((trait) => (
              <div key={trait.key}>
                <h4 className="text-sm font-medium">{trait.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {trait.description}
                </p>
              </div>
            ))}

            {/* Show parent race traits for subraces */}
            {selectedSubrace && selectedRace.traits.map((trait) => (
              <div key={trait.key}>
                <h4 className="text-sm font-medium">{trait.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {trait.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
