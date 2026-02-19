"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiClientError } from "@/lib/api";
import type { Spellbook, Spell, ConcentrationSpell } from "@/types/spell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Moon, Sun, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SpellSlotTracker } from "./SpellSlotTracker";
import { SpellList } from "./SpellList";
import { ConcentrationIndicator } from "./ConcentrationIndicator";
import { PrepareSpellsDialog } from "./PrepareSpellsDialog";
import { ShortRestRecoveryDialog } from "./ShortRestRecoveryDialog";

interface SpellBookProps {
  characterId: number;
  isActive: boolean;
  hasLiveSession: boolean;
}

export function SpellBook({ characterId, isActive, hasLiveSession }: SpellBookProps) {
  const [spellbook, setSpellbook] = useState<Spellbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isResting, setIsResting] = useState(false);
  const [showPrepareDialog, setShowPrepareDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);

  // Can modify only if: inactive character OR active with live session
  const canModify = !isActive || hasLiveSession;

  const loadSpellbook = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.getSpellbook(characterId);
      setSpellbook(response.data);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Не удалось загрузить книгу заклинаний");
      }
    } finally {
      setIsLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    void loadSpellbook();
  }, [loadSpellbook]);

  const handleUseSlot = async (level: number) => {
    if (!canModify) {
      toast.error("Изменения возможны только во время активной сессии");
      return;
    }

    try {
      const response = await api.useSpellSlot(characterId, level);
      setSpellbook((prev) =>
        prev
          ? {
              ...prev,
              spell_slots: {
                ...prev.spell_slots,
                [level]: {
                  ...prev.spell_slots[level],
                  remaining: response.data.spell_slots_remaining[level] ?? 0,
                },
              },
            }
          : null
      );
      toast.success(`Использован слот ${level} уровня`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      }
    }
  };

  const handleRestoreSlot = async (level: number) => {
    if (!canModify) {
      toast.error("Изменения возможны только во время активной сессии");
      return;
    }

    try {
      const response = await api.restoreSpellSlot(characterId, level);
      setSpellbook((prev) =>
        prev
          ? {
              ...prev,
              spell_slots: {
                ...prev.spell_slots,
                [level]: {
                  ...prev.spell_slots[level],
                  remaining: response.data.spell_slots_remaining[level] ?? 0,
                },
              },
            }
          : null
      );
      toast.success(`Восстановлен слот ${level} уровня`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      }
    }
  };

  const handleRest = async (type: "short" | "long") => {
    if (!canModify) {
      toast.error("Изменения возможны только во время активной сессии");
      return;
    }

    // For short rest, check if recovery options available first
    if (type === "short") {
      try {
        const recoveryResponse = await api.getRecoveryOptions(characterId);
        const hasAvailableRecovery = recoveryResponse.data.some((opt) => opt.available);

        if (hasAvailableRecovery) {
          // Show recovery dialog - it will handle the short rest
          setShowRecoveryDialog(true);
          return;
        }
      } catch {
        // If recovery check fails, continue with normal short rest
      }
    }

    setIsResting(true);
    try {
      const response = await api.takeRest(characterId, type);

      // Update spell slots from response
      setSpellbook((prev) => {
        if (!prev) return null;

        const newSlots = { ...prev.spell_slots };
        for (const [level, remaining] of Object.entries(response.data.spell_slots_remaining)) {
          if (newSlots[level]) {
            newSlots[level] = {
              ...newSlots[level],
              remaining: remaining as number,
            };
          }
        }

        return {
          ...prev,
          spell_slots: newSlots,
          concentration_spell: response.data.concentration_spell,
        };
      });

      if (type === "long") {
        toast.success("Продолжительный отдых завершён. Ячейки восстановлены!");
        // Open prepare spells dialog for prepared casters after long rest
        if (spellbook?.is_prepared_caster) {
          setShowPrepareDialog(true);
        }
      } else {
        toast.success("Короткий отдых завершён");
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      }
    } finally {
      setIsResting(false);
    }
  };

  const handleRecoveryUsed = (newSlots: Record<string, number>) => {
    setSpellbook((prev) => {
      if (!prev) return null;

      const updatedSlots = { ...prev.spell_slots };
      for (const [level, remaining] of Object.entries(newSlots)) {
        if (updatedSlots[level]) {
          updatedSlots[level] = {
            ...updatedSlots[level],
            remaining,
          };
        }
      }

      return {
        ...prev,
        spell_slots: updatedSlots,
      };
    });
    toast.success("Короткий отдых завершён");
  };

  const handleStartConcentration = async (spellSlug: string) => {
    if (!canModify) {
      toast.error("Изменения возможны только во время активной сессии");
      return;
    }

    try {
      const response = await api.startConcentration(characterId, spellSlug);
      setSpellbook((prev) =>
        prev
          ? { ...prev, concentration_spell: response.data.concentration_spell }
          : null
      );
      toast.success(`Концентрация: ${response.data.concentration_spell.spell_name}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      }
    }
  };

  const handleEndConcentration = async () => {
    if (!canModify) {
      toast.error("Изменения возможны только во время активной сессии");
      return;
    }

    try {
      await api.endConcentration(characterId);
      setSpellbook((prev) =>
        prev ? { ...prev, concentration_spell: null } : null
      );
      toast.success("Концентрация прервана");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      }
    }
  };

  const handlePreparedChange = (newPrepared: Spell[]) => {
    setSpellbook((prev) =>
      prev ? { ...prev, prepared_spells: newPrepared } : null
    );
  };

  // Filter spells by search query
  const filterSpells = (spells: Spell[]) => {
    if (!searchQuery) return spells;
    const query = searchQuery.toLowerCase();
    return spells.filter(
      (spell) =>
        spell.name.toLowerCase().includes(query) ||
        spell.school.toLowerCase().includes(query)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadSpellbook}>Повторить</Button>
      </div>
    );
  }

  if (!spellbook) {
    return null;
  }

  if (!spellbook.is_spellcaster) {
    return (
      <Card className="bg-card/50">
        <CardContent className="p-6 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Этот персонаж не умеет творить заклинания
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredCantrips = filterSpells(spellbook.cantrips);
  const filteredPrepared = filterSpells(spellbook.prepared_spells);
  const filteredCircle = filterSpells(spellbook.circle_spells || []);

  return (
    <div className="space-y-4">
      {/* Concentration Indicator - Sticky at top when active */}
      {spellbook.concentration_spell && (
        <ConcentrationIndicator
          concentration={spellbook.concentration_spell}
          onEnd={handleEndConcentration}
          canModify={canModify}
        />
      )}

      {/* Spellcasting Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground uppercase mb-1">
              СЛ спасброска
            </div>
            <div className="text-2xl font-bold">{spellbook.spell_save_dc}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground uppercase mb-1">
              Атака
            </div>
            <div className="text-2xl font-bold">
              +{spellbook.spell_attack_bonus}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground uppercase mb-1">
              {spellbook.spellcasting_ability?.slice(0, 3).toUpperCase()}
            </div>
            <div className="text-2xl font-bold text-primary">
              {spellbook.is_prepared_caster ? (
                <span>
                  {spellbook.prepared_spells.length}/{spellbook.max_prepared}
                </span>
              ) : (
                <span>{spellbook.known_spells.length}</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {spellbook.is_prepared_caster ? "подгот." : "изв."}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spell Slots */}
      <SpellSlotTracker
        slots={spellbook.spell_slots}
        onUseSlot={handleUseSlot}
        onRestoreSlot={handleRestoreSlot}
        canModify={canModify}
      />

      {/* Prepare Spells Button (for prepared casters) */}
      {spellbook.is_prepared_caster && canModify && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowPrepareDialog(true)}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Подготовить заклинания
        </Button>
      )}

      {/* Rest Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleRest("short")}
          disabled={isResting || !canModify}
        >
          <Sun className="h-4 w-4 mr-2" />
          Короткий отдых
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => handleRest("long")}
          disabled={isResting || !canModify}
        >
          {isResting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Moon className="h-4 w-4 mr-2" />
          )}
          Длинный отдых
        </Button>
      </div>

      {/* Prepare Spells Dialog */}
      {spellbook.is_prepared_caster && (
        <PrepareSpellsDialog
          open={showPrepareDialog}
          onOpenChange={setShowPrepareDialog}
          characterId={characterId}
          currentPrepared={spellbook.prepared_spells.map((s) => s.slug)}
          maxPrepared={spellbook.max_prepared}
          spellcastingAbility={spellbook.spellcasting_ability}
          onPreparedChange={handlePreparedChange}
        />
      )}

      {/* Short Rest Recovery Dialog */}
      <ShortRestRecoveryDialog
        open={showRecoveryDialog}
        onOpenChange={setShowRecoveryDialog}
        characterId={characterId}
        spellSlots={spellbook.spell_slots}
        onRecoveryUsed={handleRecoveryUsed}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск заклинаний..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cantrips */}
      {filteredCantrips.length > 0 && (
        <SpellList
          title="Заговоры"
          spells={filteredCantrips}
          onCast={handleStartConcentration}
          currentConcentration={spellbook.concentration_spell}
          canModify={canModify}
          isCantrip
        />
      )}

      {/* Prepared/Known Spells */}
      {filteredPrepared.length > 0 && (
        <SpellList
          title={spellbook.is_prepared_caster ? "Подготовленные" : "Известные"}
          spells={filteredPrepared}
          onCast={handleStartConcentration}
          onUseSlot={handleUseSlot}
          currentConcentration={spellbook.concentration_spell}
          slots={spellbook.spell_slots}
          canModify={canModify}
        />
      )}

      {/* Circle Spells (for Circle of the Land druids) */}
      {filteredCircle.length > 0 && (
        <SpellList
          title={`Заклинания круга${spellbook.circle_terrain ? ` (${spellbook.circle_terrain})` : ""}`}
          spells={filteredCircle}
          onCast={handleStartConcentration}
          onUseSlot={handleUseSlot}
          currentConcentration={spellbook.concentration_spell}
          slots={spellbook.spell_slots}
          canModify={canModify}
          isAlwaysPrepared
        />
      )}
    </div>
  );
}
