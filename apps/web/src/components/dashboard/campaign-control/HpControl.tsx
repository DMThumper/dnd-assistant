"use client";

import { useState } from "react";
import type { Character } from "@/types/game";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Heart,
  Minus,
  Plus,
  Shield,
  Swords,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface HpControlProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
}

export function HpControl({ character, onCharacterUpdate }: HpControlProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [healModalOpen, setHealModalOpen] = useState(false);
  const [tempHpModalOpen, setTempHpModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  // Calculate HP percentage
  const hpPercentage = Math.round((character.current_hp / character.max_hp) * 100);

  // HP color based on percentage
  const getHpColor = (percentage: number) => {
    if (percentage <= 25) return "bg-red-500";
    if (percentage <= 50) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Quick HP change buttons
  const quickAmounts = [1, 5, 10];

  // API call for HP modification
  const modifyHp = async (amount: number, type: "damage" | "healing" | "temp_hp" | "set") => {
    if (amount === 0) return;

    setIsLoading(true);
    try {
      const response = await api.modifyCharacterHp(character.id, amount, type);
      onCharacterUpdate(response.data.character);

      // Show toast
      if (type === "damage") {
        toast.error(`${character.name} получает ${amount} урона`);
      } else if (type === "healing") {
        toast.success(`${character.name} исцелён на ${amount}`);
      } else if (type === "temp_hp") {
        toast.info(`${character.name} получает ${amount} временных HP`);
      }
    } catch (error) {
      console.error("Failed to modify HP:", error);
      toast.error("Не удалось изменить HP");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick button click
  const handleQuickChange = (amount: number, type: "damage" | "healing") => {
    modifyHp(amount, type);
  };

  // Handle modal submit
  const handleModalSubmit = (type: "damage" | "healing" | "temp_hp") => {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Введите корректное число");
      return;
    }
    modifyHp(amount, type);
    setCustomAmount("");
    setDamageModalOpen(false);
    setHealModalOpen(false);
    setTempHpModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-red-400" />
        <h3 className="font-semibold text-zinc-100">Здоровье</h3>
      </div>

      {/* HP Display */}
      <div className="p-4 rounded-lg bg-zinc-800 border border-zinc-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-4xl font-bold",
              hpPercentage <= 25 ? "text-red-400" :
              hpPercentage <= 50 ? "text-amber-400" : "text-emerald-400"
            )}>
              {character.current_hp}
            </span>
            <span className="text-2xl text-zinc-500">/ {character.max_hp}</span>
          </div>
          {character.temp_hp > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400">
              <Shield className="h-4 w-4" />
              <span className="font-medium">+{character.temp_hp}</span>
            </div>
          )}
        </div>

        {/* HP Bar */}
        <div className="h-4 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              getHpColor(hpPercentage)
            )}
            style={{ width: `${Math.min(100, hpPercentage)}%` }}
          />
        </div>
      </div>

      {/* Quick buttons row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Damage buttons */}
        <div className="space-y-2">
          <Label className="text-xs text-zinc-500 uppercase tracking-wide">Урон</Label>
          <div className="flex gap-1">
            {quickAmounts.map((amount) => (
              <Button
                key={`damage-${amount}`}
                variant="outline"
                disabled={isLoading}
                onClick={() => handleQuickChange(amount, "damage")}
                className={cn(
                  "flex-1 h-14 text-lg font-bold",
                  "bg-red-500/10 border-red-500/30 text-red-400",
                  "hover:bg-red-500/20 hover:border-red-500/50",
                  "active:scale-95 transition-transform"
                )}
              >
                <Minus className="h-4 w-4 mr-1" />
                {amount}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => setDamageModalOpen(true)}
            className={cn(
              "w-full h-12",
              "bg-red-500/10 border-red-500/30 text-red-400",
              "hover:bg-red-500/20 hover:border-red-500/50"
            )}
          >
            <Swords className="h-4 w-4 mr-2" />
            Урон...
          </Button>
        </div>

        {/* Healing buttons */}
        <div className="space-y-2">
          <Label className="text-xs text-zinc-500 uppercase tracking-wide">Лечение</Label>
          <div className="flex gap-1">
            {quickAmounts.map((amount) => (
              <Button
                key={`heal-${amount}`}
                variant="outline"
                disabled={isLoading}
                onClick={() => handleQuickChange(amount, "healing")}
                className={cn(
                  "flex-1 h-14 text-lg font-bold",
                  "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                  "hover:bg-emerald-500/20 hover:border-emerald-500/50",
                  "active:scale-95 transition-transform"
                )}
              >
                <Plus className="h-4 w-4 mr-1" />
                {amount}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={() => setHealModalOpen(true)}
            className={cn(
              "w-full h-12",
              "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
              "hover:bg-emerald-500/20 hover:border-emerald-500/50"
            )}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Лечение...
          </Button>
        </div>
      </div>

      {/* Temp HP button */}
      <Button
        variant="outline"
        disabled={isLoading}
        onClick={() => setTempHpModalOpen(true)}
        className={cn(
          "w-full h-12",
          "bg-blue-500/10 border-blue-500/30 text-blue-400",
          "hover:bg-blue-500/20 hover:border-blue-500/50"
        )}
      >
        <Shield className="h-4 w-4 mr-2" />
        Временные HP
        {character.temp_hp > 0 && ` (${character.temp_hp})`}
      </Button>

      {/* Damage Modal */}
      <Dialog open={damageModalOpen} onOpenChange={setDamageModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Нанести урон</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Введите количество урона для {character.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="Урон"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="text-center text-2xl h-16 bg-zinc-800 border-zinc-700 text-zinc-100"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDamageModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              disabled={isLoading}
              onClick={() => handleModalSubmit("damage")}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Нанести урон
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Heal Modal */}
      <Dialog open={healModalOpen} onOpenChange={setHealModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Исцеление</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Введите количество лечения для {character.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="Лечение"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="text-center text-2xl h-16 bg-zinc-800 border-zinc-700 text-zinc-100"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setHealModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              disabled={isLoading}
              onClick={() => handleModalSubmit("healing")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Исцелить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Temp HP Modal */}
      <Dialog open={tempHpModalOpen} onOpenChange={setTempHpModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Временные HP</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Установить временные HP для {character.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              placeholder="Временные HP"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="text-center text-2xl h-16 bg-zinc-800 border-zinc-700 text-zinc-100"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setTempHpModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              disabled={isLoading}
              onClick={() => handleModalSubmit("temp_hp")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Установить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
