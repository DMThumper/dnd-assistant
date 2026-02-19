"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePlayerSession } from "@/contexts/PlayerSessionContext";
import { api } from "@/lib/api";
import type { Character } from "@/types/game";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen } from "lucide-react";
import { SpellBook } from "@/components/player/spells";

export default function SpellsPage() {
  const t = useTranslations();
  const router = useRouter();
  const {
    character: contextCharacter,
    activeCharacterId,
    isValidating,
    liveSession,
    setActiveCharacter,
    updateCharacter,
  } = usePlayerSession();

  // Local state for character if context doesn't have it
  const [localCharacter, setLocalCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Use context character if available, otherwise local
  const character = contextCharacter || localCharacter;
  const setCharacter = contextCharacter ? updateCharacter : setLocalCharacter;

  // Load character if we have ID but no character data
  const loadCharacter = useCallback(async () => {
    if (!activeCharacterId || character) return;

    setIsLoading(true);
    try {
      const response = await api.getCharacter(activeCharacterId);
      if (response.data?.character) {
        setLocalCharacter(response.data.character);
        setActiveCharacter(activeCharacterId, response.data.character.campaign_id);
      }
    } catch (error) {
      console.error("Failed to load character:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCharacterId, character, setActiveCharacter]);

  useEffect(() => {
    if (!isValidating && activeCharacterId && !character) {
      void loadCharacter();
    }
  }, [isValidating, activeCharacterId, character, loadCharacter]);

  // Redirect if no active character after validation
  useEffect(() => {
    if (!isValidating && !isLoading && !activeCharacterId) {
      router.push("/player");
    }
  }, [isValidating, isLoading, activeCharacterId, router]);

  // Handle character update from SpellBook (after rest)
  const handleCharacterUpdate = useCallback((updatedCharacter: unknown) => {
    setCharacter(updatedCharacter as Character);
  }, [setCharacter]);

  if (isValidating || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Персонаж не найден</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("player.sheet.spells")}</h1>
        <Badge variant="secondary">{character.name}</Badge>
      </div>

      <SpellBook
        characterId={character.id}
        isActive={character.is_active}
        hasLiveSession={!!liveSession}
        raceSlug={character.race_slug}
        onCharacterUpdate={handleCharacterUpdate}
      />
    </div>
  );
}
