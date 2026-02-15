"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import type { CharacterClassBackoffice, SettingOption } from "@/types/backoffice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Pencil,
  Heart,
  Shield,
  Swords,
  Sparkles,
  Loader2,
  BookOpen,
} from "lucide-react";

// Ability names in Russian
const abilityNames: Record<string, string> = {
  strength: "Сила",
  dexterity: "Ловкость",
  constitution: "Телосложение",
  intelligence: "Интеллект",
  wisdom: "Мудрость",
  charisma: "Харизма",
};

// Skill names in Russian
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

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [cls, setCls] = useState<CharacterClassBackoffice | null>(null);
  const [settings, setSettings] = useState<SettingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        setIsLoading(true);
        const response = await api.getClass(Number(resolvedParams.id));
        setCls(response.data.class);
        setSettings(response.data.settings);
        setError(null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить класс");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchClass();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/classes")}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error || "Класс не найден"}
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
            onClick={() => router.push("/dashboard/classes")}
            className="text-zinc-400 hover:text-zinc-100"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              {cls.name}
              {cls.is_spellcaster && (
                <Sparkles className="h-5 w-5 text-purple-400" />
              )}
            </h1>
            <p className="text-zinc-400">{cls.slug}</p>
          </div>
        </div>

        <Link href={`/dashboard/classes/${cls.id}/edit`}>
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Pencil className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
        </Link>
      </div>

      {/* Basic info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Кость здоровья</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400" />
              <span className="text-2xl font-bold text-zinc-100">{cls.hit_die}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Основные характеристики</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {cls.primary_abilities.map((ability) => (
                <Badge key={ability} className="bg-primary/20 text-primary">
                  {abilityNames[ability] || ability}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-zinc-400">Спасброски</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {cls.saving_throws.map((st) => (
                <Badge key={st} variant="secondary" className="bg-zinc-800 text-zinc-300">
                  {abilityNames[st] || st}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {cls.description && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-400 whitespace-pre-wrap">{cls.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Proficiencies */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Владения
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cls.armor_proficiencies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Доспехи</h4>
              <div className="flex flex-wrap gap-1.5">
                {cls.armor_proficiencies.map((armor) => (
                  <Badge key={armor} variant="outline" className="text-zinc-300 border-zinc-700">
                    {armor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {cls.weapon_proficiencies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Оружие</h4>
              <div className="flex flex-wrap gap-1.5">
                {cls.weapon_proficiencies.map((weapon) => (
                  <Badge key={weapon} variant="outline" className="text-zinc-300 border-zinc-700">
                    {weapon}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {cls.tool_proficiencies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Инструменты</h4>
              <div className="flex flex-wrap gap-1.5">
                {cls.tool_proficiencies.map((tool) => (
                  <Badge key={tool} variant="outline" className="text-zinc-300 border-zinc-700">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Навыки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400 mb-3">
            Выберите {cls.skill_choices} навыков из списка:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {cls.skill_options.map((skill) => (
              <Badge key={skill} variant="secondary" className="bg-zinc-800 text-zinc-300">
                {skillNames[skill] || skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spellcasting */}
      {cls.is_spellcaster && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Колдовство
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-zinc-400">Характеристика заклинаний: </span>
              <span className="text-zinc-100">
                {abilityNames[cls.spellcasting_ability || ""] || cls.spellcasting_ability}
              </span>
            </div>
            {cls.spell_slots && Object.keys(cls.spell_slots).length > 0 && (
              <div>
                <span className="text-sm text-zinc-400">Ячейки заклинаний определены</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Level Features */}
      {cls.level_features && Object.keys(cls.level_features).length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Способности по уровням
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(cls.level_features)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, features]) => (
                <div key={level}>
                  <h4 className="text-sm font-medium text-primary mb-2">
                    Уровень {level}
                  </h4>
                  <div className="space-y-2">
                    {features.map((feature) => (
                      <div key={feature.key} className="pl-4 border-l-2 border-zinc-700">
                        <span className="font-medium text-zinc-200">{feature.name}</span>
                        {feature.description && (
                          <p className="text-sm text-zinc-400 mt-1 whitespace-pre-wrap">
                            {feature.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
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
                <Badge key={setting.id} variant="outline" className="text-zinc-300 border-zinc-700">
                  {setting.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
