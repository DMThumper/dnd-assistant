"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import type { Character } from "@/types/game";
import type { Monster } from "@/types/summon";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Heart,
  Shield,
  Footprints,
  Fish,
  Bird,
  PawPrint,
  Search,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BeastSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character: Character;
  onTransform: (character: Character) => void;
}

interface WildShapeLimits {
  max_cr: number;
  can_swim: boolean;
  can_fly: boolean;
  duration_hours: number;
  is_moon_druid: boolean;
}

function formatCr(cr: number): string {
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(Math.floor(cr));
}

function formatSpeed(speed: Monster["speed"]): string {
  const parts: string[] = [];
  if (speed.walk) parts.push(`${speed.walk} м`);
  if (speed.fly) parts.push(`полёт ${speed.fly} м`);
  if (speed.swim) parts.push(`плав. ${speed.swim} м`);
  if (speed.climb) parts.push(`лаз. ${speed.climb} м`);
  if (speed.burrow) parts.push(`коп. ${speed.burrow} м`);
  return parts.join(", ") || "0 м";
}

const SIZE_NAMES: Record<string, string> = {
  tiny: "Крошечный",
  small: "Маленький",
  medium: "Средний",
  large: "Большой",
  huge: "Огромный",
  gargantuan: "Исполинский",
};

