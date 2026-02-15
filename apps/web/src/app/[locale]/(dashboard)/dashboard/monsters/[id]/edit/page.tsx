"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import type { MonsterBackoffice, SettingOption } from "@/types/backoffice";
import { Button } from "@/components/ui/button";
import { MonsterForm } from "@/components/dashboard/monsters/MonsterForm";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditMonsterPage() {
  const params = useParams();
  const monsterId = Number(params.id);

  const [monster, setMonster] = useState<MonsterBackoffice | null>(null);
  const [settings, setSettings] = useState<SettingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonster = async () => {
      try {
        setIsLoading(true);
        const response = await api.getMonster(monsterId);
        setMonster(response.data.monster);
        setSettings(response.data.settings);
        setError(null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить монстра");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchMonster();
  }, [monsterId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !monster) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/monsters">
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
          {error || "Монстр не найден"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/monsters">
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
            Редактировать: {monster.name}
          </h1>
          <p className="text-zinc-400">Изменение параметров монстра</p>
        </div>
      </div>

      {/* Form */}
      <MonsterForm
        mode="edit"
        initialData={monster}
        initialSettings={settings}
      />
    </div>
  );
}
