"use client";

import { useState, useEffect, useMemo } from "react";
import { api, ApiClientError } from "@/lib/api";
import type { Spell } from "@/types/spell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Search,
  BookOpen,
  Sparkles,
  Clock,
  Target,
  Timer,
  ChevronDown,
} from "lucide-react";

interface PrepareSpellsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: number;
  currentPrepared: string[]; // current prepared spell slugs
  maxPrepared: number;
  spellcastingAbility: string | null;
  onPreparedChange: (newPrepared: Spell[]) => void;
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

export function PrepareSpellsDialog({
  open,
  onOpenChange,
  characterId,
  currentPrepared,
  maxPrepared,
  spellcastingAbility,
  onPreparedChange,
}: PrepareSpellsDialogProps) {
  const [availableSpells, setAvailableSpells] = useState<Spell[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);

  // Load available spells when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSlugs(new Set(currentPrepared));
      loadAvailableSpells();
    }
  }, [open, currentPrepared]);

  const loadAvailableSpells = async () => {
    setIsLoading(true);
    try {
      const response = await api.getAvailableSpells(characterId);
      // Filter out cantrips - they don't need preparation
      const leveledSpells = response.data.filter((s) => s.level > 0);
      setAvailableSpells(leveledSpells);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось загрузить список заклинаний");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpell = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        // Check max limit
        if (next.size >= maxPrepared) {
          toast.error(`Максимум подготовленных заклинаний: ${maxPrepared}`);
          return prev;
        }
        next.add(slug);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updatePreparedSpells(characterId, Array.from(selectedSlugs));

      // Get full spell data for the new prepared spells
      const newPrepared = availableSpells.filter((s) =>
        selectedSlugs.has(s.slug)
      );
      onPreparedChange(newPrepared);

      toast.success("Заклинания подготовлены!");
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось сохранить подготовленные заклинания");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and group spells
  const filteredSpells = useMemo(() => {
    let spells = availableSpells;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      spells = spells.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          SCHOOL_NAMES[s.school]?.toLowerCase().includes(query)
      );
    }

    // Filter by level
    if (filterLevel !== null) {
      spells = spells.filter((s) => s.level === filterLevel);
    }

    return spells;
  }, [availableSpells, searchQuery, filterLevel]);

  // Group by level
  const groupedByLevel = useMemo(() => {
    const groups = new Map<number, Spell[]>();
    for (const spell of filteredSpells) {
      if (!groups.has(spell.level)) {
        groups.set(spell.level, []);
      }
      groups.get(spell.level)!.push(spell);
    }
    return groups;
  }, [filteredSpells]);

  const sortedLevels = Array.from(groupedByLevel.keys()).sort((a, b) => a - b);

  // Available spell levels for filter
  const availableLevels = useMemo(() => {
    const levels = new Set(availableSpells.map((s) => s.level));
    return Array.from(levels).sort((a, b) => a - b);
  }, [availableSpells]);

  const selectedCount = selectedSlugs.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Подготовка заклинаний
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Выбрано:</span>
            <Badge
              variant={selectedCount >= maxPrepared ? "default" : "secondary"}
              className={cn(
                "font-mono",
                selectedCount >= maxPrepared && "bg-primary"
              )}
            >
              {selectedCount} / {maxPrepared}
            </Badge>
            {spellcastingAbility && (
              <span className="text-xs">
                ({spellcastingAbility.slice(0, 3).toUpperCase()} + уровень)
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Search and filters */}
        <div className="px-4 py-2 border-b space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск заклинаний..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={filterLevel === null ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilterLevel(null)}
            >
              Все
            </Button>
            {availableLevels.map((level) => (
              <Button
                key={level}
                variant={filterLevel === level ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilterLevel(level)}
              >
                {level} ур.
              </Button>
            ))}
          </div>
        </div>

        {/* Spell list */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 py-2 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sortedLevels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Заклинания не найдены
              </div>
            ) : (
              sortedLevels.map((level) => {
                const spells = groupedByLevel.get(level) || [];
                return (
                  <div key={level}>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      {level} уровень
                    </div>
                    <div className="space-y-1">
                      {spells.map((spell) => {
                        const isSelected = selectedSlugs.has(spell.slug);
                        const isExpanded = expandedSpell === spell.slug;
                        const schoolColor =
                          SCHOOL_COLORS[spell.school] || "text-muted-foreground";
                        const schoolName =
                          SCHOOL_NAMES[spell.school] || spell.school;

                        return (
                          <Collapsible
                            key={spell.slug}
                            open={isExpanded}
                            onOpenChange={(open) =>
                              setExpandedSpell(open ? spell.slug : null)
                            }
                          >
                            <div
                              className={cn(
                                "rounded-md transition-colors",
                                isSelected && "bg-primary/10 border border-primary/30",
                                !isSelected && "hover:bg-accent/50"
                              )}
                            >
                              {/* Spell header */}
                              <div className="flex items-center gap-2 p-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSpell(spell.slug)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">
                                      {spell.name}
                                    </span>
                                    {spell.concentration && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-orange-500/50 text-orange-400 shrink-0"
                                      >
                                        К
                                      </Badge>
                                    )}
                                    {spell.ritual && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-purple-500/50 text-purple-400 shrink-0"
                                      >
                                        Р
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className={schoolColor}>{schoolName}</span>
                                  </div>
                                </div>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 shrink-0"
                                  >
                                    <ChevronDown
                                      className={cn(
                                        "h-5 w-5 transition-transform",
                                        isExpanded && "rotate-180"
                                      )}
                                    />
                                  </Button>
                                </CollapsibleTrigger>
                              </div>

                              {/* Spell details (collapsed) */}
                              <CollapsibleContent>
                                <div className="px-2 pb-2 pt-0 space-y-2">
                                  {/* Parameters */}
                                  <div className="grid grid-cols-2 gap-2 p-2 rounded bg-muted/50 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 text-primary" />
                                      <span>{spell.casting_time}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Target className="h-3 w-3 text-primary" />
                                      <span>{spell.range}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Timer className="h-3 w-3 text-primary" />
                                      <span>{spell.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Sparkles className="h-3 w-3 text-primary" />
                                      <span>
                                        {[
                                          spell.components.verbal && "В",
                                          spell.components.somatic && "С",
                                          spell.components.material && "М",
                                        ]
                                          .filter(Boolean)
                                          .join(", ")}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Save & Damage info */}
                                  {spell.effects && (spell.effects.save || spell.effects.damage) && (
                                    <div className="flex flex-wrap gap-2 text-xs">
                                      {spell.effects.save ? (
                                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                                          Спас: {ABILITY_NAMES[spell.effects.save.ability] || spell.effects.save.ability}
                                          {spell.effects.save.on_success && (
                                            <span className="ml-1 text-muted-foreground">
                                              ({SAVE_SUCCESS_NAMES[spell.effects.save.on_success] || spell.effects.save.on_success})
                                            </span>
                                          )}
                                        </Badge>
                                      ) : spell.effects.damage ? (
                                        <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                                          Атака
                                        </Badge>
                                      ) : null}
                                      {spell.effects.damage && (
                                        <Badge variant="outline" className="border-red-500/50 text-red-400">
                                          {spell.effects.damage.dice}
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
                                  {spell.components.material &&
                                    spell.components.material_description && (
                                      <div className="text-xs text-muted-foreground italic px-1">
                                        М: {spell.components.material_description}
                                      </div>
                                    )}

                                  {/* Description */}
                                  <div className="text-xs leading-relaxed px-1 text-muted-foreground">
                                    {spell.description}
                                  </div>

                                  {/* Higher levels */}
                                  {spell.higher_levels?.description && (
                                    <div className="text-xs p-2 rounded bg-blue-500/10 border border-blue-500/20">
                                      <span className="font-medium text-blue-400">
                                        На более высоких уровнях:{" "}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {spell.higher_levels.description}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Подготовить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
