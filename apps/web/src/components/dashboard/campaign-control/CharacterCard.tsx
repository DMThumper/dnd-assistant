"use client";

import type { Character } from "@/types/game";
import { cn } from "@/lib/utils";
import { Heart, Shield, Sparkles, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CharacterCardProps {
  character: Character;
  isSelected: boolean;
  onSelect: () => void;
}

export function CharacterCard({ character, isSelected, onSelect }: CharacterCardProps) {
  // Calculate HP percentage
  const hpPercentage = Math.round((character.current_hp / character.max_hp) * 100);
  const totalHp = character.current_hp + character.temp_hp;

  // HP color based on percentage
  const getHpColor = (percentage: number) => {
    if (percentage <= 25) return "bg-red-500";
    if (percentage <= 50) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Get class name from slug (basic translation)
  const getClassName = (slug: string | null) => {
    if (!slug) return "—";
    const classNames: Record<string, string> = {
      fighter: "Воин",
      wizard: "Волшебник",
      rogue: "Плут",
      cleric: "Жрец",
      ranger: "Следопыт",
      paladin: "Паладин",
      barbarian: "Варвар",
      bard: "Бард",
      druid: "Друид",
      monk: "Монах",
      sorcerer: "Чародей",
      warlock: "Колдун",
    };
    return classNames[slug] || slug;
  };

  // Get race name from slug
  const getRaceName = (slug: string | null) => {
    if (!slug) return "—";
    const raceNames: Record<string, string> = {
      human: "Человек",
      elf: "Эльф",
      dwarf: "Дварф",
      halfling: "Полурослик",
      gnome: "Гном",
      "half-elf": "Полуэльф",
      "half-orc": "Полуорк",
      tiefling: "Тифлинг",
      dragonborn: "Драконорождённый",
      warforged: "Кованый",
      shifter: "Перевёртыш",
      kalashtar: "Калаштар",
    };
    return raceNames[slug] || slug;
  };

  // Check for active conditions
  const hasConditions = character.conditions && character.conditions.length > 0;
  const hasCustomRules = character.custom_rules && character.custom_rules.length > 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full p-3 rounded-lg text-left transition-all",
        "border touch-manipulation",
        "min-h-[80px]", // Touch-friendly minimum height
        isSelected
          ? "bg-zinc-800 border-primary/50 ring-1 ring-primary/30"
          : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar placeholder */}
        <div className={cn(
          "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold",
          "bg-gradient-to-br from-zinc-700 to-zinc-800 text-zinc-300"
        )}>
          {character.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name and level */}
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-zinc-100 truncate">
              {character.name}
            </h3>
            {character.inspiration && (
              <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
            )}
          </div>

          {/* Race and class */}
          <p className="text-sm text-zinc-500 truncate">
            {getRaceName(character.race_slug)} · {getClassName(character.class_slug)} {character.level}
          </p>

          {/* HP bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  getHpColor(hpPercentage)
                )}
                style={{ width: `${Math.min(100, hpPercentage)}%` }}
              />
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Heart className="h-3.5 w-3.5 text-red-400" />
              <span className={cn(
                "font-medium",
                hpPercentage <= 25 ? "text-red-400" :
                hpPercentage <= 50 ? "text-amber-400" : "text-zinc-300"
              )}>
                {character.current_hp}
              </span>
              <span className="text-zinc-500">/{character.max_hp}</span>
              {character.temp_hp > 0 && (
                <span className="text-blue-400">(+{character.temp_hp})</span>
              )}
            </div>
          </div>

          {/* Status badges */}
          {(hasConditions || hasCustomRules) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {character.conditions?.slice(0, 3).map((condition) => (
                <Badge
                  key={condition.key}
                  variant="outline"
                  className="text-xs bg-orange-500/10 border-orange-500/30 text-orange-400"
                >
                  {condition.name || condition.key}
                </Badge>
              ))}
              {character.custom_rules?.slice(0, 2).map((rule) => (
                <Badge
                  key={rule.id}
                  variant="outline"
                  className={cn(
                    "text-xs",
                    rule.effects.some(e => e.type === "penalty")
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  )}
                >
                  {rule.name}
                </Badge>
              ))}
              {((character.conditions?.length || 0) > 3 || (character.custom_rules?.length || 0) > 2) && (
                <Badge variant="outline" className="text-xs bg-zinc-700/50 border-zinc-600 text-zinc-400">
                  +{(character.conditions?.length || 0) - 3 + (character.custom_rules?.length || 0) - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* AC badge */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-sm text-zinc-400">
            <Shield className="h-4 w-4" />
            <span className="font-medium">{character.armor_class}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
