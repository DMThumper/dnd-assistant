"use client";

import type { Character, Abilities } from "@/types/game";
import { cn } from "@/lib/utils";
import { Check, Star } from "lucide-react";

interface SkillsViewProps {
  character: Character;
}

const SKILLS_CONFIG: Array<{
  key: string;
  name: string;
  ability: keyof Abilities;
}> = [
  { key: "acrobatics", name: "Акробатика", ability: "dexterity" },
  { key: "animal_handling", name: "Уход за животными", ability: "wisdom" },
  { key: "arcana", name: "Магия", ability: "intelligence" },
  { key: "athletics", name: "Атлетика", ability: "strength" },
  { key: "deception", name: "Обман", ability: "charisma" },
  { key: "history", name: "История", ability: "intelligence" },
  { key: "insight", name: "Проницательность", ability: "wisdom" },
  { key: "intimidation", name: "Запугивание", ability: "charisma" },
  { key: "investigation", name: "Расследование", ability: "intelligence" },
  { key: "medicine", name: "Медицина", ability: "wisdom" },
  { key: "nature", name: "Природа", ability: "intelligence" },
  { key: "perception", name: "Внимательность", ability: "wisdom" },
  { key: "performance", name: "Выступление", ability: "charisma" },
  { key: "persuasion", name: "Убеждение", ability: "charisma" },
  { key: "religion", name: "Религия", ability: "intelligence" },
  { key: "sleight_of_hand", name: "Ловкость рук", ability: "dexterity" },
  { key: "stealth", name: "Скрытность", ability: "dexterity" },
  { key: "survival", name: "Выживание", ability: "wisdom" },
];

const ABILITY_SHORT: Record<keyof Abilities, string> = {
  strength: "СИЛ",
  dexterity: "ЛОВ",
  constitution: "ТЕЛ",
  intelligence: "ИНТ",
  wisdom: "МДР",
  charisma: "ХАР",
};

export function SkillsView({ character }: SkillsViewProps) {
  // Calculate modifier
  const getModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  // Calculate skill bonus
  const getSkillBonus = (skill: typeof SKILLS_CONFIG[0]): number => {
    const abilityMod = getModifier(character.abilities[skill.ability]);
    const isProficient = character.skill_proficiencies.includes(skill.key);
    const hasExpertise = character.skill_expertise.includes(skill.key);

    if (hasExpertise) {
      return abilityMod + character.proficiency_bonus * 2;
    }
    if (isProficient) {
      return abilityMod + character.proficiency_bonus;
    }
    return abilityMod;
  };

  // Format modifier with sign
  const formatModifier = (mod: number): string => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <h3 className="font-semibold text-zinc-100">Навыки</h3>

      {/* Skills list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {SKILLS_CONFIG.map((skill) => {
          const isProficient = character.skill_proficiencies.includes(skill.key);
          const hasExpertise = character.skill_expertise.includes(skill.key);
          const bonus = getSkillBonus(skill);

          return (
            <div
              key={skill.key}
              className={cn(
                "flex items-center justify-between p-2 rounded",
                "hover:bg-zinc-800/50 transition-colors"
              )}
            >
              <div className="flex items-center gap-2">
                {/* Proficiency indicator */}
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center",
                  hasExpertise
                    ? "bg-amber-500/20 text-amber-400"
                    : isProficient
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 text-zinc-600"
                )}>
                  {hasExpertise ? (
                    <Star className="h-3 w-3" />
                  ) : isProficient ? (
                    <Check className="h-3 w-3" />
                  ) : null}
                </div>

                <span className={cn(
                  "text-sm",
                  isProficient || hasExpertise ? "text-zinc-100" : "text-zinc-400"
                )}>
                  {skill.name}
                </span>
                <span className="text-xs text-zinc-600">
                  ({ABILITY_SHORT[skill.ability]})
                </span>
              </div>

              <span className={cn(
                "text-sm font-medium",
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
