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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  active: { icon: Play, label: "active", variant: "default" as const },
  paused: { icon: Pause, label: "paused", variant: "secondary" as const },
  completed: {
    icon: CheckCircle,
    label: "completed",
    variant: "outline" as const,
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
      lastPlayedAt: new Date(Date.now() - 86400000), // yesterday
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
      lastPlayedAt: new Date(Date.now() - 604800000), // week ago
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("create")}
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t("noCampaigns")}</p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t("createFirst")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const StatusIcon = statusConfig[campaign.status].icon;

            return (
              <Card key={campaign.id} className="group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1">
                        {campaign.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        {campaign.settingName}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>{tCommon("edit")}</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          {tCommon("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {campaign.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{campaign.playerCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>
                        {campaign.actCount} {t("acts")} / {campaign.sessionCount}{" "}
                        {t("sessions")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant={statusConfig[campaign.status].variant}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {t(`status.${campaign.status}`)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(campaign.lastPlayedAt)}</span>
                    </div>
                  </div>

                  <Link href={`/dashboard/campaign/${campaign.id}`}>
                    <Button variant="secondary" className="w-full">
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
