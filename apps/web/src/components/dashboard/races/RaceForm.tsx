"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type {
  RaceBackoffice,
  SettingOption,
  CreateRaceRequest,
  UpdateRaceRequest,
  RaceTrait,
  ParentRaceOption,
} from "@/types/backoffice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Size options
const sizes = [
  { key: "tiny", name: "Крошечный" },
  { key: "small", name: "Маленький" },
  { key: "medium", name: "Средний" },
  { key: "large", name: "Большой" },
  { key: "huge", name: "Огромный" },
  { key: "gargantuan", name: "Исполинский" },
] as const;

// Ability options
const abilities = [
  { key: "strength", name: "Сила", short: "СИЛ" },
  { key: "dexterity", name: "Ловкость", short: "ЛОВ" },
  { key: "constitution", name: "Телосложение", short: "ТЕЛ" },
  { key: "intelligence", name: "Интеллект", short: "ИНТ" },
  { key: "wisdom", name: "Мудрость", short: "МДР" },
  { key: "charisma", name: "Харизма", short: "ХАР" },
];

// Skill options
const skills = [
  { key: "acrobatics", name: "Акробатика" },
  { key: "animal_handling", name: "Уход за животными" },
  { key: "arcana", name: "Магия" },
  { key: "athletics", name: "Атлетика" },
  { key: "deception", name: "Обман" },
  { key: "history", name: "История" },
  { key: "insight", name: "Проницательность" },
  { key: "intimidation", name: "Запугивание" },
  { key: "investigation", name: "Расследование" },
  { key: "medicine", name: "Медицина" },
  { key: "nature", name: "Природа" },
  { key: "perception", name: "Внимательность" },
  { key: "performance", name: "Выступление" },
  { key: "persuasion", name: "Убеждение" },
  { key: "religion", name: "Религия" },
  { key: "sleight_of_hand", name: "Ловкость рук" },
  { key: "stealth", name: "Скрытность" },
  { key: "survival", name: "Выживание" },
];

// Common languages
const commonLanguages = [
  "Общий",
  "Дварфийский",
  "Эльфийский",
  "Гигантский",
  "Гномий",
  "Гоблинский",
  "Полуросликов",
  "Орочий",
  "Драконий",
  "Бездны",
  "Небесный",
  "Инфернальный",
  "Первичный",
  "Глубинная речь",
  "Сильван",
  "Подземный",
];

interface RaceFormProps {
  initialData?: RaceBackoffice;
  initialSettings?: SettingOption[];
  mode: "create" | "edit";
}

