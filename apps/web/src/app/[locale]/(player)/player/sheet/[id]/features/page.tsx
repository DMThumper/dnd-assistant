"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type { Character } from "@/types/game";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronLeft,
  Sparkles,
  Shield,
  Swords,
  Crown,
  User,
  Star,
  ChevronDown,
} from "lucide-react";
import { usePlayerSession } from "@/contexts/PlayerSessionContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Feature with metadata
interface Feature {
  name: string;
  description: string;
  short_description?: string;
  source?: "race" | "class" | "subclass" | "feat" | "background";
  subclass?: string;
  level?: number;
  type?: string;
  slug?: string;
  // Resource fields
  resource_key?: string;
  resource_name?: string;
  resource_die?: string;
  resource_max_formula?: string;
  resource_use_max_formula?: string;
  recharge?: "short_rest" | "long_rest";
  benefits?: {
    ability_increase?: { ability?: string; options?: string[]; amount: number; choice?: boolean };
    ac_bonus?: number;
    initiative_bonus?: number;
    speed_bonus?: number;
    hp_per_level?: number;
    skill_proficiency?: number;
    skill_expertise?: number;
    cantrips?: number;
    spells?: string[];
    languages?: number;
    luck_points?: number;
    sorcery_points?: number;
    passive_bonus?: number;
    features?: Array<{ name: string; description: string }>;
  };
}

// Helper to evaluate resource formulas
function evaluateFormula(formula: string, level: number, proficiencyBonus?: number): number {
  if (!formula) return 0;

  // Replace variables
  let expr = formula
    .replace(/level/g, String(level))
    .replace(/proficiency_bonus/g, String(proficiencyBonus || Math.floor((level - 1) / 4) + 2));

  // Handle math functions
  expr = expr.replace(/ceil\(([^)]+)\)/g, (_, inner) => {
    try {
      const value = Function(`"use strict"; return (${inner})`)();
      return String(Math.ceil(value));
    } catch {
      return "0";
    }
  });

  expr = expr.replace(/floor\(([^)]+)\)/g, (_, inner) => {
    try {
      const value = Function(`"use strict"; return (${inner})`)();
      return String(Math.floor(value));
    } catch {
      return "0";
    }
  });

  // Evaluate the final expression
  try {
    return Function(`"use strict"; return (${expr})`)();
  } catch {
    return 0;
  }
}

// Helper to replace formula patterns in text and return structured data
function replaceFormulaPatterns(text: string, level: number, profBonus: number): string {
  let result = text;

  // Calculate common values
  const levelTimes5 = level * 5;
  const halfLevel = Math.ceil(level / 2);
  const thirdLevel = Math.floor(level / 3);

  // Replace "5 × уровень друида d6" and similar patterns
  result = result
    .replace(/5\s*[×x]\s*уровень\s*(друида)?\s*d6/gi, `«${levelTimes5}d6»`)
    .replace(/5\s*[×x]\s*уровень\s*(друида)?/gi, `«${levelTimes5}»`)
    .replace(/уровень\s*(друида)?\s*[×x]\s*5/gi, `«${levelTimes5}»`)
    .replace(/level\s*\*\s*5/gi, `«${levelTimes5}»`)
    .replace(/5\s*\*\s*level/gi, `«${levelTimes5}»`);

  // Replace "половина уровня" patterns - highlight the calculated value
  result = result
    .replace(/макс\.\s*за\s*раз\s*[:=]\s*половина\s*уровня/gi, `макс. за раз: «${halfLevel}»`)
    .replace(/\(половина\s*уровня[^)]*\)/gi, `(«${halfLevel}»)`)
    .replace(/половина\s*уровня\s*(друида)?/gi, `«${halfLevel}»`)
    .replace(/ceil\s*\(\s*level\s*\/\s*2\s*\)/gi, `«${halfLevel}»`);

  // Replace "треть уровня" patterns
  result = result
    .replace(/треть\s*уровня\s*(друида)?/gi, `«${thirdLevel}»`)
    .replace(/floor\s*\(\s*level\s*\/\s*3\s*\)/gi, `«${thirdLevel}»`);

  // Replace proficiency bonus patterns
  result = result
    .replace(/число\s*раз[,\s]+равное\s*бонусу\s*мастерства/gi, `«${profBonus}» раз`)
    .replace(/бонус\s*мастерства\s*раз/gi, `«${profBonus}» раз`)
    .replace(/равное\s*бонусу\s*мастерства/gi, `равное «${profBonus}»`)
    .replace(/\(бонус\s*мастерства\)/gi, `(«${profBonus}»)`)
    .replace(/proficiency_bonus/gi, `«${profBonus}»`);

  // Replace "уровень друида" with actual level
  result = result.replace(/уровень\s*друида/gi, `«${level}»`);

  // Replace "4 временных хита за уровень друида" pattern for Circle of Spores
  result = result.replace(/4\s*временных\s*хита\s*за\s*уровень\s*друида/gi, `«${level * 4}» временных хитов`);

  // Replace "5 + 5×уровень" pattern for Wildfire Spirit
  result = result.replace(/5\s*\+\s*5\s*[×x]\s*уровень/gi, `«${5 + level * 5}»`);

  return result;
}

