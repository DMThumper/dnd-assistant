"use client";

import { useState } from "react";
import type { Character, Currency } from "@/types/game";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Coins, Plus, Minus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CurrencyViewProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
}

const CURRENCY_CONFIG: Array<{
  key: keyof Currency;
  name: string;
  shortName: string;
  color: string;
}> = [
  { key: "pp", name: "Платиновые", shortName: "ПМ", color: "text-slate-300" },
  { key: "gp", name: "Золотые", shortName: "ЗМ", color: "text-amber-400" },
  { key: "ep", name: "Электрумовые", shortName: "ЭМ", color: "text-blue-300" },
  { key: "sp", name: "Серебряные", shortName: "СМ", color: "text-zinc-300" },
  { key: "cp", name: "Медные", shortName: "ММ", color: "text-orange-400" },
];

export function CurrencyView({ character, onCharacterUpdate }: CurrencyViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<keyof Currency | null>(null);
  const [amount, setAmount] = useState("");

  const handleQuickChange = async (currencyType: keyof Currency, changeAmount: number) => {
    setIsLoading(true);
    try {
      const response = await api.modifyCurrency(character.id, currencyType, changeAmount);
      onCharacterUpdate(response.data.character);
    } catch (error) {
      console.error("Failed to modify currency:", error);
      toast.error("Не удалось изменить валюту");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalSubmit = async (type: "add" | "subtract") => {
    if (!selectedCurrency) return;

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Введите корректное число");
      return;
    }

    const finalAmount = type === "subtract" ? -parsedAmount : parsedAmount;

    setIsLoading(true);
    try {
      const response = await api.modifyCurrency(character.id, selectedCurrency, finalAmount);
      onCharacterUpdate(response.data.character);
      toast.success(
        type === "add"
          ? `+${parsedAmount} ${selectedCurrency}`
          : `-${parsedAmount} ${selectedCurrency}`
      );
      setAmount("");
      setEditModalOpen(false);
    } catch (error) {
      console.error("Failed to modify currency:", error);
      toast.error("Не удалось изменить валюту");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (currencyType: keyof Currency) => {
    setSelectedCurrency(currencyType);
    setAmount("");
    setEditModalOpen(true);
  };

  // Calculate total value in gold pieces
  const totalGold =
    character.currency.pp * 10 +
    character.currency.gp +
    character.currency.ep * 0.5 +
    character.currency.sp * 0.1 +
    character.currency.cp * 0.01;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-400" />
          <h3 className="font-semibold text-zinc-100">Валюта</h3>
        </div>
        <span className="text-sm text-zinc-500">
          Всего: {totalGold.toFixed(2)} зм
        </span>
      </div>

      {/* Currency grid */}
      <div className="grid grid-cols-5 gap-2">
        {CURRENCY_CONFIG.map((currency) => (
          <button
            key={currency.key}
            onClick={() => openEditModal(currency.key)}
            className={cn(
              "flex flex-col items-center p-3 rounded-lg",
              "bg-zinc-800 border border-zinc-700",
              "hover:bg-zinc-700 hover:border-zinc-600 transition-colors",
              "touch-manipulation"
            )}
          >
            <span className="text-xs text-zinc-500">{currency.shortName}</span>
            <span className={cn("text-xl font-bold mt-1", currency.color)}>
              {character.currency[currency.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Quick add/subtract buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickChange("gp", 10)}
          disabled={isLoading}
          className="flex-1 bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
        >
          <Plus className="h-4 w-4 mr-1" />
          10 зм
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickChange("gp", -10)}
          disabled={isLoading || character.currency.gp < 10}
          className="flex-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
        >
          <Minus className="h-4 w-4 mr-1" />
          10 зм
        </Button>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">
              {selectedCurrency && CURRENCY_CONFIG.find(c => c.key === selectedCurrency)?.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Текущий баланс: {selectedCurrency && character.currency[selectedCurrency]}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-zinc-300">Количество</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center text-2xl h-16 mt-2 bg-zinc-800 border-zinc-700 text-zinc-100"
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => handleModalSubmit("subtract")}
              disabled={isLoading}
              className="flex-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Minus className="h-4 w-4 mr-1" />
              Вычесть
            </Button>
            <Button
              onClick={() => handleModalSubmit("add")}
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Plus className="h-4 w-4 mr-1" />
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
