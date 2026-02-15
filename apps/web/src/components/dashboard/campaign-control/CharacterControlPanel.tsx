"use client";

import { useState } from "react";
import type { Character } from "@/types/game";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Heart,
  BarChart3,
  Backpack,
  BookOpen,
  Sparkles,
  Shield,
} from "lucide-react";
import { HpControl } from "./HpControl";
import { ConditionsControl } from "./ConditionsControl";
import { CustomRulesControl } from "./CustomRulesControl";
import { ActionsPanel } from "./ActionsPanel";
import { AbilitiesView } from "./AbilitiesView";
import { SkillsView } from "./SkillsView";
import { SavingThrowsView } from "./SavingThrowsView";
import { InventoryView } from "./InventoryView";
import { CurrencyView } from "./CurrencyView";
import { SpellsView } from "./SpellsView";

interface CharacterControlPanelProps {
  character: Character;
  campaignId: number;
  onCharacterUpdate: (character: Character) => void;
  onBack: () => void;
}

export function CharacterControlPanel({
  character,
  campaignId,
  onCharacterUpdate,
  onBack,
}: CharacterControlPanelProps) {
  const [activeTab, setActiveTab] = useState("hp");

  // Get class name from slug
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

  // Check if character is a spellcaster
  const isSpellcaster = [
    "wizard", "sorcerer", "warlock", "cleric", "druid", "bard", "paladin", "ranger"
  ].includes(character.class_slug || "");

  return (
    <div className="flex flex-col h-full">
      {/* Character header */}
      <div className="px-4 py-4 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-start gap-4">
          {/* Back button (mobile only) */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden h-10 w-10 text-zinc-400 hover:text-zinc-100 -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Avatar */}
          <div className={cn(
            "flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold",
            "bg-gradient-to-br from-primary/30 to-primary/10 text-primary border border-primary/30"
          )}>
            {character.name.charAt(0).toUpperCase()}
          </div>

          {/* Character info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-100 truncate">
                {character.name}
              </h2>
              {character.inspiration && (
                <Sparkles className="h-5 w-5 text-amber-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-zinc-400">
              {getRaceName(character.race_slug)} · {getClassName(character.class_slug)} {character.level}
            </p>
            <div className="flex items-center gap-4 mt-1 text-sm text-zinc-500">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>КД {character.armor_class}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Скорость {character.speed.walk} м</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-zinc-800 bg-zinc-900/50 px-2 h-auto py-0">
          <TabsTrigger
            value="hp"
            className={cn(
              "flex items-center gap-2 rounded-none border-b-2 border-transparent py-3 px-4",
              "data-[state=active]:border-primary data-[state=active]:text-primary",
              "data-[state=inactive]:text-zinc-500 data-[state=inactive]:hover:text-zinc-300"
            )}
          >
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">HP</span>
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className={cn(
              "flex items-center gap-2 rounded-none border-b-2 border-transparent py-3 px-4",
              "data-[state=active]:border-primary data-[state=active]:text-primary",
              "data-[state=inactive]:text-zinc-500 data-[state=inactive]:hover:text-zinc-300"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Характеристики</span>
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className={cn(
              "flex items-center gap-2 rounded-none border-b-2 border-transparent py-3 px-4",
              "data-[state=active]:border-primary data-[state=active]:text-primary",
              "data-[state=inactive]:text-zinc-500 data-[state=inactive]:hover:text-zinc-300"
            )}
          >
            <Backpack className="h-4 w-4" />
            <span className="hidden sm:inline">Инвентарь</span>
          </TabsTrigger>
          {isSpellcaster && (
            <TabsTrigger
              value="spells"
              className={cn(
                "flex items-center gap-2 rounded-none border-b-2 border-transparent py-3 px-4",
                "data-[state=active]:border-primary data-[state=active]:text-primary",
                "data-[state=inactive]:text-zinc-500 data-[state=inactive]:hover:text-zinc-300"
              )}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Заклинания</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* HP Tab */}
        <TabsContent value="hp" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* HP Control */}
              <HpControl
                character={character}
                onCharacterUpdate={onCharacterUpdate}
              />

              {/* Conditions */}
              <ConditionsControl
                character={character}
                onCharacterUpdate={onCharacterUpdate}
              />

              {/* Custom Rules */}
              <CustomRulesControl
                character={character}
                onCharacterUpdate={onCharacterUpdate}
              />

              {/* Quick Actions */}
              <ActionsPanel
                character={character}
                campaignId={campaignId}
                onCharacterUpdate={onCharacterUpdate}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <AbilitiesView character={character} />
              <SkillsView character={character} />
              <SavingThrowsView character={character} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <CurrencyView
                character={character}
                onCharacterUpdate={onCharacterUpdate}
              />
              <InventoryView
                character={character}
                onCharacterUpdate={onCharacterUpdate}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Spells Tab */}
        {isSpellcaster && (
          <TabsContent value="spells" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                <SpellsView character={character} />
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
