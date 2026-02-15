"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { RaceForm } from "@/components/dashboard/races/RaceForm";

export default function NewRacePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/races")}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Новая раса</h1>
          <p className="text-zinc-400">Создание новой расы для игры</p>
        </div>
      </div>

      {/* Form */}
      <RaceForm mode="create" />
    </div>
  );
}
