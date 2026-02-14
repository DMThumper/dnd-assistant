"use client";

import { useTranslations } from "next-intl";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sword, Users, BookOpen, Tv } from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tSidebar = useTranslations("dashboard.sidebar");

  const quickLinks = [
    {
      icon: <Sword className="h-6 w-6" />,
      title: tSidebar("campaigns"),
      href: "/dashboard/campaigns",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: tSidebar("users"),
      href: "/dashboard/users",
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: tSidebar("spells"),
      href: "/dashboard/spells",
    },
    {
      icon: <Tv className="h-6 w-6" />,
      title: tSidebar("displayControl"),
      href: "/dashboard/display-control",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link, index) => (
          <Card key={index} className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader>
              <div className="mb-2 text-primary">{link.icon}</div>
              <CardTitle className="text-lg">{link.title}</CardTitle>
              <CardDescription>
                {/* Placeholder description */}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
