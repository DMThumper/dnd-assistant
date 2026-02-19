"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePlayerSession } from "@/contexts/PlayerSessionContext";
import { api } from "@/lib/api";
import type { Character } from "@/types/game";
import type { SummonedCreature, Monster, SummonType } from "@/types/summon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Ghost,
  Plus,
  Heart,
  Shield,
  Swords,
  ChevronDown,
  X,
  Minus,
  Footprints,
  Flame,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUMMON_TYPE_LABELS: Record<SummonType, string> = {
  familiar: "Фамильяр",
  spirit: "Дух",
  beast: "Зверь",
  conjured: "Призванное существо",
  animated: "Оживлённое",
  other: "Другое",
};

const SUMMON_TYPE_COLORS: Record<SummonType, string> = {
  familiar: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  spirit: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  beast: "bg-green-500/20 text-green-400 border-green-500/30",
  conjured: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  animated: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

// Quick summon templates based on subclass
interface QuickSummonTemplate {
  key: string;
  name: string;
  type: SummonType;
  icon: React.ReactNode;
  description: string;
  getStats: (level: number, proficiencyBonus: number) => {
    max_hp: number;
    ac: number;
    speed: string;
    abilities: string;
    attack: string;
    special: string;
  };
}

const SUBCLASS_SUMMONS: Record<string, QuickSummonTemplate[]> = {
  "druid-circle-of-wildfire": [
    {
      key: "wildfire-spirit",
      name: "Дух Дикого Огня",
      type: "spirit",
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      description: "Призывается действием, тратя использование Дикого облика",
      getStats: (level, pb) => ({
        max_hp: 5 + 5 * level,
        ac: 13,
        speed: "9 м (парит)",
        abilities: "СИЛ 10, ЛОВ 14, ТЕЛ 14, ИНТ 13, МДР 15, ХАР 11",
        attack: `Огненный плевок: +${pb + 3} к попаданию, 18 м, 1d6+${pb} огня`,
        special: `Огненная телепортация (бонусное действие): телепортирует союзника на 4,5 м, 1d6+${pb} урона в начальной точке`,
      }),
    },
  ],
  "druid-circle-of-stars": [
    {
      key: "starry-form",
      name: "Звёздный облик",
      type: "spirit",
      icon: <Sparkles className="h-5 w-5 text-yellow-400" />,
      description: "Бонусным действием тратите Дикий облик → светящийся облик (не зверь)",
      getStats: (level, pb) => ({
        max_hp: 0, // Not separate HP
        ac: 0,
        speed: "Ваша скорость",
        abilities: "Ваши характеристики",
        attack: level >= 10 ? "Лучник/Дракон/Чаша с усилением" : "Лучник: 1d8+МДР излучения / Дракон: мин. 10 на концентрации / Чаша: 1d8+МДР лечения",
        special: "Выберите созвездие при активации",
      }),
    },
  ],
};

export default function SummonsPage() {
  const router = useRouter();
  const {
    character: contextCharacter,
    activeCharacterId,
    isValidating,
    setActiveCharacter,
  } = usePlayerSession();

  const [localCharacter, setLocalCharacter] = useState<Character | null>(null);
  const [summons, setSummons] = useState<SummonedCreature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummonDialogOpen, setIsSummonDialogOpen] = useState(false);
  const [availableMonsters, setAvailableMonsters] = useState<Monster[]>([]);
  const [isLoadingMonsters, setIsLoadingMonsters] = useState(false);

  const character = contextCharacter || localCharacter;

  // Load character if needed
  const loadCharacter = useCallback(async () => {
    if (!activeCharacterId || character) return;

    setIsLoading(true);
    try {
      const response = await api.getCharacter(activeCharacterId);
      if (response.data?.character) {
        setLocalCharacter(response.data.character);
        setActiveCharacter(activeCharacterId, response.data.character.campaign_id);
      }
    } catch (error) {
      console.error("Failed to load character:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCharacterId, character, setActiveCharacter]);

  // Load summons
  const loadSummons = useCallback(async () => {
    if (!activeCharacterId) return;

    try {
      const response = await api.getSummons(activeCharacterId);
      if (response.data?.summons) {
        setSummons(response.data.summons);
      }
    } catch (error) {
      console.error("Failed to load summons:", error);
    }
  }, [activeCharacterId]);

  useEffect(() => {
    if (!isValidating && activeCharacterId && !character) {
      void loadCharacter();
    }
  }, [isValidating, activeCharacterId, character, loadCharacter]);

  useEffect(() => {
    if (!isValidating && activeCharacterId) {
      void loadSummons();
    }
  }, [isValidating, activeCharacterId, loadSummons]);

  useEffect(() => {
    if (!isValidating && !isLoading && !activeCharacterId) {
      router.push("/player");
    }
  }, [isValidating, isLoading, activeCharacterId, router]);

  // Load available monsters when dialog opens
  const handleOpenSummonDialog = async () => {
    setIsSummonDialogOpen(true);
    if (activeCharacterId && availableMonsters.length === 0) {
      setIsLoadingMonsters(true);
      try {
        const response = await api.getAvailableMonsters(activeCharacterId, "beast");
        if (response.data?.monsters) {
          setAvailableMonsters(response.data.monsters);
        }
      } catch (error) {
        console.error("Failed to load monsters:", error);
      } finally {
        setIsLoadingMonsters(false);
      }
    }
  };

  const handleSummon = async (data: {
    name: string;
    type: SummonType;
    monster_id?: number;
    max_hp?: number;
    source_spell?: string;
  }) => {
    if (!activeCharacterId) return;

    try {
      const response = await api.summonCreature(activeCharacterId, data);
      if (response.data?.summon) {
        setSummons((prev) => [...prev, response.data.summon]);
      }
      setIsSummonDialogOpen(false);
    } catch (error) {
      console.error("Failed to summon creature:", error);
    }
  };

  const handleUpdateHp = async (summonId: string, delta: number) => {
    if (!activeCharacterId) return;

    const summon = summons.find((s) => s.id === summonId);
    if (!summon) return;

    const newHp = Math.max(0, Math.min(summon.max_hp, summon.current_hp + delta));

    try {
      await api.updateSummon(activeCharacterId, summonId, { current_hp: newHp });
      setSummons((prev) =>
        prev.map((s) => (s.id === summonId ? { ...s, current_hp: newHp } : s))
      );
    } catch (error) {
      console.error("Failed to update summon:", error);
    }
  };

  const handleDismiss = async (summonId: string) => {
    if (!activeCharacterId) return;

    try {
      await api.dismissSummon(activeCharacterId, summonId);
      setSummons((prev) => prev.filter((s) => s.id !== summonId));
    } catch (error) {
      console.error("Failed to dismiss summon:", error);
    }
  };

  if (isValidating || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <Ghost className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Персонаж не найден</p>
      </div>
    );
  }

  // Get subclass-specific summons
  const getSubclassKey = (): string | null => {
    if (!character.subclasses || !character.class_slug) return null;
    const subclassData = character.subclasses[character.class_slug];
    if (!subclassData) return null;
    // Handle both formats: { subclass: "slug" } or just "slug"
    const subclassSlug = typeof subclassData === "string"
      ? subclassData
      : (subclassData as { subclass?: string })?.subclass;
    if (!subclassSlug) return null;
    return `${character.class_slug}-${subclassSlug}`;
  };

  const subclassKey = getSubclassKey();
  const quickSummons = subclassKey ? SUBCLASS_SUMMONS[subclassKey] || [] : [];
  const proficiencyBonus = Math.floor((character.level - 1) / 4) + 2;

  // Determine if character can summon from bestiary (Wild Shape beasts, Find Familiar, etc.)
  // Moon druids can Wild Shape into any beast
  // Wizards/Warlocks can use Find Familiar
  // Rangers with Beast Master can summon beasts
  const canSummonFromBestiary =
    subclassKey === "druid-circle-of-the-moon" ||
    character.class_slug === "wizard" ||
    character.class_slug === "warlock";

  // If we have quick summons, don't show generic summon (unless can also summon from bestiary)
  const showGenericSummon = quickSummons.length === 0 || canSummonFromBestiary;

  // Handle quick summon
  const handleQuickSummon = async (template: QuickSummonTemplate) => {
    if (!activeCharacterId) return;

    const stats = template.getStats(character.level, proficiencyBonus);

    // Don't create summon for Starry Form (it's not a separate creature)
    if (stats.max_hp === 0) {
      // Just show info, don't create summon
      return;
    }

    try {
      const response = await api.summonCreature(activeCharacterId, {
        name: template.name,
        type: template.type,
        max_hp: stats.max_hp,
        source_spell: "Дикий облик",
      });
      if (response.data?.summon) {
        setSummons((prev) => [...prev, response.data.summon]);
      }
    } catch (error) {
      console.error("Failed to summon:", error);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Призванные существа</h1>
        <Badge variant="secondary">{character.name}</Badge>
      </div>

      {/* Quick Summons based on subclass */}
      {quickSummons.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Быстрый призыв</h2>
          {quickSummons.map((template) => {
            const stats = template.getStats(character.level, proficiencyBonus);
            const isStarryForm = stats.max_hp === 0;

            return (
              <Card key={template.key} className="border-primary/30">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{template.name}</h3>
                        <Badge variant="outline" className={cn("text-xs", SUMMON_TYPE_COLORS[template.type])}>
                          {SUMMON_TYPE_LABELS[template.type]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {template.description}
                      </p>

                      {/* Stats preview */}
                      <div className="mt-2 text-xs space-y-1">
                        {!isStarryForm && (
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-500" />
                              {stats.max_hp} хп
                            </span>
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              КД {stats.ac}
                            </span>
                            <span className="flex items-center gap-1">
                              <Footprints className="h-3 w-3" />
                              {stats.speed}
                            </span>
                          </div>
                        )}
                        <p className="text-muted-foreground">{stats.attack}</p>
                      </div>

                      {!isStarryForm && (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => handleQuickSummon(template)}
                        >
                          <Flame className="h-3 w-3 mr-1" />
                          Призвать
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Active Summons */}
      {summons.length === 0 && quickSummons.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Ghost className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              У вас нет призванных существ
            </p>
            {showGenericSummon && (
              <Dialog open={isSummonDialogOpen} onOpenChange={setIsSummonDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleOpenSummonDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Призвать существо
                  </Button>
                </DialogTrigger>
                <SummonDialog
                  availableMonsters={availableMonsters}
                  isLoadingMonsters={isLoadingMonsters}
                  onSummon={handleSummon}
                />
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : summons.length === 0 ? (
        // Has quick summons but no active summons - just show empty list area
        null
      ) : (
        <div className="space-y-3">
          {summons.map((summon) => (
            <SummonCard
              key={summon.id}
              summon={summon}
              onUpdateHp={(delta) => handleUpdateHp(summon.id, delta)}
              onDismiss={() => handleDismiss(summon.id)}
            />
          ))}

          {showGenericSummon && (
            <Dialog open={isSummonDialogOpen} onOpenChange={setIsSummonDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenSummonDialog}
              >
                <Plus className="h-4 w-4 mr-2" />
                Призвать ещё
              </Button>
            </DialogTrigger>
              <SummonDialog
                availableMonsters={availableMonsters}
                isLoadingMonsters={isLoadingMonsters}
                onSummon={handleSummon}
              />
            </Dialog>
          )}
        </div>
      )}
    </div>
  );
}

// Summon card component
interface SummonCardProps {
  summon: SummonedCreature;
  onUpdateHp: (delta: number) => void;
  onDismiss: () => void;
}

function SummonCard({ summon, onUpdateHp, onDismiss }: SummonCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const monster = summon.monster;

  const hpPercent = (summon.current_hp / summon.max_hp) * 100;
  const hpColor =
    hpPercent > 50
      ? "bg-green-500"
      : hpPercent > 25
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <Card>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{summon.name}</CardTitle>
              <Badge
                variant="outline"
                className={cn("text-xs", SUMMON_TYPE_COLORS[summon.type])}
              >
                {SUMMON_TYPE_LABELS[summon.type]}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* HP Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-red-500" />
                <span>
                  {summon.current_hp}/{summon.max_hp}
                </span>
                {summon.temp_hp > 0 && (
                  <span className="text-blue-400">(+{summon.temp_hp})</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onUpdateHp(-1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onUpdateHp(1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all", hpColor)}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Quick stats if monster data available */}
          {monster && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>КД {monster.armor_class}</span>
              </div>
              <div className="flex items-center gap-1">
                <Footprints className="h-4 w-4" />
                <span>{monster.speed.walk || 9} м</span>
              </div>
              {monster.challenge_rating_string && (
                <div className="flex items-center gap-1">
                  <Swords className="h-4 w-4" />
                  <span>ПО {monster.challenge_rating_string}</span>
                </div>
              )}
            </div>
          )}

          {/* Expand button */}
          {monster && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full h-8 text-xs">
                <ChevronDown
                  className={cn(
                    "h-4 w-4 mr-1 transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
                {isExpanded ? "Скрыть детали" : "Показать детали"}
              </Button>
            </CollapsibleTrigger>
          )}

          <CollapsibleContent className="space-y-3">
            {monster && <MonsterDetails monster={monster} />}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

// Monster details component
function MonsterDetails({ monster }: { monster: Monster }) {
  const abilityLabels: Record<string, string> = {
    strength: "СИЛ",
    dexterity: "ЛОВ",
    constitution: "ТЕЛ",
    intelligence: "ИНТ",
    wisdom: "МДР",
    charisma: "ХАР",
  };

  const getModifier = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  return (
    <div className="space-y-3 pt-2 border-t">
      {/* Abilities */}
      <div className="grid grid-cols-6 gap-1 text-center">
        {Object.entries(monster.abilities).map(([key, value]) => (
          <div key={key} className="space-y-0.5">
            <div className="text-[10px] text-muted-foreground">
              {abilityLabels[key]}
            </div>
            <div className="text-sm font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">
              {getModifier(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Speed */}
      {monster.speed && Object.keys(monster.speed).length > 0 && (
        <div className="text-sm">
          <span className="font-medium">Скорость: </span>
          {Object.entries(monster.speed)
            .map(([type, value]) => {
              const typeLabels: Record<string, string> = {
                walk: "",
                fly: "полёт",
                swim: "плавание",
                burrow: "копание",
                climb: "лазание",
              };
              return `${typeLabels[type] ? typeLabels[type] + " " : ""}${value} м`;
            })
            .join(", ")}
        </div>
      )}

      {/* Skills */}
      {monster.skills && Object.keys(monster.skills).length > 0 && (
        <div className="text-sm">
          <span className="font-medium">Навыки: </span>
          {Object.entries(monster.skills)
            .map(([skill, bonus]) => `${skill} +${bonus}`)
            .join(", ")}
        </div>
      )}

      {/* Senses */}
      {monster.senses && Object.keys(monster.senses).length > 0 && (
        <div className="text-sm">
          <span className="font-medium">Чувства: </span>
          {Object.entries(monster.senses)
            .map(([sense, value]) => `${sense} ${value}`)
            .join(", ")}
        </div>
      )}

      {/* Traits */}
      {monster.traits && monster.traits.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Особенности</div>
          {monster.traits.map((trait, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium">{trait.name}. </span>
              <span className="text-muted-foreground">{trait.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {monster.actions && monster.actions.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Действия</div>
          {monster.actions.map((action, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium">{action.name}. </span>
              <span className="text-muted-foreground">
                {action.type === "melee" && "Рукопашная атака оружием: "}
                {action.type === "ranged" && "Дальнобойная атака оружием: "}
                {action.attack_bonus !== undefined && `+${action.attack_bonus} к попаданию, `}
                {action.reach && `досягаемость ${action.reach}, `}
                {action.range && `дистанция ${action.range}, `}
                {action.damage && `Попадание: ${action.damage}`}
                {action.damage_type && ` ${action.damage_type}`}
                {action.description && action.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Summon dialog component
interface SummonDialogProps {
  availableMonsters: Monster[];
  isLoadingMonsters: boolean;
  onSummon: (data: {
    name: string;
    type: SummonType;
    monster_id?: number;
    max_hp?: number;
    source_spell?: string;
  }) => void;
}

function SummonDialog({
  availableMonsters,
  isLoadingMonsters,
  onSummon,
}: SummonDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SummonType>("beast");
  const [selectedMonsterId, setSelectedMonsterId] = useState<number | null>(null);
  const [customHp, setCustomHp] = useState<string>("");
  const [sourceSpell, setSourceSpell] = useState("");

  const selectedMonster = availableMonsters.find((m) => m.id === selectedMonsterId);

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSummon({
      name: name.trim(),
      type,
      monster_id: selectedMonsterId ?? undefined,
      max_hp: customHp ? parseInt(customHp, 10) : undefined,
      source_spell: sourceSpell || undefined,
    });

    // Reset form
    setName("");
    setType("beast");
    setSelectedMonsterId(null);
    setCustomHp("");
    setSourceSpell("");
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Призвать существо</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="summon-name">Имя</Label>
          <Input
            id="summon-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Ворон Каркуша"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summon-type">Тип</Label>
          <Select value={type} onValueChange={(v) => setType(v as SummonType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SUMMON_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="summon-monster">Шаблон существа (опционально)</Label>
          {isLoadingMonsters ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка бестиария...
            </div>
          ) : (
            <Select
              value={selectedMonsterId?.toString() || "none"}
              onValueChange={(v) =>
                setSelectedMonsterId(v === "none" ? null : parseInt(v, 10))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите существо" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без шаблона</SelectItem>
                {availableMonsters.map((monster) => (
                  <SelectItem key={monster.id} value={monster.id.toString()}>
                    {monster.name} (ПО {monster.challenge_rating_string})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedMonster && (
            <p className="text-xs text-muted-foreground">
              КД {selectedMonster.armor_class}, {selectedMonster.hit_points} хп
            </p>
          )}
        </div>

        {!selectedMonsterId && (
          <div className="space-y-2">
            <Label htmlFor="summon-hp">Хиты (если без шаблона)</Label>
            <Input
              id="summon-hp"
              type="number"
              value={customHp}
              onChange={(e) => setCustomHp(e.target.value)}
              placeholder="10"
              min={1}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="summon-source">Заклинание-источник (опционально)</Label>
          <Input
            id="summon-source"
            value={sourceSpell}
            onChange={(e) => setSourceSpell(e.target.value)}
            placeholder="Например: Поиск фамильяра"
          />
        </div>

        <Button onClick={handleSubmit} className="w-full" disabled={!name.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Призвать
        </Button>
      </div>
    </DialogContent>
  );
}
