"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type { RaceBackoffice, SettingOption } from "@/types/backoffice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Loader2,
  Pencil,
  Trash2,
  Footprints,
  Languages,
  GitBranch,
} from "lucide-react";
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
import { toast } from "sonner";

// Size names in Russian
const sizeNames: Record<string, string> = {
  tiny: "Крошечный",
  small: "Маленький",
  medium: "Средний",
  large: "Большой",
  huge: "Огромный",
  gargantuan: "Исполинский",
};

// Ability names
const abilityNames: Record<string, string> = {
  strength: "Сила",
  dexterity: "Ловкость",
  constitution: "Телосложение",
  intelligence: "Интеллект",
  wisdom: "Мудрость",
  charisma: "Харизма",
};

// Skill names
const skillNames: Record<string, string> = {
  acrobatics: "Акробатика",
  animal_handling: "Уход за животными",
  arcana: "Магия",
  athletics: "Атлетика",
  deception: "Обман",
  history: "История",
  insight: "Проницательность",
  intimidation: "Запугивание",
  investigation: "Расследование",
  medicine: "Медицина",
  nature: "Природа",
  perception: "Внимательность",
  performance: "Выступление",
  persuasion: "Убеждение",
  religion: "Религия",
  sleight_of_hand: "Ловкость рук",
  stealth: "Скрытность",
  survival: "Выживание",
};

