"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePlayerSession } from "@/contexts/PlayerSessionContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Backpack, Coins, Weight } from "lucide-react";

export default function InventoryPage() {
  const t = useTranslations();
  const router = useRouter();
  const { character, activeCharacterId, isValidating } = usePlayerSession();

  // Redirect if no active character after validation
  useEffect(() => {
    if (!isValidating && !activeCharacterId) {
      router.push("/player");
    }
  }, [isValidating, activeCharacterId, router]);

  if (isValidating) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
        <Backpack className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Персонаж не найден</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("player.sheet.inventory")}</h1>
        <Badge variant="secondary">{character.name}</Badge>
      </div>

      {/* Currency */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-500" />
            Деньги
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 text-center">
            <CurrencyDisplay label="ПМ" value={character.currency.pp} color="text-gray-300" />
            <CurrencyDisplay label="ЗМ" value={character.currency.gp} color="text-yellow-500" />
            <CurrencyDisplay label="ЭМ" value={character.currency.ep} color="text-blue-400" />
            <CurrencyDisplay label="СМ" value={character.currency.sp} color="text-gray-400" />
            <CurrencyDisplay label="ММ" value={character.currency.cp} color="text-orange-600" />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Всего: {formatCurrency(character.currency)}
          </p>
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Снаряжение</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Система инвентаря будет добавлена позже.
          </p>
        </CardContent>
      </Card>

      {/* Other Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Backpack className="h-4 w-4" />
            Предметы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Предметы персонажа будут отображаться здесь.
          </p>
        </CardContent>
      </Card>

      {/* Weight */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Weight className="h-4 w-4" />
            Нагрузка
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Текущий вес</span>
            <span>0 кг</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Грузоподъёмность</span>
            <span>{character.abilities.strength * 7.5} кг</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CurrencyDisplayProps {
  label: string;
  value: number;
  color: string;
}

function CurrencyDisplay({ label, value, color }: CurrencyDisplayProps) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
