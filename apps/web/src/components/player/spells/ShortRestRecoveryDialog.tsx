"use client";

import { useState, useEffect } from "react";
import { api, ApiClientError } from "@/lib/api";
import type { RecoveryOption, SpellSlot } from "@/types/spell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Plus, Minus, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShortRestRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: number;
  spellSlots: Record<string, SpellSlot>;
  onRecoveryUsed: (newSlots: Record<string, number>) => void;
}

export function ShortRestRecoveryDialog({
  open,
  onOpenChange,
  characterId,
  spellSlots,
  onRecoveryUsed,
}: ShortRestRecoveryDialogProps) {
  const [options, setOptions] = useState<RecoveryOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<RecoveryOption | null>(null);
  const [slotsToRestore, setSlotsToRestore] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load recovery options when dialog opens
  useEffect(() => {
    if (open) {
      void loadOptions();
      setSlotsToRestore([]);
      setSelectedOption(null);
    }
  }, [open, characterId]);

  const loadOptions = async () => {
    setIsLoading(true);
    try {
      const response = await api.getRecoveryOptions(characterId);
      setOptions(response.data);

      // Auto-select first available option
      const firstAvailable = response.data.find((opt) => opt.available);
      if (firstAvailable) {
        setSelectedOption(firstAvailable);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total slot levels selected
  const totalLevels = slotsToRestore.reduce((sum, level) => sum + level, 0);
  const maxLevels = selectedOption?.max_slot_levels ?? 0;
  const remainingBudget = maxLevels - totalLevels;

  // Get count of each slot level in selection
  const getSlotCount = (level: number) =>
    slotsToRestore.filter((l) => l === level).length;

  // Check if slot can be added (has room and isn't already full)
  const canAddSlot = (level: number) => {
    if (level > remainingBudget) return false;
    const slot = spellSlots[level];
    if (!slot) return false;
    const currentCount = getSlotCount(level);
    const restorable = slot.max - slot.remaining;
    return currentCount < restorable;
  };

  const addSlot = (level: number) => {
    if (canAddSlot(level)) {
      setSlotsToRestore([...slotsToRestore, level]);
    }
  };

  const removeSlot = (level: number) => {
    const idx = slotsToRestore.lastIndexOf(level);
    if (idx !== -1) {
      const newSlots = [...slotsToRestore];
      newSlots.splice(idx, 1);
      setSlotsToRestore(newSlots);
    }
  };

  const handleUseRecovery = async () => {
    if (!selectedOption || slotsToRestore.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await api.useRecovery(
        characterId,
        selectedOption.key,
        slotsToRestore
      );

      toast.success("Ячейки заклинаний восстановлены!");
      onRecoveryUsed(response.data.spell_slots_remaining);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  // Filter to only show slots that can potentially be restored (not full)
  const restorableSlots = Object.entries(spellSlots)
    .filter(([_, slot]) => slot.remaining < slot.max)
    .sort(([a], [b]) => parseInt(a) - parseInt(b));

  const availableOptions = options.filter((opt) => opt.available);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If no available recovery options, don't show dialog
  if (availableOptions.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Восстановление ячеек
          </DialogTitle>
          <DialogDescription>
            {selectedOption?.description ||
              "Выберите ячейки для восстановления во время короткого отдыха."}
          </DialogDescription>
        </DialogHeader>

        {/* Recovery Option Selector (if multiple) */}
        {availableOptions.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {availableOptions.map((opt) => (
              <Badge
                key={opt.key}
                variant={selectedOption?.key === opt.key ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedOption(opt);
                  setSlotsToRestore([]);
                }}
              >
                {opt.name}
              </Badge>
            ))}
          </div>
        )}

        {selectedOption && (
          <>
            {/* Budget Display */}
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-muted-foreground">Бюджет:</span>
              <span className="text-2xl font-bold">
                <span className={cn(totalLevels > 0 && "text-primary")}>
                  {totalLevels}
                </span>
                <span className="text-muted-foreground"> / {maxLevels}</span>
              </span>
              <span className="text-muted-foreground">уровней</span>
            </div>

            {/* Slot Selection */}
            {restorableSlots.length > 0 ? (
              <div className="space-y-3">
                {restorableSlots.map(([level, slot]) => {
                  const levelNum = parseInt(level);
                  const count = getSlotCount(levelNum);
                  const canAdd = canAddSlot(levelNum);
                  const restorable = slot.max - slot.remaining;

                  return (
                    <div
                      key={level}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <div className="font-medium">{level} уровень</div>
                        <div className="text-xs text-muted-foreground">
                          {slot.remaining}/{slot.max} (можно +{restorable})
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeSlot(levelNum)}
                          disabled={count === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center font-mono text-lg">
                          {count}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => addSlot(levelNum)}
                          disabled={!canAdd}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                Все ячейки заклинаний уже полностью восстановлены!
              </div>
            )}
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip}>
            Пропустить
          </Button>
          <Button
            onClick={handleUseRecovery}
            disabled={slotsToRestore.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Восстановить ({slotsToRestore.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
