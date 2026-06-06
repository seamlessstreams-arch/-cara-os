"use client";

// ══════════════════════════════════════════════════════════════════════════════
// useUnsavedGuard — warn before losing unsaved work to a tab close / refresh
//
// Attaches a `beforeunload` listener only while `when` is true (i.e. there is
// genuinely unsaved text), so the browser shows its native "Leave site? Changes
// you made may not be saved" prompt. Detaches as soon as the work is saved or
// cleared, so it never nags unnecessarily.
//
// Note: `beforeunload` only covers full-page navigation (tab close, refresh,
// hard nav). In-dialog dismissal and in-app routing are guarded separately.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";

export function useUnsavedGuard(when: boolean) {
  useEffect(() => {
    if (!when || typeof window === "undefined") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy requirement for the prompt to show in some browsers.
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [when]);
}
