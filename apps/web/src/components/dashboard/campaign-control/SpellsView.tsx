"use client";

import type { Character, KnownSpellItem } from "@/types/game";
import { cn } from "@/lib/utils";
import { BookOpen, Sparkles, Circle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SpellsViewProps {
  character: Character;
}

export function SpellsView({ character }: SpellsViewProps) {
  const spellSlots = character.spell_slots_remaining || {};
  const preparedSpells = character.prepared_spells || [];
  const knownSpells = character.known_spells || [];

  // Get spell slot levels
  const slotLevels = Object.keys(spellSlots)
    .filter(key => key !== "cantrips")
    .map(key => parseInt(key.replace("level_", ""), 10) || parseInt(key, 10))
    .filter(level => !isNaN(level))
    .sort((a, b) => a - b);

  // Check if character has any spells
  const hasSpells = preparedSpells.length > 0 || knownSpells.length > 0 || slotLevels.length > 0;

  if (!hasSpells) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-zinc-100">Заклинания</h3>
        </div>
        <div className="p-6 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-zinc-700 mb-2" />
          <p className="text-sm text-zinc-500">Нет заклинаний</p>
        </div>
      </div>
    );
  }

  // Format spell name from slug
  const formatSpellName = (slug: string): string => {
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase());
  };

  // Get spell slug from KnownSpellItem
  const getSpellSlug = (spell: KnownSpellItem): string => {
    return typeof spell === 'object' && spell !== null ? spell.slug : spell;
  };

  // Get spell display name from KnownSpellItem
  const getSpellName = (spell: KnownSpellItem): string => {
    if (typeof spell === 'object' && spell !== null) {
      return spell.name;
    }
    // Format spell name from slug
    return formatSpellName(spell);
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-purple-400" />
        <h3 className="font-semibold text-zinc-100">Заклинания</h3>
      </div>

      {/* Spell slots */}
      {slotLevels.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-zinc-400">Ячейки заклинаний</h4>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {slotLevels.map((level) => {
              const key = `level_${level}` in spellSlots ? `level_${level}` : level.toString();
              const slots = spellSlots[key] as { current: number; max: number } | number;
              const current = typeof slots === "number" ? slots : slots?.current ?? 0;
              const max = typeof slots === "number" ? slots : slots?.max ?? 0;

              return (
                <div
                  key={level}
                  className="flex flex-col items-center p-3 rounded-lg bg-zinc-800 border border-zinc-700"
                >
                  <span className="text-xs text-zinc-500">Уровень {level}</span>
                  <div className="flex items-center gap-1 mt-2">
                    {Array.from({ length: max }).map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-3 h-3 rounded-full border",
                          idx < current
                            ? "bg-purple-500 border-purple-400"
                            : "bg-zinc-700 border-zinc-600"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-zinc-500 mt-1">
                    {current}/{max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prepared spells */}
      {preparedSpells.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-zinc-400">
            Подготовленные заклинания ({preparedSpells.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {preparedSpells.map((spell) => (
              <Badge
                key={spell}
                variant="outline"
                className="bg-purple-500/10 border-purple-500/30 text-purple-400"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {formatSpellName(spell)}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Known spells (if different from prepared) */}
      {knownSpells.length > 0 && knownSpells !== preparedSpells && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-zinc-400">
            Известные заклинания ({knownSpells.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {knownSpells.map((spell) => (
              <Badge
                key={getSpellSlug(spell)}
                variant="outline"
                className="bg-zinc-700/50 border-zinc-600 text-zinc-300"
              >
                <Circle className="h-3 w-3 mr-1" />
                {getSpellName(spell)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
