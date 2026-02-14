"use client";

import { useState, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar, MobileSidebar, Header } from "@/components/dashboard";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // TODO: Add auth protection
  // const { isAuthenticated, isLoading, hasBackofficeAccess } = useAuth();
  // const router = useRouter();
  //
  // useEffect(() => {
  //   if (!isLoading && (!isAuthenticated || !hasBackofficeAccess)) {
  //     router.push("/login");
  //   }
  // }, [isAuthenticated, isLoading, hasBackofficeAccess, router]);
  //
  // if (isLoading) {
  //   return (
  //     <div className="flex h-screen items-center justify-center bg-zinc-950">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //     </div>
  //   );
  // }
  //
  // if (!isAuthenticated || !hasBackofficeAccess) {
  //   return null;
  // }

  return (
    <TooltipProvider>
      <div className="fixed inset-0 flex bg-zinc-950">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-zinc-950">
            {children}
          </main>
        </div>

        {/* Toast notifications */}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#27272a",
              border: "1px solid #3f3f46",
              color: "#fafafa",
            },
          }}
        />
      </div>
    </TooltipProvider>
  );
}