// Render text with highlighted values (text wrapped in «» becomes highlighted)
function renderHighlightedText(text: string): React.ReactNode {
  const parts = text.split(/(«[^»]+»)/g);
  return parts.map((part, index) => {
    if (part.startsWith("«") && part.endsWith("»")) {
      const value = part.slice(1, -1);
      return (
        <span key={index} className="font-semibold text-primary">
          {value}
        </span>
      );
    }
    return part;
  });
}

// Helper to format feature description with calculated values
function formatFeatureDescription(feature: Feature, level: number): {
  description: string;
  shortDescription?: string;
  calculatedValues?: {
    total?: string;
    maxPerUse?: string;
    rechargeText?: string;
  };
} {
  const profBonus = Math.floor((level - 1) / 4) + 2;
  let description = feature.description || "";
  let shortDescription = feature.short_description;
  const calculatedValues: { total?: string; maxPerUse?: string; rechargeText?: string } = {};

  // Apply formula replacements to both descriptions
  description = replaceFormulaPatterns(description, level, profBonus);
  if (shortDescription) {
    shortDescription = replaceFormulaPatterns(shortDescription, level, profBonus);
  }

  // Calculate and store resource values for badges
  if (feature.resource_max_formula) {
    const total = evaluateFormula(feature.resource_max_formula, level, profBonus);
    const die = feature.resource_die || "";
    calculatedValues.total = `${total}${die}`;
  }

  if (feature.resource_use_max_formula) {
    const maxPerUse = evaluateFormula(feature.resource_use_max_formula, level, profBonus);
    calculatedValues.maxPerUse = String(maxPerUse);
  }

  // Set recharge text
  if (feature.recharge) {
    calculatedValues.rechargeText = feature.recharge === "long_rest" ? "Длинный отдых" : "Короткий отдых";
  }

  return { description, shortDescription, calculatedValues };
}

// Group features by source
function groupFeatures(features: Feature[]): Record<string, Feature[]> {
  const groups: Record<string, Feature[]> = {
    race: [],
    class: [],
    subclass: [],
    feat: [],
    other: [],
  };

  for (const feature of features) {
    const source = feature.source || "other";
    if (groups[source]) {
      groups[source].push(feature);
    } else {
      groups.other.push(feature);
    }
  }

  return groups;
}

// Get icon for feature source
function getSourceIcon(source: string) {
  switch (source) {
    case "race":
      return <User className="h-5 w-5" />;
    case "class":
      return <Swords className="h-5 w-5" />;
    case "subclass":
      return <Shield className="h-5 w-5" />;
    case "feat":
      return <Crown className="h-5 w-5" />;
    default:
      return <Star className="h-5 w-5" />;
  }
}

// Get color for feature source
function getSourceColor(source: string) {
  switch (source) {
    case "race":
      return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    case "class":
      return "text-blue-500 border-blue-500/30 bg-blue-500/10";
    case "subclass":
      return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    case "feat":
      return "text-purple-500 border-purple-500/30 bg-purple-500/10";
    default:
      return "text-gray-500 border-gray-500/30 bg-gray-500/10";
  }
}

// Get label for feature source
function getSourceLabel(source: string) {
  switch (source) {
    case "race":
      return "Расовые черты";
    case "class":
      return "Классовые способности";
    case "subclass":
      return "Способности подкласса";
    case "feat":
      return "Черты";
    default:
      return "Прочие способности";
  }
}

