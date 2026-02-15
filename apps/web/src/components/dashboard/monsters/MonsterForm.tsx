"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type {
  MonsterBackoffice,
  SettingOption,
  CreateMonsterRequest,
  UpdateMonsterRequest,
  MonsterTrait,
  MonsterAction,
  LegendaryAction,
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

// Monster type options
const monsterTypes = [
  { key: "aberration", name: "Аберрация" },
  { key: "beast", name: "Зверь" },
  { key: "celestial", name: "Небожитель" },
  { key: "construct", name: "Конструкт" },
  { key: "dragon", name: "Дракон" },
  { key: "elemental", name: "Элементаль" },
  { key: "fey", name: "Фея" },
  { key: "fiend", name: "Исчадие" },
  { key: "giant", name: "Великан" },
  { key: "humanoid", name: "Гуманоид" },
  { key: "monstrosity", name: "Монстр" },
  { key: "ooze", name: "Слизь" },
  { key: "plant", name: "Растение" },
  { key: "undead", name: "Нежить" },
];

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

// Common damage types
const damageTypes = [
  "кислота", "дробящий", "холод", "огонь", "силовое поле",
  "молния", "некротический", "колющий", "яд", "психический",
  "излучение", "рубящий", "звук",
];

// Common conditions
const conditions = [
  "ослеплён", "очарован", "оглушён", "испуган", "схвачен",
  "недееспособен", "невидим", "парализован", "окаменён", "отравлен",
  "сбит с ног", "опутан", "ошеломлён", "без сознания",
];

// Common languages
const commonLanguages = [
  "Общий", "Дварфийский", "Эльфийский", "Гигантский", "Гномий",
  "Гоблинский", "Полуросликов", "Орочий", "Драконий", "Бездны",
  "Небесный", "Инфернальный", "Первичный", "Глубинная речь",
  "Сильван", "Подземный", "Телепатия",
];

