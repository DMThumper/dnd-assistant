import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard layout - will include sidebar, enhanced later */}
      <div className="flex">
        {/* Sidebar placeholder */}
        <aside className="hidden w-64 border-r border-border bg-sidebar lg:block">
          <div className="flex h-16 items-center border-b border-sidebar-border px-6">
            <span className="text-lg font-bold text-sidebar-foreground">
              D&D Assistant
            </span>
          </div>
          <nav className="p-4">
            {/* Navigation will be added */}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
