"use client";

import { useTranslations } from "next-intl";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlayerCampaignsPage() {
  const t = useTranslations("player.campaigns");

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      {/* Placeholder - will be replaced with actual campaigns list */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>{t("selectCampaign")}</CardTitle>
          <CardDescription>{t("noCampaigns")}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