export function BeastSelectionModal({
  open,
  onOpenChange,
  character,
  onTransform,
}: BeastSelectionModalProps) {
  const [beasts, setBeasts] = useState<Monster[]>([]);
  const [limits, setLimits] = useState<WildShapeLimits | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [selectedBeast, setSelectedBeast] = useState<Monster | null>(null);
  const [expandedBeast, setExpandedBeast] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCr, setFilterCr] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedBeast(null);
      setExpandedBeast(null);
      setSearchQuery("");
      setFilterCr(null);
      loadBeasts();
    }
  }, [open, character.id]);

  async function loadBeasts() {
    setIsLoading(true);
    try {
      const response = await api.getWildShapeBeasts(character.id);
      setBeasts(response.data.beasts);
      setLimits(response.data.limits);
    } catch (err) {
      console.error("Failed to load beasts:", err);
      toast.error("Не удалось загрузить список зверей");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTransform() {
    if (!selectedBeast) return;

    setIsTransforming(true);
    try {
      const response = await api.wildShapeTransform(character.id, selectedBeast.id);
      toast.success(response.data.message || `Вы превратились в ${selectedBeast.name}!`);
      onTransform(response.data.character);
    } catch (err) {
      console.error("Failed to transform:", err);
      toast.error("Не удалось превратиться");
    } finally {
      setIsTransforming(false);
    }
  }

  // Filter beasts
  const filteredBeasts = useMemo(() => {
    let result = beasts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((b) => b.name.toLowerCase().includes(query));
    }

    if (filterCr !== null) {
      result = result.filter((b) => b.challenge_rating === filterCr);
    }

    return result;
  }, [beasts, searchQuery, filterCr]);

  // Available CR values for filter
  const availableCrs = useMemo(() => {
    const crs = new Set(beasts.map((b) => b.challenge_rating));
    return Array.from(crs).sort((a, b) => a - b);
  }, [beasts]);

  // Group by CR
  const groupedByCr = useMemo(() => {
    const groups = new Map<number, Monster[]>();
    for (const beast of filteredBeasts) {
      if (!groups.has(beast.challenge_rating)) {
        groups.set(beast.challenge_rating, []);
      }
      groups.get(beast.challenge_rating)!.push(beast);
    }
    return groups;
  }, [filteredBeasts]);

  const sortedCrs = Array.from(groupedByCr.keys()).sort((a, b) => a - b);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-green-500" />
            Дикий облик
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {limits && (
              <>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                  Макс. ПО: {formatCr(limits.max_cr)}
                </Badge>
                {limits.can_swim && (
                  <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                    <Fish className="h-3 w-3 mr-1" />
                    Плавание
                  </Badge>
                )}
                {limits.can_fly && (
                  <Badge variant="outline" className="border-sky-500/50 text-sky-400">
                    <Bird className="h-3 w-3 mr-1" />
                    Полёт
                  </Badge>
                )}
              </>
            )}
          </div>
        </DialogHeader>

        {/* Search and filters */}
        <div className="px-4 py-2 border-b space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск зверя..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={filterCr === null ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilterCr(null)}
            >
              Все
            </Button>
            {availableCrs.map((cr) => (
              <Button
                key={cr}
                variant={filterCr === cr ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilterCr(cr)}
              >
                ПО {formatCr(cr)}
              </Button>
            ))}
          </div>
        </div>

        {/* Beast list - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 py-2 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : sortedCrs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {beasts.length === 0 ? "Нет доступных зверей" : "Звери не найдены"}
              </div>
            ) : (
              sortedCrs.map((cr) => {
                const crBeasts = groupedByCr.get(cr) || [];
                return (
                  <div key={cr}>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      ПО {formatCr(cr)}
                    </div>
                    <div className="space-y-1">
                      {crBeasts.map((beast) => {
                        const isSelected = selectedBeast?.id === beast.id;
                        const isExpanded = expandedBeast === beast.id;

                        return (
                          <Collapsible
                            key={beast.id}
                            open={isExpanded}
                            onOpenChange={(open) =>
                              setExpandedBeast(open ? beast.id : null)
                            }
                          >
                            <div
                              className={cn(
                                "rounded-md transition-colors cursor-pointer",
                                isSelected && "bg-green-500/10 border border-green-500/30",
                                !isSelected && "hover:bg-accent/50"
                              )}
                              onClick={() => setSelectedBeast(beast)}
                            >
                              {/* Beast header */}
                              <div className="flex items-center gap-2 p-2">
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-full border-2 shrink-0",
                                    isSelected
                                      ? "bg-green-500 border-green-500"
                                      : "border-muted-foreground"
                                  )}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">
                                      {beast.name}
                                    </span>
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                      {SIZE_NAMES[beast.size] || beast.size}
                                    </Badge>
                                    {beast.has_swim && (
                                      <Fish className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                    )}
                                    {beast.has_fly && (
                                      <Bird className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Heart className="h-3 w-3 text-red-400" />
                                      {beast.hit_points}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Shield className="h-3 w-3 text-blue-400" />
                                      {beast.armor_class}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Footprints className="h-3 w-3" />
                                      {formatSpeed(beast.speed)}
                                    </span>
                                  </div>
                                </div>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ChevronDown
                                      className={cn(
                                        "h-4 w-4 transition-transform",
                                        isExpanded && "rotate-180"
                                      )}
                                    />
                                  </Button>
                                </CollapsibleTrigger>
                              </div>

                              {/* Beast details (collapsed) */}
                              <CollapsibleContent>
                                <div className="px-2 pb-2 pt-0 space-y-2">
                                  {/* Abilities */}
                                  <div className="grid grid-cols-6 gap-1 text-xs text-center">
                                    {(["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const).map((ability) => (
                                      <div key={ability} className="p-1 rounded bg-muted/50">
                                        <div className="text-muted-foreground">
                                          {ability.slice(0, 3).toUpperCase()}
                                        </div>
                                        <div className="font-medium">
                                          {beast.abilities[ability]}
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Traits */}
                                  {beast.traits && beast.traits.length > 0 && (
                                    <div className="space-y-1">
                                      {beast.traits.map((trait, i) => (
                                        <div key={i} className="text-xs">
                                          <span className="font-medium">{trait.name}.</span>{" "}
                                          <span className="text-muted-foreground">{trait.description}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Actions */}
                                  {beast.actions && beast.actions.length > 0 && (
                                    <div className="space-y-1.5">
                                      <div className="text-xs font-medium text-red-400">Действия</div>
                                      {beast.actions.map((action, i) => (
                                        <div key={i} className="text-xs p-2 rounded bg-red-500/5 border border-red-500/20">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-red-300">{action.name}</span>
                                            {action.attack_bonus !== undefined && (
                                              <Badge variant="outline" className="text-[10px] h-4 border-red-500/30 text-red-400">
                                                +{action.attack_bonus}
                                              </Badge>
                                            )}
                                            {action.reach && (
                                              <span className="text-muted-foreground text-[10px]">{action.reach}</span>
                                            )}
                                            {action.range && (
                                              <span className="text-muted-foreground text-[10px]">{action.range}</span>
                                            )}
                                          </div>
                                          <div className="text-muted-foreground leading-relaxed">
                                            {action.description || action.damage}
                                          </div>
                                        </div>
                                      ))}
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
          <Button
            onClick={handleTransform}
            disabled={isTransforming || !selectedBeast}
            className="bg-green-600 hover:bg-green-700"
          >
            {isTransforming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Превращение...
              </>
            ) : (
              <>
                <PawPrint className="mr-2 h-4 w-4" />
                {selectedBeast ? `Превратиться в ${selectedBeast.name}` : "Выберите зверя"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
