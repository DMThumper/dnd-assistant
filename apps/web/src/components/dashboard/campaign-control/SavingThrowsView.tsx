"use client";

import type { Character, Abilities } from "@/types/game";
import { cn } from "@/lib/utils";
import { Shield, Check } from "lucide-react";

interface SavingThrowsViewProps {
  character: Character;
}

const ABILITIES_CONFIG: Array<{
  key: keyof Abilities;
  name: string;
  short: string;
}> = [
  { key: "strength", name: "Сила", short: "СИЛ" },
  { key: "dexterity", name: "Ловкость", short: "ЛОВ" },
  { key: "constitution", name: "Телосложение", short: "ТЕЛ" },
  { key: "intelligence", name: "Интеллект", short: "ИНТ" },
  { key: "wisdom", name: "Мудрость", short: "МДР" },
  { key: "charisma", name: "Харизма", short: "ХАР" },
];

export function SavingThrowsView({ character }: SavingThrowsViewProps) {
  // Calculate modifier
  const getModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  // Calculate saving throw bonus
  const getSavingThrowBonus = (ability: keyof Abilities): number => {
    const abilityMod = getModifier(character.abilities[ability]);
    const isProficient = character.saving_throw_proficiencies.includes(ability);
    return isProficient ? abilityMod + character.proficiency_bonus : abilityMod;
  };

  // Format modifier with sign
  const formatModifier = (mod: number): string => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-blue-400" />
        <h3 className="font-semibold text-zinc-100">Спасброски</h3>
      </div>

      {/* Saving throws grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ABILITIES_CONFIG.map((ability) => {
          const isProficient = character.saving_throw_proficiencies.includes(ability.key);
          const bonus = getSavingThrowBonus(ability.key);

          return (
            <div
              key={ability.key}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                "bg-zinc-800 border",
                isProficient ? "border-emerald-500/30" : "border-zinc-700"
              )}
            >
              <div className="flex items-center gap-2">
                {/* Proficiency indicator */}
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  isProficient
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-700 text-zinc-600"
                )}>
                  {isProficient && <Check className="h-3 w-3" />}
                </div>

                <span className={cn(
                  "text-sm",
                  isProficient ? "text-zinc-100" : "text-zinc-400"
                )}>
                  {ability.short}
                </span>
              </div>

              <span className={cn(
                "font-medium",
                bonus >= 5 ? "text-emerald-400" :
                bonus <= -1 ? "text-red-400" : "text-zinc-300"
              )}>
                {formatModifier(bonus)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
