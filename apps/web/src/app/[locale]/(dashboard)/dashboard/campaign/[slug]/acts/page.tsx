"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Act, Campaign } from "@/types/game";
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
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";

const statusConfig = {
  planned: {
    label: "Запланирован",
    icon: Clock,
    variant: "secondary" as const,
  },
  active: {
    label: "Активен",
    icon: Play,
    variant: "default" as const,
  },
  completed: {
    label: "Завершён",
    icon: CheckCircle,
    variant: "outline" as const,
  },
};

export default function ActsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [acts, setActs] = useState<Act[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAct, setSelectedAct] = useState<Act | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    intro: "",
    epilogue: "",
  });
  const [saving, setSaving] = useState(false);

  // Load campaign and acts
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // For now, we need to get campaign ID from slug
      // In a real app, you'd have a getCampaignBySlug endpoint
      // For this implementation, we'll assume campaign ID is in the URL or we need to fetch campaigns first

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

  const handleCreate = async () => {
    if (!campaign) return;

    try {
      setSaving(true);
      await api.createAct(campaign.id, {
        name: formData.name,
        description: formData.description || null,
        intro: formData.intro || null,
        epilogue: formData.epilogue || null,
      });
      setIsCreateOpen(false);
      setFormData({ name: "", description: "", intro: "", epilogue: "" });
      await loadData();
    } catch {
      setError("Не удалось создать акт");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!campaign || !selectedAct) return;

    try {
      setSaving(true);
      await api.updateAct(campaign.id, selectedAct.id, {
        name: formData.name,
        description: formData.description || null,
        intro: formData.intro || null,
        epilogue: formData.epilogue || null,
      });
      setIsEditOpen(false);
      setSelectedAct(null);
      setFormData({ name: "", description: "", intro: "", epilogue: "" });
      await loadData();
    } catch {
      setError("Не удалось обновить акт");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign || !selectedAct) return;

    try {
      await api.deleteAct(campaign.id, selectedAct.id);
      setIsDeleteOpen(false);
      setSelectedAct(null);
      await loadData();
    } catch {
      setError("Не удалось удалить акт");
    }
  };

  const handleStatusChange = async (act: Act, newStatus: "planned" | "active" | "completed") => {
    if (!campaign) return;

    try {
      await api.updateActStatus(campaign.id, act.id, newStatus);
      await loadData();
    } catch {
      setError("Не удалось обновить статус");
    }
  };

  const openEditDialog = (act: Act) => {
    setSelectedAct(act);
    setFormData({
      name: act.name,
      description: act.description || "",
      intro: act.intro || "",
      epilogue: act.epilogue || "",
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (act: Act) => {
    setSelectedAct(act);
    setIsDeleteOpen(true);
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
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign?.name}</h1>
            <p className="text-muted-foreground">Акты и сессии</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Новый акт
        </Button>
      </div>

      {/* Acts List */}
      {acts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет актов</h3>
            <p className="text-muted-foreground text-center mb-4">
              Создайте первый акт, чтобы начать организовывать кампанию
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать акт
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {acts.map((act) => {
            const status = statusConfig[act.status];
            const StatusIcon = status.icon;

            return (
              <Card key={act.id} className="hover:bg-accent/5 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                        {act.number}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{act.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={status.variant}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {act.completed_sessions_count}/{act.sessions_count} сессий
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(act)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(act)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {act.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {act.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {act.status !== "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(act, "active")}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Начать
                        </Button>
                      )}
                      {act.status === "active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(act, "completed")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Завершить
                        </Button>
                      )}
                    </div>
                    <Link href={`/dashboard/campaign/${slug}/acts/${act.id}`}>
                      <Button variant="ghost" size="sm">
                        Сессии
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
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
            <DialogTitle>Новый акт</DialogTitle>
            <DialogDescription>
              Создайте новый акт для организации сюжетной арки кампании
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Акт 1: Прибытие"
              />
            </div>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Краткое описание акта..."
              />
            </div>
            <div>
              <Label htmlFor="intro">Вступление</Label>
              <Textarea
                id="intro"
                value={formData.intro}
                onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                placeholder="Текст для начала акта..."
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
            <DialogTitle>Редактировать акт</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Название</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-intro">Вступление</Label>
              <Textarea
                id="edit-intro"
                value={formData.intro}
                onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-epilogue">Эпилог</Label>
              <Textarea
                id="edit-epilogue"
                value={formData.epilogue}
                onChange={(e) => setFormData({ ...formData, epilogue: e.target.value })}
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

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить акт?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Акт &quot;{selectedAct?.name}&quot; и все его сессии
              будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