// CR options
const crOptions = [
  { value: "0", label: "0" },
  { value: "0.125", label: "1/8" },
  { value: "0.25", label: "1/4" },
  { value: "0.5", label: "1/2" },
  ...Array.from({ length: 30 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
];

// XP by CR
const xpByCR: Record<string, number> = {
  "0": 10, "0.125": 25, "0.25": 50, "0.5": 100,
  "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
  "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
  "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
  "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000,
  "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000,
  "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000,
};

interface MonsterFormProps {
  initialData?: MonsterBackoffice;
  initialSettings?: SettingOption[];
  mode: "create" | "edit";
}

export function MonsterForm({ initialData, initialSettings, mode }: MonsterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSettings, setAvailableSettings] = useState<SettingOption[]>([]);

  // Form state - Basic
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [size, setSize] = useState<typeof sizes[number]["key"]>(initialData?.size || "medium");
  const [type, setType] = useState(initialData?.type || "humanoid");
  const [alignment, setAlignment] = useState(initialData?.alignment || "");

  // Combat stats
  const [armorClass, setArmorClass] = useState(initialData?.armor_class || 10);
  const [armorType, setArmorType] = useState(initialData?.armor_type || "");
  const [hitPoints, setHitPoints] = useState(initialData?.hit_points || 1);
  const [hitDice, setHitDice] = useState(initialData?.hit_dice || "");
  const [challengeRating, setChallengeRating] = useState(
    initialData?.challenge_rating != null ? String(initialData.challenge_rating) : "1"
  );
  const [experiencePoints, setExperiencePoints] = useState(
    initialData?.experience_points || xpByCR["1"] || 200
  );

  // Abilities
  const [abilityScores, setAbilityScores] = useState({
    strength: initialData?.abilities?.strength || 10,
    dexterity: initialData?.abilities?.dexterity || 10,
    constitution: initialData?.abilities?.constitution || 10,
    intelligence: initialData?.abilities?.intelligence || 10,
    wisdom: initialData?.abilities?.wisdom || 10,
    charisma: initialData?.abilities?.charisma || 10,
  });

  // Speed
  const [walkSpeed, setWalkSpeed] = useState(initialData?.speed?.walk || 9);
  const [flySpeed, setFlySpeed] = useState(initialData?.speed?.fly || 0);
  const [swimSpeed, setSwimSpeed] = useState(initialData?.speed?.swim || 0);
  const [climbSpeed, setClimbSpeed] = useState(initialData?.speed?.climb || 0);
  const [burrowSpeed, setBurrowSpeed] = useState(initialData?.speed?.burrow || 0);

  // Saving throws
  const [savingThrows, setSavingThrows] = useState<Record<string, number>>(
    initialData?.saving_throws || {}
  );

  // Skills
  const [monsterSkills, setMonsterSkills] = useState<Record<string, number>>(
    initialData?.skills || {}
  );

  // Senses
  const [darkvision, setDarkvision] = useState(initialData?.senses?.darkvision || "");
  const [blindsight, setBlindsight] = useState(initialData?.senses?.blindsight || "");
  const [tremorsense, setTremorsense] = useState(initialData?.senses?.tremorsense || "");
  const [truesight, setTruesight] = useState(initialData?.senses?.truesight || "");
  const [passivePerception, setPassivePerception] = useState(
    initialData?.senses?.passive_perception || 10
  );

  // Languages
  const [languages, setLanguages] = useState<string[]>(initialData?.languages || []);
  const [customLanguage, setCustomLanguage] = useState("");

  // Resistances and immunities
  const [damageResistances, setDamageResistances] = useState<string[]>(
    initialData?.damage_resistances || []
  );
  const [damageImmunities, setDamageImmunities] = useState<string[]>(
    initialData?.damage_immunities || []
  );
  const [damageVulnerabilities, setDamageVulnerabilities] = useState<string[]>(
    initialData?.damage_vulnerabilities || []
  );
  const [conditionImmunities, setConditionImmunities] = useState<string[]>(
    initialData?.condition_immunities || []
  );

  // Traits
  const [traits, setTraits] = useState<MonsterTrait[]>(initialData?.traits || []);

  // Actions
  const [actions, setActions] = useState<MonsterAction[]>(initialData?.actions || []);

  // Legendary actions
  const [hasLegendaryActions, setHasLegendaryActions] = useState(
    !!initialData?.legendary_actions
  );
  const [legendaryPerRound, setLegendaryPerRound] = useState(
    initialData?.legendary_actions?.per_round || 3
  );
  const [legendaryActions, setLegendaryActions] = useState<LegendaryAction[]>(
    initialData?.legendary_actions?.actions || []
  );

  // Settings
  const [selectedSettings, setSelectedSettings] = useState<number[]>(
    initialSettings?.map((s) => s.id) || []
  );

  // Fetch available settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.getMonsterSettings();
        setAvailableSettings(response.data.settings);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
    };
    void fetchSettings();
  }, []);

  // Update XP when CR changes
  useEffect(() => {
    if (xpByCR[challengeRating]) {
      setExperiencePoints(xpByCR[challengeRating]);
    }
  }, [challengeRating]);

  // Handle ability score change
  const handleAbilityChange = (ability: string, value: number) => {
    setAbilityScores({ ...abilityScores, [ability]: Math.max(1, Math.min(30, value)) });
  };

  // Handle saving throw toggle
  const toggleSavingThrow = (ability: string) => {
    if (savingThrows[ability] !== undefined) {
      const newSaves = { ...savingThrows };
      delete newSaves[ability];
      setSavingThrows(newSaves);
    } else {
      const mod = Math.floor((abilityScores[ability as keyof typeof abilityScores] - 10) / 2);
      const profBonus = Math.floor((Number(challengeRating) - 1) / 4) + 2;
      setSavingThrows({ ...savingThrows, [ability]: mod + profBonus });
    }
  };

  // Handle skill toggle
  const toggleSkill = (skill: string) => {
    if (monsterSkills[skill] !== undefined) {
      const newSkills = { ...monsterSkills };
      delete newSkills[skill];
      setMonsterSkills(newSkills);
    } else {
      setMonsterSkills({ ...monsterSkills, [skill]: 0 });
    }
  };

  // Handle trait
  const addTrait = () => {
    setTraits([...traits, { name: "", description: "" }]);
  };

  const updateTrait = (index: number, field: keyof MonsterTrait, value: string) => {
    const newTraits = [...traits];
    newTraits[index] = { ...newTraits[index], [field]: value };
    setTraits(newTraits);
  };

  const removeTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };

  // Handle action
  const addAction = () => {
    setActions([...actions, { name: "", description: "" }]);
  };

  const updateAction = (index: number, field: keyof MonsterAction, value: string | number) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  // Handle legendary action
  const addLegendaryAction = () => {
    setLegendaryActions([...legendaryActions, { name: "", cost: 1, description: "" }]);
  };

  const updateLegendaryAction = (index: number, field: keyof LegendaryAction, value: string | number) => {
    const newActions = [...legendaryActions];
    newActions[index] = { ...newActions[index], [field]: value };
    setLegendaryActions(newActions);
  };

  const removeLegendaryAction = (index: number) => {
    setLegendaryActions(legendaryActions.filter((_, i) => i !== index));
  };

  // Toggle language
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

  // Toggle damage type in list
  const toggleInList = (item: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
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
      toast.error("Введите название монстра");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build speed
      const speed: CreateMonsterRequest["speed"] = { walk: walkSpeed };
      if (flySpeed > 0) speed.fly = flySpeed;
      if (swimSpeed > 0) speed.swim = swimSpeed;
      if (climbSpeed > 0) speed.climb = climbSpeed;
      if (burrowSpeed > 0) speed.burrow = burrowSpeed;

      // Build senses
      const senses: CreateMonsterRequest["senses"] = {
        passive_perception: passivePerception,
      };
      if (darkvision.trim()) senses.darkvision = darkvision.trim();
      if (blindsight.trim()) senses.blindsight = blindsight.trim();
      if (tremorsense.trim()) senses.tremorsense = tremorsense.trim();
      if (truesight.trim()) senses.truesight = truesight.trim();

      // Build legendary actions
      const legendaryActionsData = hasLegendaryActions && legendaryActions.length > 0
        ? { per_round: legendaryPerRound, actions: legendaryActions }
        : undefined;

      const data: CreateMonsterRequest | UpdateMonsterRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        slug: slug.trim() || undefined,
        size,
        type,
        alignment: alignment.trim() || undefined,
        armor_class: armorClass,
        armor_type: armorType.trim() || undefined,
        hit_points: hitPoints,
        hit_dice: hitDice.trim() || undefined,
        challenge_rating: Number(challengeRating),
        experience_points: experiencePoints,
        abilities: abilityScores,
        speed,
        saving_throws: Object.keys(savingThrows).length > 0 ? savingThrows : undefined,
        skills: Object.keys(monsterSkills).length > 0 ? monsterSkills : undefined,
        senses,
        languages,
        damage_resistances: damageResistances,
        damage_immunities: damageImmunities,
        damage_vulnerabilities: damageVulnerabilities,
        condition_immunities: conditionImmunities,
        traits: traits.filter((t) => t.name.trim() && t.description.trim()),
        actions: actions.filter((a) => a.name.trim() && a.description.trim()),
        legendary_actions: legendaryActionsData,
        setting_ids: selectedSettings,
      };

      if (mode === "create") {
        await api.createMonster(data as CreateMonsterRequest);
        toast.success("Монстр создан");
      } else {
        await api.updateMonster(initialData!.id, data as UpdateMonsterRequest);
        toast.success("Монстр обновлён");
      }

      router.push("/dashboard/monsters");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Не удалось сохранить монстра");
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
                placeholder="Гоблин"
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
                placeholder="goblin"
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
              placeholder="Маленькое злобное существо..."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
              <Label className="text-zinc-300">
                Тип <span className="text-red-400">*</span>
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {monsterTypes.map((t) => (
                    <SelectItem key={t.key} value={t.key} className="text-zinc-100">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alignment" className="text-zinc-300">
                Мировоззрение
              </Label>
              <Input
                id="alignment"
                value={alignment}
                onChange={(e) => setAlignment(e.target.value)}
                placeholder="нейтрально-злой"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combat Stats */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Боевые характеристики</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Класс Доспеха <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={armorClass}
                onChange={(e) => setArmorClass(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Тип доспеха</Label>
              <Input
                value={armorType}
                onChange={(e) => setArmorType(e.target.value)}
                placeholder="природный доспех"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">
                Очки Здоровья <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={hitPoints}
                onChange={(e) => setHitPoints(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Кость здоровья</Label>
              <Input
                value={hitDice}
                onChange={(e) => setHitDice(e.target.value)}
                placeholder="2d6+2"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Опасность (CR)</Label>
              <Select value={challengeRating} onValueChange={setChallengeRating}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                  {crOptions.map((cr) => (
                    <SelectItem key={cr.value} value={cr.value} className="text-zinc-100">
                      {cr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Опыт (XP)</Label>
              <Input
                type="number"
                min={0}
                value={experiencePoints}
                onChange={(e) => setExperiencePoints(Number(e.target.value))}
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
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {abilities.map((ability) => (
              <div key={ability.key} className="space-y-2 text-center">
                <Label className="text-zinc-300 text-sm">{ability.short}</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={abilityScores[ability.key as keyof typeof abilityScores]}
                  onChange={(e) => handleAbilityChange(ability.key, Number(e.target.value))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 text-center"
                />
                <div className="text-xs text-zinc-500">
                  {(() => {
                    const mod = Math.floor(
                      (abilityScores[ability.key as keyof typeof abilityScores] - 10) / 2
                    );
                    return mod >= 0 ? `+${mod}` : mod;
                  })()}
                </div>
              </div>
            ))}
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
                value={burrowSpeed}
                onChange={(e) => setBurrowSpeed(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saving Throws & Skills */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Спасброски и навыки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-zinc-300 mb-2 block">Спасброски</Label>
            <div className="flex flex-wrap gap-2">
              {abilities.map((ability) => (
                <Badge
                  key={ability.key}
                  variant={savingThrows[ability.key] !== undefined ? "default" : "outline"}
                  className={`cursor-pointer ${
                    savingThrows[ability.key] !== undefined
                      ? "bg-primary text-primary-foreground"
                      : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                  }`}
                  onClick={() => toggleSavingThrow(ability.key)}
                >
                  {ability.short}
                  {savingThrows[ability.key] !== undefined && ` +${savingThrows[ability.key]}`}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-zinc-300 mb-2 block">Навыки</Label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge
                  key={skill.key}
                  variant={monsterSkills[skill.key] !== undefined ? "default" : "outline"}
                  className={`cursor-pointer ${
                    monsterSkills[skill.key] !== undefined
                      ? "bg-primary text-primary-foreground"
                      : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                  }`}
                  onClick={() => toggleSkill(skill.key)}
                >
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Senses */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Чувства</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Тёмное зрение</Label>
              <Input
                value={darkvision}
                onChange={(e) => setDarkvision(e.target.value)}
                placeholder="18 м"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Слепое зрение</Label>
              <Input
                value={blindsight}
                onChange={(e) => setBlindsight(e.target.value)}
                placeholder="9 м"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Чувство вибрации</Label>
              <Input
                value={tremorsense}
                onChange={(e) => setTremorsense(e.target.value)}
                placeholder="18 м"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Истинное зрение</Label>
              <Input
                value={truesight}
                onChange={(e) => setTruesight(e.target.value)}
                placeholder="36 м"
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">Пассивная Внимательность</Label>
              <Input
                type="number"
                min={1}
                value={passivePerception}
                onChange={(e) => setPassivePerception(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
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

      {/* Damage Resistances/Immunities */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">Сопротивления и иммунитеты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-zinc-300 mb-2 block">Сопротивления к урону</Label>
            <div className="flex flex-wrap gap-2">
              {damageTypes.map((dt) => (
                <Badge
                  key={dt}
                  variant={damageResistances.includes(dt) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    damageResistances.includes(dt)
                      ? "bg-yellow-600 text-white"
                      : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                  }`}
                  onClick={() => toggleInList(dt, damageResistances, setDamageResistances)}
                >
                  {dt}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-zinc-300 mb-2 block">Иммунитеты к урону</Label>
            <div className="flex flex-wrap gap-2">
              {damageTypes.map((dt) => (
                <Badge
                  key={dt}
                  variant={damageImmunities.includes(dt) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    damageImmunities.includes(dt)
                      ? "bg-red-600 text-white"
                      : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                  }`}
                  onClick={() => toggleInList(dt, damageImmunities, setDamageImmunities)}
                >
                  {dt}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-zinc-300 mb-2 block">Уязвимости к урону</Label>
            <div className="flex flex-wrap gap-2">
              {damageTypes.map((dt) => (
                <Badge
                  key={dt}
                  variant={damageVulnerabilities.includes(dt) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    damageVulnerabilities.includes(dt)
                      ? "bg-purple-600 text-white"
                      : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                  }`}
                  onClick={() => toggleInList(dt, damageVulnerabilities, setDamageVulnerabilities)}
                >
                  {dt}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-zinc-300 mb-2 block">Иммунитеты к состояниям</Label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((cond) => (
                <Badge
                  key={cond}
                  variant={conditionImmunities.includes(cond) ? "default" : "outline"}
                  className={`cursor-pointer ${
                    conditionImmunities.includes(cond)
                      ? "bg-blue-600 text-white"
                      : "text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                  }`}
                  onClick={() => toggleInList(cond, conditionImmunities, setConditionImmunities)}
                >
                  {cond}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traits */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-zinc-100">Особенности</CardTitle>
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
            <p className="text-sm text-zinc-500">Нет особенностей. Нажмите &quot;Добавить&quot;.</p>
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

              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Название</Label>
                <Input
                  value={trait.name}
                  onChange={(e) => updateTrait(index, "name", e.target.value)}
                  placeholder="Тёмное зрение"
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Описание</Label>
                <Textarea
                  value={trait.description}
                  onChange={(e) => updateTrait(index, "description", e.target.value)}
                  placeholder="Гоблин видит в темноте..."
                  rows={2}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-zinc-100">Действия</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAction}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {actions.length === 0 && (
            <p className="text-sm text-zinc-500">Нет действий. Нажмите &quot;Добавить&quot;.</p>
          )}

          {actions.map((action, index) => (
            <div key={index} className="p-4 bg-zinc-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Действие #{index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAction(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Название</Label>
                  <Input
                    value={action.name}
                    onChange={(e) => updateAction(index, "name", e.target.value)}
                    placeholder="Скимитар"
                    className="bg-zinc-900 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Тип</Label>
                  <Select
                    value={action.type || ""}
                    onValueChange={(v) => updateAction(index, "type", v)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="melee" className="text-zinc-100">Ближний бой</SelectItem>
                      <SelectItem value="ranged" className="text-zinc-100">Дальний бой</SelectItem>
                      <SelectItem value="special" className="text-zinc-100">Особое</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 text-sm">Описание</Label>
                <Textarea
                  value={action.description}
                  onChange={(e) => updateAction(index, "description", e.target.value)}
                  placeholder="Рукопашная атака оружием: +4 к попаданию..."
                  rows={2}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Legendary Actions */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="legendary"
              checked={hasLegendaryActions}
              onCheckedChange={(checked) => setHasLegendaryActions(checked === true)}
              className="border-zinc-600"
            />
            <Label htmlFor="legendary" className="text-zinc-100 cursor-pointer text-lg font-semibold">
              Легендарные действия
            </Label>
          </div>
        </CardHeader>
        {hasLegendaryActions && (
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="text-zinc-300">Действий в раунд:</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={legendaryPerRound}
                onChange={(e) => setLegendaryPerRound(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 w-20"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLegendaryAction}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 ml-auto"
              >
                <Plus className="h-4 w-4 mr-1" />
                Добавить
              </Button>
            </div>

            {legendaryActions.map((action, index) => (
              <div key={index} className="p-4 bg-zinc-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Легендарное #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLegendaryAction(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm">Название</Label>
                    <Input
                      value={action.name}
                      onChange={(e) => updateLegendaryAction(index, "name", e.target.value)}
                      placeholder="Обнаружение"
                      className="bg-zinc-900 border-zinc-700 text-zinc-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm">Стоимость</Label>
                    <Input
                      type="number"
                      min={1}
                      max={3}
                      value={action.cost}
                      onChange={(e) => updateLegendaryAction(index, "cost", Number(e.target.value))}
                      className="bg-zinc-900 border-zinc-700 text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 text-sm">Описание</Label>
                  <Textarea
                    value={action.description}
                    onChange={(e) => updateLegendaryAction(index, "description", e.target.value)}
                    placeholder="Монстр совершает проверку Внимательности."
                    rows={2}
                    className="bg-zinc-900 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        )}
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
          onClick={() => router.push("/dashboard/monsters")}
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
