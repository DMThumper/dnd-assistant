"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Character, LiveSession } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Tv, Settings, RefreshCw, Radio, Play, Square, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CharacterList } from "@/components/dashboard/campaign-control/CharacterList";
import { CharacterControlPanel } from "@/components/dashboard/campaign-control/CharacterControlPanel";
import { useCampaignSync } from "@/hooks/useCampaignSync";
import { toast } from "sonner";

export default function CampaignControlPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaign, setCampaign] = useState<{ id: number; name: string; slug: string } | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  // Real-time sync with players via WebSocket
  const { isConnected, members } = useCampaignSync(campaign?.id || null, {
    onCharacterUpdated: (payload) => {
      // Update character in local state
      setCharacters((prev) =>
        prev.map((c) => (c.id === payload.character_id ? payload.character : c))
      );
      if (selectedCharacter?.id === payload.character_id) {
        setSelectedCharacter(payload.character);
      }
      // Show toast for player-initiated changes
      if (payload.update_type === "hp" || payload.update_type === "player_update") {
        const changes = payload.changes as { type?: string; amount?: number };
        const charName = payload.character.name;
        if (changes.type === "damage") {
          toast.info(`${charName}: -${changes.amount} HP`);
        } else if (changes.type === "healing") {
          toast.info(`${charName}: +${changes.amount} HP`);
        }
      }
    },
    onXPAwarded: (payload) => {
      // Update character XP in local state
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === payload.character_id
            ? { ...c, experience_points: payload.total_xp }
            : c
        )
      );
      if (selectedCharacter?.id === payload.character_id) {
        setSelectedCharacter((prev) =>
          prev ? { ...prev, experience_points: payload.total_xp } : null
        );
      }
    },
    onConditionChanged: (payload) => {
      // Update conditions in local state
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === payload.character_id
            ? { ...c, conditions: payload.all_conditions as Character["conditions"] }
            : c
        )
      );
      if (selectedCharacter?.id === payload.character_id) {
        setSelectedCharacter((prev) =>
          prev
            ? { ...prev, conditions: payload.all_conditions as Character["conditions"] }
            : null
        );
      }
    },
    onLevelUp: (payload) => {
      // Update character with new level
      setCharacters((prev) =>
        prev.map((c) => (c.id === payload.character_id ? payload.character : c))
      );
      if (selectedCharacter?.id === payload.character_id) {
        setSelectedCharacter(payload.character);
      }
      toast.success(`${payload.character_name} достиг уровня ${payload.new_level}!`);
    },
    onMemberJoined: (member) => {
      toast.info(`${member.name} присоединился к сессии`);
    },
    onMemberLeft: (member) => {
      toast.info(`${member.name} покинул сессию`);
    },
    onLiveSessionStarted: (payload) => {
      setLiveSession(payload.live_session);
      toast.success("Сессия запущена!");
    },
    onLiveSessionEnded: (payload) => {
      setLiveSession(null);
      toast.info(`Сессия завершена (${payload.duration_minutes || 0} мин)`);
    },
  });

  // Start live session
  const handleStartSession = useCallback(async () => {
    if (!campaign?.id) return;

    setIsSessionLoading(true);
    try {
      const response = await api.startLiveSession(campaign.id);
      setLiveSession(response.data);
      toast.success("Живая сессия запущена!");
    } catch (err) {
      console.error("Failed to start session:", err);
      toast.error("Не удалось запустить сессию");
    } finally {
      setIsSessionLoading(false);
    }
  }, [campaign?.id]);

  // Stop live session
  const handleStopSession = useCallback(async () => {
    if (!campaign?.id) return;

    setIsSessionLoading(true);
    try {
      await api.stopLiveSession(campaign.id);
      setLiveSession(null);
      toast.info("Сессия завершена");
    } catch (err) {
      console.error("Failed to stop session:", err);
      toast.error("Не удалось завершить сессию");
    } finally {
      setIsSessionLoading(false);
    }
  }, [campaign?.id]);

  // Fetch campaign characters
  const fetchCharacters = useCallback(async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch DM's campaigns and find by slug
      const campaignsResponse = await api.getCampaigns();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const foundCampaign = (campaignsResponse.data as any[]).find((c: any) => c.slug === slug);

      if (!foundCampaign) {
        setError("Кампания не найдена");
        setIsLoading(false);
        return;
      }

      setCampaign({
        id: foundCampaign.id,
        name: foundCampaign.name,
        slug: foundCampaign.slug,
      });

      // Fetch live session status
      try {
        const sessionResponse = await api.getLiveSessionStatus(foundCampaign.id);
        if (sessionResponse.data.has_active_session) {
          setLiveSession(sessionResponse.data.live_session);
        }
      } catch (sessionErr) {
        console.warn("Failed to fetch live session status:", sessionErr);
      }

      const response = await api.getCampaignCharacters(foundCampaign.id);
      const allCharacters = response.data.characters;

      // Filter to only active characters for control panel
      const activeCharacters = allCharacters.filter(c => c.is_active && c.is_alive);
      setCharacters(activeCharacters);

      // Auto-select first character if none selected
      if (activeCharacters.length > 0 && !selectedCharacter) {
        setSelectedCharacter(activeCharacters[0]);
      }
    } catch (err) {
      console.error("Failed to fetch characters:", err);
      setError("Не удалось загрузить персонажей");
    } finally {
      setIsLoading(false);
    }
  }, [slug, selectedCharacter]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // Update character in local state after API changes
  const handleCharacterUpdate = useCallback((updatedCharacter: Character) => {
    setCharacters(prev =>
      prev.map(c => c.id === updatedCharacter.id ? updatedCharacter : c)
    );
    if (selectedCharacter?.id === updatedCharacter.id) {
      setSelectedCharacter(updatedCharacter);
    }
  }, [selectedCharacter]);

  // Select a character
  const handleSelectCharacter = useCallback((character: Character) => {
    setSelectedCharacter(character);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="text-zinc-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-400">{error}</p>
          <Button onClick={fetchCharacters} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/campaign/${slug}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-zinc-100">
                {campaign?.name || "Кампания"}
              </h1>
              {isConnected ? (
                <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400 text-xs">
                  <Radio className="mr-1 h-3 w-3 animate-pulse" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-zinc-700/50 border-zinc-600 text-zinc-400 text-xs">
                  Offline
                </Badge>
              )}
            </div>
            <p className="text-sm text-zinc-500">
              Центр управления
              {members.length > 0 && ` · ${members.length} онлайн`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Session Control */}
          {liveSession ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-md">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-400 font-medium">
                  Сессия активна
                </span>
                {liveSession.started_at && (
                  <span className="text-xs text-green-400/70 ml-1">
                    <Clock className="inline h-3 w-3 mr-0.5" />
                    {liveSession.duration_minutes || 0} мин
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopSession}
                disabled={isSessionLoading}
                className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              >
                <Square className="mr-2 h-4 w-4" />
                Завершить
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartSession}
              disabled={isSessionLoading}
              className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:text-green-300"
            >
              <Play className="mr-2 h-4 w-4" />
              Начать сессию
            </Button>
          )}

          <Link href="/dashboard/display-control">
            <Button variant="outline" size="sm" className="hidden sm:flex bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              <Tv className="mr-2 h-4 w-4" />
              Display
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content - Split panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Character list */}
        <div className={cn(
          "w-full sm:w-80 lg:w-96 border-r border-zinc-800 bg-zinc-950",
          "flex flex-col overflow-hidden",
          selectedCharacter && "hidden sm:flex"
        )}>
          <CharacterList
            characters={characters}
            selectedCharacter={selectedCharacter}
            onSelectCharacter={handleSelectCharacter}
            campaignId={campaign?.id || 0}
            onRefresh={fetchCharacters}
          />
        </div>

        {/* Right panel - Character control */}
        <div className={cn(
          "flex-1 bg-zinc-900/50 overflow-hidden",
          !selectedCharacter && "hidden sm:flex sm:items-center sm:justify-center"
        )}>
          {selectedCharacter ? (
            <CharacterControlPanel
              character={selectedCharacter}
              campaignId={campaign?.id || 0}
              onCharacterUpdate={handleCharacterUpdate}
              onBack={() => setSelectedCharacter(null)}
            />
          ) : (
            <div className="text-center text-zinc-500">
              <p>Выберите персонажа для управления</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
