"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import type { CharacterClassBackoffice, SettingOption } from "@/types/backoffice";
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
  Swords,
  Heart,
  Sparkles,
  Shield,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Loader2,
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

// Ability names in Russian
const abilityNames: Record<string, string> = {
  strength: "Сила",
  dexterity: "Ловкость",
  constitution: "Телосложение",
  intelligence: "Интеллект",
  wisdom: "Мудрость",
  charisma: "Харизма",
};

// Hit die color coding
const hitDieColors: Record<string, string> = {
  d6: "text-red-400",
  d8: "text-yellow-400",
  d10: "text-green-400",
  d12: "text-emerald-400",
};

export default function ClassesPage() {
  const [classes, setClasses] = useState<CharacterClassBackoffice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CharacterClassBackoffice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const params: Record<string, string> = {};
        if (search) {
          params.search = search;
        }
        const response = await api.getClasses(params);
        setClasses(response.data.classes);
        setError(null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить список классов");
        }
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchClasses, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  // Delete class
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await api.deleteClass(deleteTarget.id);
      setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Класс удалён");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось удалить класс");
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Классы персонажей</h1>
          <p className="text-zinc-400">
            Управление классами D&D: воины, волшебники, плуты и другие
          </p>
        </div>

        <Link href="/dashboard/classes/new">
          <Button className="hidden sm:flex bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Создать класс
          </Button>
        </Link>

        {/* Mobile FAB */}
        <Link href="/dashboard/classes/new" className="sm:hidden fixed z-50 bottom-6 right-6">
          <Button className="h-14 w-14 rounded-full p-0 bg-primary hover:bg-primary/90 shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
        />
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
      {!isLoading && classes.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center">
            <Swords className="mx-auto mb-4 h-16 w-16 text-zinc-700" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">
              {search ? "Ничего не найдено" : "Нет классов"}
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
              {search
                ? "Попробуйте изменить поисковый запрос"
                : "Создайте первый класс для вашей игры"}
            </p>
            {!search && (
              <Link href="/dashboard/classes/new">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Создать класс
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Classes grid */}
      {!isLoading && classes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="group bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-zinc-100 line-clamp-1 flex items-center gap-2">
                      {cls.name}
                      {cls.is_spellcaster && (
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-zinc-500 line-clamp-1">
                      {cls.slug}
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
                      <Link href={`/dashboard/classes/${cls.id}`}>
                        <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          Просмотр
                        </DropdownMenuItem>
                      </Link>
                      <Link href={`/dashboard/classes/${cls.id}/edit`}>
                        <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" />
                          Редактировать
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="bg-zinc-700" />
                      <DropdownMenuItem
                        className="hover:bg-white/10 cursor-pointer text-red-400 focus:text-red-400"
                        onClick={() => setDeleteTarget(cls)}
                        disabled={cls.is_system}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cls.description && (
                  <p className="line-clamp-2 text-sm text-zinc-400">
                    {cls.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Heart className={`h-4 w-4 ${hitDieColors[cls.hit_die] || "text-zinc-400"}`} />
                    <span className="text-zinc-300">{cls.hit_die}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-400">
                      {cls.armor_proficiencies.length > 0
                        ? cls.armor_proficiencies.includes("heavy")
                          ? "Тяжёлые"
                          : cls.armor_proficiencies.includes("medium")
                            ? "Средние"
                            : "Лёгкие"
                        : "Нет"}
                    </span>
                  </div>
                </div>

                {/* Primary abilities */}
                <div className="flex flex-wrap gap-1.5">
                  {cls.primary_abilities.map((ability) => (
                    <Badge
                      key={ability}
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-300 text-xs"
                    >
                      {abilityNames[ability] || ability}
                    </Badge>
                  ))}
                </div>

                {/* System badge */}
                {cls.is_system && (
                  <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
                    Системный
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
              Удалить класс?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Вы уверены, что хотите удалить класс "{deleteTarget?.name}"?
              Это действие нельзя отменить.
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
