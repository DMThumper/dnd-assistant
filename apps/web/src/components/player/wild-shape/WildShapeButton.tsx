"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PawPrint } from "lucide-react";
import { BeastSelectionModal } from "./BeastSelectionModal";
import type { Character } from "@/types/game";

interface WildShapeButtonProps {
  character: Character;
  onTransform: (character: Character) => void;
}

export function WildShapeButton({ character, onTransform }: WildShapeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show for druids
  if (character.class_slug !== "druid") {
    return null;
  }

  // Don't show if already in beast form (overlay handles that)
  if (character.wild_shape_form) {
    return null;
  }

  const charges = character.wild_shape_charges ?? 2;
  const hasCharges = charges > 0;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        disabled={!hasCharges}
        className="w-full gap-2 border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300 disabled:opacity-50"
      >
        <PawPrint className="h-5 w-5" />
        <span>Дикий облик</span>
        <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-300">
          {charges}/2
        </Badge>
      </Button>

      <BeastSelectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        character={character}
        onTransform={(updatedCharacter) => {
          onTransform(updatedCharacter);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
