"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, ApiClientError } from "@/lib/api";
import { getEcho } from "@/lib/echo";
import { usePlayerSession } from "@/contexts/PlayerSessionContext";
import type { PlayerCampaign, LiveSession } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Swords, Radio, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Channel } from "laravel-echo";

interface LiveSessionStartedPayload {
  live_session: LiveSession;
  campaign_id: number;
}

interface LiveSessionEndedPayload {
  campaign_id: number;
}

export default function PlayerCampaignsPage() {
  const t = useTranslations();
  const router = useRouter();
  const { clearActiveCharacter } = usePlayerSession();
  const [campaigns, setCampaigns] = useState<PlayerCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track subscribed channels for cleanup
  const channelsRef = useRef<Map<number, Channel>>(new Map());

  // Clear active character when on campaigns page
  // This ensures we don't show as "online" in presence channel from a previous session
  useEffect(() => {
    clearActiveCharacter();
  }, [clearActiveCharacter]);

  // Handle session started event
  const handleSessionStarted = useCallback((payload: LiveSessionStartedPayload) => {
    console.log("[WS] Campaign session started:", payload.campaign_id);
    setCampaigns(prev =>
      prev.map(c =>
        c.id === payload.campaign_id
          ? { ...c, has_active_live_session: true, live_session: payload.live_session }
          : c
      )
    );
  }, []);

  // Handle session ended event
  const handleSessionEnded = useCallback((payload: LiveSessionEndedPayload) => {
    console.log("[WS] Campaign session ended:", payload.campaign_id);
    setCampaigns(prev =>
      prev.map(c =>
        c.id === payload.campaign_id
          ? { ...c, has_active_live_session: false, live_session: null }
          : c
      )
    );
  }, []);

  // Subscribe to campaign channels (private, not presence - we don't want to show as "online" here)
  useEffect(() => {
    if (campaigns.length === 0) return;

    const echo = getEcho();
    if (!echo) {
      console.warn("[WS] Echo not initialized, skipping campaign subscriptions");
      return;
    }

    // Subscribe to each campaign's PRIVATE channel for session events
    // Using private channel instead of presence so we don't show as "online" on campaign selection page
    campaigns.forEach(campaign => {
      // Skip if already subscribed
      if (channelsRef.current.has(campaign.id)) return;

      const channelName = `campaign.${campaign.id}`;
      console.log("[WS] Subscribing to campaign private channel:", channelName);

      const channel = echo.private(channelName)
        .listen(".live_session.started", handleSessionStarted)
        .listen(".live_session.ended", handleSessionEnded);

      channelsRef.current.set(campaign.id, channel);
    });

    // Cleanup on unmount
    return () => {
      channelsRef.current.forEach((channel, campaignId) => {
        console.log("[WS] Leaving campaign private channel:", campaignId);
        const echo = getEcho();
        if (echo) {
          echo.leave(`private-campaign.${campaignId}`);
        }
      });
      channelsRef.current.clear();
    };
  }, [campaigns.length, handleSessionStarted, handleSessionEnded]);

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await api.getPlayerCampaigns();
        setCampaigns(response.data.campaigns);
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
  }, [t]);

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
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{campaign.name}</CardTitle>
          {campaign.has_active_live_session ? (
            <Badge
              variant="outline"
              className="bg-green-500/10 border-green-500/30 text-green-400 text-xs animate-pulse"
            >
              <Radio className="mr-1 h-3 w-3" />
              Live
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-zinc-500/10 border-zinc-500/30 text-zinc-400 text-xs"
            >
              <WifiOff className="mr-1 h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>
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
