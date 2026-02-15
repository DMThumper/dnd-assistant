"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import type { MonsterBackoffice } from "@/types/backoffice";
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
  Shield,
  Heart,
  Skull,
  Crown,
} from "lucide-react";

// Size names in Russian
const sizeNames: Record<string, string> = {
  tiny: "Крошечный",
  small: "Маленький",
  medium: "Средний",
  large: "Большой",
  huge: "Огромный",
  gargantuan: "Исполинский",
};

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

// CR color coding
const getCRColor = (cr: number | null): string => {
  if (cr === null) return "text-zinc-500";
  if (cr <= 0.5) return "text-green-400";
  if (cr <= 4) return "text-blue-400";
  if (cr <= 10) return "text-yellow-400";
  if (cr <= 17) return "text-orange-400";
  return "text-red-400";
};

interface ColumnsProps {
  onDelete: (monster: MonsterBackoffice) => void;
}

export const createColumns = ({ onDelete }: ColumnsProps): ColumnDef<MonsterBackoffice>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Название" />
    ),
    cell: ({ row }) => {
      const monster = row.original;
      return (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/monsters/${monster.id}`}
            className="font-medium hover:text-primary transition-colors"
          >
            {monster.name}
          </Link>
          {monster.has_legendary_actions && (
            <span title="Легендарный"><Crown className="h-4 w-4 text-yellow-400" /></span>
          )}
          {monster.is_system && (
            <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">
              Системный
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Тип" />
    ),
    cell: ({ row }) => {
      const monster = row.original;
      return (
        <span className="text-zinc-400">
          {sizeNames[monster.size] || monster.size} {typeNames[monster.type] || monster.type}
        </span>
      );
    },
  },
  {
    accessorKey: "armor_class",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="КД" />
    ),
    cell: ({ row }) => {
      const monster = row.original;
      return (
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-blue-400" />
          <span>{monster.armor_class}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "hit_points",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ОЗ" />
    ),
    cell: ({ row }) => {
      const monster = row.original;
      return (
        <div className="flex items-center gap-1.5">
          <Heart className="h-4 w-4 text-red-400" />
          <span>{monster.hit_points}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "challenge_rating",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ОП" />
    ),
    cell: ({ row }) => {
      const monster = row.original;
      return (
        <div className="flex items-center gap-1.5">
          <Skull className={`h-4 w-4 ${getCRColor(monster.challenge_rating)}`} />
          <span className={getCRColor(monster.challenge_rating)}>
            {monster.challenge_rating_string}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "experience_points",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Опыт" />
    ),
    cell: ({ row }) => {
      const monster = row.original;
      return (
        <span className="text-zinc-400">
          {monster.experience_points?.toLocaleString() || "—"} XP
        </span>
      );
    },
  },
  {
    id: "immunities",
    header: "Иммунитеты",
    cell: ({ row }) => {
      const monster = row.original;
      const immunities = monster.damage_immunities;
      if (immunities.length === 0) return <span className="text-zinc-600">—</span>;

      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {immunities.slice(0, 2).map((immunity) => (
            <Badge
              key={immunity}
              variant="secondary"
              className="bg-red-900/30 text-red-300 text-xs"
            >
              {immunity}
            </Badge>
          ))}
          {immunities.length > 2 && (
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">
              +{immunities.length - 2}
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
      const monster = row.original;
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
            <Link href={`/dashboard/monsters/${monster.id}`}>
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Просмотр
              </DropdownMenuItem>
            </Link>
            <Link href={`/dashboard/monsters/${monster.id}/edit`}>
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-zinc-700" />
            <DropdownMenuItem
              className="hover:bg-white/10 cursor-pointer text-red-400 focus:text-red-400"
              onClick={() => onDelete(monster)}
              disabled={monster.is_system}
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
