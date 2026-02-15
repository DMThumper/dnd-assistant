"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { Display, Campaign } from "@/types/game";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tv,
  Wifi,
  WifiOff,
  Image,
  Music,
  Type,
  Moon,
  Trash2,
  MonitorPlay,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function DisplayControlPage() {
  const t = useTranslations("dashboard.displayControl");

  const [pairingCode, setPairingCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [isPairing, setIsPairing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [displays, setDisplays] = useState<Display[]>([]);

  // Load campaigns and displays
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [campaignsRes, displaysRes] = await Promise.all([
        api.getCampaigns(),
        api.getDisplays(),
      ]);
      setCampaigns(campaignsRes.data as Campaign[]);
      setDisplays(displaysRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Не удалось загрузить данные");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handlePair = async () => {
    if (!pairingCode || !selectedCampaign) return;

    setIsPairing(true);
    try {
      await api.pairDisplay({
        code: pairingCode,
        campaign_id: parseInt(selectedCampaign),
        name: displayName || undefined,
      });
      toast.success("Дисплей подключён");
      setPairingCode("");
      setDisplayName("");
      setSelectedCampaign("");
      void loadData();
    } catch (error) {
      console.error("Failed to pair display:", error);
      toast.error("Неверный код или код истёк");
    } finally {
      setIsPairing(false);
    }
  };

  const handleDisconnect = async (displayId: number) => {
    try {
      await api.disconnectDisplay(displayId);
      toast.success("Дисплей отключён");
      setDisplays(displays.filter((d) => d.id !== displayId));
    } catch (error) {
      console.error("Failed to disconnect display:", error);
      toast.error("Не удалось отключить дисплей");
    }
  };

  const handleCommand = async (
    displayId: number,
    command: "scene" | "music" | "text" | "blackout"
  ) => {
    try {
      await api.sendDisplayCommand(displayId, { command });
      toast.success("Команда отправлена");
    } catch (error) {
      console.error("Failed to send command:", error);
      toast.error("Дисплей не подключён или не отвечает");
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{t("title")}</h1>
          <p className="text-zinc-400">{t("description")}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => void loadData()}
          className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pair new display */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <Tv className="h-5 w-5 text-primary" />
              {t("pair.title")}
            </CardTitle>
            <CardDescription className="text-zinc-500">
              {t("pair.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign" className="text-zinc-300">
                {t("pair.selectCampaign")}
              </Label>
              <Select
                value={selectedCampaign}
                onValueChange={setSelectedCampaign}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder={t("pair.selectCampaignPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {campaigns.map((campaign) => (
                    <SelectItem
                      key={campaign.id}
                      value={campaign.id.toString()}
                      className="text-zinc-100 focus:bg-white/10 focus:text-zinc-100"
                    >
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-zinc-300">
                Название дисплея (опционально)
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Например: Гостиная ТВ"
                maxLength={100}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code" className="text-zinc-300">
                {t("pair.enterCode")}
              </Label>
              <div className="flex gap-3">
                <Input
                  id="code"
                  value={pairingCode}
                  onChange={(e) =>
                    setPairingCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="0000"
                  maxLength={4}
                  className={cn(
                    "font-mono text-2xl tracking-[0.5em] text-center",
                    "bg-zinc-800 border-zinc-700 text-zinc-100",
                    "placeholder:text-zinc-600 placeholder:tracking-[0.5em]",
                    "focus:border-primary focus:ring-primary/20"
                  )}
                />
                <Button
                  onClick={() => void handlePair()}
                  disabled={pairingCode.length !== 4 || !selectedCampaign || isPairing}
                  className="bg-primary hover:bg-primary/90 text-white min-w-[120px]"
                >
                  {isPairing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("pair.connect")
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick controls - show only if there are displays */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">{t("controls.title")}</CardTitle>
            <CardDescription className="text-zinc-500">
              {t("controls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {displays.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                Подключите дисплей для управления
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className={cn(
                    "h-24 flex-col gap-2",
                    "bg-zinc-800 border-zinc-700 text-zinc-300",
                    "hover:bg-zinc-700 hover:text-zinc-100 hover:border-zinc-600"
                  )}
                  onClick={() => {
                    const aliveDisplay = displays.find((d) => d.is_alive);
                    if (aliveDisplay) {
                      void handleCommand(aliveDisplay.id, "scene");
                    }
                  }}
                  disabled={!displays.some((d) => d.is_alive)}
                >
                  <Image className="h-7 w-7" />
                  <span className="text-sm">{t("controls.changeScene")}</span>
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-24 flex-col gap-2",
                    "bg-zinc-800 border-zinc-700 text-zinc-300",
                    "hover:bg-zinc-700 hover:text-zinc-100 hover:border-zinc-600"
                  )}
                  onClick={() => {
                    const aliveDisplay = displays.find((d) => d.is_alive);
                    if (aliveDisplay) {
                      void handleCommand(aliveDisplay.id, "music");
                    }
                  }}
                  disabled={!displays.some((d) => d.is_alive)}
                >
                  <Music className="h-7 w-7" />
                  <span className="text-sm">{t("controls.changeMusic")}</span>
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-24 flex-col gap-2",
                    "bg-zinc-800 border-zinc-700 text-zinc-300",
                    "hover:bg-zinc-700 hover:text-zinc-100 hover:border-zinc-600"
                  )}
                  onClick={() => {
                    const aliveDisplay = displays.find((d) => d.is_alive);
                    if (aliveDisplay) {
                      void handleCommand(aliveDisplay.id, "text");
                    }
                  }}
                  disabled={!displays.some((d) => d.is_alive)}
                >
                  <Type className="h-7 w-7" />
                  <span className="text-sm">{t("controls.showText")}</span>
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-24 flex-col gap-2",
                    "bg-zinc-800 border-zinc-700 text-zinc-300",
                    "hover:bg-zinc-700 hover:text-zinc-100 hover:border-zinc-600"
                  )}
                  onClick={() => {
                    const aliveDisplay = displays.find((d) => d.is_alive);
                    if (aliveDisplay) {
                      void handleCommand(aliveDisplay.id, "blackout");
                    }
                  }}
                  disabled={!displays.some((d) => d.is_alive)}
                >
                  <Moon className="h-7 w-7" />
                  <span className="text-sm">{t("controls.blackout")}</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connected displays */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">{t("connected.title")}</CardTitle>
          <CardDescription className="text-zinc-500">
            {t("connected.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displays.length === 0 ? (
            <div className="py-12 text-center">
              <MonitorPlay className="mx-auto mb-4 h-16 w-16 text-zinc-700" />
              <h3 className="text-lg font-medium text-zinc-300 mb-2">
                Нет подключённых экранов
              </h3>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                {t("connected.noDisplays")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displays.map((display) => (
                <div
                  key={display.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg p-4",
                    "bg-zinc-800/50 border border-zinc-700/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        display.is_alive
                          ? "bg-emerald-500/20"
                          : "bg-red-500/20"
                      )}
                    >
                      {display.is_alive ? (
                        <Wifi className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-100">
                          {display.name || `Дисплей #${display.id}`}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            display.is_alive
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          )}
                        >
                          {display.is_alive ? "Онлайн" : "Офлайн"}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {display.campaign?.name || "Без кампании"} · Подключён в{" "}
                        {formatTime(display.paired_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleDisconnect(display.id)}
                    className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
