"use client";

import { useState } from "react";
import type { Character } from "@/types/game";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Star, Loader2, Users, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface XpAwardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: number;
  characters: Character[];
  onSuccess: () => void;
}

export function XpAwardModal({
  open,
  onOpenChange,
  campaignId,
  characters,
  onSuccess,
}: XpAwardModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [selectedCharacters, setSelectedCharacters] = useState<number[]>([]);
  const [awardAll, setAwardAll] = useState(true);

  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setAmount("");
      setReason("");
      setSelectedCharacters([]);
      setAwardAll(true);
    }
    onOpenChange(open);
  };

  // Toggle character selection
  const toggleCharacter = (charId: number) => {
    setSelectedCharacters(prev =>
      prev.includes(charId)
        ? prev.filter(id => id !== charId)
        : [...prev, charId]
    );
  };

  // Handle submit
  const handleSubmit = async () => {
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Введите корректное количество XP");
      return;
    }

    const targetIds = awardAll ? "all_active" : selectedCharacters;
    if (!awardAll && selectedCharacters.length === 0) {
      toast.error("Выберите хотя бы одного персонажа");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.awardXp(campaignId, targetIds, parsedAmount, reason || undefined);
      const result = response.data.result;

      // Build success message
      const leveledUp = result.characters.filter(c => c.leveled_up);
      if (leveledUp.length > 0) {
        toast.success(
          `${result.awarded_to} персонаж(ей) получают ${parsedAmount} XP!`,
          {
            description: `${leveledUp.map(c => `${c.name} → ${c.new_level} ур.`).join(", ")}`,
          }
        );
      } else {
        toast.success(`${result.awarded_to} персонаж(ей) получают ${parsedAmount} XP`);
      }

      onSuccess();
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to award XP:", error);
      toast.error("Не удалось выдать XP");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick XP amounts based on encounter difficulty
  const quickAmounts = [
    { label: "25", value: 25 },
    { label: "50", value: 50 },
    { label: "100", value: 100 },
    { label: "200", value: 200 },
    { label: "500", value: 500 },
    { label: "1000", value: 1000 },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            Выдать опыт
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Выдайте XP всем или выбранным персонажам
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Amount input */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Количество XP</Label>
            <Input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center text-2xl h-14 bg-zinc-800 border-zinc-700 text-zinc-100"
              autoFocus
            />

            {/* Quick amount buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {quickAmounts.map((qa) => (
                <Button
                  key={qa.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(qa.value.toString())}
                  className={cn(
                    "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700",
                    amount === qa.value.toString() && "border-amber-500/50 text-amber-400"
                  )}
                >
                  {qa.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Причина (опционально)</Label>
            <Input
              placeholder="Победа над драконом"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          {/* Target selection */}
          <div className="space-y-3">
            <Label className="text-zinc-300">Кому выдать</Label>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800 border border-zinc-700">
              <Checkbox
                id="award-all"
                checked={awardAll}
                onCheckedChange={(checked) => setAwardAll(!!checked)}
              />
              <label
                htmlFor="award-all"
                className="flex items-center gap-2 cursor-pointer text-zinc-100"
              >
                <Users className="h-4 w-4" />
                Всем активным персонажам
              </label>
            </div>

            {!awardAll && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                      selectedCharacters.includes(character.id)
                        ? "bg-amber-500/10 border-amber-500/30"
                        : "bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800"
                    )}
                    onClick={() => toggleCharacter(character.id)}
                  >
                    <Checkbox
                      checked={selectedCharacters.includes(character.id)}
                      onCheckedChange={() => toggleCharacter(character.id)}
                    />
                    <User className="h-4 w-4 text-zinc-500" />
                    <span className="text-zinc-100">{character.name}</span>
                    <span className="text-xs text-zinc-500">
                      (XP: {character.experience_points})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Отмена
          </Button>
          <Button
            disabled={isLoading || !amount || (!awardAll && selectedCharacters.length === 0)}
            onClick={handleSubmit}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Выдать XP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
