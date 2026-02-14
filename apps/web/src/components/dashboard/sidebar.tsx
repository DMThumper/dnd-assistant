"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Swords,
  BookOpen,
  Users,
  Map,
  Music,
  Scroll,
  Settings,
  ChevronLeft,
  ChevronRight,
  Tv,
  Dices,
  Shield,
  Wand2,
  Package,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission?: string;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Обзор" },
  { href: "/dashboard/campaigns", icon: Map, label: "Кампании" },
  { href: "/dashboard/encounters", icon: Swords, label: "Встречи" },
  { href: "/dashboard/battle", icon: Shield, label: "Трекер боя" },
];

const contentNavItems: NavItem[] = [
  { href: "/dashboard/monsters", icon: Bug, label: "Бестиарий" },
  { href: "/dashboard/spells", icon: Wand2, label: "Заклинания" },
  { href: "/dashboard/items", icon: Package, label: "Предметы" },
  { href: "/dashboard/random-tables", icon: Dices, label: "Таблицы" },
];

const settingsNavItems: NavItem[] = [
  { href: "/dashboard/rule-systems", icon: BookOpen, label: "Системы правил" },
  { href: "/dashboard/settings", icon: Scroll, label: "Сеттинги" },
  { href: "/dashboard/display-control", icon: Tv, label: "Управление ТВ" },
  { href: "/dashboard/users", icon: Users, label: "Пользователи", permission: "manage users" },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dnd-sidebar-collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("dnd-sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/ru/dashboard";
    }
    return pathname?.startsWith(href) || pathname?.startsWith(`/ru${href}`);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
          "hover:bg-white/10",
          active
            ? "bg-primary/20 text-primary border-l-2 border-primary"
            : "text-zinc-400 hover:text-zinc-100"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
        {!isCollapsed && <span>{item.label}</span>}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="bg-zinc-800 text-zinc-100 border-zinc-700">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{linkContent}</div>;
  };

  const renderNavSection = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      {!isCollapsed && (
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
          {title}
        </h3>
      )}
      {items.map(renderNavItem)}
    </div>
  );

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-zinc-900 border-r border-zinc-800 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-zinc-800 px-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <Swords className="h-7 w-7 text-primary" />
            <span className="font-bold text-lg text-zinc-100">D&D Assistant</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard">
            <Swords className="h-7 w-7 text-primary" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {renderNavSection("Основное", mainNavItems)}
          <Separator className="bg-zinc-800" />
          {renderNavSection("Контент", contentNavItems)}
          <Separator className="bg-zinc-800" />
          {renderNavSection("Настройки", settingsNavItems)}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t border-zinc-800 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full text-zinc-400 hover:text-zinc-100 hover:bg-white/10",
            isCollapsed && "justify-center"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Свернуть</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
