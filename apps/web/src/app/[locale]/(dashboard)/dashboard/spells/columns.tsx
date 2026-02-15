"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { SpellBackoffice } from "@/types/backoffice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Sparkles,
  Clock,
  Target,
  BookOpen,
} from "lucide-react";

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

// School colors
const schoolColors: Record<string, string> = {
  abjuration: "text-blue-400",
  conjuration: "text-yellow-400",
  divination: "text-purple-400",
  enchantment: "text-pink-400",
  evocation: "text-red-400",
  illusion: "text-indigo-400",
  necromancy: "text-green-400",
  transmutation: "text-orange-400",
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

interface ColumnsProps {
  onDelete: (spell: SpellBackoffice) => void;
}

export const createColumns = ({ onDelete }: ColumnsProps): ColumnDef<SpellBackoffice>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Название" />
    ),
    cell: ({ row }) => {
      const spell = row.original;
      return (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/spells/${spell.id}`}
            className="font-medium hover:text-primary transition-colors"
          >
            {spell.name}
          </Link>
          {spell.concentration && (
            <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-700">
              К
            </Badge>
          )}
          {spell.ritual && (
            <Badge variant="outline" className="text-xs text-purple-400 border-purple-700">
              Р
            </Badge>
          )}
          {spell.is_system && (
            <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
              Системный
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "level",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Уровень" />
    ),
    cell: ({ row }) => {
      const spell = row.original;
      return (
        <div className="flex items-center gap-1.5">
          <Sparkles className={`h-4 w-4 ${spell.is_cantrip ? "text-green-400" : "text-blue-400"}`} />
          <span className={spell.is_cantrip ? "text-green-400" : ""}>
            {spell.level_string}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "school",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Школа" />
    ),
    cell: ({ row }) => {
      const spell = row.original;
      return (
        <span className={schoolColors[spell.school] || "text-zinc-400"}>
          {schoolNames[spell.school] || spell.school}
        </span>
      );
    },
  },
  {
    accessorKey: "casting_time",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Время" />
    ),
    cell: ({ row }) => {
      const spell = row.original;
      return (
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-zinc-500" />
          <span className="text-zinc-400">{spell.casting_time}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "range",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Дистанция" />
    ),
    cell: ({ row }) => {
      const spell = row.original;
      return (
        <div className="flex items-center gap-1.5">
          <Target className="h-4 w-4 text-zinc-500" />
          <span className="text-zinc-400">{spell.range}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "components_string",
    header: "Комп.",
    cell: ({ row }) => {
      const spell = row.original;
      return (
        <span className="text-zinc-400 font-mono">{spell.components_string}</span>
      );
    },
    enableSorting: false,
  },
  {
    id: "classes",
    header: "Классы",
    cell: ({ row }) => {
      const spell = row.original;
      const classes = spell.classes;
      if (classes.length === 0) return <span className="text-zinc-600">—</span>;

      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {classes.slice(0, 3).map((cls) => (
            <Badge
              key={cls}
              variant="secondary"
              className="bg-zinc-800 text-zinc-300 text-xs"
            >
              {classNames[cls] || cls}
            </Badge>
          ))}
          {classes.length > 3 && (
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
              +{classes.length - 3}
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const spell = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          >
            <Link href={`/dashboard/spells/${spell.id}`}>
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Просмотр
              </DropdownMenuItem>
            </Link>
            <Link href={`/dashboard/spells/${spell.id}/edit`}>
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem
              className="hover:bg-white/10 cursor-pointer text-red-400 focus:text-red-400"
              onClick={() => onDelete(spell)}
              disabled={spell.is_system}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];
