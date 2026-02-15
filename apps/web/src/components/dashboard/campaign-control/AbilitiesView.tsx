"use client";

import type { Character, Abilities } from "@/types/game";
import { cn } from "@/lib/utils";

interface AbilitiesViewProps {
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

export function AbilitiesView({ character }: AbilitiesViewProps) {
  // Calculate modifier
  const getModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  // Format modifier with sign
  const formatModifier = (mod: number): string => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <h3 className="font-semibold text-zinc-100">Характеристики</h3>

      {/* Abilities grid */}
      <div className="grid grid-cols-3 gap-3">
        {ABILITIES_CONFIG.map((ability) => {
          const score = character.abilities[ability.key];
          const modifier = getModifier(score);
          const isProficient = character.saving_throw_proficiencies.includes(ability.key);

          return (
            <div
              key={ability.key}
              className={cn(
                "flex flex-col items-center p-4 rounded-lg",
                "bg-zinc-800 border border-zinc-700"
              )}
            >
              <span className="text-xs text-zinc-500 uppercase tracking-wider">
                {ability.short}
              </span>
              <span className={cn(
                "text-2xl font-bold mt-1",
                modifier >= 2 ? "text-emerald-400" :
                modifier <= -2 ? "text-red-400" : "text-zinc-100"
              )}>
                {formatModifier(modifier)}
              </span>
              <span className="text-sm text-zinc-400 mt-1">
                {score}
              </span>
            </div>
          );
        })}
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <span className="text-xs text-zinc-500">Бонус мастерства</span>
          <span className="text-xl font-bold text-zinc-100">
            +{character.proficiency_bonus}
          </span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <span className="text-xs text-zinc-500">Инициатива</span>
          <span className="text-xl font-bold text-zinc-100">
            {formatModifier(getModifier(character.abilities.dexterity))}
          </span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
          <span className="text-xs text-zinc-500">Пассив. Внимат.</span>
          <span className="text-xl font-bold text-zinc-100">
            {10 + getModifier(character.abilities.wisdom) +
              (character.skill_proficiencies.includes("perception") ? character.proficiency_bonus : 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
