"use client";

import { useState, useMemo } from "react";
import type { CharacterClass, Spell, Abilities } from "@/types/character-creation";
import { calculateModifier } from "@/types/character-creation";
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
import { Check, Search, Sparkles, Clock, Target, Zap, X, Heart } from "lucide-react";

interface StepSpellsProps {
  spells: Spell[];
  characterClass: CharacterClass;
  selectedSpells: string[];
  onSpellsChange: (spells: string[]) => void;
  abilities: Abilities;
  abilityBonusChoices: { [ability: string]: number };
  level: number;
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

// Damage type translations
const DAMAGE_TYPE_NAMES: Record<string, string> = {
  fire: "огонь",
  cold: "холод",
  lightning: "молния",
  thunder: "звук",
  acid: "кислота",
  poison: "яд",
  radiant: "излучение",
  necrotic: "некротический",
  force: "силовое поле",
  psychic: "психический",
  piercing: "колющий",
  bludgeoning: "дробящий",
  slashing: "рубящий",
  healing: "исцеление",
  varies: "по стихии",
  "piercing, cold": "колющий + холод",
};

// Ability short names
const ABILITY_SHORT_NAMES: Record<string, string> = {
  strength: "СИЛ",
  dexterity: "ЛОВ",
  constitution: "ТЕЛ",
  intelligence: "ИНТ",
  wisdom: "МДР",
  charisma: "ХАР",
};

// Ability full names
const ABILITY_FULL_NAMES: Record<string, string> = {
  strength: "Сила",
  dexterity: "Ловкость",
  constitution: "Телосложение",
  intelligence: "Интеллект",
  wisdom: "Мудрость",
  charisma: "Харизма",
};

// Area shape translations
const AREA_SHAPE_NAMES: Record<string, string> = {
  sphere: "Сфера",
  cone: "Конус",
  cube: "Куб",
  line: "Линия",
  cylinder: "Цилиндр",
  square: "Квадрат",
  circle: "Круг",
};

// Helper functions
const getDamageTypeName = (type: string): string => DAMAGE_TYPE_NAMES[type] || type;
const getAbilityShortName = (ability: string): string => ABILITY_SHORT_NAMES[ability] || ability;
const getAbilityFullName = (ability: string): string => ABILITY_FULL_NAMES[ability] || ability;
const getAreaShapeName = (shape: string): string => AREA_SHAPE_NAMES[shape] || shape;

export function StepSpells({
  spells,
  characterClass,
  selectedSpells,
  onSpellsChange,
  abilities,
  abilityBonusChoices,
  level,
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
  // Cantrips are in progression, not spell_slots
  const cantripLimit = (characterClass.progression?.["1"] as Record<string, unknown>)?.cantrips as number ?? 0;

  // For spell limit:
  // - Known casters (Bard, Sorcerer, Warlock, Ranger): use spells_known
  // - Prepared casters (Druid, Cleric, Paladin, Wizard): calculate level + modifier
  const isKnownCaster = characterClass.spells_known !== null && characterClass.spells_known["1"] !== undefined;

  const spellLimit = useMemo(() => {
    if (isKnownCaster) {
      return characterClass.spells_known!["1"];
    }

    // For prepared casters, calculate based on ability
    if (!characterClass.spellcasting_ability) return 0;

    const abilityKey = characterClass.spellcasting_ability as keyof Abilities;
    const baseAbility = abilities[abilityKey];
    const bonusFromRace = abilityBonusChoices[abilityKey] ?? 0;
    const totalAbility = baseAbility + bonusFromRace;
    const modifier = calculateModifier(totalAbility);

    // Prepared spells = level + modifier (minimum 1)
    return Math.max(1, level + modifier);
  }, [isKnownCaster, characterClass.spells_known, characterClass.spellcasting_ability, abilities, abilityBonusChoices, level]);

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
                      ? "opacity-50"
                      : "hover:bg-accent/50"
                }`}
                onClick={() => setDetailSpell(spell)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Selection checkbox */}
                    <button
                      type="button"
                      className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors mt-0.5 ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : isDisabled
                            ? "border-muted-foreground/30 cursor-not-allowed"
                            : "border-muted-foreground/50 hover:border-primary"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDisabled || isSelected) {
                          toggleSpell(spell);
                        }
                      }}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{spell.name}</h3>
                        {spell.concentration && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-orange-500/50 text-orange-400">
                            К
                          </Badge>
                        )}
                        {spell.ritual && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/50 text-purple-400">
                            Р
                          </Badge>
                        )}
                      </div>

                      {/* Spell info row */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span className={SCHOOL_COLORS[spell.school]}>
                          {SCHOOL_NAMES[spell.school] || spell.school}
                        </span>
                        <span>•</span>
                        <span>{spell.casting_time}</span>
                        <span>•</span>
                        <span>{spell.range}</span>
                        {spell.duration && spell.duration !== "Мгновенная" && (
                          <>
                            <span>•</span>
                            <span>{spell.duration}</span>
                          </>
                        )}
                      </div>

                      {/* Effects badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {spell.effects?.damage && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            {spell.effects.damage.dice}
                            {spell.effects.damage.type && ` ${getDamageTypeName(spell.effects.damage.type)}`}
                          </Badge>
                        )}
                        {spell.effects?.healing && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            {spell.effects.healing.dice}
                          </Badge>
                        )}
                        {spell.effects?.save && (
                          <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400">
                            Спас: {getAbilityShortName(spell.effects.save.ability)}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          {spell.components_string}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Spell detail dialog */}
      <Dialog open={!!detailSpell} onOpenChange={() => setDetailSpell(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col">
          {detailSpell && (
            <div className="overflow-y-auto flex-1">
              {/* Header */}
              <div className="bg-background border-b px-4 py-3">
                <DialogTitle className="flex items-center gap-2 text-lg">
                  {detailSpell.name}
                  {detailSpell.concentration && (
                    <Badge variant="outline" className="border-orange-500/50 text-orange-400 text-xs">
                      К
                    </Badge>
                  )}
                  {detailSpell.ritual && (
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
                    {detailSpell.level_string}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${SCHOOL_COLORS[detailSpell.school]}`}>
                    {SCHOOL_NAMES[detailSpell.school]}
                  </Badge>
                </div>

