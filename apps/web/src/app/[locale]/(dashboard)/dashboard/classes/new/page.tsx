"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { ClassForm } from "@/components/dashboard/classes/ClassForm";

export default function NewClassPage() {
  const router = useRouter();

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
          <h1 className="text-2xl font-bold text-zinc-100">Новый класс</h1>
          <p className="text-zinc-400">Создание нового класса персонажа</p>
        </div>
      </div>

      {/* Form */}
      <ClassForm mode="create" />
    </div>
  );
}
