"use client";

import type { CharacterClass } from "@/types/character-creation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Shield, Swords, Heart } from "lucide-react";

interface StepClassProps {
  classes: CharacterClass[];
  selectedClass: CharacterClass | null;
  onSelectClass: (characterClass: CharacterClass) => void;
}

export function StepClass({
  classes,
  selectedClass,
  onSelectClass,
}: StepClassProps) {
  // Get primary ability names
  const getAbilityName = (key: string): string => {
    const names: Record<string, string> = {
      strength: "Сила",
      dexterity: "Ловкость",
      constitution: "Телосложение",
      intelligence: "Интеллект",
      wisdom: "Мудрость",
      charisma: "Харизма",
    };
    return names[key] || key;
  };

  // Get hit die display
  const getHitDieInfo = (hitDie: string) => {
    const die = parseInt(hitDie.replace("d", ""));
    if (die >= 10) return { label: "Высокое ОЗ", color: "text-green-500" };
    if (die >= 8) return { label: "Среднее ОЗ", color: "text-yellow-500" };
    return { label: "Низкое ОЗ", color: "text-red-500" };
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-2">Выберите класс</h2>
        <p className="text-sm text-muted-foreground">
          Класс определяет способности вашего персонажа, стиль боя и доступные навыки.
        </p>
      </div>

      {/* Class list */}
      <div className="grid gap-3">
        {classes.map((cls) => {
          const isSelected = selectedClass?.slug === cls.slug;
          const hitDieInfo = getHitDieInfo(cls.hit_die);

          return (
            <Card
              key={cls.slug}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "ring-2 ring-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => onSelectClass(cls)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{cls.name}</h3>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                      {cls.is_spellcaster && (
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ">
                      {cls.description}
                    </p>
                  </div>
                </div>

                {/* Class info badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Heart className={`h-3 w-3 mr-1 ${hitDieInfo.color}`} />
                    {cls.hit_die}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {cls.primary_abilities.map(getAbilityName).join(", ")}
                  </Badge>
                  {cls.armor_proficiencies.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {cls.armor_proficiencies.includes("heavy")
                        ? "Тяжёлые доспехи"
                        : cls.armor_proficiencies.includes("medium")
                          ? "Средние доспехи"
                          : "Лёгкие доспехи"}
                    </Badge>
                  )}
                  {cls.weapon_proficiencies.includes("martial") && (
                    <Badge variant="outline" className="text-xs">
                      <Swords className="h-3 w-3 mr-1" />
                      Воинское оружие
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected class details */}
      {selectedClass && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
          <h3 className="font-semibold">{selectedClass.name}</h3>

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Кость здоровья:</span>
              <span className="ml-2 font-medium">{selectedClass.hit_die}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Главная хар.:</span>
              <span className="ml-2 font-medium">
                {selectedClass.primary_abilities.map(getAbilityName).join(", ")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Спасброски:</span>
              <span className="ml-2 font-medium">
                {selectedClass.saving_throws.map(getAbilityName).join(", ")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Навыков на выбор:</span>
              <span className="ml-2 font-medium">{selectedClass.skill_choices}</span>
            </div>
          </div>

          {/* First level features */}
          {selectedClass.level_features["1"] && (
            <div>
              <h4 className="text-sm font-medium mb-2">Способности 1-го уровня:</h4>
              <div className="space-y-2">
                {selectedClass.level_features["1"].map((feature) => (
                  <div key={feature.key}>
                    <span className="text-sm font-medium">{feature.name}</span>
                    <p className="text-sm text-muted-foreground ">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spellcasting info */}
          {selectedClass.is_spellcaster && (
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>
                Заклинатель ({getAbilityName(selectedClass.spellcasting_ability || "")})
              </span>
            </div>
          )}

          {/* Subclass info */}
          {selectedClass.subclass_name && (
            <div className="text-sm text-muted-foreground">
              На {selectedClass.subclass_level}-м уровне выберите: {selectedClass.subclass_name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
