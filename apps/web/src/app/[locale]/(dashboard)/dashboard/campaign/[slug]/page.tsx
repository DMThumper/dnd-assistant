"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Campaign, Act } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Gamepad2,
  BookOpen,
  Users,
  Calendar,
  Play,
  Pause,
  CheckCircle,
  Settings,
  Tv,
  Swords,
  FileText,
  Clock,
} from "lucide-react";

const statusConfig = {
  active: {
    label: "Активна",
    icon: Play,
    variant: "default" as const,
  },
  paused: {
    label: "Приостановлена",
    icon: Pause,
    variant: "secondary" as const,
  },
  completed: {
    label: "Завершена",
    icon: CheckCircle,
    variant: "outline" as const,
  },
};

interface QuickAction {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
}

export default function CampaignPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [acts, setActs] = useState<Act[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const campaignsResponse = await api.getCampaigns();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const campaignData = (campaignsResponse.data as any[]).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.slug === slug
      );

      if (!campaignData) {
        setError("Кампания не найдена");
        return;
      }

      setCampaign(campaignData);

      // Load acts
      const actsResponse = await api.getActs(campaignData.id);
      setActs(actsResponse.data);
    } catch {
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-6">
        <div className="text-destructive">{error || "Кампания не найдена"}</div>
        <Link href="/dashboard/campaigns">
          <Button className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            К списку кампаний
          </Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[campaign.status];
  const StatusIcon = status.icon;

  const activeAct = acts.find((a) => a.status === "active");
  const completedActsCount = acts.filter((a) => a.status === "completed").length;
  const totalSessionsCount = acts.reduce((sum, a) => sum + a.sessions_count, 0);
  const completedSessionsCount = acts.reduce((sum, a) => sum + a.completed_sessions_count, 0);

  const quickActions: QuickAction[] = [
    {
      href: `/dashboard/campaign/${slug}/control`,
      icon: Gamepad2,
      title: "Центр управления",
      description: "Управление персонажами в реальном времени",
      color: "text-emerald-500",
    },
    {
      href: `/dashboard/campaign/${slug}/acts`,
      icon: BookOpen,
      title: "Акты и сессии",
      description: `${acts.length} актов, ${totalSessionsCount} сессий`,
      color: "text-blue-500",
    },
    {
      href: `/dashboard/campaign/${slug}/encounters`,
      icon: Swords,
      title: "Встречи",
      description: "Столкновения и бои кампании",
      color: "text-red-500",
    },
    {
      href: `/dashboard/campaign/${slug}/notes`,
      icon: FileText,
      title: "Заметки",
      description: "Записи и планы кампании",
      color: "text-amber-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{campaign.name}</h1>
              <Badge variant={status.variant}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            {campaign.setting && (
              <p className="text-muted-foreground">
                {campaign.setting.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/campaign/${slug}/settings`}>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/display-control">
            <Button variant="outline">
              <Tv className="h-4 w-4 mr-2" />
              Display
            </Button>
          </Link>
        </div>
      </div>

      {/* Campaign description */}
      {campaign.description && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-muted-foreground">{campaign.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Игроки
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.players_count}</div>
            <p className="text-xs text-muted-foreground">
              {campaign.characters_count} персонажей
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Акты
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acts.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedActsCount} завершено
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Сессии
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessionsCount}</div>
            <p className="text-xs text-muted-foreground">
              {completedSessionsCount} проведено
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Текущий акт
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeAct ? `#${activeAct.number}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {activeAct?.name || "Нет активного акта"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Быстрый доступ</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="h-full hover:bg-accent/5 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className={`h-5 w-5 ${action.color}`} />
                      {action.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Act Progress */}
      {activeAct && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-emerald-500" />
              Текущий акт: {activeAct.name}
            </CardTitle>
            {activeAct.description && (
              <CardDescription>{activeAct.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Прогресс: {activeAct.completed_sessions_count} из {activeAct.sessions_count} сессий
              </div>
              <Link href={`/dashboard/campaign/${slug}/acts`}>
                <Button variant="outline" size="sm">
                  Подробнее
                </Button>
              </Link>
            </div>
            {activeAct.sessions_count > 0 && (
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(activeAct.completed_sessions_count / activeAct.sessions_count) * 100}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Acts */}
      {acts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Акты кампании</CardTitle>
            <Link href={`/dashboard/campaign/${slug}/acts`}>
              <Button variant="ghost" size="sm">
                Все акты
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {acts.slice(0, 5).map((act) => {
                const actStatus = {
                  planned: { icon: Clock, color: "text-muted-foreground" },
                  active: { icon: Play, color: "text-emerald-500" },
                  completed: { icon: CheckCircle, color: "text-blue-500" },
                }[act.status];
                const ActIcon = actStatus.icon;

                return (
                  <Link
                    key={act.id}
                    href={`/dashboard/campaign/${slug}/acts/${act.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {act.number}
                      </div>
                      <div>
                        <div className="font-medium">{act.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {act.sessions_count} сессий
                        </div>
                      </div>
                    </div>
                    <ActIcon className={`h-5 w-5 ${actStatus.color}`} />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
