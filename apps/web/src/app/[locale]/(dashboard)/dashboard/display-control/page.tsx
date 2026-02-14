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
import {
  Tv,
  Wifi,
  WifiOff,
  Image,
  Music,
  Type,
  Moon,
  Trash2,
} from "lucide-react";

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
      name: "Display #1",
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
      // await api.post('/backoffice/displays/pair', { code: pairingCode, campaign_id: selectedCampaign });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pair new display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="h-5 w-5" />
              {t("pair.title")}
            </CardTitle>
            <CardDescription>{t("pair.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign">{t("pair.selectCampaign")}</Label>
              <Select
                value={selectedCampaign}
                onValueChange={setSelectedCampaign}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("pair.selectCampaignPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">{t("pair.enterCode")}</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={pairingCode}
                  onChange={(e) =>
                    setPairingCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="0000"
                  maxLength={4}
                  className="font-mono text-2xl tracking-widest text-center"
                />
                <Button
                  onClick={handlePair}
                  disabled={pairingCode.length !== 4 || !selectedCampaign || isPairing}
                >
                  {isPairing ? tCommon("loading") : t("pair.connect")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick controls */}
        <Card>
          <CardHeader>
            <CardTitle>{t("controls.title")}</CardTitle>
            <CardDescription>{t("controls.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleCommand("scene")}
              >
                <Image className="h-6 w-6" />
                <span>{t("controls.changeScene")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleCommand("music")}
              >
                <Music className="h-6 w-6" />
                <span>{t("controls.changeMusic")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleCommand("text")}
              >
                <Type className="h-6 w-6" />
                <span>{t("controls.showText")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleCommand("blackout")}
              >
                <Moon className="h-6 w-6" />
                <span>{t("controls.blackout")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected displays */}
      <Card>
        <CardHeader>
          <CardTitle>{t("connected.title")}</CardTitle>
          <CardDescription>{t("connected.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {connectedDisplays.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Tv className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p>{t("connected.noDisplays")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {connectedDisplays.map((display) => (
                <div
                  key={display.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    {display.isAlive ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{display.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {display.campaignName}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDisconnect(display.id)}
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
