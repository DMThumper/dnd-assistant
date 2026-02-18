"use client";

import { useState, memo } from "react";
import type { Character } from "@/types/game";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Edit3, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PlayerNotesControlProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  onMarkPendingUpdate: (characterId: number, updateType?: "hp" | "xp" | "condition") => void;
}

export const PlayerNotesControl = memo(function PlayerNotesControl({
  character,
  onCharacterUpdate,
  onMarkPendingUpdate,
}: PlayerNotesControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = () => {
    setNotesValue(character.player_notes ?? "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setNotesValue("");
  };

  const saveNotes = async () => {
    if (isSaving) return;

    onMarkPendingUpdate(character.id);

    setIsSaving(true);
    try {
      const response = await api.updatePlayerNotes(character.id, notesValue);
      onCharacterUpdate(response.data.character);
      setIsEditing(false);
      toast.success("Заметки сохранены");
    } catch (error) {
      console.error("Failed to save notes:", error);
      toast.error("Не удалось сохранить заметки");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold text-zinc-100">Заметки игрока</h3>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={startEditing}
            className="bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Редактировать
          </Button>
        )}
      </div>

      {/* Notes content */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              placeholder="Заметки игрока..."
              className="min-h-[120px] bg-zinc-800/50 border-blue-500/30 focus:border-blue-500 text-zinc-100"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                disabled={isSaving}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="h-4 w-4 mr-1" />
                Отмена
              </Button>
              <Button
                size="sm"
                onClick={saveNotes}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                Сохранить
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm">
            {character.player_notes ? (
              <p className="whitespace-pre-wrap text-zinc-300">{character.player_notes}</p>
            ) : (
              <p className="text-zinc-500 italic">
                Игрок пока не добавил заметки
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.character.id === nextProps.character.id &&
    prevProps.character.player_notes === nextProps.character.player_notes
  );
});
