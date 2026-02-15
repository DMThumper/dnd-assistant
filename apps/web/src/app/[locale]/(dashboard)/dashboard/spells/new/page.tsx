"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SpellForm } from "@/components/dashboard/spells/SpellForm";
import { ArrowLeft } from "lucide-react";

export default function NewSpellPage() {
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
          <h1 className="text-2xl font-bold text-zinc-100">Создать заклинание</h1>
          <p className="text-zinc-400">Добавьте новое заклинание в справочник</p>
        </div>
      </div>

      {/* Form */}
      <SpellForm mode="create" />
    </div>
  );
}
