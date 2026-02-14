"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Sword, BookOpen, ChevronRight } from "lucide-react";

interface PlayerCampaign {
  id: string;
  name: string;
  settingName: string;
  dmName: string;
  characterCount: number;
  lastPlayedAt: Date | null;
}

export default function PlayerCampaignsPage() {
  const t = useTranslations("player.campaigns");

  // TODO: Replace with SWR data fetching
  const campaigns: PlayerCampaign[] = [
    {
      id: "1",
      name: "Тайны Шарна",
      settingName: "Эберрон",
      dmName: "Александр",
      characterCount: 2,
      lastPlayedAt: new Date(Date.now() - 86400000),
    },
    {
      id: "2",
      name: "Затерянные шахты",
      settingName: "Забытые Королевства",
      dmName: "Михаил",
      characterCount: 1,
      lastPlayedAt: new Date(Date.now() - 604800000),
    },
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return t("today");
    if (days === 1) return t("yesterday");
    if (days < 7) return t("daysAgo", { days });
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  if (campaigns.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <h1 className="mb-2 text-xl font-bold">{t("noCampaigns")}</h1>
        <p className="text-muted-foreground">{t("waitForInvite")}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/player/campaign/${campaign.id}/characters`}
          >
            <Card className="transition-colors hover:bg-accent">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription>{campaign.settingName}</CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {t("dm")}: {campaign.dmName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sword className="h-4 w-4" />
                    <span>
                      {campaign.characterCount} {t("characters")}
                    </span>
                  </div>
                </div>
                {campaign.lastPlayedAt && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {t("lastPlayed")}: {formatDate(campaign.lastPlayedAt)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
