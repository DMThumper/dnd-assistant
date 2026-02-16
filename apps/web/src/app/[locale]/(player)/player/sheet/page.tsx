"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const ACTIVE_CHARACTER_KEY = "dnd-player-active-character";

export default function SheetRedirectPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    // Small delay to ensure localStorage is accessible
    const timeout = setTimeout(() => {
      const activeCharId = localStorage.getItem(ACTIVE_CHARACTER_KEY);

      if (activeCharId) {
        router.replace(`/player/sheet/${activeCharId}`);
      } else {
        router.replace("/player");
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
