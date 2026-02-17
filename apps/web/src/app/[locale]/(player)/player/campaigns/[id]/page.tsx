"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, ApiClientError } from "@/lib/api";
import { usePlayerSession } from "@/contexts/PlayerSessionContext";
import type { Character, PlayerCampaign } from "@/types/game";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Plus,
  Skull,
  ChevronLeft,
  Shield,
  Heart,
  Swords,
  Trash2,
  Play,
  Crown,
} from "lucide-react";
import { toast } from "sonner";

export default function CampaignCharactersPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const { clearActiveCharacter } = usePlayerSession();
  const campaignId = Number(params.id);

  const [campaign, setCampaign] = useState<PlayerCampaign | null>(null);
  const [aliveCharacters, setAliveCharacters] = useState<Character[]>([]);
  const [deadCharacters, setDeadCharacters] = useState<Character[]>([]);
  const [showExperiments, setShowExperiments] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [activateDialog, setActivateDialog] = useState<Character | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Character | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear active character when on character selection page
  // This ensures we don't show as "online" in presence channel from a previous session
  useEffect(() => {
    clearActiveCharacter();
  }, [clearActiveCharacter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignRes, charactersRes] = await Promise.all([
          api.getPlayerCampaign(campaignId),
          api.getPlayerCharacters(campaignId),
        ]);

        setCampaign(campaignRes.data.campaign);
        setAliveCharacters(charactersRes.data.alive);
        setDeadCharacters(charactersRes.data.dead);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError(t("errors.generic"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [campaignId, t]);

  const handleActivate = async () => {
    if (!activateDialog) return;

    setIsActivating(true);
    try {
      const response = await api.activateCharacter(activateDialog.id);

      // Update the list - mark this one as active, others as inactive
      setAliveCharacters(prev =>
        prev.map(c => ({
          ...c,
          is_active: c.id === activateDialog.id,
          can_be_deleted: c.id === activateDialog.id ? false : c.can_be_deleted,
        }))
      );

      toast.success(`${activateDialog.name} вступает в игру!`);
      setActivateDialog(null);

      // Navigate to character sheet
      router.push(`/player/sheet/${activateDialog.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error(t("errors.generic"));
      }
    } finally {
      setIsActivating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    setIsDeleting(true);
    try {
      await api.deleteCharacter(deleteDialog.id);

      // Remove from list
      setAliveCharacters(prev => prev.filter(c => c.id !== deleteDialog.id));

      toast.success("Персонаж удалён");
      setDeleteDialog(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error(t("errors.generic"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Separate active and inactive (experiments) characters
  const activeCharacters = aliveCharacters.filter(c => c.is_active);
  const experimentCharacters = aliveCharacters.filter(c => !c.is_active);

  const handleSelectCharacter = (character: Character) => {
    router.push(`/player/sheet/${character.id}`);
  };

  const handleCreateCharacter = () => {
    router.push(`/player/create?campaign=${campaignId}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push("/player")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push("/player")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{campaign?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {campaign?.setting?.name}
          </p>
        </div>
      </div>

      {/* No characters state */}
      {aliveCharacters.length === 0 && deadCharacters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Swords className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {t("player.characters.noCharacters")}
          </h2>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Создайте персонажа, чтобы присоединиться к приключению
          </p>
          <Button onClick={handleCreateCharacter}>
            <Plus className="mr-2 h-4 w-4" />
            {t("player.characters.createNew")}
          </Button>
        </div>
      )}

      {/* Active characters */}
      {activeCharacters.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {t("player.characters.title")}
          </h2>
          <div className="grid gap-3">
            {activeCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                hasActiveCharacter={true}
                onSelect={() => handleSelectCharacter(character)}
                onActivate={() => setActivateDialog(character)}
                onDelete={() => setDeleteDialog(character)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Inactive characters ready for activation */}
      {experimentCharacters.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Swords className="h-5 w-5 text-muted-foreground" />
            Готовы к игре
          </h2>
          <div className="grid gap-3">
            {experimentCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                hasActiveCharacter={activeCharacters.length > 0}
                onSelect={() => handleSelectCharacter(character)}
                onActivate={() => setActivateDialog(character)}
                onDelete={() => setDeleteDialog(character)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Create new character button */}
      {(activeCharacters.length > 0 || experimentCharacters.length > 0) && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleCreateCharacter}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("player.characters.createNew")}
        </Button>
      )}

      {/* Dead characters (graveyard) */}
      {deadCharacters.length > 0 && (
        <section>
          <Separator className="my-6" />
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            <Skull className="h-5 w-5" />
            {t("player.characters.graveyard")}
          </h2>
          <div className="grid gap-3">
            {deadCharacters.map((character) => (
              <GraveyardCard key={character.id} character={character} />
            ))}
          </div>
        </section>
      )}

      {/* Activation Dialog */}
      <AlertDialog open={!!activateDialog} onOpenChange={() => setActivateDialog(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">
              Вступить в игру?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground text-left space-y-3 pt-2">
                <p>
                  <span className="font-semibold text-foreground">{activateDialog?.name}</span> станет вашим активным персонажем в этой кампании.
                </p>
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
                  <p className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Активного персонажа нельзя удалить</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Вся статистика сессий будет записываться на него</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Деактивировать может только Мастер</span>
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 pt-2">
            <AlertDialogCancel disabled={isActivating}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivate}
              disabled={isActivating}
              className="bg-primary"
            >
              {isActivating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              В бой!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить персонажа?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">{deleteDialog?.name}</span> будет удалён навсегда. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface CharacterCardProps {
  character: Character;
  hasActiveCharacter: boolean;
  onSelect: () => void;
  onActivate: () => void;
  onDelete: () => void;
}

function CharacterCard({ character, hasActiveCharacter, onSelect, onActivate, onDelete }: CharacterCardProps) {
  const hpPercentage = (character.current_hp / character.max_hp) * 100;
  const hpColor =
    hpPercentage <= 25
      ? "bg-destructive"
      : hpPercentage <= 50
        ? "bg-warning"
        : "bg-success";

  const isActive = character.is_active;
  const canDelete = character.can_be_deleted;

  return (
    <Card className={`transition-colors ${isActive ? "border-primary/50 bg-primary/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div
            className="flex-1 cursor-pointer"
            onClick={onSelect}
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{character.name}</h3>
              {isActive && (
                <Badge variant="default" className="bg-primary text-xs">
                  <Crown className="mr-1 h-3 w-3" />
                  В игре
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {character.race_slug && (
                <span className="capitalize">{character.race_slug}</span>
              )}{" "}
              {character.class_slug && (
                <span className="capitalize">{character.class_slug}</span>
              )}{" "}
              <Badge variant="secondary" className="ml-1">
                Ур. {character.level}
              </Badge>
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-destructive" />
              <span>
                {character.current_hp}/{character.max_hp}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>{character.armor_class}</span>
            </div>
          </div>
        </div>

        {/* HP Bar */}
        <div
          className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden cursor-pointer"
          onClick={onSelect}
        >
          <div
            className={`h-full transition-all ${hpColor}`}
            style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
          />
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center justify-end gap-2">
          {isActive ? (
            // Active character - no extra buttons needed, card click opens sheet
            null
          ) : (
            // Inactive character
            <>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {/* Activate button - only show if no active character yet */}
              {!hasActiveCharacter && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onActivate();
                  }}
                >
                  <Play className="mr-1 h-4 w-4" />
                  Активировать
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface GraveyardCardProps {
  character: Character;
}

function GraveyardCard({ character }: GraveyardCardProps) {
  return (
    <Card className="opacity-60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Skull className="h-4 w-4" />
              {character.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {character.race_slug && (
                <span className="capitalize">{character.race_slug}</span>
              )}{" "}
              {character.class_slug && (
                <span className="capitalize">{character.class_slug}</span>
              )}{" "}
              <Badge variant="outline" className="ml-1">
                Ур. {character.level}
              </Badge>
            </p>
          </div>
        </div>

        {character.death_info && (
          <div className="mt-3 text-sm text-muted-foreground">
            <p>
              Убит: <span className="text-foreground">{character.death_info.killed_by}</span>
            </p>
            {character.death_info.last_words && (
              <p className="italic mt-1">
                &ldquo;{character.death_info.last_words}&rdquo;
              </p>
            )}
          </div>
        )}

        {character.stats && character.stats.sessions_played && (
          <div className="mt-2 text-xs text-muted-foreground">
            Сессий: {character.stats.sessions_played} | Убито монстров:{" "}
            {character.stats.monsters_killed || 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}