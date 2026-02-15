"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type {
  SpellBackoffice,
  SettingOption,
  CreateSpellRequest,
  UpdateSpellRequest,
  SpellSchool,
  SpellComponents,
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
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

// Spell schools with Russian names
const spellSchools: { key: SpellSchool; name: string }[] = [
  { key: "abjuration", name: "Ограждение" },
  { key: "conjuration", name: "Вызов" },
  { key: "divination", name: "Прорицание" },
  { key: "enchantment", name: "Очарование" },
  { key: "evocation", name: "Воплощение" },
  { key: "illusion", name: "Иллюзия" },
  { key: "necromancy", name: "Некромантия" },
  { key: "transmutation", name: "Преобразование" },
];

// Spell levels
const spellLevels = [
  { value: 0, label: "Заговор" },
  { value: 1, label: "1 уровень" },
  { value: 2, label: "2 уровень" },
  { value: 3, label: "3 уровень" },
  { value: 4, label: "4 уровень" },
  { value: 5, label: "5 уровень" },
  { value: 6, label: "6 уровень" },
  { value: 7, label: "7 уровень" },
  { value: 8, label: "8 уровень" },
  { value: 9, label: "9 уровень" },
];

// Character classes that can cast spells
const spellcastingClasses = [
  { key: "wizard", name: "Волшебник" },
  { key: "sorcerer", name: "Чародей" },
  { key: "cleric", name: "Жрец" },
  { key: "druid", name: "Друид" },
  { key: "bard", name: "Бард" },
  { key: "paladin", name: "Паладин" },
  { key: "ranger", name: "Следопыт" },
  { key: "warlock", name: "Колдун" },
  { key: "artificer", name: "Изобретатель" },
];

// Common casting times
const commonCastingTimes = [
  "1 действие",
  "1 бонусное действие",
  "1 реакция",
  "1 минута",
  "10 минут",
  "1 час",
  "8 часов",
  "12 часов",
  "24 часа",
];

// Common durations
const commonDurations = [
  "Мгновенная",
  "1 раунд",
  "1 минута",
  "10 минут",
  "1 час",
  "8 часов",
  "24 часа",
  "До рассеивания",
  "Пока не сработает",
  "Особая",
];

// Common ranges
const commonRanges = [
  "На себя",
  "Касание",
  "1,5 м",
  "3 м",
  "9 м",
  "18 м",
  "27 м",
  "36 м",
  "45 м",
  "90 м",
  "150 м",
  "300 м",
  "1,5 км",
  "В пределах видимости",
  "Неограниченная",
];

interface SpellFormProps {
  initialData?: SpellBackoffice;
  initialSettings?: SettingOption[];
  mode: "create" | "edit";
}

