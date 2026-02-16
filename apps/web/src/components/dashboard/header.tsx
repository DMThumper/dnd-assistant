"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch with Radix UI
  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement global search
      console.log("Search:", searchQuery);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 md:px-6">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Search - desktop */}
        <form onSubmit={handleSearch} className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              type="search"
              placeholder="Поиск по кампаниям, монстрам, заклинаниям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-80 lg:w-96 pl-10 bg-zinc-800 border-zinc-700",
                "text-zinc-100 placeholder:text-zinc-500",
                "focus:border-primary focus:ring-primary/20"
              )}
            />
          </div>
        </form>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
        >
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-400 hover:text-zinc-100 hover:bg-white/10"
        >
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            3
          </Badge>
        </Button>

        {/* User menu - only render after mount to avoid hydration mismatch */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-zinc-100 hover:bg-white/10 px-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                    {getInitials(user?.name || "DM")}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block font-medium">{user?.name || "Мастер"}</span>
                <ChevronDown className="h-4 w-4 text-zinc-500 hidden md:inline-block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-zinc-800 border-zinc-700 text-zinc-100"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || "Мастер"}</p>
                  <p className="text-xs text-zinc-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-700" />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="hover:bg-white/10 cursor-pointer text-red-400 focus:text-red-400"
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-zinc-100 hover:bg-white/10 px-2"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                {getInitials(user?.name || "DM")}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline-block font-medium">{user?.name || "Мастер"}</span>
            <ChevronDown className="h-4 w-4 text-zinc-500 hidden md:inline-block" />
          </Button>
        )}
      </div>
    </header>
  );
}
