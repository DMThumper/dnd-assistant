import type { ReactNode } from "react";

export default function DisplayLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="display-fullscreen bg-black">
      {/* Display layout - fullscreen, no UI chrome */}
      {children}
    </div>
  );
}
