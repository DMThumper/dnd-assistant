"use client";

import { useState } from "react";
import type { SpellSlot } from "@/types/spell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Plus, Minus } from "lucide-react";

interface SpellSlotTrackerProps {
  slots: Record<string, SpellSlot>;
  onUseSlot: (level: number) => void;
  onRestoreSlot: (level: number) => void;
  canModify: boolean;
}

const LEVEL_LABELS: Record<string, string> = {
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
};

export function SpellSlotTracker({
  slots,
  onUseSlot,
  onRestoreSlot,
  canModify,
}: SpellSlotTrackerProps) {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  // Sort slot levels numerically
  const sortedLevels = Object.keys(slots)
    .map(Number)
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  if (sortedLevels.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Ячейки заклинаний
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Compact view - horizontal row of slots */}
        <div className="flex flex-wrap gap-3 justify-center">
          {sortedLevels.map((level) => {
            const slot = slots[level];
            if (!slot || slot.max === 0) return null;

            const isExpanded = expandedLevel === level;

            return (
              <div key={level} className="flex flex-col items-center">
                {/* Level label */}
                <div className="text-xs text-muted-foreground mb-1">
                  {LEVEL_LABELS[level] || level}
                </div>

                {/* Slot circles */}
                <div
                  className={cn(
                    "flex gap-1 cursor-pointer p-1 rounded-md transition-colors",
                    canModify && "hover:bg-accent/50"
                  )}
                  onClick={() => setExpandedLevel(isExpanded ? null : level)}
                >
                  {Array.from({ length: slot.max }).map((_, i) => {
                    const isFilled = i < slot.remaining;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "w-4 h-4 rounded-full border-2 transition-all",
                          isFilled
                            ? "bg-primary border-primary"
                            : "bg-transparent border-muted-foreground/50"
                        )}
                      />
                    );
                  })}
                </div>

                {/* Expanded controls */}
                {isExpanded && canModify && (
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUseSlot(level);
                      }}
                      disabled={slot.remaining <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreSlot(level);
                      }}
                      disabled={slot.remaining >= slot.max}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Hint text */}
        <div className="text-center text-xs text-muted-foreground mt-3">
          {canModify
            ? "Нажмите на уровень для управления"
            : "Доступно только во время сессии"}
        </div>
      </CardContent>
    </Card>
  );
}
