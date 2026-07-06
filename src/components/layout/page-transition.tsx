"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Page transition
// Gives every route change a soft fade + rise, for a high-class, deliberate feel.
// Pure CSS (no motion library): re-keying on the pathname replays the animation.
// Honours prefers-reduced-motion via the .cs-page-enter rule in globals.css.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="cs-page-enter">
      {children}
    </div>
  );
}
