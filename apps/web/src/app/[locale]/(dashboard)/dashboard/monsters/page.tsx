"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import type { MonsterBackoffice } from "@/types/backoffice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DataTable, SortingState, PaginationMeta } from "@/components/ui/data-table";
import { createColumns } from "./columns";
import { Plus, Search, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Monster type names in Russian
const typeNames: Record<string, string> = {
  aberration: "Аберрация",
  beast: "Зверь",
  celestial: "Небожитель",
  construct: "Конструкт",
  dragon: "Дракон",
  elemental: "Элементаль",
  fey: "Фея",
  fiend: "Исчадие",
  giant: "Великан",
  humanoid: "Гуманоид",
  monstrosity: "Монстр",
  ooze: "Слизь",
  plant: "Растение",
  undead: "Нежить",
};

export default function MonstersPage() {
  const [monsters, setMonsters] = useState<MonsterBackoffice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [crFilter, setCrFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "challenge_rating", desc: false },
  ]);
  const [deleteTarget, setDeleteTarget] = useState<MonsterBackoffice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0,
  });

  // Create columns with delete handler
  const columns = useMemo(
    () => createColumns({ onDelete: setDeleteTarget }),
    []
  );

  // Fetch monsters
  const fetchMonsters = useCallback(async (page = pagination.currentPage, perPage = pagination.perPage) => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
      };
      if (search) {
        params.search = search;
      }
      if (typeFilter !== "all") {
        params.type = typeFilter;
      }
      if (crFilter !== "all") {
        const [min, max] = crFilter.split("-");
        if (min) params.cr_min = min;
        if (max) params.cr_max = max;
      }
      // Add sorting
      if (sorting.length > 0) {
        params.sort = sorting[0].id;
        params.dir = sorting[0].desc ? "desc" : "asc";
      }
      const response = await api.getMonsters(params);
      setMonsters(response.data.monsters);
      if (response.meta) {
        setPagination({
          currentPage: response.meta.current_page as number,
          lastPage: response.meta.last_page as number,
          perPage: response.meta.per_page as number,
          total: response.meta.total as number,
        });
      }
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Не удалось загрузить список монстров");
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, typeFilter, crFilter, sorting, pagination.currentPage, pagination.perPage]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      void fetchMonsters(1, pagination.perPage);
    }, 300);
    return () => clearTimeout(debounce);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, crFilter, sorting]);

  // Handle sorting change
  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
  };

  const handlePageChange = (page: number) => {
    void fetchMonsters(page, pagination.perPage);
  };

  const handlePerPageChange = (perPage: number) => {
    void fetchMonsters(1, perPage);
  };

  // Delete monster
  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await api.deleteMonster(deleteTarget.id);
      setMonsters((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast.success("Монстр удалён");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось удалить монстра");
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
          <h1 className="text-2xl font-bold text-zinc-100">Бестиарий</h1>
          <p className="text-zinc-400">
            Управление монстрами: от гоблинов до драконов
          </p>
        </div>

        <Link href="/dashboard/monsters/new">
          <Button className="hidden sm:flex bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Создать монстра
          </Button>
        </Link>

        {/* Mobile FAB */}
        <Link href="/dashboard/monsters/new" className="sm:hidden fixed z-50 bottom-6 right-6">
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

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-100">
            <SelectValue placeholder="Тип существа" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">Все типы</SelectItem>
            {Object.entries(typeNames).map(([key, name]) => (
              <SelectItem key={key} value={key} className="text-zinc-100">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={crFilter} onValueChange={setCrFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-100">
            <SelectValue placeholder="Опасность" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">Любая ОП</SelectItem>
            <SelectItem value="0-0.5" className="text-zinc-100">ОП 0 - 1/2</SelectItem>
            <SelectItem value="1-4" className="text-zinc-100">ОП 1 - 4</SelectItem>
            <SelectItem value="5-10" className="text-zinc-100">ОП 5 - 10</SelectItem>
            <SelectItem value="11-17" className="text-zinc-100">ОП 11 - 17</SelectItem>
            <SelectItem value="18-30" className="text-zinc-100">ОП 18+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={monsters}
        isLoading={isLoading}
        emptyMessage={
          search || typeFilter !== "all" || crFilter !== "all"
            ? "Ничего не найдено. Попробуйте изменить параметры поиска."
            : "Нет монстров. Создайте первого монстра для бестиария."
        }
        sorting={sorting}
        onSortingChange={handleSortingChange}
        manualSorting
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Удалить монстра?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Вы уверены, что хотите удалить монстра &quot;{deleteTarget?.name}&quot;?
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
