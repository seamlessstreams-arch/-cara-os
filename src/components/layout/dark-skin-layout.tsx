import React from "react";

// Ask CARA dark skin for route segments whose pages DON'T use PageShell (the
// Cara-intelligence dashboards, cara-toolkit tools, and a few standalone pages).
// PageShell applies `.cara-dark` on its own body (darkBody defaults true); pages
// that render their content directly had no such wrapper and so fell back to the
// light default — the reskin's biggest remaining light-leak class.
//
// Dropped in as a Next `layout.tsx` for the affected segment, this gives those
// pages the same `.cara-dark` token scope + dark canvas. It is idempotent when a
// child DOES use PageShell (nesting `.cara-dark` just re-declares the same tokens),
// so it is safe on mixed subtrees. `min-h-screen` fills the viewport so short
// pages don't leave a light gap below the content.
export default function DarkSkinLayout({ children }: { children: React.ReactNode }) {
  return <div className="cara-dark min-h-screen">{children}</div>;
}