                {/* Spell details - card style */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{detailSpell.casting_time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{detailSpell.range}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{detailSpell.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{detailSpell.components_string}</span>
                  </div>
                </div>

                {/* Effects badges */}
                {detailSpell.effects && (detailSpell.effects.save || detailSpell.effects.damage || detailSpell.effects.healing) && (
                  <div className="flex flex-wrap gap-2">
                    {detailSpell.effects.save ? (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                        Спасбросок: {getAbilityShortName(detailSpell.effects.save.ability)}
                        {detailSpell.effects.save.on_success && (
                          <span className="ml-1 opacity-70">
                            ({detailSpell.effects.save.on_success === 'half' ? '½ урона' : 'нет эффекта'})
                          </span>
                        )}
                      </Badge>
                    ) : detailSpell.effects.damage ? (
                      <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Атака
                      </Badge>
                    ) : null}
                    {detailSpell.effects.damage && (
                      <Badge className="bg-red-500/20 text-red-300 border border-red-500/30">
                        Урон: {detailSpell.effects.damage.dice}
                        {detailSpell.effects.damage.type && ` ${getDamageTypeName(detailSpell.effects.damage.type)}`}
                      </Badge>
                    )}
                    {detailSpell.effects.healing && (
                      <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">
                        Лечение: {detailSpell.effects.healing.dice}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Material components */}
                {detailSpell.components.material && detailSpell.components.material_description && (
                  <div className="text-sm text-muted-foreground italic px-1">
                    Материалы: {detailSpell.components.material_description}
                  </div>
                )}

                {/* Description */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {detailSpell.description}
                </div>

                {/* Higher levels */}
                {detailSpell.higher_levels?.description && (
                  <div className="text-sm p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <span className="font-semibold text-blue-400">На более высоких уровнях: </span>
                    <span className="text-muted-foreground">{detailSpell.higher_levels.description}</span>
                  </div>
                )}
              </div>

              {/* Footer with action button */}
              <div className="border-t px-4 py-4">
                {(() => {
                  const isSelected = selectedSpells.includes(detailSpell.slug);
                  const isCantrip = detailSpell.level === 0;
                  const isDisabled = !isSelected && (isCantrip
                    ? selectedCantrips.length >= cantripLimit
                    : selectedLeveledSpells.length >= spellLimit);

                  return (
                    <Button
                      className="w-full h-11"
                      variant={isSelected ? "destructive" : "default"}
                      disabled={isDisabled && !isSelected}
                      onClick={() => {
                        toggleSpell(detailSpell);
                        setDetailSpell(null);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Убрать из выбора
                        </>
                      ) : isDisabled ? (
                        <>Достигнут лимит {isCantrip ? "заговоров" : "заклинаний"}</>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Выбрать заклинание
                        </>
                      )}
                    </Button>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
