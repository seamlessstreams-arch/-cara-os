"use client";

// ══════════════════════════════════════════════════════════════════════════════
// PLATFORM ERROR BOUNDARY
//
// Catches render/runtime errors in any (platform) route segment. Critically, it
// auto-recovers from chunk-load failures — the common "This page couldn't load"
// caused by deployment skew (an open tab references JS chunks that a newer deploy
// has replaced). Rather than dead-ending, it triggers a one-time hard reload to
// fetch the current build; for genuine errors it shows a calm retry UI.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

function isChunkLoadError(err: Error): boolean {
  const msg = `${err?.name ?? ""} ${err?.message ?? ""}`;
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(msg);
}

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Deployment-skew recovery: a stale tab requesting now-removed chunks.
    // Reload once (guarded by a session flag so we never loop) to pull the
    // current build, then the page loads normally.
    if (isChunkLoadError(error)) {
      try {
        const KEY = "cs_chunk_reload_at";
        const last = Number(sessionStorage.getItem(KEY) ?? "0");
        // Only auto-reload if we haven't already done so in the last 10s.
        if (Date.now() - last > 10_000) {
          sessionStorage.setItem(KEY, String(Date.now()));
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    } else {
      // Log genuine errors for diagnostics (visible in browser console).
      console.error("[platform error boundary]", error);
    }
  }, [error]);

  const chunk = isChunkLoadError(error);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-[var(--cs-border)] bg-white p-8 text-center shadow-[var(--cs-shadow-card)]">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="text-lg font-bold text-[var(--cs-navy)] mb-1">
          {chunk ? "Updating to the latest version…" : "This page hit a problem"}
        </h1>
        <p className="text-sm text-[var(--cs-text-muted)] mb-5">
          {chunk
            ? "A newer version of Cornerstone is available. Reloading to pick it up…"
            : "Something went wrong loading this page. Your data is safe — try again, or head back to the dashboard."}
        </p>
        {error?.digest && (
          <p className="text-[10px] text-[var(--cs-text-gentle)] mb-4 font-mono">ref: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--cs-navy)] text-white px-4 py-2.5 text-sm font-medium hover:bg-[var(--cs-navy-soft)] transition-colors min-h-[44px]"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--cs-border)] text-[var(--cs-text-secondary)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--cs-bg)] transition-colors min-h-[44px]"
          >
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
