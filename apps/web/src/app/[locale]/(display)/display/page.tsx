"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Sword, Loader2, Wifi, WifiOff } from "lucide-react";

type DisplayStatus = "loading" | "waiting" | "paired" | "error";

interface DisplayState {
  status: DisplayStatus;
  code: string | null;
  codeTtl: number;
  campaignName: string | null;
  error: string | null;
}

export default function DisplayPage() {
  const t = useTranslations("display");

  const [state, setState] = useState<DisplayState>({
    status: "loading",
    code: null,
    codeTtl: 0,
    campaignName: null,
    error: null,
  });

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Register display and get code
  const registerDisplay = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.post('/display/register');
      // For now, simulate with mock data
      const mockCode = Math.floor(1000 + Math.random() * 9000).toString();
      setState({
        status: "waiting",
        code: mockCode,
        codeTtl: 300, // 5 minutes
        campaignName: null,
        error: null,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: t("errors.connectionFailed"),
      }));
    }
  }, [t]);

  // Initialize display on mount
  useEffect(() => {
    registerDisplay();
  }, [registerDisplay]);

  // Countdown timer for code TTL
  useEffect(() => {
    if (state.status !== "waiting" || state.codeTtl <= 0) return;

    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.codeTtl <= 1) {
          // Code expired, refresh it
          registerDisplay();
          return prev;
        }
        return { ...prev, codeTtl: prev.codeTtl - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.status, state.codeTtl, registerDisplay]);

  // Render loading state
  if (state.status === "loading") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
        <p className="text-xl text-muted-foreground">{t("connecting")}</p>
      </div>
    );
  }

  // Render error state
  if (state.status === "error") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white">
        <WifiOff className="mb-4 h-16 w-16 text-destructive" />
        <h1 className="mb-2 text-2xl font-bold">{t("errors.title")}</h1>
        <p className="mb-8 text-muted-foreground">{state.error}</p>
        <button
          onClick={registerDisplay}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  // Render paired state
  if (state.status === "paired") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white">
        <Wifi className="mb-4 h-12 w-12 text-green-500" />
        <h1 className="mb-2 text-2xl font-bold text-green-500">
          {t("paired.title")}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t("paired.campaign")}: {state.campaignName}
        </p>
        <p className="mt-8 text-sm text-muted-foreground">
          {t("paired.waitingForDm")}
        </p>
      </div>
    );
  }

  // Render waiting for pairing (show code)
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <Sword className="h-10 w-10 text-primary" />
        <span className="text-3xl font-bold">D&D Assistant</span>
      </div>

      {/* Pairing code */}
      <div className="mb-4 text-center">
        <p className="mb-2 text-lg text-muted-foreground">{t("code.label")}</p>
        <div className="flex gap-3">
          {state.code?.split("").map((digit, i) => (
            <div
              key={i}
              className="flex h-24 w-20 items-center justify-center rounded-xl bg-zinc-900 text-5xl font-bold text-gold shadow-lg"
            >
              {digit}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <p className="mb-8 text-center text-muted-foreground">
        {t("code.instruction")}
      </p>

      {/* TTL countdown */}
      <div className="text-sm text-muted-foreground">
        {t("code.expiresIn")} {formatTime(state.codeTtl)}
      </div>
    </div>
  );
}
