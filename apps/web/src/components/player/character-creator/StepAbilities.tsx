"use client";

import { useState } from "react";
import type { Race, Abilities, RulesInfo } from "@/types/character-creation";
import {
  calculateModifier,
  formatModifier,
  POINT_BUY_COSTS,
  calculatePointsSpent,
} from "@/types/character-creation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Dices } from "lucide-react";

interface StepAbilitiesProps {
  rules: RulesInfo;
  race: Race | null;
  method: "point_buy" | "standard_array" | "roll";
  abilities: Abilities;
  abilityBonusChoices: { [ability: string]: number };
  onAbilitiesChange: (abilities: Abilities) => void;
  onBonusChoicesChange: (choices: { [ability: string]: number }) => void;
}

type AbilityKey = keyof Abilities;

export function StepAbilities({
  rules,
  race,
  method,
  abilities,
  abilityBonusChoices,
  onAbilitiesChange,
  onBonusChoicesChange,
}: StepAbilitiesProps) {
  const [standardArrayAssigned, setStandardArrayAssigned] = useState<{ [key: string]: number }>({});
  const [rolledValues, setRolledValues] = useState<number[]>([]);

  const abilityKeys: AbilityKey[] = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ];

  // Get racial bonus for an ability
  const getRacialBonus = (ability: AbilityKey): number => {
    if (!race) return 0;
    const fixed = race.ability_bonuses[ability];
    if (typeof fixed === "number") return fixed;
    return abilityBonusChoices[ability] || 0;
  };

  // Check if race has flexible bonus choices
  const hasFlexibleBonus = race?.ability_bonuses.choice;
  const flexibleBonusCount = hasFlexibleBonus?.count || 0;
  const flexibleBonusAmount = hasFlexibleBonus?.amount || 0;
  const excludedAbilities = hasFlexibleBonus?.exclude || [];
  const chosenBonusCount = Object.keys(abilityBonusChoices).length;

  // Point buy logic
  const pointsSpent = calculatePointsSpent(abilities);
  const pointsRemaining = rules.creation.point_buy_budget - pointsSpent;

  const canIncrease = (ability: AbilityKey): boolean => {
    if (method !== "point_buy") return false;
    const current = abilities[ability];
    if (current >= rules.creation.point_buy_max) return false;
    const cost = (POINT_BUY_COSTS[current + 1] ?? 0) - (POINT_BUY_COSTS[current] ?? 0);
    return pointsRemaining >= cost;
  };

  const canDecrease = (ability: AbilityKey): boolean => {
    if (method !== "point_buy") return false;
    return abilities[ability] > rules.creation.point_buy_min;
  };

  const handlePointBuyChange = (ability: AbilityKey, delta: number) => {
    const newValue = abilities[ability] + delta;
    if (newValue >= rules.creation.point_buy_min && newValue <= rules.creation.point_buy_max) {
      onAbilitiesChange({ ...abilities, [ability]: newValue });
    }
  };

  // Standard array logic
  const standardArray = rules.creation.standard_array;
  const availableStandardValues = standardArray.filter(
    (v) => !Object.values(standardArrayAssigned).includes(v)
  );

  const handleStandardArrayAssign = (ability: AbilityKey, value: number) => {
    // Remove previous assignment for this ability
    const newAssigned = { ...standardArrayAssigned };
    delete newAssigned[ability];

    // Assign new value
    if (value > 0) {
      newAssigned[ability] = value;
    }

    setStandardArrayAssigned(newAssigned);

    // Update abilities
    const newAbilities = { ...abilities };
    abilityKeys.forEach((key) => {
      newAbilities[key] = newAssigned[key] || 8;
    });
    onAbilitiesChange(newAbilities);
  };

  // Roll logic
  const rollAbilities = () => {
    const rolls: number[] = [];
    for (let i = 0; i < 6; i++) {
      // 4d6 drop lowest
      const dice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      dice.sort((a, b) => b - a);
      rolls.push(dice[0] + dice[1] + dice[2]);
    }
    setRolledValues(rolls.sort((a, b) => b - a));

    // Auto-assign to abilities in order
    const newAbilities: Abilities = {
      strength: rolls[0],
      dexterity: rolls[1],
      constitution: rolls[2],
      intelligence: rolls[3],
      wisdom: rolls[4],
      charisma: rolls[5],
    };
    onAbilitiesChange(newAbilities);
  };

  // Handle flexible racial bonus choice
  const handleBonusChoice = (ability: AbilityKey) => {
    if (!hasFlexibleBonus) return;
    if (excludedAbilities.includes(ability)) return;

    const newChoices = { ...abilityBonusChoices };

    if (newChoices[ability]) {
      // Remove choice
      delete newChoices[ability];
    } else if (chosenBonusCount < flexibleBonusCount) {
      // Add choice
      newChoices[ability] = flexibleBonusAmount;
    }

    onBonusChoicesChange(newChoices);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Распределите характеристики</h2>
        <p className="text-sm text-muted-foreground">
          {method === "point_buy" && `Распределите ${rules.creation.point_buy_budget} очков между характеристиками.`}
          {method === "standard_array" && "Назначьте значения из стандартного набора каждой характеристике."}
          {method === "roll" && "Бросьте кубики для определения значений характеристик."}
        </p>
      </div>

      {/* Point buy counter */}
      {method === "point_buy" && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Осталось очков:</span>
          <Badge variant={pointsRemaining < 0 ? "destructive" : "secondary"} className="text-lg px-3">
            {pointsRemaining}
          </Badge>
        </div>
      )}

      {/* Roll button */}
      {method === "roll" && (
        <Button onClick={rollAbilities} className="w-full" variant="outline">
          <Dices className="mr-2 h-4 w-4" />
          Бросить 4d6 (отбросить меньший)
        </Button>
      )}

      {/* Flexible racial bonus info */}
      {hasFlexibleBonus && (
        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm">
            <strong>{race?.name}:</strong> Выберите {flexibleBonusCount} характеристик
            для бонуса +{flexibleBonusAmount}
            {chosenBonusCount < flexibleBonusCount && (
              <span className="text-primary ml-2">
                (выбрано {chosenBonusCount}/{flexibleBonusCount})
              </span>
            )}
          </p>
        </div>
      )}

      {/* Abilities grid */}
      <div className="grid grid-cols-2 gap-3">
        {abilityKeys.map((ability) => {
          const baseValue = abilities[ability];
          const racialBonus = getRacialBonus(ability);
          const totalValue = baseValue + racialBonus;
          const modifier = calculateModifier(totalValue);
          const abilityInfo = rules.abilities.find((a) => a.key === ability);
          const isFlexibleChoice = abilityBonusChoices[ability] !== undefined;
          const canChooseFlexible =
            hasFlexibleBonus &&
            !excludedAbilities.includes(ability) &&
            (chosenBonusCount < flexibleBonusCount || isFlexibleChoice);

          return (
            <Card
              key={ability}
              className={`${isFlexibleChoice ? "ring-2 ring-primary" : ""} ${
                canChooseFlexible && !isFlexibleChoice ? "cursor-pointer hover:bg-accent/50" : ""
              }`}
              onClick={() => canChooseFlexible && handleBonusChoice(ability)}
            >
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    {abilityInfo?.name || ability}
                  </div>
                  <div className="text-2xl font-bold mt-1">{totalValue}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatModifier(totalValue)}
                  </div>

                  {/* Point buy controls */}
                  {method === "point_buy" && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePointBuyChange(ability, -1);
                        }}
                        disabled={!canDecrease(ability)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{baseValue}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePointBuyChange(ability, 1);
                        }}
                        disabled={!canIncrease(ability)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Standard array dropdown */}
                  {method === "standard_array" && (
                    <select
                      className="mt-2 w-full p-1 text-sm border rounded bg-background"
                      value={standardArrayAssigned[ability] || ""}
                      onChange={(e) => handleStandardArrayAssign(ability, Number(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">—</option>
                      {(standardArrayAssigned[ability]
                        ? [standardArrayAssigned[ability], ...availableStandardValues]
                        : availableStandardValues
                      )
                        .sort((a, b) => b - a)
                        .map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                    </select>
                  )}

                  {/* Racial bonus indicator */}
                  {racialBonus !== 0 && (
                    <div className="text-xs text-primary mt-1">
                      +{racialBonus} {race?.name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Point buy cost reference */}
      {method === "point_buy" && (
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Стоимость очков:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(POINT_BUY_COSTS).map(([score, cost]) => (
              <span key={score}>
                {score}: {cost}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
