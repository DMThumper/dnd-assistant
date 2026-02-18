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
} from "lucide-react";
import { usePlayerSession } from "@/contexts/PlayerSessionContext";

// Feature with metadata
interface Feature {
  name: string;
  description: string;
  source?: "race" | "class" | "subclass" | "feat" | "background";
  subclass?: string;
  level?: number;
  type?: string;
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
                  {sourceFeatures.map((feature, index) => (
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
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* Summary Card */}
        {hasFeatures && (
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Всего способностей:</span>
                <Badge variant="default">{features.length}</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
