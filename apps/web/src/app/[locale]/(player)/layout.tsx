"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { PlayerSessionProvider, usePlayerSession } from "@/contexts/PlayerSessionContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { cn } from "@/lib/utils";
import { Loader2, Swords, Sparkles, BookOpen, Backpack, LogOut, Radio, WifiOff, Wifi, Ghost } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  match?: RegExp;
}

// Inner layout component that uses the session context
function PlayerLayoutInner({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, logout, hasBackofficeAccess } = useAuth();
  const { activeCharacterId, activeCampaignId, isValidating, isConnected, liveSession, character, clearActiveCharacter } = usePlayerSession();
  const { hasAuthError } = useWebSocket();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Build nav items with dynamic character ID
  const sheetHref = activeCharacterId ? `/player/sheet/${activeCharacterId}` : "/player/sheet";
  const featuresHref = activeCharacterId ? `/player/sheet/${activeCharacterId}/features` : "/player/features";

  // Check if character has summons or can summon (druids, wizards, etc.)
  const hasSummons = character?.summoned_creatures && character.summoned_creatures.length > 0;

  // Classes that can summon creatures (Wild Shape, Find Familiar, etc.)
  const summonerClasses = ["druid", "wizard", "warlock", "ranger"];
  const canSummon = character?.class_slug && summonerClasses.includes(character.class_slug);

  const navItems: NavItem[] = [
    {
      href: sheetHref,
      label: t("player.nav.sheet"),
      icon: <Swords className="h-5 w-5" />,
      match: /\/player\/sheet(\/\d+)?$/,
    },
    {
      href: featuresHref,
      label: t("player.nav.features"),
      icon: <Sparkles className="h-5 w-5" />,
      match: /\/player\/(sheet\/\d+\/)?features/,
    },
    {
      href: "/player/spells",
      label: t("player.nav.spells"),
      icon: <BookOpen className="h-5 w-5" />,
      match: /\/player\/spells/,
    },
    // Show summons tab if character has summons OR can summon (druids, wizards, etc.)
    ...((hasSummons || canSummon) ? [{
      href: "/player/summons",
      label: "Призыв",
      icon: <Ghost className="h-5 w-5" />,
      match: /\/player\/summons/,
    }] : []),
    {
      href: "/player/inventory",
      label: t("player.nav.inventory"),
      icon: <Backpack className="h-5 w-5" />,
      match: /\/player\/inventory/,
    },
  ];

  const isNavItemActive = (item: NavItem) => {
    if (item.match) {
      return item.match.test(pathname);
    }
    return pathname === item.href;
  };

  const handleLogout = async () => {
    await logout();
  };

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  // Check if we're on a page that should show bottom nav (character sheet views)
  const showBottomNav = pathname.includes("/player/sheet") ||
                        pathname.includes("/player/spells") ||
                        pathname.includes("/player/inventory") ||
                        pathname.includes("/player/features") ||
                        pathname.includes("/player/summons");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Header - Always visible */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          {/* Left side: Logo + Session Status */}
          <div className="flex items-center gap-3">
            <Link href="/player" className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">D&D</span>
              <span className="text-sm text-muted-foreground">Assistant</span>
            </Link>

            {/* Connection Status Indicator - only show after validation */}
            {!isValidating && (
              <>
                {/* Priority 1: Offline - auth error takes precedence */}
                {hasAuthError ? (
                  <Badge
                    variant="outline"
                    className="bg-red-500/10 border-red-500/30 text-red-400 text-xs cursor-pointer hover:bg-red-500/20"
                    title="Ошибка авторизации. Нажмите чтобы сбросить сессию"
                    onClick={() => {
                      clearActiveCharacter();
                      window.location.reload();
                    }}
                  >
                    <WifiOff className="mr-1 h-3 w-3" />
                    Offline
                  </Badge>
                ) : /* Priority 2: Live - active character + live session + connected */
                showBottomNav && character?.is_active && liveSession && isConnected ? (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 border-green-500/30 text-green-400 text-xs animate-pulse"
                    title={`Сессия активна · ${character.name}`}
                  >
                    <Radio className="mr-1 h-3 w-3" />
                    Live
                  </Badge>
                ) : /* Priority 3: Connected - active character + connected (no live session) */
                showBottomNav && character?.is_active && isConnected ? (
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs"
                    title="Подключено к серверу"
                  >
                    <Wifi className="mr-1 h-3 w-3" />
                    Connected
                  </Badge>
                ) : /* Priority 4: Sandbox mode - inactive character (experimentation) */
                showBottomNav && character && !character.is_active ? (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 border-amber-500/30 text-amber-400 text-xs"
                    title="Режим экспериментирования (персонаж неактивен)"
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    Sandbox
                  </Badge>
                ) : /* Priority 5: Disconnected - active character but connection lost */
                showBottomNav && character?.is_active && !isConnected ? (
                  <Badge
                    variant="outline"
                    className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400 text-xs"
                    title="Нет подключения к серверу"
                  >
                    <WifiOff className="mr-1 h-3 w-3" />
                    Disconnected
                  </Badge>
                ) : /* Priority 6: Not on character sheet - no status needed */
                null}
              </>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              {hasBackofficeAccess && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      {t("dashboard.title")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t("auth.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "mx-auto w-full max-w-2xl flex-1",
        showBottomNav && "pb-16" // Add padding for bottom nav
      )}>
        {children}
      </main>

      {/* Bottom Navigation - Only shown on character sheet views */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card">
          <div className="mx-auto flex h-16 max-w-2xl items-center justify-around px-2">
            {navItems.map((item) => {
              const isActive = isNavItemActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.icon}
                  <span className="line-clamp-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

// Export the layout wrapped in PlayerSessionProvider
export default function PlayerLayout({ children }: { children: ReactNode }) {
  return (
    <PlayerSessionProvider>
      <PlayerLayoutInner>{children}</PlayerLayoutInner>
    </PlayerSessionProvider>
  );
}
