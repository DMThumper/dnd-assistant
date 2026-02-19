"use client";

import { useState, useEffect } from "react";
import type { Spell, SpellSlot, ConcentrationSpell } from "@/types/spell";
import { calculateUpcastDamage, getAvailableSlotLevels } from "@/types/spell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  Clock,
  Zap,
  Target,
  Timer,
  BookOpen,
  Sparkles,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface SpellListProps {
  title: string;
  spells: Spell[];
  onCast?: (spellSlug: string) => void;
  onUseSlot?: (level: number) => void;
  currentConcentration?: ConcentrationSpell | null;
  slots?: Record<string, SpellSlot>;
  canModify: boolean;
  isCantrip?: boolean;
  isAlwaysPrepared?: boolean; // For Circle spells that don't count against limit
}

// Group spells by level
function groupByLevel(spells: Spell[]): Map<number, Spell[]> {
  const groups = new Map<number, Spell[]>();
  for (const spell of spells) {
    const level = spell.level;
    if (!groups.has(level)) {
      groups.set(level, []);
    }
    groups.get(level)!.push(spell);
  }
  return groups;
}

const SCHOOL_COLORS: Record<string, string> = {
  abjuration: "text-blue-400",
  conjuration: "text-yellow-400",
  divination: "text-purple-400",
  enchantment: "text-pink-400",
  evocation: "text-red-400",
  illusion: "text-indigo-400",
  necromancy: "text-gray-400",
  transmutation: "text-green-400",
};

const SCHOOL_NAMES: Record<string, string> = {
  abjuration: "Ограждение",
  conjuration: "Вызов",
  divination: "Прорицание",
  enchantment: "Очарование",
  evocation: "Воплощение",
  illusion: "Иллюзия",
  necromancy: "Некромантия",
  transmutation: "Преобразование",
};

const ABILITY_NAMES: Record<string, string> = {
  strength: "СИЛ",
  dexterity: "ЛОВ",
  constitution: "ТЕЛ",
  intelligence: "ИНТ",
  wisdom: "МДР",
  charisma: "ХАР",
};

const SAVE_SUCCESS_NAMES: Record<string, string> = {
  half: "½ урона",
  none: "нет эффекта",
};

const DAMAGE_TYPE_NAMES: Record<string, string> = {
  acid: "кислота",
  bludgeoning: "дробящий",
  cold: "холод",
  fire: "огонь",
  force: "силовое поле",
  lightning: "молния",
  necrotic: "некротический",
  piercing: "колющий",
  poison: "яд",
  psychic: "психический",
  radiant: "излучение",
  slashing: "рубящий",
  thunder: "звук",
  varies: "по стихии",
  "piercing, cold": "колющий + холод",
};