export function RaceForm({ initialData, initialSettings, mode }: RaceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSettings, setAvailableSettings] = useState<SettingOption[]>([]);
  const [parentRaces, setParentRaces] = useState<ParentRaceOption[]>([]);

  // Form state - Basic
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [size, setSize] = useState<typeof sizes[number]["key"]>(initialData?.size || "medium");
  const [parentSlug, setParentSlug] = useState<string>(initialData?.parent_slug || "");

  // Ability bonuses
  const [abilityBonuses, setAbilityBonuses] = useState<Record<string, number>>(
    () => {
      const bonuses: Record<string, number> = {};
      if (initialData?.ability_bonuses) {
        for (const [key, value] of Object.entries(initialData.ability_bonuses)) {
          if (key !== "choice" && typeof value === "number") {
            bonuses[key] = value;
          }
        }
      }
      return bonuses;
    }
  );
  const [hasFlexibleChoice, setHasFlexibleChoice] = useState(
    !!initialData?.ability_bonuses?.choice
  );
  const [choiceCount, setChoiceCount] = useState(
    initialData?.ability_bonuses?.choice?.count || 2
  );
  const [choiceAmount, setChoiceAmount] = useState(
    initialData?.ability_bonuses?.choice?.amount || 1
  );

  // Speed
  const [walkSpeed, setWalkSpeed] = useState(initialData?.speed?.walk || 9);
  const [flySpeed, setFlySpeed] = useState(initialData?.speed?.fly || 0);
  const [swimSpeed, setSwimSpeed] = useState(initialData?.speed?.swim || 0);
  const [climbSpeed, setClimbSpeed] = useState(initialData?.speed?.climb || 0);
  const [burrowSpeed, setBurrowSpeed] = useState(initialData?.speed?.burrow || 0);

  // Traits
  const [traits, setTraits] = useState<RaceTrait[]>(initialData?.traits || []);

  // Languages
  const [languages, setLanguages] = useState<string[]>(initialData?.languages || ["Общий"]);
  const [customLanguage, setCustomLanguage] = useState("");

  // Proficiencies
  const [weaponProficiencies, setWeaponProficiencies] = useState(
    initialData?.proficiencies?.weapons?.join(", ") || ""
  );
  const [armorProficiencies, setArmorProficiencies] = useState(
    initialData?.proficiencies?.armor?.join(", ") || ""
  );
  const [toolProficiencies, setToolProficiencies] = useState(
    initialData?.proficiencies?.tools?.join(", ") || ""
  );

  // Skill proficiencies
  const [skillProficiencies, setSkillProficiencies] = useState<string[]>(
    initialData?.skill_proficiencies || []
  );

  // Age & Size info
  const [ageMaturity, setAgeMaturity] = useState(initialData?.age_info?.maturity || 0);
  const [ageLifespan, setAgeLifespan] = useState(initialData?.age_info?.lifespan || 0);
  const [heightRange, setHeightRange] = useState(initialData?.size_info?.height_range || "");
  const [weightRange, setWeightRange] = useState(initialData?.size_info?.weight_range || "");

  // Settings
  const [selectedSettings, setSelectedSettings] = useState<number[]>(
    initialSettings?.map((s) => s.id) || []
  );

  // Fetch available settings and parent races
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, parentsRes] = await Promise.all([
          api.getRaceSettings(),
          api.getParentRaces(),
        ]);
        setAvailableSettings(settingsRes.data.settings);
        setParentRaces(parentsRes.data.parents);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    void fetchData();
  }, []);

  // Handle ability bonus change
  const handleAbilityBonus = (ability: string, value: number) => {
    if (value === 0) {
      const newBonuses = { ...abilityBonuses };
      delete newBonuses[ability];
      setAbilityBonuses(newBonuses);
    } else {
      setAbilityBonuses({ ...abilityBonuses, [ability]: value });
    }
  };

  // Handle trait add
  const addTrait = () => {
    setTraits([
      ...traits,
      { key: "", name: "", description: "" },
    ]);
  };

  // Handle trait update
  const updateTrait = (index: number, field: keyof RaceTrait, value: string) => {
    const newTraits = [...traits];
    newTraits[index] = { ...newTraits[index], [field]: value };
    setTraits(newTraits);
  };

  // Handle trait remove
  const removeTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };

  // Handle language toggle
  const toggleLanguage = (language: string) => {
    if (languages.includes(language)) {
      setLanguages(languages.filter((l) => l !== language));
    } else {
      setLanguages([...languages, language]);
    }
  };

  // Add custom language
  const addCustomLanguage = () => {
    if (customLanguage.trim() && !languages.includes(customLanguage.trim())) {
      setLanguages([...languages, customLanguage.trim()]);
      setCustomLanguage("");
    }
  };

  // Toggle skill proficiency
  const toggleSkill = (skill: string) => {
    if (skillProficiencies.includes(skill)) {
      setSkillProficiencies(skillProficiencies.filter((s) => s !== skill));
    } else {
      setSkillProficiencies([...skillProficiencies, skill]);
    }
  };

  // Toggle setting
  const toggleSetting = (settingId: number) => {
    if (selectedSettings.includes(settingId)) {
      setSelectedSettings(selectedSettings.filter((id) => id !== settingId));
    } else {
      setSelectedSettings([...selectedSettings, settingId]);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Введите название расы");
      return;
    }

    // Validate traits
    for (const trait of traits) {
      if (!trait.key.trim() || !trait.name.trim() || !trait.description.trim()) {
        toast.error("Заполните все поля особенностей");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Build ability bonuses
      const finalAbilityBonuses: CreateRaceRequest["ability_bonuses"] = { ...abilityBonuses };
      if (hasFlexibleChoice) {
        finalAbilityBonuses.choice = { count: choiceCount, amount: choiceAmount };
      }

      // Build speed
      const speed: CreateRaceRequest["speed"] = { walk: walkSpeed };
      if (flySpeed > 0) speed.fly = flySpeed;
      if (swimSpeed > 0) speed.swim = swimSpeed;
      if (climbSpeed > 0) speed.climb = climbSpeed;
      if (burrowSpeed > 0) speed.burrow = burrowSpeed;

      // Build proficiencies
      const proficiencies: CreateRaceRequest["proficiencies"] = {};
      if (weaponProficiencies.trim()) {
        proficiencies.weapons = weaponProficiencies.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (armorProficiencies.trim()) {
        proficiencies.armor = armorProficiencies.split(",").map((s) => s.trim()).filter(Boolean);
      }
      if (toolProficiencies.trim()) {
        proficiencies.tools = toolProficiencies.split(",").map((s) => s.trim()).filter(Boolean);
      }

      // Build age info
      const ageInfo = (ageMaturity > 0 || ageLifespan > 0)
        ? { maturity: ageMaturity || undefined, lifespan: ageLifespan || undefined }
        : undefined;

      // Build size info
      const sizeInfo = (heightRange.trim() || weightRange.trim())
        ? { height_range: heightRange.trim() || undefined, weight_range: weightRange.trim() || undefined }
        : undefined;

      const data: CreateRaceRequest | UpdateRaceRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        slug: slug.trim() || undefined,
        size,
        ability_bonuses: finalAbilityBonuses,
        speed,
        traits: traits.filter((t) => t.key.trim() && t.name.trim()),
        languages,
        proficiencies,
        skill_proficiencies: skillProficiencies,
        parent_slug: parentSlug || undefined,
        age_info: ageInfo,
        size_info: sizeInfo,
        setting_ids: selectedSettings,
      };

      if (mode === "create") {
        await api.createRace(data as CreateRaceRequest);
        toast.success("Раса создана");
      } else {
        await api.updateRace(initialData!.id, data as UpdateRaceRequest);
        toast.success("Раса обновлена");
      }

      router.push("/dashboard/races");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось сохранить расу");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Основная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-300">
                Название <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Человек"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-zinc-300">
                Slug (генерируется автоматически)
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="human"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-300">
              Описание
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Люди — самая распространённая раса..."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Размер <span className="text-red-400">*</span>
              </Label>
              <Select value={size} onValueChange={(v) => setSize(v as typeof size)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {sizes.map((s) => (
                    <SelectItem key={s.key} value={s.key} className="text-zinc-100">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Родительская раса (для подрасы)</Label>
              <Select value={parentSlug} onValueChange={setParentSlug}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Не подраса" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="" className="text-zinc-100">
                    Не подраса
                  </SelectItem>
                  {parentRaces.map((race) => (
                    <SelectItem key={race.slug} value={race.slug} className="text-zinc-100">
                      {race.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ability Bonuses */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Бонусы характеристик</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {abilities.map((ability) => (
              <div key={ability.key} className="space-y-2">
                <Label className="text-zinc-300 text-sm">{ability.name}</Label>
                <Select
                  value={String(abilityBonuses[ability.key] || 0)}
                  onValueChange={(v) => handleAbilityBonus(ability.key, Number(v))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {[-2, -1, 0, 1, 2, 3].map((v) => (
                      <SelectItem key={v} value={String(v)} className="text-zinc-100">
                        {v > 0 ? `+${v}` : v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="flexible"
                checked={hasFlexibleChoice}
                onCheckedChange={(checked) => setHasFlexibleChoice(checked === true)}
                className="border-zinc-600"
              />
              <Label htmlFor="flexible" className="text-zinc-300 cursor-pointer">
                Гибкое распределение (игрок выбирает)
              </Label>
            </div>

            {hasFlexibleChoice && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">К скольким характ.</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={choiceCount}
                    onChange={(e) => setChoiceCount(Number(e.target.value))}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Бонус к каждой</Label>
                  <Input
                    type="number"
                    min={1}
                    max={3}
                    value={choiceAmount}
                    onChange={(e) => setChoiceAmount(Number(e.target.value))}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Speed */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Скорость (в метрах)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Ходьба *</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={walkSpeed}
                onChange={(e) => setWalkSpeed(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Полёт</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={flySpeed}
                onChange={(e) => setFlySpeed(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Плавание</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={swimSpeed}
                onChange={(e) => setSwimSpeed(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Лазание</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={climbSpeed}
                onChange={(e) => setClimbSpeed(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Копание</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={burrowSpeed}
                onChange={(e) => setBurrowSpeed(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traits */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-zinc-100">Особенности расы</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTrait}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {traits.length === 0 && (
            <p className="text-sm text-zinc-500">Нет особенностей. Нажмите "Добавить" чтобы создать.</p>
          )}

          {traits.map((trait, index) => (
            <div key={index} className="p-4 bg-zinc-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Особенность #{index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTrait(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Ключ (для кода)</Label>
                  <Input
                    value={trait.key}
                    onChange={(e) => updateTrait(index, "key", e.target.value)}
                    placeholder="darkvision"
                    className="bg-zinc-900 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Название</Label>
                  <Input
                    value={trait.name}
                    onChange={(e) => updateTrait(index, "name", e.target.value)}
                    placeholder="Тёмное зрение"
                    className="bg-zinc-900 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Описание</Label>
                <Textarea
                  value={trait.description}
                  onChange={(e) => updateTrait(index, "description", e.target.value)}
                  placeholder="Вы видите в темноте на расстоянии 18 метров..."
                  rows={2}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Языки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {commonLanguages.map((language) => (
              <Badge
                key={language}
                variant={languages.includes(language) ? "default" : "outline"}
                className={`cursor-pointer ${
                  languages.includes(language)
                    ? "bg-primary text-primary-foreground"
                    : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                }`}
                onClick={() => toggleLanguage(language)}
              >
                {language}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={customLanguage}
              onChange={(e) => setCustomLanguage(e.target.value)}
              placeholder="Другой язык..."
              className="bg-zinc-800 border-zinc-700 text-zinc-100 flex-1"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomLanguage())}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomLanguage}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Proficiencies */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Владения</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weapons" className="text-zinc-300">
              Оружие (через запятую)
            </Label>
            <Input
              id="weapons"
              value={weaponProficiencies}
              onChange={(e) => setWeaponProficiencies(e.target.value)}
              placeholder="короткий меч, длинный лук"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="armor" className="text-zinc-300">
              Доспехи (через запятую)
            </Label>
            <Input
              id="armor"
              value={armorProficiencies}
              onChange={(e) => setArmorProficiencies(e.target.value)}
              placeholder="лёгкие"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tools" className="text-zinc-300">
              Инструменты (через запятую)
            </Label>
            <Input
              id="tools"
              value={toolProficiencies}
              onChange={(e) => setToolProficiencies(e.target.value)}
              placeholder="кузнечные инструменты"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Skill Proficiencies */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Владение навыками</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {skills.map((skill) => (
              <div key={skill.key} className="flex items-center space-x-2">
                <Checkbox
                  id={`skill-${skill.key}`}
                  checked={skillProficiencies.includes(skill.key)}
                  onCheckedChange={() => toggleSkill(skill.key)}
                  className="border-zinc-600"
                />
                <Label htmlFor={`skill-${skill.key}`} className="text-zinc-300 text-sm cursor-pointer">
                  {skill.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Age & Size Info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Дополнительная информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Возраст зрелости</Label>
              <Input
                type="number"
                min={0}
                value={ageMaturity}
                onChange={(e) => setAgeMaturity(Number(e.target.value))}
                placeholder="18"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Продолжительность жизни</Label>
              <Input
                type="number"
                min={0}
                value={ageLifespan}
                onChange={(e) => setAgeLifespan(Number(e.target.value))}
                placeholder="80"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Диапазон роста</Label>
              <Input
                value={heightRange}
                onChange={(e) => setHeightRange(e.target.value)}
                placeholder="150-180 см"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Диапазон веса</Label>
              <Input
                value={weightRange}
                onChange={(e) => setWeightRange(e.target.value)}
                placeholder="50-90 кг"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Привязка к сеттингам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableSettings.map((setting) => (
              <Badge
                key={setting.id}
                variant={selectedSettings.includes(setting.id) ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedSettings.includes(setting.id)
                    ? "bg-primary text-primary-foreground"
                    : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                }`}
                onClick={() => toggleSetting(setting.id)}
              >
                {setting.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/races")}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <X className="h-4 w-4 mr-2" />
          Отмена
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {mode === "create" ? "Создать" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
