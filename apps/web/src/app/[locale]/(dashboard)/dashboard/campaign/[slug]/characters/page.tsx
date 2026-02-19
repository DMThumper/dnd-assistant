"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Campaign, CharacterWithRelations } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Skull,
  UserCheck,
  UserX,
  Loader2,
  CheckCircle,
  Circle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type CharacterFilter = "all" | "active" | "inactive" | "dead";

interface KillDialogState {
  open: boolean;
  character: CharacterWithRelations | null;
  killedBy: string;
  killingBlow: string;
  lastWords: string;
}

export default function CampaignCharactersPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [characters, setCharacters] = useState<CharacterWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CharacterFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [killDialog, setKillDialog] = useState<KillDialogState>({
    open: false,
    character: null,
    killedBy: "",
    killingBlow: "",
    lastWords: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Get campaign first
      const campaignsResponse = await api.getCampaigns();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const campaignData = (campaignsResponse.data as any[]).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.slug === slug
      );

      if (!campaignData) {
        setError("Кампания не найдена");
        return;
      }

      setCampaign(campaignData);

      // Load all characters
      const charactersResponse = await api.getCampaignCharacters(campaignData.id);
      setCharacters(charactersResponse.data.characters);
    } catch {
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleActivate = async (character: CharacterWithRelations) => {
    if (!campaign) return;
    setActionLoading(character.id);
    try {
      const response = await api.activateCharacterDM(campaign.id, character.id);
      // Update character in list
      setCharacters((prev) =>
        prev.map((c) => {
          if (c.id === character.id) return response.data.character;
          // Deactivate other characters of the same owner
          if (c.owner?.id === character.owner?.id && c.is_active) {
            return { ...c, is_active: false };
          }
          return c;
        })
      );
      toast.success(`${character.name} активирован`);
    } catch {
      toast.error("Не удалось активировать персонажа");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (character: CharacterWithRelations) => {
    if (!campaign) return;
    setActionLoading(character.id);
    try {
      const response = await api.deactivateCharacter(campaign.id, character.id);
      setCharacters((prev) =>
        prev.map((c) => (c.id === character.id ? response.data.character : c))
      );
      toast.success(`${character.name} деактивирован`);
    } catch {
      toast.error("Не удалось деактивировать персонажа");
    } finally {
      setActionLoading(null);
    }
  };

  const openKillDialog = (character: CharacterWithRelations) => {
    setKillDialog({
      open: true,
      character,
      killedBy: "",
      killingBlow: "",
      lastWords: "",
    });
  };

  const handleKill = async () => {
    if (!campaign || !killDialog.character) return;
    if (!killDialog.killedBy.trim()) {
      toast.error("Укажите, кто/что убил персонажа");
      return;
    }

    setActionLoading(killDialog.character.id);
    try {
      const response = await api.killCharacter(campaign.id, killDialog.character.id, {
        killed_by: killDialog.killedBy,
        killing_blow: killDialog.killingBlow || undefined,
        cause: "combat",
        last_words: killDialog.lastWords || undefined,
      });
      setCharacters((prev) =>
        prev.map((c) => (c.id === killDialog.character!.id ? response.data.character : c))
      );
      toast.success(`${killDialog.character.name} погиб`);
      setKillDialog({ open: false, character: null, killedBy: "", killingBlow: "", lastWords: "" });
    } catch {
      toast.error("Не удалось выполнить действие");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter characters
  const filteredCharacters = characters.filter((c) => {
    // Apply status filter
    if (filter === "active" && !c.is_active) return false;
    if (filter === "inactive" && (c.is_active || !c.is_alive)) return false;
    if (filter === "dead" && c.is_alive) return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = c.name.toLowerCase();
      const ownerName = c.owner?.name?.toLowerCase() || "";
      const raceName = c.race?.name?.toLowerCase() || "";
      const className = c.character_class?.name?.toLowerCase() || "";
      return (
        name.includes(query) ||
        ownerName.includes(query) ||
        raceName.includes(query) ||
        className.includes(query)
      );
    }
    return true;
  });

  // Count by status
  const counts = {
    all: characters.length,
    active: characters.filter((c) => c.is_active && c.is_alive).length,
    inactive: characters.filter((c) => !c.is_active && c.is_alive).length,
    dead: characters.filter((c) => !c.is_alive).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-6">
        <div className="text-destructive">{error || "Кампания не найдена"}</div>
        <Link href="/dashboard/campaigns">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            К списку кампаний
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/campaign/${slug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Персонажи</h1>
            <p className="text-muted-foreground">{campaign.name}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as CharacterFilter)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Все ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="active">
              Активные ({counts.active})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Неактивные ({counts.inactive})
            </TabsTrigger>
            <TabsTrigger value="dead">
              Кладбище ({counts.dead})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, игроку..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Characters List */}
      {filter === "dead" ? (
        // Graveyard view
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCharacters.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                Кладбище пусто
              </CardContent>
            </Card>
          ) : (
            filteredCharacters.map((character) => (
              <GraveyardCard key={character.id} character={character} />
            ))
          )}
        </div>
      ) : (
        // Table view
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Имя</th>
                    <th className="text-left p-4 font-medium">Игрок</th>
                    <th className="text-left p-4 font-medium">Раса/Класс</th>
                    <th className="text-center p-4 font-medium">Уровень</th>
                    <th className="text-center p-4 font-medium">Статус</th>
                    <th className="text-right p-4 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCharacters.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        Персонажи не найдены
                      </td>
                    </tr>
                  ) : (
                    filteredCharacters.map((character) => (
                      <CharacterRow
                        key={character.id}
                        character={character}
                        isLoading={actionLoading === character.id}
                        onActivate={() => handleActivate(character)}
                        onDeactivate={() => handleDeactivate(character)}
                        onKill={() => openKillDialog(character)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kill Character Dialog */}
      <AlertDialog
        open={killDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setKillDialog({ open: false, character: null, killedBy: "", killingBlow: "", lastWords: "" });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Skull className="h-5 w-5" />
              Убить персонажа
            </AlertDialogTitle>
            <AlertDialogDescription>
              Персонаж <span className="font-semibold">{killDialog.character?.name}</span> будет помечен как мёртвый
              и перемещён в кладбище.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="killed_by">Убит кем/чем *</Label>
              <Input
                id="killed_by"
                placeholder="Гоблин-вожак, ловушка с копьями..."
                value={killDialog.killedBy}
                onChange={(e) => setKillDialog((prev) => ({ ...prev, killedBy: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="killing_blow">Смертельный удар</Label>
              <Input
                id="killing_blow"
                placeholder="12 урона рубящего, яд..."
                value={killDialog.killingBlow}
                onChange={(e) => setKillDialog((prev) => ({ ...prev, killingBlow: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_words">Последние слова</Label>
              <Textarea
                id="last_words"
                placeholder="За Морию!..."
                value={killDialog.lastWords}
                onChange={(e) => setKillDialog((prev) => ({ ...prev, lastWords: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleKill();
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={actionLoading !== null}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Skull className="h-4 w-4 mr-2" />
              )}
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Character row component
interface CharacterRowProps {
  character: CharacterWithRelations;
  isLoading: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onKill: () => void;
}

function CharacterRow({
  character,
  isLoading,
  onActivate,
  onDeactivate,
  onKill,
}: CharacterRowProps) {
  const raceName = character.race?.name || "—";
  const className = character.character_class?.name || "—";

  return (
    <tr className="border-b hover:bg-muted/25 transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          {!character.is_alive && <Skull className="h-4 w-4 text-destructive" />}
          <span className="font-medium">{character.name}</span>
        </div>
      </td>
      <td className="p-4 text-muted-foreground">
        {character.owner?.name || "—"}
      </td>
      <td className="p-4 text-muted-foreground">
        {raceName} / {className}
      </td>
      <td className="p-4 text-center">
        <Badge variant="outline">{character.level}</Badge>
      </td>
      <td className="p-4 text-center">
        <CharacterStatusBadge character={character} />
      </td>
      <td className="p-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {character.is_alive && (
              <>
                {character.is_active ? (
                  <DropdownMenuItem onClick={onDeactivate}>
                    <UserX className="h-4 w-4 mr-2" />
                    Деактивировать
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={onActivate}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Активировать
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onKill} className="text-destructive">
                  <Skull className="h-4 w-4 mr-2" />
                  Убить персонажа
                </DropdownMenuItem>
              </>
            )}
            {!character.is_alive && (
              <DropdownMenuItem disabled>
                <Skull className="h-4 w-4 mr-2" />
                Персонаж мёртв
              </DropdownMenuItem>
            )}
            {character.can_be_deleted && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// Status badge component
function CharacterStatusBadge({ character }: { character: CharacterWithRelations }) {
  if (!character.is_alive) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Skull className="h-3 w-3" />
        Погиб
      </Badge>
    );
  }

  if (character.is_active) {
    return (
      <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
        <CheckCircle className="h-3 w-3" />
        Активен
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Circle className="h-3 w-3" />
      Неактивен
    </Badge>
  );
}

// Graveyard card component
function GraveyardCard({ character }: { character: CharacterWithRelations }) {
  const deathInfo = character.death_info;
  const stats = character.stats;

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Skull className="h-5 w-5 text-destructive" />
          {character.name}
        </CardTitle>
        <CardDescription>
          {character.race?.name} / {character.character_class?.name} / Уровень {character.level}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {deathInfo && (
          <>
            <div className="text-sm">
              <span className="text-muted-foreground">Убит: </span>
              <span className="text-destructive font-medium">{deathInfo.killed_by}</span>
            </div>
            {deathInfo.killing_blow && (
              <div className="text-sm">
                <span className="text-muted-foreground">Удар: </span>
                <span>{deathInfo.killing_blow}</span>
              </div>
            )}
            {deathInfo.last_words && (
              <div className="text-sm italic text-muted-foreground">
                &quot;{deathInfo.last_words}&quot;
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Сессия #{deathInfo.session_number} / {deathInfo.death_date}
            </div>
          </>
        )}

        {stats && (
          <div className="pt-2 border-t border-destructive/20">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {stats.sessions_played !== undefined && (
                <div>Сессий: {stats.sessions_played}</div>
              )}
              {stats.monsters_killed !== undefined && (
                <div>Убил: {stats.monsters_killed}</div>
              )}
              {stats.damage_dealt !== undefined && (
                <div>Урон: {stats.damage_dealt}</div>
              )}
              {stats.critical_hits !== undefined && (
                <div>Критов: {stats.critical_hits}</div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Игрок: {character.owner?.name || "—"}
        </div>
      </CardContent>
    </Card>
  );
}
