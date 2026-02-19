"use client";

import type { ConcentrationSpell } from "@/types/spell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Focus, X, Shield } from "lucide-react";

interface ConcentrationIndicatorProps {
  concentration: ConcentrationSpell;
  onEnd: () => void;
  canModify: boolean;
}

export function ConcentrationIndicator({
  concentration,
  onEnd,
  canModify,
}: ConcentrationIndicatorProps) {
  return (
    <Card
      className={cn(
        "bg-orange-500/20 border-orange-500/50",
        "sticky top-0 z-10"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Pulsing indicator */}
          <div className="relative shrink-0">
            <Focus className="h-6 w-6 text-orange-400" />
            <div className="absolute inset-0 h-6 w-6 rounded-full bg-orange-400/30 animate-ping" />
          </div>

          {/* Spell info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-orange-200 truncate">
              {concentration.spell_name}
            </div>
            <div className="text-xs text-orange-300/70">
              {concentration.duration}
            </div>
          </div>

          {/* CON Save DC indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Shield className="h-4 w-4 text-orange-400" />
            <Badge
              variant="outline"
              className="border-orange-500/50 text-orange-300 font-mono text-sm px-2"
            >
              ТЕЛ СЛ 10+
            </Badge>
          </div>

          {/* End concentration button */}
          {canModify && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
              onClick={onEnd}
              title="Прервать концентрацию"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
