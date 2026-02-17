"use client";

import { useState } from "react";
import type { Character } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Star, Users, ChevronDown, ChevronUp, FlaskConical } from "lucide-react";
import { CharacterCard } from "./CharacterCard";
import { XpAwardModal } from "./XpAwardModal";

interface CharacterListProps {
  characters: Character[];
  inactiveCharacters?: Character[];
  selectedCharacter: Character | null;
  onSelectCharacter: (character: Character) => void;
  campaignId: number;
  onRefresh: () => void;
}

export function CharacterList({
  characters,
  inactiveCharacters = [],
  selectedCharacter,
  onSelectCharacter,
  campaignId,
  onRefresh,
}: CharacterListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isXpModalOpen, setIsXpModalOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  // Filter characters by search query
  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInactiveCharacters = inactiveCharacters.filter(character =>
    character.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header with search */}
        <div className="p-4 space-y-3 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-zinc-400" />
              <h2 className="font-semibold text-zinc-100">Персонажи</h2>
              <span className="text-sm text-zinc-500">({characters.length})</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
              onClick={onRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Character list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {/* Active characters */}
            {filteredCharacters.length === 0 && filteredInactiveCharacters.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
                <p className="text-sm text-zinc-500">
                  {searchQuery
                    ? "Персонажи не найдены"
                    : "Нет персонажей"}
                </p>
              </div>
            ) : (
              <>
                {filteredCharacters.map((character) => (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    isSelected={selectedCharacter?.id === character.id}
                    onSelect={() => onSelectCharacter(character)}
                  />
                ))}

                {/* Inactive characters section */}
                {filteredInactiveCharacters.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowInactive(!showInactive)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-zinc-300">
                          Эксперименты
                        </span>
                        <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-400">
                          {filteredInactiveCharacters.length}
                        </Badge>
                      </div>
                      {showInactive ? (
                        <ChevronUp className="h-4 w-4 text-zinc-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-zinc-500" />
                      )}
                    </button>

                    {showInactive && (
                      <div className="mt-2 space-y-2 pl-2 border-l-2 border-purple-500/30">
                        <p className="text-xs text-zinc-500 px-2 py-1">
                          Неактивные персонажи для тестирования билдов
                        </p>
                        {filteredInactiveCharacters.map((character) => (
                          <CharacterCard
                            key={character.id}
                            character={character}
                            isSelected={selectedCharacter?.id === character.id}
                            onSelect={() => onSelectCharacter(character)}
                            variant="inactive"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer with XP button */}
        <div className="p-3 border-t border-zinc-800">
          <Button
            variant="outline"
            className="w-full bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
            onClick={() => setIsXpModalOpen(true)}
          >
            <Star className="mr-2 h-4 w-4" />
            Выдать XP всем
          </Button>
        </div>
      </div>

      {/* XP Award Modal */}
      <XpAwardModal
        open={isXpModalOpen}
        onOpenChange={setIsXpModalOpen}
        campaignId={campaignId}
        characters={characters}
        onSuccess={onRefresh}
      />
    </>
  );
}
