"use client";

import { useState, memo } from "react";
import type { Character } from "@/types/game";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InspirationControlProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  onMarkPendingUpdate: (characterId: number, updateType?: "hp" | "xp" | "condition") => void;
}

export const InspirationControl = memo(function InspirationControl({
  character,
  onCharacterUpdate,
  onMarkPendingUpdate,
}: InspirationControlProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleInspiration = async () => {
    onMarkPendingUpdate(character.id);
    setIsLoading(true);

    try {
      const response = await api.toggleInspiration(character.id);
      onCharacterUpdate(response.data.character);

      if (response.data.character.inspiration) {
        toast.success(`${character.name} получает вдохновение!`);
      } else {
        toast.info(`${character.name} использует вдохновение`);
      }
    } catch (error) {
      console.error("Failed to toggle inspiration:", error);
      toast.error("Не удалось изменить вдохновение");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-400" />
        <h3 className="font-semibold text-zinc-100">Вдохновение</h3>
      </div>

      {/* Inspiration toggle */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
        <Button
          onClick={handleToggleInspiration}
          disabled={isLoading}
          variant="outline"
          className={cn(
            "flex-1 h-14 text-lg font-medium transition-all",
            character.inspiration
              ? "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30"
              : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Sparkles className={cn(
                "h-5 w-5 mr-2",
                character.inspiration ? "text-amber-400" : "text-zinc-500"
              )} />
              {character.inspiration ? "Есть вдохновение" : "Нет вдохновения"}
            </>
          )}
        </Button>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500">
        Вдохновение даёт преимущество на один бросок атаки, спасбросок или проверку характеристики.
        Нельзя накапливать несколько вдохновений.
      </p>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.character.id === nextProps.character.id &&
    prevProps.character.inspiration === nextProps.character.inspiration
  );
});
