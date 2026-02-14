"use client";

import { useTranslations } from "next-intl";

export default function DisplayScreenPage() {
  const t = useTranslations("display");

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-gold">D&D Assistant</h1>
        <p className="text-xl text-muted-foreground">{t("connecting")}</p>
      </div>
    </div>
  );
}
