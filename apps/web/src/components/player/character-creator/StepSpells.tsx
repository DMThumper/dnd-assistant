"use client";

import { useState, useMemo } from "react";
import type { CharacterClass, Spell } from "@/types/character-creation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Search, Sparkles, Clock, Target, Zap, X } from "lucide-react";

interface StepSpellsProps {
  spells: Spell[];
  characterClass: CharacterClass;
  selectedSpells: string[];
  onSpellsChange: (spells: string[]) => void;
}

// School names in Russian
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

// School colors
const SCHOOL_COLORS: Record<string, string> = {
  abjuration: "text-blue-400",
  conjuration: "text-yellow-400",
  divination: "text-cyan-400",
  enchantment: "text-pink-400",
  evocation: "text-red-400",
  illusion: "text-purple-400",
  necromancy: "text-green-400",
  transmutation: "text-orange-400",
};

export function StepSpells({
  spells,
  characterClass,
  selectedSpells,
  onSpellsChange,
}: StepSpellsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [detailSpell, setDetailSpell] = useState<Spell | null>(null);

  // Get spells available to this class
  const classSpells = useMemo(() => {
    return spells.filter((spell) =>
      spell.classes.includes(characterClass.slug)
    );
  }, [spells, characterClass.slug]);

  // Separate cantrips and leveled spells
  const cantrips = useMemo(
    () => classSpells.filter((s) => s.level === 0),
    [classSpells]
  );
  const leveledSpells = useMemo(
    () => classSpells.filter((s) => s.level === 1),
    [classSpells]
  );

  // Get limits from class
  const cantripLimit = characterClass.spell_slots?.["1"]?.cantrips ?? 0;
  const spellLimit = characterClass.spells_known?.["1"] ?? 0;

  // Filter spells by search and level
  const filteredSpells = useMemo(() => {
    let filtered =
      selectedLevel === 0
        ? cantrips
        : selectedLevel === 1
          ? leveledSpells
          : [...cantrips, ...leveledSpells];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (spell) =>
          spell.name.toLowerCase().includes(query) ||
          spell.description?.toLowerCase().includes(query) ||
          SCHOOL_NAMES[spell.school]?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      // Sort by level first, then by name
      if (a.level !== b.level) return a.level - b.level;
      return a.name.localeCompare(b.name, "ru");
    });
  }, [cantrips, leveledSpells, selectedLevel, searchQuery]);

  // Count selected cantrips and spells
  const selectedCantrips = selectedSpells.filter((slug) =>
    cantrips.some((s) => s.slug === slug)
  );
  const selectedLeveledSpells = selectedSpells.filter((slug) =>
    leveledSpells.some((s) => s.slug === slug)
  );

  const toggleSpell = (spell: Spell) => {
    const isSelected = selectedSpells.includes(spell.slug);

    if (isSelected) {
      onSpellsChange(selectedSpells.filter((s) => s !== spell.slug));
    } else {
      // Check limits
      if (spell.level === 0) {
        if (selectedCantrips.length >= cantripLimit) {
          return; // Can't add more cantrips
        }
      } else {
        if (selectedLeveledSpells.length >= spellLimit) {
          return; // Can't add more spells
        }
      }
      onSpellsChange([...selectedSpells, spell.slug]);
    }
  };

  const getSpellById = (slug: string) =>
    classSpells.find((s) => s.slug === slug);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Выберите заклинания</h2>
        <p className="text-sm text-muted-foreground">
          Как {characterClass.name}, вы можете выбрать стартовые заклинания.
        </p>
      </div>

      {/* Selection summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className={selectedCantrips.length >= cantripLimit ? "border-green-500/50" : ""}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">
              {selectedCantrips.length} / {cantripLimit}
            </div>
            <div className="text-xs text-muted-foreground">Заговоров</div>
          </CardContent>
        </Card>
        <Card className={selectedLeveledSpells.length >= spellLimit ? "border-green-500/50" : ""}>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">
              {selectedLeveledSpells.length} / {spellLimit}
            </div>
            <div className="text-xs text-muted-foreground">Заклинаний 1 ур.</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск заклинаний..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Level filter tabs */}
      <div className="flex gap-2">
        <Button
          variant={selectedLevel === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedLevel(null)}
        >
          Все
        </Button>
        <Button
          variant={selectedLevel === 0 ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedLevel(0)}
        >
          Заговоры ({cantrips.length})
        </Button>
        <Button
          variant={selectedLevel === 1 ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedLevel(1)}
        >
          1-й уровень ({leveledSpells.length})
        </Button>
      </div>

      {/* Selected spells preview */}
      {selectedSpells.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Выбранные заклинания:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSpells.map((slug) => {
              const spell = getSpellById(slug);
              if (!spell) return null;
              return (
                <Badge
                  key={slug}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive/20"
                  onClick={() => toggleSpell(spell)}
                >
                  {spell.name}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Spell list */}
      <div className="grid gap-2">
        {filteredSpells.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {searchQuery
              ? "Заклинания не найдены"
              : "Нет доступных заклинаний"}
          </div>
        ) : (
          filteredSpells.map((spell) => {
            const isSelected = selectedSpells.includes(spell.slug);
            const isCantrip = spell.level === 0;
            const isDisabled =
              !isSelected &&
              (isCantrip
                ? selectedCantrips.length >= cantripLimit
                : selectedLeveledSpells.length >= spellLimit);

            return (
              <Card
                key={spell.slug}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-primary bg-primary/5"
                    : isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-accent/50"
                }`}
                onClick={() => !isDisabled && toggleSpell(spell)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{spell.name}</h3>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                        {spell.concentration && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            К
                          </Badge>
                        )}
                        {spell.ritual && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            Р
                          </Badge>
                        )}
                      </div>

                      {/* Spell info row */}
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className={SCHOOL_COLORS[spell.school]}>
                          {SCHOOL_NAMES[spell.school] || spell.school}
                        </span>
                        <span>•</span>
                        <span>{spell.level_string}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {spell.casting_time}
                        </span>
                      </div>
                    </div>

                    {/* Info button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailSpell(spell);
                      }}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick stats */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      {spell.range}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {spell.components_string}
                    </Badge>
                    {spell.effects?.damage && (
                      <Badge variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {spell.effects.damage.dice} {spell.effects.damage.type}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Spell detail dialog */}
      <Dialog open={!!detailSpell} onOpenChange={() => setDetailSpell(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {detailSpell && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detailSpell.name}
                  {detailSpell.concentration && (
                    <Badge variant="outline" className="text-xs">
                      Концентрация
                    </Badge>
                  )}
                  {detailSpell.ritual && (
                    <Badge variant="outline" className="text-xs">
                      Ритуал
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Spell meta */}
                <div className="text-sm text-muted-foreground">
                  <span className={SCHOOL_COLORS[detailSpell.school]}>
                    {SCHOOL_NAMES[detailSpell.school]}
                  </span>
                  {" — "}
                  {detailSpell.level_string}
                </div>

                {/* Casting info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Время накладывания:</span>
                    <span className="ml-2">{detailSpell.casting_time}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Дистанция:</span>
                    <span className="ml-2">{detailSpell.range}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Компоненты:</span>
                    <span className="ml-2">{detailSpell.components_string}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Длительность:</span>
                    <span className="ml-2">{detailSpell.duration}</span>
                  </div>
                </div>

                {/* Material component detail */}
                {detailSpell.components.material &&
                  detailSpell.components.material_description && (
                    <div className="text-sm bg-muted/50 p-2 rounded">
                      <span className="text-muted-foreground">Материальный компонент: </span>
                      {detailSpell.components.material_description}
                    </div>
                  )}

                {/* Description */}
                <div className="text-sm whitespace-pre-wrap">
                  {detailSpell.description}
                </div>

                {/* Higher levels */}
                {detailSpell.higher_levels?.description && (
                  <div className="text-sm">
                    <span className="font-medium">На более высоких уровнях: </span>
                    {detailSpell.higher_levels.description}
                  </div>
                )}

                {/* Effects summary */}
                {detailSpell.effects && (
                  <div className="flex flex-wrap gap-2">
                    {detailSpell.effects.damage && (
                      <Badge variant="secondary">
                        Урон: {detailSpell.effects.damage.dice}{" "}
                        {detailSpell.effects.damage.type}
                      </Badge>
                    )}
                    {detailSpell.effects.save && (
                      <Badge variant="secondary">
                        Спасбросок: {detailSpell.effects.save.ability}
                      </Badge>
                    )}
                    {detailSpell.effects.area && (
                      <Badge variant="secondary">
                        Область: {detailSpell.effects.area.shape}{" "}
                        {detailSpell.effects.area.radius}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Select button */}
                <Button
                  className="w-full"
                  variant={
                    selectedSpells.includes(detailSpell.slug)
                      ? "destructive"
                      : "default"
                  }
                  onClick={() => {
                    toggleSpell(detailSpell);
                    setDetailSpell(null);
                  }}
                >
                  {selectedSpells.includes(detailSpell.slug)
                    ? "Убрать из выбора"
                    : "Выбрать заклинание"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