export default function RaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [race, setRace] = useState<RaceBackoffice | null>(null);
  const [settings, setSettings] = useState<SettingOption[]>([]);
  const [subraces, setSubraces] = useState<RaceBackoffice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchRace = async () => {
      try {
        setIsLoading(true);
        const response = await api.getRace(Number(resolvedParams.id));
        setRace(response.data.race);
        setSettings(response.data.settings);
        setSubraces(response.data.subraces);
        setError(null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить расу");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRace();
  }, [resolvedParams.id]);

  const handleDelete = async () => {
    if (!race) return;

    setIsDeleting(true);
    try {
      await api.deleteRace(race.id);
      toast.success("Раса удалена");
      router.push("/dashboard/races");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось удалить расу");
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Format ability bonuses
  const formatAbilityBonuses = () => {
    if (!race) return [];
    const result: string[] = [];

    for (const [ability, value] of Object.entries(race.ability_bonuses)) {
      if (ability === "choice") continue;
      if (typeof value === "number" && value !== 0) {
        const sign = value > 0 ? "+" : "";
        result.push(`${sign}${value} ${abilityNames[ability] || ability}`);
      }
    }

    if (race.ability_bonuses.choice) {
      result.push(`+${race.ability_bonuses.choice.amount} к ${race.ability_bonuses.choice.count} характ. на выбор`);
    }

    return result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/races")}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error || "Раса не найдена"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/races")}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-100">{race.name}</h1>
              {race.is_subrace && (
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  <GitBranch className="h-3 w-3 mr-1" />
                  Подраса
                </Badge>
              )}
              {race.is_system && (
                <Badge variant="outline" className="text-zinc-500 border-zinc-700">
                  Системная
                </Badge>
              )}
            </div>
            <p className="text-zinc-400">{race.slug}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/races/${race.id}/edit`}>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Pencil className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          </Link>
          {!race.is_system && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="border-red-800 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {race.description && (
              <p className="text-zinc-300">{race.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-zinc-500 text-sm">Размер</span>
                <p className="text-zinc-100">{sizeNames[race.size] || race.size}</p>
              </div>
              <div>
                <span className="text-zinc-500 text-sm">Скорость</span>
                <div className="flex items-center gap-2">
                  <Footprints className="h-4 w-4 text-zinc-400" />
                  <span className="text-zinc-100">{race.speed.walk} м</span>
                </div>
              </div>
            </div>

            {/* Additional speeds */}
            {(race.speed.fly || race.speed.swim || race.speed.climb || race.speed.burrow) && (
              <div className="flex flex-wrap gap-2">
                {race.speed.fly && (
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    Полёт: {race.speed.fly} м
                  </Badge>
                )}
                {race.speed.swim && (
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    Плавание: {race.speed.swim} м
                  </Badge>
                )}
                {race.speed.climb && (
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    Лазание: {race.speed.climb} м
                  </Badge>
                )}
                {race.speed.burrow && (
                  <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                    Копание: {race.speed.burrow} м
                  </Badge>
                )}
              </div>
            )}

            {/* Age & Size info */}
            {(race.age_info || race.size_info) && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {race.age_info?.maturity && (
                  <div>
                    <span className="text-zinc-500 text-sm">Зрелость</span>
                    <p className="text-zinc-100">{race.age_info.maturity} лет</p>
                  </div>
                )}
                {race.age_info?.lifespan && (
                  <div>
                    <span className="text-zinc-500 text-sm">Продолж. жизни</span>
                    <p className="text-zinc-100">~{race.age_info.lifespan} лет</p>
                  </div>
                )}
                {race.size_info?.height_range && (
                  <div>
                    <span className="text-zinc-500 text-sm">Рост</span>
                    <p className="text-zinc-100">{race.size_info.height_range}</p>
                  </div>
                )}
                {race.size_info?.weight_range && (
                  <div>
                    <span className="text-zinc-500 text-sm">Вес</span>
                    <p className="text-zinc-100">{race.size_info.weight_range}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ability Bonuses */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Бонусы характеристик</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {formatAbilityBonuses().map((bonus, i) => (
                <Badge key={i} variant="secondary" className="bg-zinc-800 text-zinc-300">
                  {bonus}
                </Badge>
              ))}
              {formatAbilityBonuses().length === 0 && (
                <span className="text-zinc-500">Нет бонусов</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Languages */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Языки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {race.languages.map((lang) => (
                <Badge key={lang} variant="outline" className="border-zinc-700 text-zinc-300">
                  {lang}
                </Badge>
              ))}
              {race.languages.length === 0 && (
                <span className="text-zinc-500">Нет языков</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Proficiencies */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Владения</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {race.proficiencies?.weapons && race.proficiencies.weapons.length > 0 && (
              <div>
                <span className="text-zinc-500 text-sm">Оружие</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {race.proficiencies.weapons.map((w) => (
                    <Badge key={w} variant="secondary" className="bg-zinc-800 text-zinc-300">
                      {w}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {race.proficiencies?.armor && race.proficiencies.armor.length > 0 && (
              <div>
                <span className="text-zinc-500 text-sm">Доспехи</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {race.proficiencies.armor.map((a) => (
                    <Badge key={a} variant="secondary" className="bg-zinc-800 text-zinc-300">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {race.proficiencies?.tools && race.proficiencies.tools.length > 0 && (
              <div>
                <span className="text-zinc-500 text-sm">Инструменты</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {race.proficiencies.tools.map((t) => (
                    <Badge key={t} variant="secondary" className="bg-zinc-800 text-zinc-300">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {race.skill_proficiencies && race.skill_proficiencies.length > 0 && (
              <div>
                <span className="text-zinc-500 text-sm">Навыки</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {race.skill_proficiencies.map((s) => (
                    <Badge key={s} variant="secondary" className="bg-zinc-800 text-zinc-300">
                      {skillNames[s] || s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(!race.proficiencies?.weapons?.length && !race.proficiencies?.armor?.length &&
              !race.proficiencies?.tools?.length && !race.skill_proficiencies?.length) && (
              <span className="text-zinc-500">Нет владений</span>
            )}
          </CardContent>
        </Card>

        {/* Traits */}
        {race.traits.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-zinc-100">Особенности расы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {race.traits.map((trait, i) => (
                <div key={i} className="p-4 bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-zinc-100">{trait.name}</h4>
                    <span className="text-xs text-zinc-500">({trait.key})</span>
                  </div>
                  <p className="text-sm text-zinc-400">{trait.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        {settings.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">Сеттинги</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {settings.map((setting) => (
                  <Badge key={setting.id} className="bg-primary text-primary-foreground">
                    {setting.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subraces */}
        {subraces.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Подрасы ({subraces.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {subraces.map((subrace) => (
                  <Link
                    key={subrace.id}
                    href={`/dashboard/races/${subrace.id}`}
                    className="block p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    <div className="font-medium text-zinc-100">{subrace.name}</div>
                    <div className="text-sm text-zinc-400">{subrace.slug}</div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Удалить расу?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Вы уверены, что хотите удалить расу "{race.name}"?
              Это действие нельзя отменить.
              {subraces.length > 0 && (
                <span className="block mt-2 text-amber-400">
                  У этой расы есть {subraces.length} подрас(ы). Сначала удалите их.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || subraces.length > 0}
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
