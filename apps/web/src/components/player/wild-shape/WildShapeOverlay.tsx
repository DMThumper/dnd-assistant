"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Character, WildShapeForm } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Heart,
  Shield,
  Footprints,
  Plus,
  Minus,
  ArrowLeft,
  PawPrint,
  AlertTriangle,
  Swords,
  Sparkles,
  Eye,
  Dices,
} from "lucide-react";
import { cn, formatModifier, calculateModifier } from "@/lib/utils";
import { toast } from "sonner";

interface WildShapeOverlayProps {
  character: Character;
  wildShapeForm: WildShapeForm;
  onUpdate: (character: Character) => void;
}

const ABILITIES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

const ABILITY_LABELS: Record<string, string> = {
  strength: "СИЛ",
  dexterity: "ЛОВ",
  constitution: "ТЕЛ",
  intelligence: "ИНТ",
  wisdom: "МДР",
  charisma: "ХАР",
};

function formatSpeed(speed: WildShapeForm["speed"]): string {
  const parts: string[] = [];
  if (speed.walk) parts.push(`${speed.walk} м`);
  if (speed.fly) parts.push(`полёт ${speed.fly} м`);
  if (speed.swim) parts.push(`плав. ${speed.swim} м`);
  if (speed.climb) parts.push(`лаз. ${speed.climb} м`);
  if (speed.burrow) parts.push(`коп. ${speed.burrow} м`);
  return parts.join(", ") || "0 м";
}

