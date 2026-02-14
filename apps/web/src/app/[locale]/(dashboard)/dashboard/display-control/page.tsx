"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectedDisplay {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  isAlive: boolean;
  connectedAt: Date;
}

export default function DisplayControlPage() {
  const t = useTranslations("dashboard.displayControl");
  const tCommon = useTranslations("common");

  const [pairingCode, setPairingCode] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [isPairing, setIsPairing] = useState(false);

  // TODO: Replace with actual data from SWR
  const campaigns = [
    { id: "1", name: "Тайны Шарна" },
    { id: "2", name: "Затерянные шахты" },
  ];

  const connectedDisplays: ConnectedDisplay[] = [
    {
      id: "1",
      name: "Гостиная ТВ",
      campaignId: "1",
      campaignName: "Тайны Шарна",
      isAlive: true,
      connectedAt: new Date(),
    },
  ];

  const handlePair = async () => {
    if (!pairingCode || !selectedCampaign) return;

    setIsPairing(true);
    try {
      // TODO: API call to pair display
      console.log("Pairing:", pairingCode, selectedCampaign);
      setPairingCode("");
    } finally {
      setIsPairing(false);
    }
  };

  const handleDisconnect = async (displayId: string) => {
    // TODO: API call to disconnect display
    console.log("Disconnecting:", displayId);
  };

  const handleCommand = async (
    command: "scene" | "music" | "text" | "blackout"
  ) => {
    // TODO: API call to send command to display
    console.log("Command:", command);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">{t("title")}</h1>
        <p className="text-zinc-400">{t("description")}</p>
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
                      value={campaign.id}
                      className="text-zinc-100 focus:bg-white/10 focus:text-zinc-100"
                    >
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  onClick={handlePair}
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

        {/* Quick controls */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">{t("controls.title")}</CardTitle>
            <CardDescription className="text-zinc-500">
              {t("controls.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className={cn(
                  "h-24 flex-col gap-2",
                  "bg-zinc-800 border-zinc-700 text-zinc-300",
                  "hover:bg-zinc-700 hover:text-zinc-100 hover:border-zinc-600"
                )}
                onClick={() => handleCommand("scene")}
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
                onClick={() => handleCommand("music")}
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
                onClick={() => handleCommand("text")}
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
                onClick={() => handleCommand("blackout")}
              >
                <Moon className="h-7 w-7" />
                <span className="text-sm">{t("controls.blackout")}</span>
              </Button>
            </div>
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
          {connectedDisplays.length === 0 ? (
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
              {connectedDisplays.map((display) => (
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
                        display.isAlive
                          ? "bg-emerald-500/20"
                          : "bg-red-500/20"
                      )}
                    >
                      {display.isAlive ? (
                        <Wifi className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-zinc-100">
                          {display.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            display.isAlive
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          )}
                        >
                          {display.isAlive ? "Онлайн" : "Офлайн"}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {display.campaignName} · Подключён в{" "}
                        {formatTime(display.connectedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDisconnect(display.id)}
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
