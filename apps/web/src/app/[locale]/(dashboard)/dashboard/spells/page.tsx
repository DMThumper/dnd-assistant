"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import type { SpellBackoffice } from "@/types/backoffice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, PaginationMeta } from "@/components/ui/data-table";
import { createColumns } from "./columns";
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
import { Plus, Search, BookOpen, Loader2 } from "lucide-react";
import { SortingState } from "@tanstack/react-table";

// School names in Russian
const schoolNames: Record<string, string> = {
  abjuration: "Ограждение",
  conjuration: "Вызов",
  divination: "Прорицание",
  enchantment: "Очарование",
  evocation: "Воплощение",
  illusion: "Иллюзия",
  necromancy: "Некромантия",
  transmutation: "Преобразование",
};

// Class names in Russian
const classNames: Record<string, string> = {
  wizard: "Волшебник",
  sorcerer: "Чародей",
  cleric: "Жрец",
  druid: "Друид",
  bard: "Бард",
  paladin: "Паладин",
  ranger: "Следопыт",
  warlock: "Колдун",
  artificer: "Изобретатель",
};

export default function SpellsPage() {
  const [spells, setSpells] = useState<SpellBackoffice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [schools, setSchools] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [deleteSpell, setDeleteSpell] = useState<SpellBackoffice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "level", desc: false }]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0,
  });

  const fetchSpells = useCallback(async (page = pagination.currentPage, perPage = pagination.perPage) => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {
        page: String(page),
        per_page: String(perPage),
      };

      if (search) params.search = search;
      if (levelFilter !== "all") params.level = levelFilter;
      if (schoolFilter !== "all") params.school = schoolFilter;
      if (classFilter !== "all") params.class = classFilter;

      // Add sorting
      if (sorting.length > 0) {
        params.sort = sorting[0].id;
        params.dir = sorting[0].desc ? "desc" : "asc";
      }

      const response = await api.getSpells(params);
      setSpells(response.data.spells);
      if (response.meta) {
        setPagination({
          currentPage: response.meta.current_page as number,
          lastPage: response.meta.last_page as number,
          perPage: response.meta.per_page as number,
          total: response.meta.total as number,
        });
      }
    } catch (error) {
      console.error("Failed to fetch spells:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, levelFilter, schoolFilter, classFilter, sorting, pagination.currentPage, pagination.perPage]);

  const fetchFilters = useCallback(async () => {
    try {
      const [schoolsRes, classesRes] = await Promise.all([
        api.getSpellSchools(),
        api.getSpellClasses(),
      ]);
      setSchools(schoolsRes.data.schools);
      setClasses(classesRes.data.classes);
    } catch (error) {
      console.error("Failed to fetch filters:", error);
    }
  }, []);

  useEffect(() => {
    void fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      void fetchSpells(1, pagination.perPage);
    }, 300);
    return () => clearTimeout(debounce);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, levelFilter, schoolFilter, classFilter, sorting]);

  const handleDelete = async () => {
    if (!deleteSpell) return;

    try {
      setIsDeleting(true);
      await api.deleteSpell(deleteSpell.id);
      setSpells(spells.filter((s) => s.id !== deleteSpell.id));
      setDeleteSpell(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        alert(error.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    void fetchSpells(page, pagination.perPage);
  };

  const handlePerPageChange = (perPage: number) => {
    void fetchSpells(1, perPage);
  };

  const columns = createColumns({
    onDelete: (spell) => setDeleteSpell(spell),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Заклинания</h1>
            <p className="text-zinc-400">Справочник заклинаний</p>
          </div>
        </div>
        <Link href="/dashboard/spells/new">
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Добавить заклинание
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[150px] bg-zinc-800/50 border-zinc-700 text-zinc-100">
            <SelectValue placeholder="Уровень" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">Все уровни</SelectItem>
            <SelectItem value="0" className="text-zinc-100">Заговор</SelectItem>
            <SelectItem value="1" className="text-zinc-100">1 уровень</SelectItem>
            <SelectItem value="2" className="text-zinc-100">2 уровень</SelectItem>
            <SelectItem value="3" className="text-zinc-100">3 уровень</SelectItem>
            <SelectItem value="4" className="text-zinc-100">4 уровень</SelectItem>
            <SelectItem value="5" className="text-zinc-100">5 уровень</SelectItem>
            <SelectItem value="6" className="text-zinc-100">6 уровень</SelectItem>
            <SelectItem value="7" className="text-zinc-100">7 уровень</SelectItem>
            <SelectItem value="8" className="text-zinc-100">8 уровень</SelectItem>
            <SelectItem value="9" className="text-zinc-100">9 уровень</SelectItem>
          </SelectContent>
        </Select>

        <Select value={schoolFilter} onValueChange={setSchoolFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-800/50 border-zinc-700 text-zinc-100">
            <SelectValue placeholder="Школа" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">Все школы</SelectItem>
            {schools.map((school) => (
              <SelectItem key={school} value={school} className="text-zinc-100">
                {schoolNames[school] || school}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[180px] bg-zinc-800/50 border-zinc-700 text-zinc-100">
            <SelectValue placeholder="Класс" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="all" className="text-zinc-100">Все классы</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls} value={cls} className="text-zinc-100">
                {classNames[cls] || cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={spells}
        isLoading={isLoading}
        emptyMessage="Заклинания не найдены. Создайте первое заклинание или измените фильтры."
        sorting={sorting}
        onSortingChange={handleSortingChange}
        manualSorting
        pagination={pagination}
        onPageChange={handlePageChange}
        onPerPageChange={handlePerPageChange}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSpell} onOpenChange={() => setDeleteSpell(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Удалить заклинание?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Вы уверены, что хотите удалить заклинание «{deleteSpell?.name}»?
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