export function SpellList({
  title,
  spells,
  onCast,
  onUseSlot,
  currentConcentration,
  slots,
  canModify,
  isCantrip = false,
  isAlwaysPrepared = false,
}: SpellListProps) {
  const [openLevels, setOpenLevels] = useState<Set<number>>(new Set([0, 1]));

  const toggleLevel = (level: number) => {
    setOpenLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const groupedSpells = groupByLevel(spells);
  const sortedLevels = Array.from(groupedSpells.keys()).sort((a, b) => a - b);

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {title}
          {isAlwaysPrepared && (
            <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
              всегда готовы
            </Badge>
          )}
          <Badge variant="secondary" className="ml-auto">
            {spells.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedLevels.map((level) => {
          const levelSpells = groupedSpells.get(level) || [];
          const isOpen = openLevels.has(level);
          const slot = slots?.[String(level)];
          const hasAvailableSlots = !isCantrip && slot != null && slot.remaining > 0;

          return (
            <Collapsible
              key={level}
              open={isOpen}
              onOpenChange={() => toggleLevel(level)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-2">
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                  <span className="font-medium">
                    {level === 0 ? "Заговоры" : `${level} уровень`}
                  </span>
                  <Badge variant="outline" className="ml-1">
                    {levelSpells.length}
                  </Badge>
                </div>
                {slot && (
                  <div className="flex gap-1">
                    {Array.from({ length: slot.max }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-2 h-2 rounded-full",
                          i < slot.remaining ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pl-6 pr-2 py-1">
                {levelSpells.map((spell) => (
                  <SpellCard
                    key={spell.slug}
                    spell={spell}
                    onCast={onCast}
                    onUseSlot={onUseSlot}
                    isConcentrating={
                      currentConcentration?.spell_slug === spell.slug
                    }
                    hasConcentration={!!currentConcentration}
                    hasSlots={isCantrip || hasAvailableSlots}
                    canModify={canModify}
                    isCantrip={isCantrip}
                    allSlots={slots}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface SpellCardProps {
  spell: Spell;
  onCast?: (spellSlug: string) => void;
  onUseSlot?: (level: number) => void;
  isConcentrating: boolean;
  hasConcentration: boolean;
  hasSlots: boolean;
  canModify: boolean;
  isCantrip: boolean;
  allSlots?: Record<string, SpellSlot>;
}

function SpellCard({
  spell,
  onCast,
  onUseSlot,
  isConcentrating,
  hasConcentration,
  hasSlots,
  canModify,
  isCantrip,
  allSlots,
}: SpellCardProps) {
  const schoolColor = SCHOOL_COLORS[spell.school] || "text-muted-foreground";
  const schoolName = SCHOOL_NAMES[spell.school] || spell.school;

  // Get available slot levels for this spell
  const availableSlotLevels = allSlots
    ? getAvailableSlotLevels(spell.level, allSlots)
    : [];

  // Initialize to first available slot level, or spell level if none available
  const [selectedSlotLevel, setSelectedSlotLevel] = useState<number>(
    availableSlotLevels.length > 0 ? availableSlotLevels[0] : spell.level
  );

  // Update selected level if current selection becomes unavailable
  useEffect(() => {
    if (availableSlotLevels.length > 0 && !availableSlotLevels.includes(selectedSlotLevel)) {
      setSelectedSlotLevel(availableSlotLevels[0]);
    }
  }, [availableSlotLevels, selectedSlotLevel]);

  // Calculate upcast damage if spell has scaling
  const baseDamage = spell.effects?.damage?.dice;
  const upcastDamage = baseDamage && spell.higher_levels?.scaling
    ? calculateUpcastDamage(
        baseDamage,
        spell.level,
        selectedSlotLevel,
        spell.higher_levels.scaling
      )
    : baseDamage;

  const isUpcast = selectedSlotLevel > spell.level;

  const handleCast = (slotLevel?: number) => {
    const level = slotLevel ?? selectedSlotLevel;

    // For concentration spells, start concentration
    if (spell.concentration && onCast) {
      onCast(spell.slug);
    }

    // Use a spell slot for leveled spells
    if (!isCantrip && onUseSlot) {
      onUseSlot(level);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
            "hover:bg-accent/50",
            isConcentrating && "bg-primary/20 border border-primary/50"
          )}
        >
          {/* Spell info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{spell.name}</span>
              {spell.concentration && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isConcentrating
                      ? "border-primary text-primary"
                      : "border-orange-500/50 text-orange-400"
                  )}
                >
                  К
                </Badge>
              )}
              {spell.ritual && (
                <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                  Р
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={schoolColor}>{schoolName}</span>
              <span>|</span>
              <span>{spell.casting_time}</span>
            </div>
          </div>

          {/* Quick cast button */}
          {canModify && hasSlots && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={(e) => {
                e.stopPropagation();
                handleCast();
              }}
            >
              <Zap className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col">
        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="bg-background border-b px-4 py-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              {spell.name}
              {spell.concentration && (
                <Badge variant="outline" className="border-orange-500/50 text-orange-400 text-xs">
                  К
                </Badge>
              )}
              {spell.ritual && (
                <Badge variant="outline" className="border-purple-500/50 text-purple-400 text-xs">
                  Р
                </Badge>
              )}
            </DialogTitle>
          </div>

          {/* Content */}
          <div className="px-4 py-4 space-y-4">
            {/* Spell meta */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {spell.level === 0 ? "Заговор" : `${spell.level} уровень`}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", schoolColor)}>
                {schoolName}
              </Badge>
            </div>

            {/* Spell details - card style */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>{spell.casting_time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-primary" />
                <span>{spell.range}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Timer className="h-4 w-4 text-primary" />
                <span>{spell.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>
                  {[
                    spell.components.verbal && "В",
                    spell.components.somatic && "С",
                    spell.components.material && "М",
                  ].filter(Boolean).join(", ")}
                </span>
              </div>
            </div>

            {/* Save & Damage info */}
            {spell.effects && (spell.effects.save || spell.effects.damage) && (
              <div className="flex flex-wrap gap-2">
                {spell.effects.save ? (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30">
                    Спасбросок: {ABILITY_NAMES[spell.effects.save.ability] || spell.effects.save.ability}
                    {spell.effects.save.on_success && (
                      <span className="ml-1 opacity-70">
                        ({SAVE_SUCCESS_NAMES[spell.effects.save.on_success] || spell.effects.save.on_success})
                      </span>
                    )}
                  </Badge>
                ) : spell.effects.damage ? (
                  <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30">
                    Атака
                  </Badge>
                ) : null}
                {spell.effects.damage && (
                  <Badge className={cn(
                    "border hover:bg-red-500/30",
                    isUpcast
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-red-500/20 text-red-300 border-red-500/30"
                  )}>
                    {isUpcast && <TrendingUp className="h-3 w-3 mr-1" />}
                    Урон: {upcastDamage || spell.effects.damage.dice}
                    {spell.effects.damage.type && (
                      <>
                        {" "}
                        {spell.effects.damage.type
                          .split(/[,\s]+/)
                          .map((t) => DAMAGE_TYPE_NAMES[t.toLowerCase()] || t)
                          .join(", ")}
                      </>
                    )}
                  </Badge>
                )}
              </div>
            )}

            {/* Material components */}
            {spell.components.material && spell.components.material_description && (
              <div className="text-sm text-muted-foreground italic px-1">
                Материалы: {spell.components.material_description}
              </div>
            )}

            {/* Description */}
            <div className="text-sm leading-relaxed">{spell.description}</div>

            {/* At higher levels */}
            {spell.higher_levels?.description && (
              <div className="text-sm p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="font-semibold text-blue-400">На более высоких уровнях: </span>
                <span className="text-muted-foreground">{spell.higher_levels.description}</span>
              </div>
            )}

            {/* Concentration warning */}
            {spell.concentration && hasConcentration && !isConcentrating && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="text-sm text-orange-300">
                  Вы уже концентрируетесь на другом заклинании. Применение этого
                  заклинания прервёт текущую концентрацию.
                </div>
              </div>
            )}
          </div>

          {/* Footer with action button */}
          <div className="border-t px-4 py-4 space-y-3">
            {/* Slot level selector for leveled spells with upcasting */}
            {!isCantrip && canModify && availableSlotLevels.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Уровень слота:</span>
                <Select
                  value={String(selectedSlotLevel)}
                  onValueChange={(v) => setSelectedSlotLevel(parseInt(v, 10))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlotLevels.map((lvl) => (
                      <SelectItem key={lvl} value={String(lvl)}>
                        {lvl} ур.
                        {lvl > spell.level && (
                          <span className="ml-1 text-green-400">↑</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isUpcast && spell.higher_levels?.scaling && (
                  <Badge variant="outline" className="text-green-400 border-green-500/50">
                    +{selectedSlotLevel - spell.level} ур.
                  </Badge>
                )}
              </div>
            )}

            {canModify && (isCantrip || availableSlotLevels.length > 0) ? (
              <Button
                className="w-full h-11"
                onClick={() => handleCast()}
              >
                <Zap className="h-4 w-4 mr-2" />
                {isCantrip
                  ? "Сотворить"
                  : isUpcast
                    ? `Сотворить на ${selectedSlotLevel} уровне`
                    : "Сотворить (потратить слот)"
                }
              </Button>
            ) : !isCantrip && availableSlotLevels.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-2">
                Нет доступных ячеек {spell.level} уровня или выше
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
