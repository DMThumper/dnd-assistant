"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Loader2, Swords, BookOpen, Backpack, LogOut } from "lucide-react";

const ACTIVE_CHARACTER_KEY = "dnd-player-active-character";
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

export default function PlayerLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, logout, hasBackofficeAccess } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);

  // Get active character ID from localStorage
  useEffect(() => {
    const charId = localStorage.getItem(ACTIVE_CHARACTER_KEY);
    setActiveCharacterId(charId);
  }, [pathname]); // Re-check when pathname changes

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

  const navItems: NavItem[] = [
    {
      href: sheetHref,
      label: t("player.sheet.abilities"),
      icon: <Swords className="h-5 w-5" />,
      match: /\/player\/sheet/,
    },
    {
      href: "/player/spells",
      label: t("player.sheet.spells"),
      icon: <BookOpen className="h-5 w-5" />,
      match: /\/player\/spells/,
    },
    {
      href: "/player/inventory",
      label: t("player.sheet.inventory"),
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
                        pathname.includes("/player/inventory");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Header - Always visible */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/player" className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">D&D</span>
            <span className="text-sm text-muted-foreground">Assistant</span>
          </Link>

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
        "flex-1",
        showBottomNav && "pb-16" // Add padding for bottom nav
      )}>
        {children}
      </main>

      {/* Bottom Navigation - Only shown on character sheet views */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card">
          <div className="flex h-16 items-center justify-around px-2">
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