export function WildShapeOverlay({
  character,
  wildShapeForm,
  onUpdate,
}: WildShapeOverlayProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const hpPercentage = (wildShapeForm.current_hp / wildShapeForm.max_hp) * 100;
  const hpColor =
    hpPercentage <= 25
      ? "bg-destructive"
      : hpPercentage <= 50
        ? "bg-warning"
        : "bg-success";

  async function handleDamage(amount: number) {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const response = await api.wildShapeDamage(character.id, amount);
      onUpdate(response.data.character);
      if (response.data.reverted) {
        toast.warning(
          `Форма зверя потеряна! Избыточный урон: ${response.data.excess_damage}`,
          { duration: 5000 }
        );
      }
    } catch (err) {
      console.error("Failed to apply damage:", err);
      toast.error("Не удалось применить урон");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleHeal(amount: number) {
    if (isUpdating || wildShapeForm.current_hp >= wildShapeForm.max_hp) return;
    setIsUpdating(true);
    try {
      const response = await api.wildShapeHeal(character.id, amount);
      onUpdate(response.data.character);
    } catch (err) {
      console.error("Failed to heal:", err);
      toast.error("Не удалось исцелить");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRevert() {
    if (isReverting) return;
    setIsReverting(true);
    try {
      const response = await api.wildShapeRevert(character.id);
      toast.success(response.data.message || "Вы вернулись в свою форму");
      onUpdate(response.data.character);
    } catch (err) {
      console.error("Failed to revert:", err);
      toast.error("Не удалось выйти из формы");
    } finally {
      setIsReverting(false);
    }
  }

  return (
    <Card className="bg-green-500/10 border-green-500/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-green-400">
            <PawPrint className="h-5 w-5" />
            <span>Дикий облик: {wildShapeForm.beast_name}</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevert}
            disabled={isReverting}
            className="text-green-400 border-green-500/50 hover:bg-green-500/20"
          >
            {isReverting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Выйти
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Beast HP Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-400" />
              <span className="font-semibold text-green-300">HP зверя</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {wildShapeForm.current_hp}
              <span className="text-green-600 text-lg">/{wildShapeForm.max_hp}</span>
              {(wildShapeForm.temp_hp ?? 0) > 0 && (
                <span className="text-cyan-400 text-lg ml-1">+{wildShapeForm.temp_hp}</span>
              )}
            </div>
          </div>

          {/* HP Bar */}
          <div className="h-4 w-full rounded-full bg-muted overflow-hidden mb-3">
            <div
              className={cn("h-full transition-all", hpColor)}
              style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
            />
          </div>

          {/* HP Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-16 border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => handleDamage(5)}
              disabled={isUpdating}
            >
              -5
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-12 border-red-500/50 text-red-400 hover:bg-red-500/10"
              onClick={() => handleDamage(1)}
              disabled={isUpdating}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-12 border-green-500/50 text-green-400 hover:bg-green-500/10"
              onClick={() => handleHeal(1)}
              disabled={isUpdating || wildShapeForm.current_hp >= wildShapeForm.max_hp}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-16 border-green-500/50 text-green-400 hover:bg-green-500/10"
              onClick={() => handleHeal(5)}
              disabled={isUpdating || wildShapeForm.current_hp >= wildShapeForm.max_hp}
            >
              +5
            </Button>
          </div>
        </div>

        {/* Warning about 0 HP */}
        {wildShapeForm.current_hp <= wildShapeForm.max_hp * 0.25 && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>При 0 HP формы вы вернётесь в обычный облик. Избыточный урон переносится!</span>
          </div>
        )}

        {/* Beast Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <Shield className="h-3 w-3" />
              <span>КД</span>
            </div>
            <div className="text-xl font-bold text-green-400">
              {wildShapeForm.armor_class}
            </div>
          </div>

          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-2 text-center col-span-2">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
              <Footprints className="h-3 w-3" />
              <span>Скорость</span>
            </div>
            <div className="text-sm font-medium text-green-400">
              {formatSpeed(wildShapeForm.speed)}
            </div>
          </div>
        </div>

        {/* Beast Abilities */}
        <div className="grid grid-cols-6 gap-1">
          {ABILITIES.map((ability) => {
            const score = wildShapeForm.abilities[ability] ?? 10;
            const modifier = calculateModifier(score);
            return (
              <div
                key={ability}
                className="rounded-lg border border-green-500/30 bg-green-500/5 p-1 text-center"
              >
                <div className="text-xs text-muted-foreground">
                  {ABILITY_LABELS[ability]}
                </div>
                <div className="text-sm font-bold text-green-400">
                  {formatModifier(modifier)}
                </div>
                <div className="text-xs text-muted-foreground">{score}</div>
              </div>
            );
          })}
        </div>

        {/* Senses & Skills Row */}
        {((wildShapeForm.senses && Object.keys(wildShapeForm.senses).length > 0) ||
          (wildShapeForm.skills && Object.keys(wildShapeForm.skills).length > 0)) && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Senses */}
            {wildShapeForm.senses && Object.keys(wildShapeForm.senses).length > 0 && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-2">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Eye className="h-3 w-3" />
                  <span>Чувства</span>
                </div>
                <div className="text-green-300 space-y-0.5">
                  {Object.entries(wildShapeForm.senses).map(([key, value]) => (
                    <div key={key}>
                      {key === "passive_perception" ? "пасс. внимательность" :
                       key === "darkvision" ? "тёмное зрение" :
                       key === "blindsight" ? "слепое зрение" :
                       key === "tremorsense" ? "чувство вибрации" : key}: {value}
                      {typeof value === "number" || !String(value).includes("м") ? "" : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Skills */}
            {wildShapeForm.skills && Object.keys(wildShapeForm.skills).length > 0 && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-2">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <Dices className="h-3 w-3" />
                  <span>Навыки</span>
                </div>
                <div className="text-green-300 space-y-0.5">
                  {Object.entries(wildShapeForm.skills).map(([key, value]) => (
                    <div key={key}>
                      {key === "perception" ? "Внимательность" :
                       key === "stealth" ? "Скрытность" :
                       key === "athletics" ? "Атлетика" :
                       key === "acrobatics" ? "Акробатика" :
                       key === "survival" ? "Выживание" : key}: {formatModifier(value as number)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Beast Traits */}
        {wildShapeForm.traits && wildShapeForm.traits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-300">
              <Sparkles className="h-4 w-4" />
              <span>Особенности</span>
            </div>
            <div className="space-y-1.5">
              {wildShapeForm.traits.map((trait, i) => (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-green-500/5 border border-green-500/20"
                >
                  <span className="font-semibold text-green-300">{trait.name}.</span>{" "}
                  <span className="text-muted-foreground">{trait.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Beast Actions */}
        {wildShapeForm.actions && wildShapeForm.actions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-red-400">
              <Swords className="h-4 w-4" />
              <span>Действия</span>
            </div>
            <div className="space-y-1.5">
              {wildShapeForm.actions.map((action, i) => (
                <div
                  key={i}
                  className="text-xs p-2 rounded bg-red-500/5 border border-red-500/20"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-red-300">{action.name}</span>
                    {action.attack_bonus !== undefined && (
                      <Badge variant="outline" className="text-[10px] h-4 border-red-500/30 text-red-400">
                        +{action.attack_bonus}
                      </Badge>
                    )}
                    {action.reach && (
                      <span className="text-muted-foreground">{action.reach}</span>
                    )}
                  </div>
                  <div className="text-muted-foreground leading-relaxed">
                    {action.description || action.damage}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charges remaining */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Осталось использований:</span>
          <Badge variant="secondary" className="bg-green-500/20 text-green-300">
            {character.wild_shape_charges ?? 0}/2
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
