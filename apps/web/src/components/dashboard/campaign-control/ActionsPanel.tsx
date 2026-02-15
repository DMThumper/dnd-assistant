"use client";

import { useState } from "react";
import type { Character, InventoryItem, Currency } from "@/types/game";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Zap,
  Gift,
  Coins,
  Sparkles,
  Star,
  Skull,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ActionsPanelProps {
  character: Character;
  campaignId: number;
  onCharacterUpdate: (character: Character) => void;
}

export function ActionsPanel({ character, campaignId, onCharacterUpdate }: ActionsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [xpModalOpen, setXpModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [killDialogOpen, setKillDialogOpen] = useState(false);

  // Form states
  const [xpAmount, setXpAmount] = useState("");
  const [xpReason, setXpReason] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemSource, setItemSource] = useState("");
  const [currencyType, setCurrencyType] = useState<keyof Currency>("gp");
  const [currencyAmount, setCurrencyAmount] = useState("");
  const [killReason, setKillReason] = useState("");
  const [killedBy, setKilledBy] = useState("");

  // Toggle inspiration
  const handleToggleInspiration = async () => {
    setIsLoading(true);
    try {
      const response = await api.toggleInspiration(character.id);
      onCharacterUpdate(response.data.character);
      toast.success(
        response.data.character.inspiration
          ? `${character.name} получает вдохновение!`
          : `Вдохновение снято`
      );
    } catch (error) {
      console.error("Failed to toggle inspiration:", error);
      toast.error("Не удалось изменить вдохновение");
    } finally {
      setIsLoading(false);
    }
  };

  // Award XP
  const handleAwardXp = async () => {
    const amount = parseInt(xpAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Введите корректное количество XP");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.awardXp(campaignId, [character.id], amount, xpReason || undefined);
      const result = response.data.result;

      // Find this character's result
      const charResult = result.characters.find(c => c.id === character.id);
      if (charResult?.leveled_up) {
        toast.success(`${character.name} получает ${amount} XP и повышает уровень до ${charResult.new_level}!`);
      } else {
        toast.success(`${character.name} получает ${amount} XP`);
      }

      // Refresh character data
      const charResponse = await api.getCharacter(character.id);
      onCharacterUpdate(charResponse.data.character);

      setXpAmount("");
      setXpReason("");
      setXpModalOpen(false);
    } catch (error) {
      console.error("Failed to award XP:", error);
      toast.error("Не удалось выдать XP");
    } finally {
      setIsLoading(false);
    }
  };

  // Give item
  const handleGiveItem = async () => {
    if (!itemName.trim()) {
      toast.error("Введите название предмета");
      return;
    }

    const quantity = parseInt(itemQuantity, 10) || 1;

    setIsLoading(true);
    try {
      const item: InventoryItem = {
        name: itemName,
        custom: true,
        quantity,
        notes: itemSource || undefined,
      };

      const response = await api.giveItem(character.id, item, quantity, itemSource || undefined);
      onCharacterUpdate(response.data.character);
      toast.success(`${character.name} получает ${itemName}`);

      setItemName("");
      setItemQuantity("1");
      setItemSource("");
      setItemModalOpen(false);
    } catch (error) {
      console.error("Failed to give item:", error);
      toast.error("Не удалось выдать предмет");
    } finally {
      setIsLoading(false);
    }
  };

  // Modify currency
  const handleModifyCurrency = async () => {
    const amount = parseInt(currencyAmount, 10);
    if (isNaN(amount) || amount === 0) {
      toast.error("Введите корректное количество");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.modifyCurrency(character.id, currencyType, amount);
      onCharacterUpdate(response.data.character);

      const currencyNames: Record<keyof Currency, string> = {
        cp: "медных",
        sp: "серебряных",
        ep: "электрумовых",
        gp: "золотых",
        pp: "платиновых",
      };

      if (amount > 0) {
        toast.success(`${character.name} получает ${amount} ${currencyNames[currencyType]}`);
      } else {
        toast.info(`${character.name} теряет ${Math.abs(amount)} ${currencyNames[currencyType]}`);
      }

      setCurrencyAmount("");
      setCurrencyModalOpen(false);
    } catch (error) {
      console.error("Failed to modify currency:", error);
      toast.error("Не удалось изменить валюту");
    } finally {
      setIsLoading(false);
    }
  };

  // Kill character
  const handleKillCharacter = async () => {
    if (!killedBy.trim()) {
      toast.error("Укажите причину смерти");
      return;
    }

    setIsLoading(true);
    try {
      await api.killCharacter(campaignId, character.id, {
        killed_by: killedBy,
        ...(killReason && { killing_blow: killReason }),
        cause: "combat",
      });

      toast.error(`${character.name} погиб...`, {
        description: killedBy,
      });

      // Character is no longer active, callback should handle removal
      onCharacterUpdate({ ...character, is_alive: false, is_active: false });

      setKilledBy("");
      setKillReason("");
      setKillDialogOpen(false);
    } catch (error) {
      console.error("Failed to kill character:", error);
      toast.error("Не удалось выполнить операцию");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-amber-400" />
        <h3 className="font-semibold text-zinc-100">Действия</h3>
      </div>

      {/* Action buttons grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Give Item */}
        <Button
          variant="outline"
          onClick={() => setItemModalOpen(true)}
          className={cn(
            "h-14 flex-col gap-1",
            "bg-zinc-800 border-zinc-700 text-zinc-300",
            "hover:bg-zinc-700 hover:text-zinc-100"
          )}
        >
          <Gift className="h-5 w-5" />
          <span className="text-xs">Выдать предмет</span>
        </Button>

        {/* Modify Currency */}
        <Button
          variant="outline"
          onClick={() => setCurrencyModalOpen(true)}
          className={cn(
            "h-14 flex-col gap-1",
            "bg-zinc-800 border-zinc-700 text-zinc-300",
            "hover:bg-zinc-700 hover:text-zinc-100"
          )}
        >
          <Coins className="h-5 w-5" />
          <span className="text-xs">Изменить золото</span>
        </Button>

        {/* Toggle Inspiration */}
        <Button
          variant="outline"
          onClick={handleToggleInspiration}
          disabled={isLoading}
          className={cn(
            "h-14 flex-col gap-1",
            character.inspiration
              ? "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30"
              : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
          )}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-xs">
            {character.inspiration ? "Снять вдохновение" : "Вдохновение"}
          </span>
        </Button>

        {/* Award XP */}
        <Button
          variant="outline"
          onClick={() => setXpModalOpen(true)}
          className={cn(
            "h-14 flex-col gap-1",
            "bg-amber-500/10 border-amber-500/30 text-amber-400",
            "hover:bg-amber-500/20"
          )}
        >
          <Star className="h-5 w-5" />
          <span className="text-xs">Выдать XP</span>
        </Button>
      </div>

      {/* Kill character button (separate, dangerous) */}
      <Button
        variant="outline"
        onClick={() => setKillDialogOpen(true)}
        className={cn(
          "w-full h-12",
          "bg-red-500/5 border-red-500/20 text-red-400/70",
          "hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
        )}
      >
        <Skull className="h-4 w-4 mr-2" />
        Убить персонажа
      </Button>

      {/* XP Modal */}
      <Dialog open={xpModalOpen} onOpenChange={setXpModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Выдать опыт</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Текущий XP: {character.experience_points}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Количество XP</Label>
              <Input
                type="number"
                placeholder="100"
                value={xpAmount}
                onChange={(e) => setXpAmount(e.target.value)}
                className="text-center text-xl bg-zinc-800 border-zinc-700 text-zinc-100"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Причина (опционально)</Label>
              <Input
                placeholder="За победу над..."
                value={xpReason}
                onChange={(e) => setXpReason(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setXpModalOpen(false)}>
              Отмена
            </Button>
            <Button
              disabled={isLoading}
              onClick={handleAwardXp}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Выдать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Modal */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Выдать предмет</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Добавить предмет в инвентарь {character.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Название *</Label>
              <Input
                placeholder="Зелье лечения"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Количество</Label>
              <Input
                type="number"
                placeholder="1"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Источник (опционально)</Label>
              <Input
                placeholder="Лут с босса"
                value={itemSource}
                onChange={(e) => setItemSource(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setItemModalOpen(false)}>
              Отмена
            </Button>
            <Button
              disabled={isLoading || !itemName.trim()}
              onClick={handleGiveItem}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Выдать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Currency Modal */}
      <Dialog open={currencyModalOpen} onOpenChange={setCurrencyModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Изменить валюту</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Добавить или вычесть монеты
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Тип валюты</Label>
              <Select value={currencyType} onValueChange={(v) => setCurrencyType(v as keyof Currency)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="cp" className="text-zinc-100">Медные (cp)</SelectItem>
                  <SelectItem value="sp" className="text-zinc-100">Серебряные (sp)</SelectItem>
                  <SelectItem value="ep" className="text-zinc-100">Электрумовые (ep)</SelectItem>
                  <SelectItem value="gp" className="text-zinc-100">Золотые (gp)</SelectItem>
                  <SelectItem value="pp" className="text-zinc-100">Платиновые (pp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">
                Количество (+ добавить, - вычесть)
              </Label>
              <Input
                type="number"
                placeholder="50"
                value={currencyAmount}
                onChange={(e) => setCurrencyAmount(e.target.value)}
                className="text-center text-xl bg-zinc-800 border-zinc-700 text-zinc-100"
                autoFocus
              />
              <p className="text-xs text-zinc-500">
                Текущий баланс: {character.currency[currencyType]} {currencyType}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCurrencyModalOpen(false)}>
              Отмена
            </Button>
            <Button
              disabled={isLoading}
              onClick={handleModifyCurrency}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Изменить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kill Character Dialog */}
      <AlertDialog open={killDialogOpen} onOpenChange={setKillDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100 flex items-center gap-2">
              <Skull className="h-5 w-5 text-red-500" />
              Убить персонажа?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {character.name} будет перемещён на кладбище. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Убит кем/чем *</Label>
              <Input
                placeholder="Дракон, ловушка, падение..."
                value={killedBy}
                onChange={(e) => setKilledBy(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Смертельный удар</Label>
              <Input
                placeholder="Огненное дыхание, 45 урона"
                value={killReason}
                onChange={(e) => setKillReason(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKillCharacter}
              disabled={isLoading || !killedBy.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Убить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
