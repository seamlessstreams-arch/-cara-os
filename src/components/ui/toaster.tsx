"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TOAST PROVIDER (Sonner)
// Styled toasts for success, error, warning, and info notifications.
// ══════════════════════════════════════════════════════════════════════════════

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: "!rounded-xl !border-slate-200 !shadow-lg !text-sm",
        style: {
          fontFamily: "inherit",
        },
      }}
      richColors
      closeButton
      duration={4000}
    />
  );
}
