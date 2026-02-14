"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  BookOpen,
  Calendar,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle,
  Map,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Campaign {
  id: string;
  name: string;
  description: string;
  settingName: string;
  status: "active" | "paused" | "completed";
  playerCount: number;
  actCount: number;
  sessionCount: number;
  lastPlayedAt: Date | null;
}

const statusConfig = {
  active: {
    icon: Play,
    label: "active",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  paused: {
    icon: Pause,
    label: "paused",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  completed: {
    icon: CheckCircle,
    label: "completed",
    className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  },
};

export default function CampaignsPage() {
  const t = useTranslations("dashboard.campaigns");
  const tCommon = useTranslations("common");

  // TODO: Replace with SWR data fetching
  const campaigns: Campaign[] = [
    {
      id: "1",
      name: "Тайны Шарна",
      description:
        "Приключение в величайшем городе Кхорвера. Интриги Домов и древние секреты.",
      settingName: "Эберрон",
      status: "active",
      playerCount: 4,
      actCount: 3,
      sessionCount: 5,
      lastPlayedAt: new Date(Date.now() - 86400000),
    },
    {
      id: "2",
      name: "Затерянные шахты Фанделвера",
      description: "Классическое приключение для начинающих.",
      settingName: "Забытые Королевства",
      status: "paused",
      playerCount: 3,
      actCount: 2,
      sessionCount: 8,
      lastPlayedAt: new Date(Date.now() - 604800000),
    },
    {
      id: "3",
      name: "Проклятие Страда",
      description: "Готический хоррор в мрачных землях Баровии.",
      settingName: "Равенлофт",
      status: "completed",
      playerCount: 5,
      actCount: 4,
      sessionCount: 24,
      lastPlayedAt: new Date(Date.now() - 2592000000),
    },
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{t("title")}</h1>
          <p className="text-zinc-400">{t("subtitle")}</p>
        </div>

        {/* Desktop button */}
        <Button className="hidden sm:flex bg-primary hover:bg-primary/90 text-white">
          <Plus className="mr-2 h-4 w-4" />
          {t("create")}
        </Button>

        {/* Mobile FAB */}
        <Button className="sm:hidden fixed z-50 bottom-6 right-6 h-14 w-14 rounded-full p-0 bg-primary hover:bg-primary/90 shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Campaign grid */}
      {campaigns.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-16 text-center">
            <Map className="mx-auto mb-4 h-16 w-16 text-zinc-700" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">
              {t("noCampaigns")}
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md mx-auto">
              Создайте свою первую кампанию и начните приключение
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="mr-2 h-4 w-4" />
              {t("createFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const StatusIcon = statusConfig[campaign.status].icon;

            return (
              <Card
                key={campaign.id}
                className="group bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-zinc-100 line-clamp-1">
                        {campaign.name}
                      </CardTitle>
                      <CardDescription className="text-zinc-500 line-clamp-1">
                        {campaign.settingName}
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
                        <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          Открыть
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                          <Pencil className="mr-2 h-4 w-4" />
                          {tCommon("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-700" />
                        <DropdownMenuItem className="hover:bg-white/10 cursor-pointer text-red-400 focus:text-red-400">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {tCommon("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-2 text-sm text-zinc-400">
                    {campaign.description}
                  </p>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{campaign.playerCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      <span>
                        {campaign.actCount} {t("acts")} / {campaign.sessionCount}{" "}
                        {t("sessions")}
                      </span>
                    </div>
                  </div>

                  {/* Status and date row */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className={statusConfig[campaign.status].className}
                    >
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {t(`status.${campaign.status}`)}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(campaign.lastPlayedAt)}</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <Link href={`/dashboard/campaign/${campaign.id}`}>
                    <Button
                      variant="secondary"
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-0"
                    >
                      {t("manage")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
