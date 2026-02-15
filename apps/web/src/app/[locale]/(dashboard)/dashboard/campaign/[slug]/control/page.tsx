"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Character, Campaign } from "@/types/game";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tv, Settings, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CharacterList } from "@/components/dashboard/campaign-control/CharacterList";
import { CharacterControlPanel } from "@/components/dashboard/campaign-control/CharacterControlPanel";

export default function CampaignControlPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaign, setCampaign] = useState<{ id: number; name: string; slug: string } | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaign characters
  const fetchCharacters = useCallback(async () => {
    if (!slug) return;

    setIsLoading(true);
    setError(null);

    try {
      // First we need to get campaign ID from slug
      // For now, we'll use a workaround - fetch player campaigns and find by slug
      const campaignsResponse = await api.getPlayerCampaigns();
      const foundCampaign = campaignsResponse.data.campaigns.find(c => c.slug === slug);

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
            <h1 className="text-lg font-semibold text-zinc-100">
              {campaign?.name || "Кампания"}
            </h1>
            <p className="text-sm text-zinc-500">Центр управления</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
