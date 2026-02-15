"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import type { SpellBackoffice, SettingOption } from "@/types/backoffice";
import { Button } from "@/components/ui/button";
import { SpellForm } from "@/components/dashboard/spells/SpellForm";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditSpellPage() {
  const params = useParams();
  const spellId = Number(params.id);

  const [spell, setSpell] = useState<SpellBackoffice | null>(null);
  const [settings, setSettings] = useState<SettingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpell = async () => {
      try {
        setIsLoading(true);
        const response = await api.getSpell(spellId);
        setSpell(response.data.spell);
        setSettings(response.data.settings);
        setError(null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить заклинание");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSpell();
  }, [spellId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !spell) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/spells">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">Ошибка</h1>
        </div>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error || "Заклинание не найдено"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/spells">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">
            Редактировать: {spell.name}
          </h1>
          <p className="text-zinc-400">Изменение параметров заклинания</p>
        </div>
      </div>

      {/* Form */}
      <SpellForm
        mode="edit"
        initialData={spell}
        initialSettings={settings}
      />
    </div>
  );
}
