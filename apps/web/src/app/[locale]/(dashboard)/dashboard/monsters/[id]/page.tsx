"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import type { MonsterBackoffice, SettingOption } from "@/types/backoffice";
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
  Shield,
  Heart,
  Skull,
  Crown,
  Zap,
  Eye,
  Swords,
  Star,
} from "lucide-react";
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

// Monster type names in Russian
const typeNames: Record<string, string> = {
  aberration: "Аберрация",
  beast: "Зверь",
  celestial: "Небожитель",
  construct: "Конструкт",
  dragon: "Дракон",
  elemental: "Элементаль",
  fey: "Фея",
  fiend: "Исчадие",
  giant: "Великан",
  humanoid: "Гуманоид",
  monstrosity: "Монстр",
  ooze: "Слизь",
  plant: "Растение",
  undead: "Нежить",
};

// Ability names
const abilityNames: Record<string, string> = {
  strength: "СИЛ",
  dexterity: "ЛОВ",
  constitution: "ТЕЛ",
  intelligence: "ИНТ",
  wisdom: "МДР",
  charisma: "ХАР",
};

// CR color coding
const getCRColor = (cr: number | null): string => {
  if (cr === null) return "text-zinc-500";
  if (cr <= 0.5) return "text-green-400";
  if (cr <= 4) return "text-blue-400";
  if (cr <= 10) return "text-yellow-400";
  if (cr <= 17) return "text-orange-400";
  return "text-red-400";
};

