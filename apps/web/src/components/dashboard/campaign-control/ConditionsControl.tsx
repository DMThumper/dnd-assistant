"use client";

import { useState } from "react";
import type { Character, Condition } from "@/types/game";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Plus, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ConditionsControlProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
}

// D&D 5e standard conditions
const DND_CONDITIONS = [
  { key: "blinded", name: "Ослеплён" },
  { key: "charmed", name: "Очарован" },
  { key: "deafened", name: "Оглушён" },
  { key: "frightened", name: "Испуган" },
  { key: "grappled", name: "Схвачен" },
  { key: "incapacitated", name: "Недееспособен" },
  { key: "invisible", name: "Невидим" },
  { key: "paralyzed", name: "Парализован" },
  { key: "petrified", name: "Окаменён" },
  { key: "poisoned", name: "Отравлен" },
  { key: "prone", name: "Сбит с ног" },
  { key: "restrained", name: "Опутан" },
  { key: "stunned", name: "Ошеломлён" },
  { key: "unconscious", name: "Без сознания" },
  { key: "exhaustion_1", name: "Истощение 1" },
  { key: "exhaustion_2", name: "Истощение 2" },
  { key: "exhaustion_3", name: "Истощение 3" },
  { key: "exhaustion_4", name: "Истощение 4" },
  { key: "exhaustion_5", name: "Истощение 5" },
  { key: "exhaustion_6", name: "Истощение 6" },
];

export function ConditionsControl({ character, onCharacterUpdate }: ConditionsControlProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState("");
  const [conditionSource, setConditionSource] = useState("");

  const conditions = character.conditions || [];

  // Get condition name by key
  const getConditionName = (key: string): string => {
    const found = DND_CONDITIONS.find(c => c.key === key);
    return found?.name || key;
  };

  // Get available conditions (not already applied)
  const availableConditions = DND_CONDITIONS.filter(
    c => !conditions.some(existing => existing.key === c.key)
  );

  // Add condition
  const handleAddCondition = async () => {
    if (!selectedCondition) {
      toast.error("Выберите состояние");
      return;
    }

    setIsLoading(true);
    try {
      const condition: Condition = {
        key: selectedCondition,
        name: getConditionName(selectedCondition),
        source: conditionSource || undefined,
        applied_at: new Date().toISOString(),
      };

      const response = await api.modifyCharacterConditions(character.id, "add", condition);
      onCharacterUpdate(response.data.character);
      toast.success(`${character.name}: ${condition.name}`);

      // Reset and close
      setSelectedCondition("");
      setConditionSource("");
      setAddModalOpen(false);
    } catch (error) {
      console.error("Failed to add condition:", error);
      toast.error("Не удалось добавить состояние");
    } finally {
      setIsLoading(false);
    }
  };

  // Remove condition
  const handleRemoveCondition = async (condition: Condition) => {
    setIsLoading(true);
    try {
      const response = await api.modifyCharacterConditions(character.id, "remove", condition);
      onCharacterUpdate(response.data.character);
      toast.info(`${condition.name || condition.key} снято`);
    } catch (error) {
      console.error("Failed to remove condition:", error);
      toast.error("Не удалось снять состояние");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
          <h3 className="font-semibold text-zinc-100">Состояния</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddModalOpen(true)}
          className="bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
        >
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      {/* Conditions list */}
      {conditions.length === 0 ? (
        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-center">
          <p className="text-sm text-zinc-500">Нет активных состояний</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {conditions.map((condition) => (
            <Badge
              key={condition.key}
              variant="outline"
              className={cn(
                "text-sm py-1.5 px-3 flex items-center gap-2",
                "bg-orange-500/10 border-orange-500/30 text-orange-400"
              )}
            >
              <span>{condition.name || getConditionName(condition.key)}</span>
              {condition.source && (
                <span className="text-orange-400/60 text-xs">({condition.source})</span>
              )}
              <button
                onClick={() => handleRemoveCondition(condition)}
                disabled={isLoading}
                className="ml-1 hover:text-orange-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add Condition Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Добавить состояние</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Выберите состояние для {character.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Состояние</Label>
              <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Выберите состояние" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {availableConditions.map((condition) => (
                    <SelectItem
                      key={condition.key}
                      value={condition.key}
                      className="text-zinc-100 focus:bg-zinc-700 focus:text-zinc-100"
                    >
                      {condition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Источник (опционально)</Label>
              <Input
                placeholder="Например: Яд паука, Заклинание"
                value={conditionSource}
                onChange={(e) => setConditionSource(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAddModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              disabled={isLoading || !selectedCondition}
              onClick={handleAddCondition}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
