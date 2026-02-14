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
import { Button } from "@/components/ui/button";
import {
  Map,
  Users,
  Swords,
  Tv,
  Plus,
  ArrowRight,
  Play,
  Calendar,
  Clock,
  Wand2,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  // TODO: Replace with actual data from SWR
  const stats: StatCard[] = [
    {
      title: "Активные кампании",
      value: 2,
      description: "Всего кампаний: 5",
      icon: Map,
      href: "/dashboard/campaigns",
      color: "text-emerald-400",
    },
    {
      title: "Игроки",
      value: 8,
      description: "В ваших кампаниях",
      icon: Users,
      href: "/dashboard/users",
      color: "text-blue-400",
    },
    {
      title: "Встречи",
      value: 12,
      description: "Подготовлено",
      icon: Swords,
      href: "/dashboard/encounters",
      color: "text-amber-400",
    },
    {
      title: "Дисплеи",
      value: 1,
      description: "Подключено",
      icon: Tv,
      href: "/dashboard/display-control",
      color: "text-purple-400",
    },
  ];

  const recentCampaigns = [
    {
      id: "1",
      name: "Тайны Шарна",
      setting: "Эберрон",
      lastSession: "Сессия #5",
      lastPlayed: "Вчера",
      status: "active",
    },
    {
      id: "2",
      name: "Затерянные шахты",
      setting: "Забытые Королевства",
      lastSession: "Сессия #8",
      lastPlayed: "Неделю назад",
      status: "paused",
    },
  ];

  const upcomingSessions = [
    {
      id: "1",
      campaignName: "Тайны Шарна",
      sessionName: "Сессия #6: Нижний Шарн",
      date: "Суббота, 15:00",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Добро пожаловать, Мастер!
          </h1>
          <p className="text-zinc-400">
            Вот что происходит в ваших кампаниях
          </p>
        </div>
        <Link href="/dashboard/campaigns">
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Новая кампания
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">
                    {stat.title}
                  </CardTitle>
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-zinc-100">
                    {stat.value}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent campaigns */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-zinc-100">Последние кампании</CardTitle>
              <CardDescription className="text-zinc-500">
                Продолжите где остановились
              </CardDescription>
            </div>
            <Link href="/dashboard/campaigns">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                Все <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCampaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/campaign/${campaign.id}`}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg",
                  "bg-zinc-800/50 border border-zinc-700/50",
                  "hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      campaign.status === "active"
                        ? "bg-emerald-500/20"
                        : "bg-amber-500/20"
                    )}
                  >
                    <Play
                      className={cn(
                        "h-5 w-5",
                        campaign.status === "active"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">{campaign.name}</p>
                    <p className="text-sm text-zinc-500">
                      {campaign.setting} · {campaign.lastSession}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  {campaign.lastPlayed}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming sessions */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Предстоящие сессии</CardTitle>
            <CardDescription className="text-zinc-500">
              Запланированные игры
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="mx-auto mb-3 h-12 w-12 text-zinc-700" />
                <p className="text-sm text-zinc-500">Нет запланированных сессий</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      "bg-zinc-800/50 border border-zinc-700/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-100">
                          {session.sessionName}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {session.campaignName}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-400">{session.date}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Быстрые действия</CardTitle>
          <CardDescription className="text-zinc-500">
            Часто используемые инструменты
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/battle">
              <Button
                variant="outline"
                className={cn(
                  "w-full h-auto py-4 flex-col gap-2",
                  "bg-zinc-800 border-zinc-700 text-zinc-300",
                  "hover:bg-zinc-700 hover:text-zinc-100"
                )}
              >
                <Swords className="h-6 w-6" />
                <span>Начать бой</span>
              </Button>
            </Link>
            <Link href="/dashboard/display-control">
              <Button
                variant="outline"
                className={cn(
                  "w-full h-auto py-4 flex-col gap-2",
                  "bg-zinc-800 border-zinc-700 text-zinc-300",
                  "hover:bg-zinc-700 hover:text-zinc-100"
                )}
              >
                <Tv className="h-6 w-6" />
                <span>Управление ТВ</span>
              </Button>
            </Link>
            <Link href="/dashboard/monsters">
              <Button
                variant="outline"
                className={cn(
                  "w-full h-auto py-4 flex-col gap-2",
                  "bg-zinc-800 border-zinc-700 text-zinc-300",
                  "hover:bg-zinc-700 hover:text-zinc-100"
                )}
              >
                <Bug className="h-6 w-6" />
                <span>Бестиарий</span>
              </Button>
            </Link>
            <Link href="/dashboard/spells">
              <Button
                variant="outline"
                className={cn(
                  "w-full h-auto py-4 flex-col gap-2",
                  "bg-zinc-800 border-zinc-700 text-zinc-300",
                  "hover:bg-zinc-700 hover:text-zinc-100"
                )}
              >
                <Wand2 className="h-6 w-6" />
                <span>Заклинания</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
