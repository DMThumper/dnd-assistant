"use client";

import type { Race, CharacterClass, Abilities } from "@/types/character-creation";
import { calculateModifier, formatModifier } from "@/types/character-creation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Heart, Shield, Swords, Sparkles } from "lucide-react";

interface StepDetailsProps {
  name: string;
  backstory: string;
  race: Race | null;
  characterClass: CharacterClass | null;
  abilities: Abilities;
  abilityBonusChoices: { [ability: string]: number };
  onNameChange: (name: string) => void;
  onBackstoryChange: (backstory: string) => void;
}

export function StepDetails({
  name,
  backstory,
  race,
  characterClass,
  abilities,
  abilityBonusChoices,
  onNameChange,
  onBackstoryChange,
}: StepDetailsProps) {
  // Calculate final abilities with racial bonuses
  const getFinalAbility = (key: keyof Abilities): number => {
    let value = abilities[key];
    if (race) {
      const fixed = race.ability_bonuses[key];
      if (typeof fixed === "number") {
        value += fixed;
      }
    }
    value += abilityBonusChoices[key] || 0;
    return value;
  };

  // Calculate HP
  const constitutionMod = calculateModifier(getFinalAbility("constitution"));
  const hitDieNumber = characterClass ? parseInt(characterClass.hit_die.replace("d", "")) : 0;
  const startingHp = hitDieNumber + constitutionMod;

  // Calculate AC (base 10 + DEX mod)
  const dexterityMod = calculateModifier(getFinalAbility("dexterity"));
  const baseAc = 10 + dexterityMod;

  // Get ability names
  const abilityNames: Record<string, string> = {
    strength: "СИЛ",
    dexterity: "ЛОВ",
    constitution: "ТЕЛ",
    intelligence: "ИНТ",
    wisdom: "МДР",
    charisma: "ХАР",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Детали персонажа</h2>
        <p className="text-sm text-muted-foreground">
          Придумайте имя и, при желании, предысторию вашего персонажа.
        </p>
      </div>

      {/* Character summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold">{name || "Безымянный герой"}</div>
              <div className="text-sm text-muted-foreground">
                {race?.name || "Раса"} · {characterClass?.name || "Класс"} · 1 ур.
              </div>
            </div>
          </div>

          {/* Stats preview */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">{startingHp > 0 ? startingHp : "—"} ОЗ</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{baseAc} КД</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <Swords className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">{characterClass?.hit_die || "—"}</span>
            </div>
          </div>

          {/* Abilities summary */}
          <div className="grid grid-cols-6 gap-1 text-center text-xs">
            {(Object.keys(abilities) as Array<keyof Abilities>).map((key) => {
              const finalValue = getFinalAbility(key);
              const modifier = calculateModifier(finalValue);
              return (
                <div key={key} className="p-1">
                  <div className="text-muted-foreground">{abilityNames[key]}</div>
                  <div className="font-bold">{finalValue}</div>
                  <div className="text-muted-foreground">{formatModifier(finalValue)}</div>
                </div>
              );
            })}
          </div>

          {/* Class features */}
          {characterClass?.is_spellcaster && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Заклинатель</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Name input */}
      <div className="space-y-2">
        <Label htmlFor="character-name">
          Имя персонажа <span className="text-destructive">*</span>
        </Label>
        <Input
          id="character-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Введите имя персонажа"
          maxLength={100}
        />
        {name.length > 0 && name.length < 2 && (
          <p className="text-xs text-destructive">Имя должно быть не менее 2 символов</p>
        )}
      </div>

      {/* Backstory */}
      <div className="space-y-2">
        <Label htmlFor="character-backstory">
          Предыстория <span className="text-muted-foreground text-xs">(необязательно)</span>
        </Label>
        <Textarea
          id="character-backstory"
          value={backstory}
          onChange={(e) => onBackstoryChange(e.target.value)}
          placeholder="Расскажите о прошлом вашего персонажа..."
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-muted-foreground text-right">
          {backstory.length} / 2000
        </p>
      </div>

      {/* Traits from race */}
      {race && race.traits.length > 0 && (
        <div className="space-y-2">
          <Label>Расовые черты</Label>
          <div className="flex flex-wrap gap-2">
            {race.traits.map((trait) => (
              <Badge key={trait.key} variant="outline">
                {trait.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Class features at level 1 */}
      {characterClass?.level_features["1"] && (
        <div className="space-y-2">
          <Label>Способности 1-го уровня</Label>
          <div className="flex flex-wrap gap-2">
            {characterClass.level_features["1"].map((feature) => (
              <Badge key={feature.key} variant="secondary">
                {feature.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
