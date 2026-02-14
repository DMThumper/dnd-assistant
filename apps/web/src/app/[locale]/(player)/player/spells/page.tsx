"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, ApiClientError } from "@/lib/api";
import type { Character } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Sparkles } from "lucide-react";

const ACTIVE_CHARACTER_KEY = "dnd-player-active-character";

export default function SpellsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharacter = async () => {
      // Get active character ID from localStorage
      const activeCharId = localStorage.getItem(ACTIVE_CHARACTER_KEY);

      if (!activeCharId) {
        // No active character, redirect to campaigns
        router.push("/player");
        return;
      }

      try {
        const response = await api.getCharacter(Number(activeCharId));
        setCharacter(response.data.character);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError(t("errors.generic"));
        }
        // Clear invalid character ID
        localStorage.removeItem(ACTIVE_CHARACTER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCharacter();
  }, [router, t]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{error || "Персонаж не найден"}</p>
      </div>
    );
  }

  // For now, show placeholder - spells system will be added later
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("player.sheet.spells")}</h1>
        <Badge variant="secondary">{character.name}</Badge>
      </div>

      {/* Spell Slots (placeholder) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Ячейки заклинаний
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {character.class_slug === "wizard" || character.class_slug === "sorcerer" ? (
              <p>Система заклинаний будет добавлена позже.</p>
            ) : (
              <p>Этот класс не использует заклинания.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cantrips */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Заговоры</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Заговоры персонажа будут отображаться здесь.
          </p>
        </CardContent>
      </Card>

      {/* Prepared Spells */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Подготовленные заклинания</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Список подготовленных заклинаний будет здесь.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
