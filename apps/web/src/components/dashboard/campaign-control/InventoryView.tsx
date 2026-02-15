"use client";

import type { Character, InventoryItem } from "@/types/game";
import { cn } from "@/lib/utils";
import { Backpack, Package, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InventoryViewProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
}

export function InventoryView({ character, onCharacterUpdate }: InventoryViewProps) {
  const inventory = character.inventory || [];
  const equipment = character.equipment || {};

  // Get equipment slots that are filled
  const equippedItems = Object.entries(equipment)
    .filter(([_, value]) => value)
    .map(([slot, item]) => ({ slot, item }));

  const slotNames: Record<string, string> = {
    armor: "Доспех",
    main_hand: "Основная рука",
    off_hand: "Левая рука",
    ring_1: "Кольцо 1",
    ring_2: "Кольцо 2",
    amulet: "Амулет",
    cloak: "Плащ",
    boots: "Сапоги",
    gloves: "Перчатки",
    belt: "Пояс",
    helm: "Шлем",
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Backpack className="h-5 w-5 text-amber-400" />
        <h3 className="font-semibold text-zinc-100">Инвентарь</h3>
        <Badge variant="outline" className="ml-auto bg-zinc-800 border-zinc-700 text-zinc-400">
          {inventory.length} предметов
        </Badge>
      </div>

      {/* Equipped items */}
      {equippedItems.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-zinc-400">Экипировка</h4>
          <div className="grid grid-cols-2 gap-2">
            {equippedItems.map(({ slot, item }) => (
              <div
                key={slot}
                className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500">{slotNames[slot] || slot}</p>
                  <p className="text-sm text-zinc-100 truncate">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory list */}
      {inventory.length === 0 ? (
        <div className="p-6 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-center">
          <Package className="mx-auto h-10 w-10 text-zinc-700 mb-2" />
          <p className="text-sm text-zinc-500">Инвентарь пуст</p>
        </div>
      ) : (
        <div className="space-y-2">
          {inventory.map((item, index) => (
            <div
              key={`${item.item_slug || item.name}-${index}`}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                "bg-zinc-800 border border-zinc-700"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-100">
                    {item.name || item.item_slug}
                  </span>
                  {item.quantity > 1 && (
                    <Badge variant="outline" className="bg-zinc-700/50 border-zinc-600 text-zinc-400">
                      x{item.quantity}
                    </Badge>
                  )}
                  {item.custom && (
                    <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
                      Custom
                    </Badge>
                  )}
                </div>
                {item.notes && (
                  <p className="text-xs text-zinc-500 mt-0.5">{item.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
