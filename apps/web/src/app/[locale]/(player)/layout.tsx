import type { ReactNode } from "react";

export default function PlayerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Player layout - mobile-first, will be enhanced later */}
      {children}
    </div>
  );
}
