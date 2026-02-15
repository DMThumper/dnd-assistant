"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type {
  CharacterClassBackoffice,
  SettingOption,
  CreateClassRequest,
  UpdateClassRequest,
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

// Ability options
const abilities = [
  { key: "strength", name: "Сила" },
  { key: "dexterity", name: "Ловкость" },
  { key: "constitution", name: "Телосложение" },
  { key: "intelligence", name: "Интеллект" },
  { key: "wisdom", name: "Мудрость" },
  { key: "charisma", name: "Харизма" },
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

// Hit dice options
const hitDice = ["d6", "d8", "d10", "d12"];

interface ClassFormProps {
  initialData?: CharacterClassBackoffice;
  initialSettings?: SettingOption[];
  mode: "create" | "edit";
}

export function ClassForm({ initialData, initialSettings, mode }: ClassFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSettings, setAvailableSettings] = useState<SettingOption[]>([]);

  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [hitDie, setHitDie] = useState(initialData?.hit_die || "d8");
  const [primaryAbilities, setPrimaryAbilities] = useState<string[]>(
    initialData?.primary_abilities || []
  );
  const [savingThrows, setSavingThrows] = useState<string[]>(
    initialData?.saving_throws || []
  );
  const [skillChoices, setSkillChoices] = useState(initialData?.skill_choices || 2);
  const [skillOptions, setSkillOptions] = useState<string[]>(
    initialData?.skill_options || []
  );
  const [armorProficiencies, setArmorProficiencies] = useState(
    initialData?.armor_proficiencies?.join(", ") || ""
  );
  const [weaponProficiencies, setWeaponProficiencies] = useState(
    initialData?.weapon_proficiencies?.join(", ") || ""
  );
  const [isSpellcaster, setIsSpellcaster] = useState(initialData?.is_spellcaster || false);
  const [spellcastingAbility, setSpellcastingAbility] = useState(
    initialData?.spellcasting_ability || ""
  );
  const [selectedSettings, setSelectedSettings] = useState<number[]>(
    initialSettings?.map((s) => s.id) || []
  );

  // Fetch available settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.getClassSettings();
        setAvailableSettings(response.data.settings);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    void fetchSettings();
  }, []);

  // Handle ability toggle
  const toggleAbility = (ability: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(ability)) {
      setList(list.filter((a) => a !== ability));
    } else {
      setList([...list, ability]);
    }
  };

  // Handle skill toggle
  const toggleSkill = (skill: string) => {
    if (skillOptions.includes(skill)) {
      setSkillOptions(skillOptions.filter((s) => s !== skill));
    } else {
      setSkillOptions([...skillOptions, skill]);
    }
  };

  // Handle setting toggle
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
      toast.error("Введите название класса");
      return;
    }

    if (primaryAbilities.length === 0) {
      toast.error("Выберите хотя бы одну основную характеристику");
      return;
    }

    if (savingThrows.length !== 2) {
      toast.error("Выберите ровно 2 спасброска");
      return;
    }

    if (skillOptions.length < 2) {
      toast.error("Выберите хотя бы 2 навыка");
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateClassRequest | UpdateClassRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        slug: slug.trim() || undefined,
        hit_die: hitDie,
        primary_abilities: primaryAbilities,
        saving_throws: savingThrows,
        skill_choices: skillChoices,
        skill_options: skillOptions,
        armor_proficiencies: armorProficiencies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        weapon_proficiencies: weaponProficiencies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        is_spellcaster: isSpellcaster,
        spellcasting_ability: isSpellcaster ? spellcastingAbility : undefined,
        setting_ids: selectedSettings,
      };

      if (mode === "create") {
        await api.createClass(data as CreateClassRequest);
        toast.success("Класс создан");
      } else {
        await api.updateClass(initialData!.id, data as UpdateClassRequest);
        toast.success("Класс обновлён");
      }

      router.push("/dashboard/classes");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось сохранить класс");
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
                placeholder="Воин"
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
                placeholder="fighter"
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
              placeholder="Мастера боевых искусств..."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Кость здоровья <span className="text-red-400">*</span>
              </Label>
              <Select value={hitDie} onValueChange={setHitDie}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {hitDice.map((die) => (
                    <SelectItem key={die} value={die} className="text-zinc-100">
                      {die}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">
                Количество навыков на выбор <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={6}
                value={skillChoices}
                onChange={(e) => setSkillChoices(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abilities */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Характеристики</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">
              Основные характеристики <span className="text-red-400">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {abilities.map((ability) => (
                <Badge
                  key={ability.key}
                  variant={primaryAbilities.includes(ability.key) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    primaryAbilities.includes(ability.key)
                      ? "bg-primary text-primary-foreground"
                      : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                  }`}
                  onClick={() => toggleAbility(ability.key, primaryAbilities, setPrimaryAbilities)}
                >
                  {ability.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">
              Спасброски (выберите 2) <span className="text-red-400">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {abilities.map((ability) => (
                <Badge
                  key={ability.key}
                  variant={savingThrows.includes(ability.key) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    savingThrows.includes(ability.key)
                      ? "bg-primary text-primary-foreground"
                      : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                  }`}
                  onClick={() => toggleAbility(ability.key, savingThrows, setSavingThrows)}
                >
                  {ability.name}
                </Badge>
              ))}
            </div>
            {savingThrows.length !== 2 && (
              <p className="text-xs text-zinc-500">Выбрано: {savingThrows.length}/2</p>
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
          <div className="space-y-2">
            <Label htmlFor="armor" className="text-zinc-300">
              Доспехи (через запятую)
            </Label>
            <Input
              id="armor"
              value={armorProficiencies}
              onChange={(e) => setArmorProficiencies(e.target.value)}
              placeholder="лёгкие, средние, щиты"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weapons" className="text-zinc-300">
              Оружие (через запятую)
            </Label>
            <Input
              id="weapons"
              value={weaponProficiencies}
              onChange={(e) => setWeaponProficiencies(e.target.value)}
              placeholder="простое, воинское"
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">
            Навыки на выбор <span className="text-red-400">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {skills.map((skill) => (
              <div key={skill.key} className="flex items-center space-x-2">
                <Checkbox
                  id={skill.key}
                  checked={skillOptions.includes(skill.key)}
                  onCheckedChange={() => toggleSkill(skill.key)}
                  className="border-zinc-600"
                />
                <Label htmlFor={skill.key} className="text-zinc-300 text-sm cursor-pointer">
                  {skill.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Spellcasting */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Колдовство</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="spellcaster"
              checked={isSpellcaster}
              onCheckedChange={(checked) => setIsSpellcaster(checked === true)}
              className="border-zinc-600"
            />
            <Label htmlFor="spellcaster" className="text-zinc-300 cursor-pointer">
              Класс умеет колдовать
            </Label>
          </div>

          {isSpellcaster && (
            <div className="space-y-2">
              <Label className="text-zinc-300">Характеристика заклинаний</Label>
              <Select value={spellcastingAbility} onValueChange={setSpellcastingAbility}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Выберите характеристику" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {abilities.map((ability) => (
                    <SelectItem key={ability.key} value={ability.key} className="text-zinc-100">
                      {ability.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
          onClick={() => router.push("/dashboard/classes")}
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
