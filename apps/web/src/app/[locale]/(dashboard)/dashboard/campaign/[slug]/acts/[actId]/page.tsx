"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Act, GameSession, Campaign } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Play,
  CheckCircle,
  Clock,
  Pencil,
  Trash2,
  GripVertical,
  MoveRight,
} from "lucide-react";

const statusConfig = {
  planned: {
    label: "Запланирована",
    icon: Clock,
    variant: "secondary" as const,
  },
  active: {
    label: "Активна",
    icon: Play,
    variant: "default" as const,
  },
  completed: {
    label: "Завершена",
    icon: CheckCircle,
    variant: "outline" as const,
  },
};

export default function SessionsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const actId = parseInt(params.actId as string, 10);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [act, setAct] = useState<Act | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [allActs, setAllActs] = useState<Act[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    summary: "",
    played_at: "",
  });
  const [targetActId, setTargetActId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Get campaigns to find the one with this slug
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

      // Load all acts (for move functionality)
      const actsResponse = await api.getActs(campaignData.id);
      setAllActs(actsResponse.data);

      // Find current act
      const currentAct = actsResponse.data.find((a: Act) => a.id === actId);
      if (!currentAct) {
        setError("Акт не найден");
        return;
      }
      setAct(currentAct);

      // Load sessions
      const sessionsResponse = await api.getSessions(campaignData.id, actId);
      setSessions(sessionsResponse.data);
    } catch {
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [slug, actId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!campaign || !act) return;

    try {
      setSaving(true);
      await api.createSession(campaign.id, act.id, {
        name: formData.name,
        summary: formData.summary || null,
        played_at: formData.played_at || null,
      });
      setIsCreateOpen(false);
      setFormData({ name: "", summary: "", played_at: "" });
      await loadData();
    } catch {
      setError("Не удалось создать сессию");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!campaign || !act || !selectedSession) return;

    try {
      setSaving(true);
      await api.updateSession(campaign.id, act.id, selectedSession.id, {
        name: formData.name,
        summary: formData.summary || null,
        played_at: formData.played_at || null,
      });
      setIsEditOpen(false);
      setSelectedSession(null);
      setFormData({ name: "", summary: "", played_at: "" });
      await loadData();
    } catch {
      setError("Не удалось обновить сессию");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign || !act || !selectedSession) return;

    try {
      await api.deleteSession(campaign.id, act.id, selectedSession.id);
      setIsDeleteOpen(false);
      setSelectedSession(null);
      await loadData();
    } catch {
      setError("Не удалось удалить сессию");
    }
  };

  const handleStatusChange = async (
    session: GameSession,
    newStatus: "planned" | "active" | "completed"
  ) => {
    if (!campaign || !act) return;

    try {
      await api.updateSessionStatus(campaign.id, act.id, session.id, newStatus);
      await loadData();
    } catch {
      setError("Не удалось обновить статус");
    }
  };

  const handleMove = async () => {
    if (!campaign || !act || !selectedSession || !targetActId) return;

    try {
      setSaving(true);
      await api.moveSession(campaign.id, act.id, selectedSession.id, targetActId);
      setIsMoveOpen(false);
      setSelectedSession(null);
      setTargetActId(null);
      await loadData();
    } catch {
      setError("Не удалось переместить сессию");
    } finally {
      setSaving(false);
    }
  };

  const openEditDialog = (session: GameSession) => {
    setSelectedSession(session);
    setFormData({
      name: session.name,
      summary: session.summary || "",
      played_at: session.played_at || "",
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (session: GameSession) => {
    setSelectedSession(session);
    setIsDeleteOpen(true);
  };

  const openMoveDialog = (session: GameSession) => {
    setSelectedSession(session);
    setTargetActId(null);
    setIsMoveOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">{error}</div>
        <Button onClick={() => void loadData()} className="mt-4">
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/campaign/${slug}/acts`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/campaign/${slug}/acts`}
                className="text-muted-foreground hover:text-foreground"
              >
                {campaign?.name}
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">Акт {act?.number}</span>
            </div>
            <h1 className="text-2xl font-bold">{act?.name}</h1>
            <p className="text-muted-foreground">Сессии акта</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Новая сессия
        </Button>
      </div>

      {/* Act description */}
      {act?.description && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-muted-foreground">{act.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет сессий</h3>
            <p className="text-muted-foreground text-center mb-4">
              Создайте первую сессию для этого акта
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать сессию
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const status = statusConfig[session.status];
            const StatusIcon = status.icon;

            return (
              <Card
                key={session.id}
                className="hover:bg-accent/5 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div className="flex items-center justify-center min-w-[2.5rem] h-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          #{session.global_number}
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{session.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          {session.played_at && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(session.played_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openMoveDialog(session)}
                        title="Переместить в другой акт"
                      >
                        <MoveRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(session)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(session)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {session.summary && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {session.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {session.status !== "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(session, "active")}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Начать
                        </Button>
                      )}
                      {session.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(session, "completed")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Завершить
                        </Button>
                      )}
                      {session.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(session, "planned")}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Вернуть в план
                        </Button>
                      )}
                    </div>
                    {/* Future: Link to scene editor */}
                    {/* <Link href={`/dashboard/campaign/${slug}/acts/${actId}/sessions/${session.id}/scenes`}>
                      <Button variant="ghost" size="sm">
                        Сцены
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link> */}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая сессия</DialogTitle>
            <DialogDescription>
              Создайте новую игровую сессию для акта &quot;{act?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Сессия 1: Начало пути"
              />
            </div>
            <div>
              <Label htmlFor="summary">Краткое содержание</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                placeholder="Что произошло в этой сессии..."
              />
            </div>
            <div>
              <Label htmlFor="played_at">Дата проведения</Label>
              <Input
                id="played_at"
                type="date"
                value={formData.played_at}
                onChange={(e) =>
                  setFormData({ ...formData, played_at: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || saving}>
              {saving ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать сессию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Название</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-summary">Краткое содержание</Label>
              <Textarea
                id="edit-summary"
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-played_at">Дата проведения</Label>
              <Input
                id="edit-played_at"
                type="date"
                value={formData.played_at}
                onChange={(e) =>
                  setFormData({ ...formData, played_at: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name || saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переместить сессию</DialogTitle>
            <DialogDescription>
              Выберите акт, в который нужно переместить сессию &quot;
              {selectedSession?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {allActs
              .filter((a) => a.id !== actId)
              .map((targetAct) => (
                <Button
                  key={targetAct.id}
                  variant={targetActId === targetAct.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setTargetActId(targetAct.id)}
                >
                  <span className="mr-2">Акт {targetAct.number}:</span>
                  {targetAct.name}
                </Button>
              ))}
            {allActs.filter((a) => a.id !== actId).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Нет других актов для перемещения
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleMove} disabled={!targetActId || saving}>
              {saving ? "Перемещение..." : "Переместить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сессию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Сессия &quot;{selectedSession?.name}
              &quot; будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