export function SpellForm({ initialData, initialSettings, mode }: SpellFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSettings, setAvailableSettings] = useState<SettingOption[]>([]);

  // Basic info
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [slug, setSlug] = useState(initialData?.slug || "");

  // Spell properties
  const [level, setLevel] = useState(initialData?.level ?? 0);
  const [school, setSchool] = useState<SpellSchool>(initialData?.school || "evocation");
  const [castingTime, setCastingTime] = useState(initialData?.casting_time || "1 действие");
  const [range, setRange] = useState(initialData?.range || "На себя");
  const [duration, setDuration] = useState(initialData?.duration || "Мгновенная");
  const [concentration, setConcentration] = useState(initialData?.concentration || false);
  const [ritual, setRitual] = useState(initialData?.ritual || false);

  // Components
  const [verbal, setVerbal] = useState(initialData?.components?.verbal ?? true);
  const [somatic, setSomatic] = useState(initialData?.components?.somatic ?? true);
  const [material, setMaterial] = useState(initialData?.components?.material ?? false);
  const [materialDescription, setMaterialDescription] = useState(
    initialData?.components?.material_description || ""
  );
  const [materialCost, setMaterialCost] = useState(
    initialData?.components?.material_cost || ""
  );

  // Classes
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    initialData?.classes || []
  );

  // Higher levels
  const [higherLevels, setHigherLevels] = useState(
    initialData?.higher_levels?.description || ""
  );

  // Cantrip scaling (for cantrips)
  const [cantripScaling5, setCantripScaling5] = useState(
    initialData?.cantrip_scaling?.["5"] || ""
  );
  const [cantripScaling11, setCantripScaling11] = useState(
    initialData?.cantrip_scaling?.["11"] || ""
  );
  const [cantripScaling17, setCantripScaling17] = useState(
    initialData?.cantrip_scaling?.["17"] || ""
  );

  // Settings
  const [selectedSettings, setSelectedSettings] = useState<number[]>(
    initialSettings?.map((s) => s.id) || []
  );

  // Fetch available settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.getSpellSettings();
        setAvailableSettings(response.data.settings);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    void fetchSettings();
  }, []);

  // Toggle class
  const toggleClass = (classKey: string) => {
    if (selectedClasses.includes(classKey)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== classKey));
    } else {
      setSelectedClasses([...selectedClasses, classKey]);
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
      toast.error("Введите название заклинания");
      return;
    }

    if (!description.trim()) {
      toast.error("Введите описание заклинания");
      return;
    }

    if (selectedClasses.length === 0) {
      toast.error("Выберите хотя бы один класс");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build components
      const components: SpellComponents = {
        verbal,
        somatic,
        material,
      };
      if (material && materialDescription.trim()) {
        components.material_description = materialDescription.trim();
      }
      if (material && materialCost.trim()) {
        components.material_cost = materialCost.trim();
      }

      // Build higher levels
      const higherLevelsData = higherLevels.trim()
        ? { description: higherLevels.trim() }
        : undefined;

      // Build cantrip scaling (only for cantrips)
      let cantripScalingData: Record<string, string> | undefined;
      if (level === 0) {
        cantripScalingData = {};
        if (cantripScaling5.trim()) cantripScalingData["5"] = cantripScaling5.trim();
        if (cantripScaling11.trim()) cantripScalingData["11"] = cantripScaling11.trim();
        if (cantripScaling17.trim()) cantripScalingData["17"] = cantripScaling17.trim();
        if (Object.keys(cantripScalingData).length === 0) {
          cantripScalingData = undefined;
        }
      }

      const data: CreateSpellRequest | UpdateSpellRequest = {
        name: name.trim(),
        description: description.trim(),
        slug: slug.trim() || undefined,
        level,
        school,
        casting_time: castingTime,
        range,
        duration,
        concentration,
        ritual,
        components,
        classes: selectedClasses,
        higher_levels: higherLevelsData,
        cantrip_scaling: cantripScalingData,
        setting_ids: selectedSettings,
      };

      if (mode === "create") {
        await api.createSpell(data as CreateSpellRequest);
        toast.success("Заклинание создано");
      } else {
        await api.updateSpell(initialData!.id, data as UpdateSpellRequest);
        toast.success("Заклинание обновлено");
      }

      router.push("/dashboard/spells");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось сохранить заклинание");
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
                placeholder="Огненный шар"
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
                placeholder="fireball"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-300">
              Описание <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Яркий луч вылетает из вашего указательного пальца в точку, выбранную вами в пределах дистанции..."
              rows={6}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Spell Properties */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Свойства заклинания</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Уровень <span className="text-red-400">*</span>
              </Label>
              <Select
                value={String(level)}
                onValueChange={(v) => setLevel(Number(v))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {spellLevels.map((l) => (
                    <SelectItem
                      key={l.value}
                      value={String(l.value)}
                      className="text-zinc-100"
                    >
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">
                Школа <span className="text-red-400">*</span>
              </Label>
              <Select value={school} onValueChange={(v) => setSchool(v as SpellSchool)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {spellSchools.map((s) => (
                    <SelectItem key={s.key} value={s.key} className="text-zinc-100">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Время накладывания <span className="text-red-400">*</span>
              </Label>
              <Select value={castingTime} onValueChange={setCastingTime}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {commonCastingTimes.map((ct) => (
                    <SelectItem key={ct} value={ct} className="text-zinc-100">
                      {ct}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={castingTime}
                onChange={(e) => setCastingTime(e.target.value)}
                placeholder="Или введите своё..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">
                Дистанция <span className="text-red-400">*</span>
              </Label>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                  {commonRanges.map((r) => (
                    <SelectItem key={r} value={r} className="text-zinc-100">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder="Или введите своё..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">
                Длительность <span className="text-red-400">*</span>
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                  {commonDurations.map((d) => (
                    <SelectItem key={d} value={d} className="text-zinc-100">
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Или введите своё..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 mt-1"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="concentration"
                checked={concentration}
                onCheckedChange={(checked) => setConcentration(checked === true)}
                className="border-zinc-600"
              />
              <Label htmlFor="concentration" className="text-zinc-300 cursor-pointer">
                Концентрация
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ritual"
                checked={ritual}
                onCheckedChange={(checked) => setRitual(checked === true)}
                className="border-zinc-600"
              />
              <Label htmlFor="ritual" className="text-zinc-300 cursor-pointer">
                Ритуал
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Components */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Компоненты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verbal"
                checked={verbal}
                onCheckedChange={(checked) => setVerbal(checked === true)}
                className="border-zinc-600"
              />
              <Label htmlFor="verbal" className="text-zinc-300 cursor-pointer">
                Вербальный (В)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="somatic"
                checked={somatic}
                onCheckedChange={(checked) => setSomatic(checked === true)}
                className="border-zinc-600"
              />
              <Label htmlFor="somatic" className="text-zinc-300 cursor-pointer">
                Соматический (С)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="material"
                checked={material}
                onCheckedChange={(checked) => setMaterial(checked === true)}
                className="border-zinc-600"
              />
              <Label htmlFor="material" className="text-zinc-300 cursor-pointer">
                Материальный (М)
              </Label>
            </div>
          </div>

          {material && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-300">Описание материала</Label>
                <Input
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  placeholder="крошечный шарик из гуано летучей мыши и серы"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Стоимость материала</Label>
                <Input
                  value={materialCost}
                  onChange={(e) => setMaterialCost(e.target.value)}
                  placeholder="алмаз стоимостью 500 зм"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classes */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">
            Классы <span className="text-red-400 text-sm font-normal">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {spellcastingClasses.map((cls) => (
              <Badge
                key={cls.key}
                variant={selectedClasses.includes(cls.key) ? "default" : "outline"}
                className={`cursor-pointer ${
                  selectedClasses.includes(cls.key)
                    ? "bg-primary text-primary-foreground"
                    : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                }`}
                onClick={() => toggleClass(cls.key)}
              >
                {cls.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Higher Levels */}
      {level > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">На более высоких уровнях</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={higherLevels}
              onChange={(e) => setHigherLevels(e.target.value)}
              placeholder="Если вы сотворяете это заклинание, используя ячейку 4 уровня или выше, урон увеличивается на 1d6 за каждый уровень ячейки выше 3."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </CardContent>
        </Card>
      )}

      {/* Cantrip Scaling */}
      {level === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Масштабирование заговора</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-zinc-300">5-й уровень персонажа</Label>
                <Input
                  value={cantripScaling5}
                  onChange={(e) => setCantripScaling5(e.target.value)}
                  placeholder="2d10"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">11-й уровень персонажа</Label>
                <Input
                  value={cantripScaling11}
                  onChange={(e) => setCantripScaling11(e.target.value)}
                  placeholder="3d10"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">17-й уровень персонажа</Label>
                <Input
                  value={cantripScaling17}
                  onChange={(e) => setCantripScaling17(e.target.value)}
                  placeholder="4d10"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          onClick={() => router.push("/dashboard/spells")}
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
