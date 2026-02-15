"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import type { DisplayStatus } from "@/types/game";
import { Sword, Loader2, Wifi, WifiOff } from "lucide-react";

const DISPLAY_TOKEN_KEY = "dnd-display-token";
const POLL_INTERVAL = 3000; // Poll for pairing status every 3 seconds
const HEARTBEAT_INTERVAL = 30000; // Send heartbeat every 30 seconds

interface DisplayState {
  status: "loading" | DisplayStatus | "error";
  code: string | null;
  codeTtl: number;
  campaignName: string | null;
  campaignSlug: string | null;
  error: string | null;
}

export default function DisplayPage() {
  const t = useTranslations("display");
  const router = useRouter();

  const [state, setState] = useState<DisplayState>({
    status: "loading",
    code: null,
    codeTtl: 0,
    campaignName: null,
    campaignSlug: null,
    error: null,
  });

  const tokenRef = useRef<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Clear all intervals
  const clearIntervals = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Check display status (poll)
  const checkStatus = useCallback(async (token: string) => {
    try {
      const response = await api.getDisplayStatus(token);
      const data = response.data;

      if (data.status === "paired" && data.campaign) {
        // Paired! Navigate to display screen
        clearIntervals();
        setState((prev) => ({
          ...prev,
          status: "paired",
          campaignName: data.campaign?.name || null,
          campaignSlug: data.campaign?.slug || null,
        }));
        // Navigate to the display screen after a short delay
        setTimeout(() => {
          router.push(`/display/screen?token=${encodeURIComponent(token)}`);
        }, 2000);
      } else if (data.status === "waiting") {
        setState((prev) => ({
          ...prev,
          status: "waiting",
          code: data.code,
          codeTtl: data.code_ttl || 0,
        }));
      } else if (data.status === "disconnected") {
        // Re-register if disconnected
        localStorage.removeItem(DISPLAY_TOKEN_KEY);
        registerDisplay();
      }
    } catch {
      // Token might be invalid, re-register
      localStorage.removeItem(DISPLAY_TOKEN_KEY);
      registerDisplay();
    }
  }, [clearIntervals, router]);

  // Register display and get code
  const registerDisplay = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, status: "loading" }));

      // Check for existing token
      const existingToken = localStorage.getItem(DISPLAY_TOKEN_KEY);
      if (existingToken) {
        tokenRef.current = existingToken;
        await checkStatus(existingToken);
        return;
      }

      // Register new display
      const response = await api.registerDisplay();
      const data = response.data;

      // Save token
      localStorage.setItem(DISPLAY_TOKEN_KEY, data.token);
      tokenRef.current = data.token;

      setState({
        status: "waiting",
        code: data.code,
        codeTtl: data.code_ttl,
        campaignName: null,
        campaignSlug: null,
        error: null,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: t("errors.connectionFailed"),
      }));
    }
  }, [t, checkStatus]);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = setInterval(async () => {
      const token = tokenRef.current;
      if (token) {
        try {
          await api.displayHeartbeat(token);
        } catch {
          // Ignore heartbeat errors
        }
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  // Start polling for status
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    pollIntervalRef.current = setInterval(() => {
      const token = tokenRef.current;
      if (token) {
        checkStatus(token);
      }
    }, POLL_INTERVAL);
  }, [checkStatus]);

  // Initialize display on mount
  useEffect(() => {
    registerDisplay();
    return () => {
      clearIntervals();
    };
  }, [registerDisplay, clearIntervals]);

  // Start polling and heartbeat when waiting
  useEffect(() => {
    if (state.status === "waiting") {
      startPolling();
      startHeartbeat();
    }
    return () => {
      clearIntervals();
    };
  }, [state.status, startPolling, startHeartbeat, clearIntervals]);

  // Countdown timer for code TTL
  useEffect(() => {
    if (state.status !== "waiting" || state.codeTtl <= 0) return;

    const timer = setInterval(() => {
      setState((prev) => {
        if (prev.codeTtl <= 1) {
          // Code expired, refresh it
          const token = tokenRef.current;
          if (token) {
            api.refreshDisplayCode(token).then((response) => {
              setState((p) => ({
                ...p,
                code: response.data.code,
                codeTtl: response.data.code_ttl,
              }));
            }).catch(() => {
              // Refresh failed, re-register
              registerDisplay();
            });
          }
          return prev;
        }
        return { ...prev, codeTtl: prev.codeTtl - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.status, state.codeTtl, registerDisplay]);

  // Handle page unload - disconnect display
  useEffect(() => {
    const handleUnload = () => {
      const token = tokenRef.current;
      if (token) {
        // Use sendBeacon for reliable unload
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/display/disconnect`,
          JSON.stringify({ token })
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

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
          onClick={() => void registerDisplay()}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  // Render paired state (brief transition before navigating to screen)
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
