"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Users, Crown, User } from "lucide-react";
import type { PresenceMember } from "@/hooks/useCampaignSync";

interface OnlinePlayersIndicatorProps {
  members: PresenceMember[];
  isConnected: boolean;
  className?: string;
}

export function OnlinePlayersIndicator({
  members,
  isConnected,
  className,
}: OnlinePlayersIndicatorProps) {
  if (!isConnected) {
    return (
      <Badge variant="outline" className="bg-zinc-700/50 border-zinc-600 text-zinc-400 text-xs">
        Offline
      </Badge>
    );
  }

  // Separate DM and players
  const dm = members.find((m) => m.role === "dm");
  const players = members.filter((m) => m.role === "player");

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Show compact view with avatars for up to 4 players
  const maxVisible = 4;
  const visiblePlayers = players.slice(0, maxVisible);
  const hiddenCount = players.length - maxVisible;

  return (
    <TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors",
              "bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50",
              className
            )}
          >
            <Users className="h-4 w-4 text-zinc-400" />
            <div className="flex -space-x-2">
              {visiblePlayers.map((player) => (
                <Tooltip key={player.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-6 w-6 border-2 border-zinc-800">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{player.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {hiddenCount > 0 && (
                <Avatar className="h-6 w-6 border-2 border-zinc-800">
                  <AvatarFallback className="bg-zinc-700 text-zinc-300 text-xs">
                    +{hiddenCount}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <span className="text-sm text-zinc-400">
              {players.length}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-0 bg-zinc-900 border-zinc-800"
          align="end"
        >
          <div className="p-3 border-b border-zinc-800">
            <h4 className="font-medium text-zinc-100">Онлайн участники</h4>
            <p className="text-xs text-zinc-500">{members.length} подключено</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {/* DM */}
            {dm && (
              <div className="flex items-center gap-3 px-3 py-2 border-b border-zinc-800/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-amber-500/20 text-amber-400 text-sm">
                    {getInitials(dm.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {dm.name}
                  </p>
                  <p className="text-xs text-amber-400 flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Мастер
                  </p>
                </div>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            )}
            {/* Players */}
            {players.length > 0 ? (
              players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-800/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {getInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">
                      {player.name}
                    </p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Игрок
                    </p>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-zinc-500">
                Игроки ещё не подключились
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
