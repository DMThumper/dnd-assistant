"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import type { CharacterClassBackoffice, SettingOption } from "@/types/backoffice";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import { ClassForm } from "@/components/dashboard/classes/ClassForm";

export default function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [cls, setCls] = useState<CharacterClassBackoffice | null>(null);
  const [settings, setSettings] = useState<SettingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        setIsLoading(true);
        const response = await api.getClass(Number(resolvedParams.id));
        setCls(response.data.class);
        setSettings(response.data.settings);
        setError(null);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Не удалось загрузить класс");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchClass();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/classes")}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error || "Класс не найден"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/classes")}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Редактировать: {cls.name}</h1>
          <p className="text-zinc-400">{cls.slug}</p>
        </div>
      </div>

      {/* Form */}
      <ClassForm mode="edit" initialData={cls} initialSettings={settings} />
    </div>
  );
}
