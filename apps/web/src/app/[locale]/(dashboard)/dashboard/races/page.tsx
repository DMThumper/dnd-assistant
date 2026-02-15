"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import type { RaceBackoffice } from "@/types/backoffice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Users,
  Footprints,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  GitBranch,
} from "lucide-react";
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
import { toast } from "sonner";

// Size names in Russian
const sizeNames: Record<string, string> = {
  tiny: "Крошечный",
  small: "Маленький",
  medium: "Средний",
  large: "Большой",
  huge: "Огромный",
  gargantuan: "Исполинский",
};

// Ability names in Russian
const abilityNames: Record<string, string> = {
  strength: "СИЛ",
  dexterity: "ЛОВ",
  constitution: "ТЕЛ",
  intelligence: "ИНТ",
  wisdom: "МДР",
  charisma: "ХАР",
};

export default function RacesPage() {
  const [races, setRaces] = useState<RaceBackoffice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSubraces, setShowSubraces] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RaceBackoffice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch races
  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setIsLoading(true);
        const params: Record<string, string> = {};
        if (search) {
          params.search = search;
        }
        if (!showSubraces) {
          params.main_only = "true";
        }
        const response = await api.getRaces(params);
        setRaces(response.data.races);
        setError(null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить список рас");
        }
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchRaces, 300);
    return () => clearTimeout(debounce);
  }, [search, showSubraces]);

  // Delete race
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await api.deleteRace(deleteTarget.id);
      setRaces((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success("Раса удалена");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось удалить расу");
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Format ability bonuses
  const formatAbilityBonuses = (bonuses: RaceBackoffice["ability_bonuses"]) => {
    const result: string[] = [];

    for (const [ability, value] of Object.entries(bonuses)) {
      if (ability === "choice") continue;
      if (typeof value === "number" && value !== 0) {
        const sign = value > 0 ? "+" : "";
        result.push(`${sign}${value} ${abilityNames[ability] || ability}`);
      }
    }

    if (bonuses.choice) {
      result.push(`+${bonuses.choice.amount} к ${bonuses.choice.count} характ.`);
    }

    return result;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Расы</h1>
          <p className="text-zinc-400">
            Управление расами: люди, эльфы, дварфы и другие народы
          </p>
        </div>

        <Link href="/dashboard/races/new">
          <Button className="hidden sm:flex bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Создать расу
          </Button>
        </Link>

        {/* Mobile FAB */}
        <Link href="/dashboard/races/new" className="sm:hidden fixed z-50 bottom-6 right-6">
          <Button className="h-14 w-14 rounded-full p-0 bg-primary hover:bg-primary/90 shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        <Button
          variant={showSubraces ? "default" : "outline"}
          onClick={() => setShowSubraces(!showSubraces)}
          className={showSubraces
            ? "bg-primary hover:bg-primary/90"
            : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          }
        >
          <GitBranch className="mr-2 h-4 w-4" />
          Показать подрасы
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && races.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center">
            <Users className="mx-auto mb-4 h-16 w-16 text-zinc-700" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">
              {search ? "Ничего не найдено" : "Нет рас"}
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
              {search
                ? "Попробуйте изменить поисковый запрос"
                : "Создайте первую расу для вашей игры"}
            </p>
            {!search && (
              <Link href="/dashboard/races/new">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Создать расу
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Races grid */}
      {!isLoading && races.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <Card
              key={race.id}
              className="group bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-zinc-100 line-clamp-1 flex items-center gap-2">
                      {race.name}
                      {race.is_subrace && (
                        <GitBranch className="h-4 w-4 text-blue-400" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 line-clamp-1">
                      {race.slug}
                      {race.parent_slug && (
                        <span className="ml-1">({race.parent_slug})</span>
                      )}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-zinc-300"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100"
                    >
                      <Link href={`/dashboard/races/${race.id}`}>
                        <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          Просмотр
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/dashboard/races/${race.id}/edit`}>
                        <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" />
                          Редактировать
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="bg-zinc-700" />
                      <DropdownMenuItem
                        className="hover:bg-white/10 cursor-pointer text-red-400 focus:text-red-400"
                        onClick={() => setDeleteTarget(race)}
                        disabled={race.is_system}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {race.description && (
                  <p className="line-clamp-2 text-sm text-zinc-400">
                    {race.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    {sizeNames[race.size] || race.size}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <Footprints className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-400">{race.speed.walk} м</span>
                  </div>
                </div>

                {/* Ability bonuses */}
                <div className="flex flex-wrap gap-1.5">
                  {formatAbilityBonuses(race.ability_bonuses).map((bonus, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-300 text-xs"
                    >
                      {bonus}
                    </Badge>
                  ))}
                </div>

                {/* Traits count */}
                {race.traits.length > 0 && (
                  <p className="text-xs text-zinc-500">
                    {race.traits.length} {race.traits.length === 1 ? "особенность" :
                      race.traits.length < 5 ? "особенности" : "особенностей"}
                  </p>
                )}

                {/* System badge */}
                {race.is_system && (
                  <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                    Системная
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Удалить расу?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Вы уверены, что хотите удалить расу "{deleteTarget?.name}"?
              Это действие нельзя отменить.
              {deleteTarget?.is_subrace === false && (
                <span className="block mt-2 text-amber-400">
                  Убедитесь, что у этой расы нет подрас перед удалением.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
