"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, ApiClientError } from "@/lib/api";
import type { Character, Condition, LiveSession } from "@/types/game";
import { cn, formatModifier, calculateModifier } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ChevronLeft,
  Shield,
  Heart,
  Plus,
  Minus,
  Footprints,
  Sparkles,
  Zap,
  Star,
  TrendingUp,
  RefreshCw,
  Wifi,
  WifiOff,
  Radio,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useCharacterSync } from "@/hooks/useCharacterSync";
import { useCampaignSync } from "@/hooks/useCampaignSync";
import { toast } from "sonner";

// XP thresholds for D&D 5e levels
const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

// Ability keys for iteration
const ABILITIES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

const ACTIVE_CHARACTER_KEY = "dnd-player-active-character";

type AbilityKey = (typeof ABILITIES)[number];

export default function CharacterSheetPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const characterId = Number(params.id);

  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);

  // Real-time sync with DM via WebSocket
  const { isConnected } = useCharacterSync(character ? characterId : null, {
    onCharacterUpdated: (payload) => {
      // Update character with DM's changes
      setCharacter(payload.character);
      if (payload.update_type === "hp") {
        const changes = payload.changes as { type?: string; amount?: number };
        if (changes.type === "damage") {
          toast.error(`Получено ${changes.amount} урона`);
        } else if (changes.type === "healing") {
          toast.success(`Исцелено ${changes.amount} HP`);
        }
      }
    },
    onXPAwarded: (payload) => {
      setCharacter((prev) =>
        prev ? { ...prev, experience_points: payload.total_xp } : null
      );
      toast.success(`+${payload.xp_amount} XP${payload.reason ? `: ${payload.reason}` : ""}`, {
        duration: 5000,
      });
      if (payload.can_level_up) {
        toast.info("Доступно повышение уровня!", {
          duration: 10000,
          icon: "🎉",
        });
      }
    },
    onConditionChanged: (payload) => {
      setCharacter((prev) =>
        prev ? { ...prev, conditions: payload.all_conditions as Condition[] } : null
      );
      const action = payload.action === "added" ? "Добавлено" : "Убрано";
      const conditionName = payload.condition.name || payload.condition.key;
      if (payload.action === "added") {
        toast.warning(`${action}: ${conditionName}`);
      } else {
        toast.info(`${action}: ${conditionName}`);
      }
    },
    onLevelUp: (payload) => {
      setCharacter(payload.character);
      toast.success(`Уровень повышен до ${payload.new_level}!`, {
        duration: 10000,
        icon: "🎉",
      });
    },
    onCustomRuleChanged: (payload) => {
      // Refresh character to get updated custom rules
      void fetchCharacterSilent();
      const action = payload.action === "added" ? "Добавлен" : payload.action === "removed" ? "Убран" : "Изменён";
      toast.info(`${action} эффект: ${payload.custom_rule.name}`);
    },
  });

  // Listen for live session events from campaign channel
  useCampaignSync(character?.campaign_id || null, {
    onLiveSessionStarted: (payload) => {
      setLiveSession(payload.live_session);
      toast.success("DM запустил сессию!", {
        duration: 5000,
        icon: "🎲",
      });
    },
    onLiveSessionEnded: (payload) => {
      setLiveSession(null);
      toast.info("Сессия завершена", {
        duration: 5000,
      });
    },
  });

  // Silent fetch without loading state (for WebSocket-triggered refreshes)
  const fetchCharacterSilent = useCallback(async () => {
    try {
      const response = await api.getCharacter(characterId);
      setCharacter(response.data.character);
    } catch (err) {
      console.error("Failed to refresh character:", err);
    }
  }, [characterId]);

  const fetchCharacter = useCallback(async () => {
    try {
      const response = await api.getCharacter(characterId);
      setCharacter(response.data.character);
      // Save active character ID for spells/inventory pages
      localStorage.setItem(ACTIVE_CHARACTER_KEY, String(characterId));

      // Fetch live session status for the campaign
      try {
        const sessionResponse = await api.getPlayerLiveSessionStatus(response.data.character.campaign_id);
        if (sessionResponse.data.has_active_session) {
          setLiveSession(sessionResponse.data.live_session);
        }
      } catch (sessionErr) {
        console.warn("Failed to fetch live session status:", sessionErr);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(t("errors.generic"));
      }
    } finally {
      setIsLoading(false);
    }
  }, [characterId, t]);

  useEffect(() => {
    void fetchCharacter();
  }, [fetchCharacter]);

  const updateHp = async (delta: number) => {
    if (!character || isUpdating) return;

    const newHp = Math.max(0, Math.min(character.max_hp, character.current_hp + delta));
    if (newHp === character.current_hp) return;

    setIsUpdating(true);
    try {
      const response = await api.updateCharacter(characterId, { current_hp: newHp });
      setCharacter(response.data.character);
    } catch (err) {
      console.error("Failed to update HP:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleInspiration = async () => {
    if (!character || isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await api.updateCharacter(characterId, {
        inspiration: !character.inspiration,
      });
      setCharacter(response.data.character);
    } catch (err) {
      console.error("Failed to toggle inspiration:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <p className="text-destructive mb-4">{error || t("errors.notFound")}</p>
        <Button variant="outline" onClick={() => router.push("/player")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
      </div>
    );
  }

  const hpPercentage = (character.current_hp / character.max_hp) * 100;
  const hpColor =
    hpPercentage <= 25
      ? "bg-destructive"
      : hpPercentage <= 50
        ? "bg-warning"
        : "bg-success";

  // XP calculations
  const currentLevel = character.level;
  const nextLevel = currentLevel + 1;
  const currentLevelXp = XP_THRESHOLDS[currentLevel] || 0;
  const nextLevelXp = XP_THRESHOLDS[nextLevel] || XP_THRESHOLDS[20];
  const xpInCurrentLevel = character.experience_points - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const xpProgress = currentLevel >= 20 ? 100 : (xpInCurrentLevel / xpNeededForNextLevel) * 100;
  const canLevelUp = character.experience_points >= nextLevelXp && currentLevel < 20;

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Character Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/player/campaigns/${character.campaign_id}`)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{character.name}</h1>
            {liveSession ? (
              <Badge
                variant="outline"
                className="bg-green-500/10 border-green-500/30 text-green-400 text-xs animate-pulse"
                title="Сессия активна"
              >
                <Radio className="mr-1 h-3 w-3" />
                Live
              </Badge>
            ) : (
              <span title={isConnected ? "Подключено к серверу" : "Нет подключения"}>
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {character.race_slug && (
              <span className="capitalize">{character.race_slug}</span>
            )}{" "}
            {character.class_slug && (
              <span className="capitalize">{character.class_slug}</span>
            )}{" "}
            <Badge variant="secondary">
              {t("player.sheet.level")} {character.level}
            </Badge>
          </p>
        </div>
        <Button
          variant={character.inspiration ? "default" : "outline"}
          size="icon"
          onClick={toggleInspiration}
          disabled={isUpdating}
          title={t("player.sheet.inspiration")}
        >
          <Sparkles className={cn("h-4 w-4", character.inspiration && "text-yellow-300")} />
        </Button>
      </div>

      {/* XP Progress Section */}
      <Card className={cn("bg-card/50", canLevelUp && "border-yellow-500 border-2")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">Опыт (XP)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => fetchCharacter()}
                disabled={isLoading}
                title="Обновить"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              <span className="text-xl font-bold text-yellow-500">
                {character.experience_points.toLocaleString()}
              </span>
            </div>
          </div>

          {currentLevel < 20 ? (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>До уровня {nextLevel}</span>
                <span>{xpInCurrentLevel.toLocaleString()} / {xpNeededForNextLevel.toLocaleString()}</span>
              </div>
              <Progress value={xpProgress} className="h-3" />
              {canLevelUp && (
                <Button
                  onClick={() => router.push(`/player/sheet/${characterId}/level-up`)}
                  className="mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold animate-pulse"
                >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Повысить уровень!
                </Button>
              )}
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              Максимальный уровень достигнут
            </div>
          )}
        </CardContent>
      </Card>

      {/* HP Section - Most Important! */}
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              <span className="font-semibold">{t("player.sheet.hp")}</span>
            </div>
            <div className="text-2xl font-bold">
              {character.current_hp}
              <span className="text-muted-foreground text-lg">/{character.max_hp}</span>
              {character.temp_hp > 0 && (
                <span className="text-info text-lg ml-1">+{character.temp_hp}</span>
              )}
            </div>
          </div>

          {/* HP Bar */}
          <div className="h-4 w-full rounded-full bg-muted overflow-hidden mb-3">
            <div
              className={`h-full transition-all ${hpColor}`}
              style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
            />
          </div>

          {/* HP Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-16"
              onClick={() => updateHp(-5)}
              disabled={isUpdating}
            >
              -5
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-12"
              onClick={() => updateHp(-1)}
              disabled={isUpdating}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-12"
              onClick={() => updateHp(1)}
              disabled={isUpdating}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-16"
              onClick={() => updateHp(5)}
              disabled={isUpdating}
            >
              +5
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conditions (if any) */}
      {character.conditions && character.conditions.length > 0 && (
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-orange-500">Состояния</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {character.conditions.map((condition, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-orange-500/20 border-orange-500/50 text-orange-200"
                >
                  {condition.name || condition.key}
                  {condition.source && (
                    <span className="text-orange-400/70 ml-1">({condition.source})</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Rules (perks/afflictions) */}
      {character.custom_rules && character.custom_rules.length > 0 && (
        <Card className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">Особые эффекты</span>
            </div>
            <div className="space-y-2">
              {character.custom_rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start gap-2 text-sm"
                >
                  <span>{rule.icon || "✦"}</span>
                  <div>
                    <span className="font-medium" style={{ color: rule.color }}>
                      {rule.name}
                    </span>
                    {rule.effects && rule.effects.length > 0 && (
                      <div className="text-muted-foreground text-xs">
                        {rule.effects.map((effect, i) => (
                          <span key={i} className={effect.type === "bonus" ? "text-green-400" : "text-red-400"}>
                            {effect.description}{i < rule.effects.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
              <Shield className="h-4 w-4" />
              <span>{t("player.sheet.ac")}</span>
            </div>
            <div className="text-2xl font-bold">{character.armor_class}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
              <Zap className="h-4 w-4" />
              <span>{t("player.sheet.proficiencyBonus")}</span>
            </div>
            <div className="text-2xl font-bold">
              {formatModifier(character.proficiency_bonus)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
              <Footprints className="h-4 w-4" />
              <span>{t("player.sheet.speed")}</span>
            </div>
            <div className="text-2xl font-bold">
              {character.speed.walk}
              <span className="text-sm text-muted-foreground">м</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abilities Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("player.sheet.abilities")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {ABILITIES.map((ability) => {
              const score = character.abilities[ability];
              const modifier = calculateModifier(score);
              const hasSaveProficiency =
                character.saving_throw_proficiencies.includes(ability);

              return (
                <div
                  key={ability}
                  className={cn(
                    "rounded-lg border p-2 text-center",
                    hasSaveProficiency && "border-primary"
                  )}
                >
                  <div className="text-xs text-muted-foreground uppercase">
                    {t(`dnd.abilitiesShort.${ability}`)}
                  </div>
                  <div className="text-2xl font-bold">
                    {formatModifier(modifier)}
                  </div>
                  <div className="text-sm text-muted-foreground">{score}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("player.sheet.skills")}</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillsList character={character} />
        </CardContent>
      </Card>

      {/* Features Section */}
      {character.features.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("player.sheet.features")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {character.features.map((feature, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium">{feature.name}</span>
                <span className="text-muted-foreground"> — {feature.description}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Class Resources */}
      {character.class_resources.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ресурсы класса</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {character.class_resources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{resource.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({resource.recharge === "short_rest" ? "короткий отдых" : "длинный отдых"})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: resource.max }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-4 w-4 rounded-full border-2",
                        i < resource.current
                          ? "bg-primary border-primary"
                          : "border-muted-foreground"
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Skills list component
interface SkillsListProps {
  character: Character;
}

const SKILLS: Array<{ key: string; ability: AbilityKey }> = [
  { key: "acrobatics", ability: "dexterity" },
  { key: "animal_handling", ability: "wisdom" },
  { key: "arcana", ability: "intelligence" },
  { key: "athletics", ability: "strength" },
  { key: "deception", ability: "charisma" },
  { key: "history", ability: "intelligence" },
  { key: "insight", ability: "wisdom" },
  { key: "intimidation", ability: "charisma" },
  { key: "investigation", ability: "intelligence" },
  { key: "medicine", ability: "wisdom" },
  { key: "nature", ability: "intelligence" },
  { key: "perception", ability: "wisdom" },
  { key: "performance", ability: "charisma" },
  { key: "persuasion", ability: "charisma" },
  { key: "religion", ability: "intelligence" },
  { key: "sleight_of_hand", ability: "dexterity" },
  { key: "stealth", ability: "dexterity" },
  { key: "survival", ability: "wisdom" },
];

function SkillsList({ character }: SkillsListProps) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      {SKILLS.map((skill) => {
        const hasProficiency = character.skill_proficiencies.includes(skill.key);
        const hasExpertise = character.skill_expertise.includes(skill.key);
        const abilityMod = calculateModifier(character.abilities[skill.ability]);
        let totalMod = abilityMod;
        if (hasProficiency) totalMod += character.proficiency_bonus;
        if (hasExpertise) totalMod += character.proficiency_bonus;

        return (
          <div key={skill.key} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "w-3 h-3 rounded-full border",
                  hasExpertise
                    ? "bg-primary border-primary"
                    : hasProficiency
                      ? "bg-primary/50 border-primary"
                      : "border-muted-foreground"
                )}
              />
              <span className={cn(hasProficiency && "font-medium")}>
                {t(`dnd.skills.${skill.key}`)}
              </span>
            </div>
            <span className="font-mono">{formatModifier(totalMod)}</span>
          </div>
        );
      })}
    </div>
  );
}
