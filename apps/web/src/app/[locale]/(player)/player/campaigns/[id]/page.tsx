"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, ApiClientError } from "@/lib/api";
import type { Character, PlayerCampaign } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Plus,
  Skull,
  ChevronLeft,
  Shield,
  Heart,
  Swords,
} from "lucide-react";

export default function CampaignCharactersPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const campaignId = Number(params.id);

  const [campaign, setCampaign] = useState<PlayerCampaign | null>(null);
  const [aliveCharacters, setAliveCharacters] = useState<Character[]>([]);
  const [deadCharacters, setDeadCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // Always show character list - players may want to create new characters
        // or view the graveyard
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
  }, [campaignId, router, t]);

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

  const handleSelectCharacter = (character: Character) => {
    router.push(`/player/sheet/${character.id}`);
  };

  const handleCreateCharacter = () => {
    router.push(`/player/create?campaign=${campaignId}`);
  };

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
          <Button onClick={handleCreateCharacter} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            {t("player.characters.createNew")}
          </Button>
        </div>
      )}

      {/* Alive characters */}
      {aliveCharacters.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">
            {t("player.characters.title")}
          </h2>
          <div className="grid gap-3">
            {aliveCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onClick={() => handleSelectCharacter(character)}
              />
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={handleCreateCharacter}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("player.characters.createNew")}
          </Button>
        </section>
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
    </div>
  );
}

interface CharacterCardProps {
  character: Character;
  onClick: () => void;
}

function CharacterCard({ character, onClick }: CharacterCardProps) {
  const hpPercentage = (character.current_hp / character.max_hp) * 100;
  const hpColor =
    hpPercentage <= 25
      ? "bg-destructive"
      : hpPercentage <= 50
        ? "bg-warning"
        : "bg-success";

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{character.name}</h3>
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
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-destructive" />
              <span>
                {character.current_hp}/{character.max_hp}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-info" />
              <span>{character.armor_class}</span>
            </div>
          </div>
        </div>

        {/* HP Bar */}
        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all ${hpColor}`}
            style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
          />
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