export default function FeaturesPage() {
  const router = useRouter();
  const params = useParams();
  const characterId = Number(params.id);

  const { character: contextCharacter } = usePlayerSession();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch character data
  const fetchCharacter = useCallback(async () => {
    try {
      const response = await api.getCharacter(characterId);
      setCharacter(response.data.character);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Не удалось загрузить персонажа");
      }
    } finally {
      setIsLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    void fetchCharacter();
  }, [fetchCharacter]);

  // Use context character if available (real-time updates)
  const displayCharacter = contextCharacter?.id === characterId ? contextCharacter : character;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !displayCharacter) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">{error || "Персонаж не найден"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
      </div>
    );
  }

  const features = (displayCharacter.features ?? []) as Feature[];
  const groupedFeatures = groupFeatures(features);
  const hasFeatures = features.length > 0;

  // Order of groups to display
  const groupOrder = ["race", "class", "subclass", "feat", "other"];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Способности
            </h1>
            <p className="text-sm text-muted-foreground">{displayCharacter.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {!hasFeatures ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                У вас пока нет способностей.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Способности появятся при повышении уровня.
              </p>
            </CardContent>
          </Card>
        ) : (
          groupOrder.map((source) => {
            const sourceFeatures = groupedFeatures[source];
            if (!sourceFeatures || sourceFeatures.length === 0) return null;

            return (
              <div key={source}>
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("p-1.5 rounded", getSourceColor(source))}>
                    {getSourceIcon(source)}
                  </div>
                  <h2 className="font-semibold">{getSourceLabel(source)}</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {sourceFeatures.length}
                  </Badge>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {sourceFeatures.map((feature, index) => {
                    const formatted = formatFeatureDescription(feature, displayCharacter.level || 1);
                    const isResource = feature.type === "resource" || !!feature.resource_max_formula;
                    const hasShortDescription = !!formatted.shortDescription;
                    const hasCalculatedValues = formatted.calculatedValues && (
                      formatted.calculatedValues.total ||
                      formatted.calculatedValues.maxPerUse ||
                      formatted.calculatedValues.rechargeText
                    );

                    return (
                    <Card
                      key={index}
                      className={cn("border", getSourceColor(source).replace("text-", "border-").split(" ")[0] + "/20")}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{feature.name}</CardTitle>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {feature.level && (
                              <Badge variant="outline" className="text-xs">
                                Ур. {feature.level}
                              </Badge>
                            )}
                            {feature.subclass && (
                              <Badge variant="secondary" className="text-xs">
                                {feature.subclass}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Resource badges at top for quick reference */}
                        {isResource && hasCalculatedValues && (
                          <div className="flex flex-wrap gap-2 pb-2 border-b border-border/50">
                            {formatted.calculatedValues?.total && (
                              <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
                                Запас: {formatted.calculatedValues.total}
                              </Badge>
                            )}
                            {formatted.calculatedValues?.maxPerUse && (
                              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
                                Макс. за раз: {formatted.calculatedValues.maxPerUse}
                              </Badge>
                            )}
                            {formatted.calculatedValues?.rechargeText && (
                              <Badge variant="outline" className="text-xs">
                                {formatted.calculatedValues.rechargeText}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Show short description if available, with expandable full description */}
                        {hasShortDescription ? (
                          <Collapsible>
                            <p className="text-sm text-muted-foreground">
                              {renderHighlightedText(formatted.shortDescription || "")}
                            </p>
                            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:underline mt-2 group">
                              <span>Подробнее</span>
                              <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <p className="text-sm text-muted-foreground/80 whitespace-pre-line mt-2 pl-2 border-l-2 border-border/50">
                                {renderHighlightedText(formatted.description)}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {renderHighlightedText(formatted.description)}
                          </p>
                        )}

                        {/* Feat benefits badges */}
                        {feature.source === "feat" && feature.benefits && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                            {feature.benefits.ability_increase && (
                              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                                +{feature.benefits.ability_increase.amount} к характеристике
                              </Badge>
                            )}
                            {feature.benefits.ac_bonus && (
                              <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                                +{feature.benefits.ac_bonus} КД
                              </Badge>
                            )}
                            {feature.benefits.initiative_bonus && (
                              <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400">
                                +{feature.benefits.initiative_bonus} инициатива
                              </Badge>
                            )}
                            {feature.benefits.speed_bonus && (
                              <Badge variant="secondary" className="text-xs bg-cyan-500/20 text-cyan-400">
                                +{feature.benefits.speed_bonus} м скорость
                              </Badge>
                            )}
                            {feature.benefits.hp_per_level && (
                              <Badge variant="secondary" className="text-xs bg-red-500/20 text-red-400">
                                +{feature.benefits.hp_per_level} ОЗ/уровень
                              </Badge>
                            )}
                            {feature.benefits.skill_proficiency && (
                              <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400">
                                +{feature.benefits.skill_proficiency} навык
                              </Badge>
                            )}
                            {feature.benefits.skill_expertise && (
                              <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-400">
                                Экспертиза
                              </Badge>
                            )}
                            {feature.benefits.cantrips && (
                              <Badge variant="secondary" className="text-xs bg-indigo-500/20 text-indigo-400">
                                +{feature.benefits.cantrips} заговор
                              </Badge>
                            )}
                            {feature.benefits.spells && feature.benefits.spells.length > 0 && (
                              <Badge variant="secondary" className="text-xs bg-indigo-500/20 text-indigo-400">
                                +{feature.benefits.spells.length} заклинание
                              </Badge>
                            )}
                            {feature.benefits.languages && (
                              <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-400">
                                +{feature.benefits.languages} язык
                              </Badge>
                            )}
                            {feature.benefits.luck_points && (
                              <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400">
                                {feature.benefits.luck_points} очков удачи
                              </Badge>
                            )}
                            {feature.benefits.sorcery_points && (
                              <Badge variant="secondary" className="text-xs bg-pink-500/20 text-pink-400">
                                +{feature.benefits.sorcery_points} очков чародейства
                              </Badge>
                            )}
                            {feature.benefits.passive_bonus && (
                              <Badge variant="secondary" className="text-xs bg-teal-500/20 text-teal-400">
                                +{feature.benefits.passive_bonus} пассивное восприятие
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}
