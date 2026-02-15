"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MonsterForm } from "@/components/dashboard/monsters/MonsterForm";
import { ArrowLeft } from "lucide-react";

export default function NewMonsterPage() {
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
          <h1 className="text-2xl font-bold text-zinc-100">Создать монстра</h1>
          <p className="text-zinc-400">Добавьте нового монстра в бестиарий</p>
        </div>
      </div>

      {/* Form */}
      <MonsterForm mode="create" />
    </div>
  );
}