export default function MonsterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const monsterId = Number(params.id);

  const [monster, setMonster] = useState<MonsterBackoffice | null>(null);
  const [settings, setSettings] = useState<SettingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchMonster = async () => {
      try {
        setIsLoading(true);
        const response = await api.getMonster(monsterId);
        setMonster(response.data.monster);
        setSettings(response.data.settings);
        setError(null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить монстра");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMonster();
  }, [monsterId]);

  const handleDelete = async () => {
    if (!monster) return;

    setIsDeleting(true);
    try {
      await api.deleteMonster(monster.id);
      toast.success("Монстр удалён");
      router.push("/dashboard/monsters");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось удалить монстра");
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

  if (error || !monster) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/monsters">
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
          {error || "Монстр не найден"}
        </div>
      </div>
    );
  }

  const getMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/monsters">
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
              {monster.name}
              {monster.has_legendary_actions && (
                <span title="Легендарный"><Crown className="h-5 w-5 text-yellow-400" /></span>
              )}
            </h1>
            <p className="text-zinc-400">
              {sizeNames[monster.size]} {typeNames[monster.type] || monster.type}
              {monster.alignment && `, ${monster.alignment}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/monsters/${monster.id}/edit`}>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Pencil className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          </Link>
          {!monster.is_system && (
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

      {/* Main stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-zinc-100">{monster.armor_class}</div>
                <div className="text-sm text-zinc-500">
                  Класс Доспеха{monster.armor_type && ` (${monster.armor_type})`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-zinc-100">{monster.hit_points}</div>
                <div className="text-sm text-zinc-500">
                  Очки Здоровья{monster.hit_dice && ` (${monster.hit_dice})`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Skull className={`h-8 w-8 ${getCRColor(monster.challenge_rating)}`} />
              <div>
                <div className={`text-2xl font-bold ${getCRColor(monster.challenge_rating)}`}>
                  {monster.challenge_rating_string}
                </div>
                <div className="text-sm text-zinc-500">
                  Опасность ({monster.experience_points?.toLocaleString()} XP)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abilities */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Характеристики</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {Object.entries(monster.abilities).map(([key, value]) => (
              <div key={key} className="text-center p-3 bg-zinc-800 rounded-lg">
                <div className="text-xs text-zinc-500 mb-1">{abilityNames[key]}</div>
                <div className="text-xl font-bold text-zinc-100">{value}</div>
                <div className="text-sm text-zinc-400">{getMod(value)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Speed */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Скорость
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(monster.speed).map(([type, value]) => (
              <Badge key={type} variant="secondary" className="bg-zinc-800 text-zinc-100 text-sm">
                {type === "walk" ? "ходьба" : type === "fly" ? "полёт" : type === "swim" ? "плавание" : type === "climb" ? "лазание" : "копание"} {value} м
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Saving throws and skills */}
      {(Object.keys(monster.saving_throws).length > 0 || Object.keys(monster.skills).length > 0) && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Спасброски и навыки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(monster.saving_throws).length > 0 && (
              <div>
                <div className="text-sm text-zinc-400 mb-2">Спасброски</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(monster.saving_throws).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="border-zinc-700 text-zinc-300">
                      {abilityNames[key]} +{value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(monster.skills).length > 0 && (
              <div>
                <div className="text-sm text-zinc-400 mb-2">Навыки</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(monster.skills).map(([key, value]) => (
                    <Badge key={key} variant="outline" className="border-zinc-700 text-zinc-300">
                      {key} +{value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Senses and Languages */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Чувства
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-zinc-300">
              {monster.senses.darkvision && <div>Тёмное зрение {monster.senses.darkvision}</div>}
              {monster.senses.blindsight && <div>Слепое зрение {monster.senses.blindsight}</div>}
              {monster.senses.tremorsense && <div>Чувство вибрации {monster.senses.tremorsense}</div>}
              {monster.senses.truesight && <div>Истинное зрение {monster.senses.truesight}</div>}
              <div>Пассивная Внимательность {monster.senses.passive_perception}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Языки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {monster.languages.length > 0 ? (
                monster.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="bg-zinc-800 text-zinc-300">
                    {lang}
                  </Badge>
                ))
              ) : (
                <span className="text-zinc-500">—</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Immunities and Resistances */}
      {(monster.damage_immunities.length > 0 ||
        monster.damage_resistances.length > 0 ||
        monster.damage_vulnerabilities.length > 0 ||
        monster.condition_immunities.length > 0) && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Сопротивления и иммунитеты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monster.damage_resistances.length > 0 && (
              <div>
                <div className="text-sm text-zinc-400 mb-2">Сопротивления к урону</div>
                <div className="flex flex-wrap gap-2">
                  {monster.damage_resistances.map((r) => (
                    <Badge key={r} className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {monster.damage_immunities.length > 0 && (
              <div>
                <div className="text-sm text-zinc-400 mb-2">Иммунитеты к урону</div>
                <div className="flex flex-wrap gap-2">
                  {monster.damage_immunities.map((i) => (
                    <Badge key={i} className="bg-red-600/20 text-red-400 border-red-600/30">
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {monster.damage_vulnerabilities.length > 0 && (
              <div>
                <div className="text-sm text-zinc-400 mb-2">Уязвимости к урону</div>
                <div className="flex flex-wrap gap-2">
                  {monster.damage_vulnerabilities.map((v) => (
                    <Badge key={v} className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {monster.condition_immunities.length > 0 && (
              <div>
                <div className="text-sm text-zinc-400 mb-2">Иммунитеты к состояниям</div>
                <div className="flex flex-wrap gap-2">
                  {monster.condition_immunities.map((c) => (
                    <Badge key={c} className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Traits */}
      {monster.traits.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Особенности
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monster.traits.map((trait, index) => (
              <div key={index}>
                <div className="font-semibold text-zinc-100">{trait.name}</div>
                <div className="text-zinc-400 text-sm whitespace-pre-wrap">{trait.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {monster.actions.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Действия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monster.actions.map((action, index) => (
              <div key={index}>
                <div className="font-semibold text-zinc-100">
                  {action.name}
                  {action.type && (
                    <span className="text-zinc-500 font-normal ml-2">
                      ({action.type === "melee" ? "ближний бой" : action.type === "ranged" ? "дальний бой" : "особое"})
                    </span>
                  )}
                </div>
                <div className="text-zinc-400 text-sm whitespace-pre-wrap">{action.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Legendary Actions */}
      {monster.legendary_actions && monster.legendary_actions.actions.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800 border-yellow-600/30">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Легендарные действия ({monster.legendary_actions.per_round} в раунд)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monster.legendary_actions.actions.map((action, index) => (
              <div key={index}>
                <div className="font-semibold text-zinc-100">
                  {action.name}
                  <span className="text-zinc-500 font-normal ml-2">(стоимость: {action.cost})</span>
                </div>
                <div className="text-zinc-400 text-sm whitespace-pre-wrap">{action.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
      {monster.is_system && (
        <div className="text-sm text-zinc-500 text-center">
          Это системный монстр. Его нельзя удалить.
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              Удалить монстра?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Вы уверены, что хотите удалить монстра &quot;{monster.name}&quot;?
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
