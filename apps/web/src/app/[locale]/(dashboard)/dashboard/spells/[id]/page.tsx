"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import type { SpellBackoffice, SettingOption } from "@/types/backoffice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Sparkles,
  Clock,
  Target,
  Timer,
  BookOpen,
  Scroll,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

// School names in Russian
const schoolNames: Record<string, string> = {
  abjuration: "Ограждение",
  conjuration: "Вызов",
  divination: "Прорицание",
  enchantment: "Очарование",
  evocation: "Воплощение",
  illusion: "Иллюзия",
  necromancy: "Некромантия",
  transmutation: "Преобразование",
};

// School colors
const schoolColors: Record<string, string> = {
  abjuration: "text-blue-400",
  conjuration: "text-yellow-400",
  divination: "text-purple-400",
  enchantment: "text-pink-400",
  evocation: "text-red-400",
  illusion: "text-indigo-400",
  necromancy: "text-green-400",
  transmutation: "text-orange-400",
};

// Class names in Russian
const classNames: Record<string, string> = {
  wizard: "Волшебник",
  sorcerer: "Чародей",
  cleric: "Жрец",
  druid: "Друид",
  bard: "Бард",
  paladin: "Паладин",
  ranger: "Следопыт",
  warlock: "Колдун",
  artificer: "Изобретатель",
};

export default function SpellDetailPage() {
  const params = useParams();
  const router = useRouter();
  const spellId = Number(params.id);

  const [spell, setSpell] = useState<SpellBackoffice | null>(null);
  const [settings, setSettings] = useState<SettingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchSpell = async () => {
      try {
        setIsLoading(true);
        const response = await api.getSpell(spellId);
        setSpell(response.data.spell);
        setSettings(response.data.settings);
        setError(null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить заклинание");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSpell();
  }, [spellId]);

  const handleDelete = async () => {
    if (!spell) return;

    setIsDeleting(true);
    try {
      await api.deleteSpell(spell.id);
      toast.success("Заклинание удалено");
      router.push("/dashboard/spells");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось удалить заклинание");
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !spell) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/spells">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">Ошибка</h1>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error || "Заклинание не найдено"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/spells">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              {spell.name}
              {spell.concentration && (
                <Badge variant="outline" className="text-yellow-400 border-yellow-700">
                  Концентрация
                </Badge>
              )}
              {spell.ritual && (
                <Badge variant="outline" className="text-purple-400 border-purple-700">
                  Ритуал
                </Badge>
              )}
            </h1>
            <p className={`${schoolColors[spell.school] || "text-zinc-400"}`}>
              {spell.level_string} — {schoolNames[spell.school] || spell.school}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/spells/${spell.id}/edit`}>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Pencil className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          </Link>
          {!spell.is_system && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-red-800 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          )}
        </div>
      </div>

      {/* Main info cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Sparkles className={`h-8 w-8 ${spell.is_cantrip ? "text-green-400" : "text-blue-400"}`} />
              <div>
                <div className="text-xl font-bold text-zinc-100">{spell.level_string}</div>
                <div className="text-sm text-zinc-500">Уровень</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-zinc-400" />
              <div>
                <div className="text-xl font-bold text-zinc-100">{spell.casting_time}</div>
                <div className="text-sm text-zinc-500">Время накладывания</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-zinc-400" />
              <div>
                <div className="text-xl font-bold text-zinc-100">{spell.range}</div>
                <div className="text-sm text-zinc-500">Дистанция</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Timer className="h-8 w-8 text-zinc-400" />
              <div>
                <div className="text-xl font-bold text-zinc-100">{spell.duration}</div>
                <div className="text-sm text-zinc-500">Длительность</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Components */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Компоненты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {spell.components.verbal && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-100">
                В (Вербальный)
              </Badge>
            )}
            {spell.components.somatic && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-100">
                С (Соматический)
              </Badge>
            )}
            {spell.components.material && (
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-100">
                М (Материальный)
              </Badge>
            )}
          </div>
          {spell.components.material && spell.components.material_description && (
            <div className="text-zinc-400 text-sm">
              <span className="text-zinc-500">Материал: </span>
              {spell.components.material_description}
              {spell.components.material_cost && (
                <span className="text-yellow-400 ml-1">
                  ({spell.components.material_cost})
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Scroll className="h-5 w-5" />
            Описание
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {spell.description}
          </div>
        </CardContent>
      </Card>

      {/* Higher Levels */}
      {spell.higher_levels?.description && (
        <Card className="bg-zinc-900 border-zinc-800 border-blue-600/30">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              На более высоких уровнях
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-zinc-300 whitespace-pre-wrap">
              {spell.higher_levels.description}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cantrip Scaling */}
      {spell.is_cantrip && spell.cantrip_scaling && Object.keys(spell.cantrip_scaling).length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 border-green-600/30">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Масштабирование заговора
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(spell.cantrip_scaling).map(([level, dice]) => (
                <div key={level} className="text-center p-3 bg-zinc-800 rounded-lg">
                  <div className="text-sm text-zinc-500 mb-1">{level}-й уровень</div>
                  <div className="text-xl font-bold text-zinc-100">{dice}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Classes */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Классы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {spell.classes.map((cls) => (
              <Badge key={cls} variant="secondary" className="bg-primary/20 text-primary">
                {classNames[cls] || cls}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      {settings.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Привязка к сеттингам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {settings.map((setting) => (
                <Badge key={setting.id} variant="secondary" className="bg-primary/20 text-primary">
                  {setting.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System badge */}
      {spell.is_system && (
        <div className="text-sm text-zinc-500 text-center">
          Это системное заклинание. Его нельзя удалить.
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Удалить заклинание?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Вы уверены, что хотите удалить заклинание &quot;{spell.name}&quot;?
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
