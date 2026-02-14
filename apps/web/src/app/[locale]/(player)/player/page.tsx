"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, ApiClientError } from "@/lib/api";
import type { PlayerCampaign } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Swords, Calendar } from "lucide-react";

export default function PlayerCampaignsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<PlayerCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await api.getPlayerCampaigns();
        setCampaigns(response.data.campaigns);
        // Always show campaign list - don't auto-redirect
        // Players may want to see all campaigns or create characters
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError(t("errors.generic"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCampaigns();
  }, [router, t]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <Swords className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("player.campaigns.noCampaigns")}
        </h2>
        <p className="text-muted-foreground">
          {t("player.campaigns.waitForInvite")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t("player.campaigns.title")}</h1>
      <p className="text-muted-foreground">
        {t("player.campaigns.selectCampaign")}
      </p>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onClick={() => router.push(`/player/campaigns/${campaign.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

interface CampaignCardProps {
  campaign: PlayerCampaign;
  onClick: () => void;
}

function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const t = useTranslations();

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50 active:bg-accent"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{campaign.name}</CardTitle>
        {campaign.setting && (
          <p className="text-sm text-muted-foreground">{campaign.setting.name}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {t("player.campaigns.dm")}: {campaign.owner.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Swords className="h-4 w-4" />
            <span>
              {campaign.my_alive_characters_count} {t("player.campaigns.characters")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
