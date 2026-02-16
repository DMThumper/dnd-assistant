"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sword, Shield, Tv, Sparkles } from "lucide-react";

export default function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  const features = [
    {
      icon: <Sword className="h-8 w-8 text-secondary" />,
      title: t("features.characterSheet.title"),
      description: t("features.characterSheet.description"),
    },
    {
      icon: <Shield className="h-8 w-8 text-secondary" />,
      title: t("features.battleTracker.title"),
      description: t("features.battleTracker.description"),
    },
    {
      icon: <Tv className="h-8 w-8 text-secondary" />,
      title: t("features.displayClient.title"),
      description: t("features.displayClient.description"),
    },
    {
      icon: <Sparkles className="h-8 w-8 text-secondary" />,
      title: t("features.characterCreator.title"),
      description: t("features.characterCreator.description"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Sword className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{tCommon("appName")}</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">{t("nav.login")}</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">{t("nav.register")}</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-gold">
          {t("hero.title")}
        </h1>
        <p className="mb-2 text-2xl text-muted-foreground">
          {t("hero.subtitle")}
        </p>
        <p className="mb-8 text-lg text-muted-foreground">
          {t("hero.description")}
        </p>
        <Link href="/login">
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            {t("hero.cta")}
          </Button>
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          {t("hero.noAccount")}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t("hero.registerLink")}
          </Link>
        </p>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold">
          {t("features.title")}
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card">
              <CardHeader>
                <div className="mb-4">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 {tCommon("appName")}</p>
        </div>
      </footer>
    </div>
  );
}
