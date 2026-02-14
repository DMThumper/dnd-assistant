"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Swords,
  BookOpen,
  Users,
  Map,
  Scroll,
  X,
  Tv,
  Dices,
  Shield,
  Wand2,
  Package,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
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
  { href: "/dashboard/users", icon: Users, label: "Пользователи" },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/ru/dashboard";
    }
    return pathname?.startsWith(href) || pathname?.startsWith(`/ru${href}`);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all",
          "hover:bg-white/10",
          active
            ? "bg-primary/20 text-primary border-l-2 border-primary"
            : "text-zinc-400 hover:text-zinc-100"
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
        <span>{item.label}</span>
      </Link>
    );
  };

  const renderNavSection = (title: string, items: NavItem[]) => (
    <div className="space-y-1">
      <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
        {title}
      </h3>
      {items.map(renderNavItem)}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[280px] flex flex-col bg-zinc-900 md:hidden"
          >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
              <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
                <Swords className="h-7 w-7 text-primary" />
                <span className="font-bold text-lg text-zinc-100">D&D Assistant</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
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

            {/* Footer */}
            <div className="border-t border-zinc-800 p-4">
              <p className="text-xs text-zinc-500 text-center">
                D&D Assistant v0.1.0
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
