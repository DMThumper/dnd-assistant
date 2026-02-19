"use client";

import type { SubclassData, SubclassChoicesState } from "@/types/level-up";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubclassChoicesStepProps {
  subclass: SubclassData | null;
  subclassChoices: SubclassChoicesState;
  setSubclassChoices: React.Dispatch<React.SetStateAction<SubclassChoicesState>>;
  characterKnownSpells: Array<{ slug: string; name: string; level: number; is_cantrip?: boolean } | string>;
}

export function SubclassChoicesStep({ subclass, subclassChoices, setSubclassChoices, characterKnownSpells }: SubclassChoicesStepProps) {
  if (!subclass) {
    return (
      <Card className="border-red-500/30">
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-red-500/50" />
          <p className="text-red-400">Ошибка: данные подкласса не найдены</p>
        </CardContent>
      </Card>
    );
  }

  if (!subclass.choices) {
    return (
      <Card className="border-yellow-500/30">
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-yellow-500/50" />
          <p className="text-yellow-400">Подкласс: {subclass.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Этот подкласс не требует дополнительных выборов
          </p>
        </CardContent>
      </Card>
    );
  }

  const { terrain, bonus_cantrip } = subclass.choices;

  // Get available cantrips from API
  const availableCantrips = bonus_cantrip?.available_cantrips || [];

  // Extract known cantrip slugs (handle both object and string formats)
  const knownCantripSlugs = characterKnownSpells
    .filter(spell => {
      if (typeof spell === 'string') return true;
      if (typeof spell === 'object' && spell && 'level' in spell) {
        return spell.level === 0;
      }
      return false;
    })
    .map(spell => typeof spell === 'object' && spell && 'slug' in spell ? spell.slug : spell as string);

  // Filter out cantrips the character already knows
  const selectableCantrips = availableCantrips.filter(
    c => !knownCantripSlugs.includes(c.slug)
  );

  return (
    <Card className="border-green-500/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-green-500" />
          <CardTitle>Выбор для {subclass.name}</CardTitle>
        </div>
        <CardDescription>
          Сделайте необходимые выборы для вашего круга
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Terrain Selection */}
        {terrain && terrain.required && (
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="text-green-500">&earth;</span>
              {terrain.feature_name}
            </Label>
            <p className="text-sm text-muted-foreground">
              Выберите тип местности, который определит ваши заклинания круга
            </p>
            <RadioGroup
              value={subclassChoices.terrain || ""}
              onValueChange={(value) => setSubclassChoices(prev => ({ ...prev, terrain: value }))}
              className="grid gap-3"
            >
              {terrain.options.map(option => (
                <div
                  key={option.key}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    subclassChoices.terrain === option.key
                      ? "border-green-500 bg-green-500/10"
                      : "border-border hover:border-green-500/50"
                  )}
                  onClick={() => setSubclassChoices(prev => ({ ...prev, terrain: option.key }))}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <RadioGroupItem value={option.key} id={`terrain-${option.key}`} />
                    <Label htmlFor={`terrain-${option.key}`} className="cursor-pointer font-semibold">
                      {option.name}
                    </Label>
                    {subclassChoices.terrain === option.key && (
                      <Check className="h-4 w-4 text-green-500 ml-auto" />
                    )}
                  </div>
                  {option.spells && option.spells.length > 0 && (
                    <p className="text-xs text-muted-foreground ml-6">
                      {option.spells.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {terrain && subclassChoices.terrain && (
          <Separator />
        )}

        {/* Bonus Cantrip Selection */}
        {bonus_cantrip && bonus_cantrip.required && (
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="text-green-500">&starf;</span>
              {bonus_cantrip.feature_name}
            </Label>
            <p className="text-sm text-muted-foreground">
              Выберите дополнительный заговор друида
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {selectableCantrips.map(cantrip => {
                const isSelected = subclassChoices.bonus_cantrip === cantrip.slug;

                return (
                  <div
                    key={cantrip.slug}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "border-green-500 bg-green-500/10"
                        : "border-border hover:border-green-500/50"
                    )}
                    onClick={() => setSubclassChoices(prev => ({ ...prev, bonus_cantrip: cantrip.slug }))}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{cantrip.name}</span>
                      {isSelected && <Check className="h-4 w-4 text-green-500" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectableCantrips.length === 0 && (
              <p className="text-sm text-yellow-500">
                Вы уже знаете все доступные заговоры друида
              </p>
            )}
          </div>
        )}

        {/* Summary */}
        {(subclassChoices.terrain || subclassChoices.bonus_cantrip) && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Ваш выбор:</Label>
              <div className="flex flex-wrap gap-2">
                {subclassChoices.terrain && terrain && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    &earth; {terrain.options.find(o => o.key === subclassChoices.terrain)?.name}
                  </Badge>
                )}
                {subclassChoices.bonus_cantrip && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    &starf; {availableCantrips.find(c => c.slug === subclassChoices.bonus_cantrip)?.name}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
