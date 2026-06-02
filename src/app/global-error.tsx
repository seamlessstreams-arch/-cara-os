"use client";

// ══════════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR BOUNDARY (root)
//
// Last-resort boundary for errors that escape the route segment boundaries
// (e.g. thrown from the root layout). Renders its own <html>/<body>. Also
// auto-recovers from chunk-load failures caused by deployment skew.
// ══════════════════════════════════════════════════════════════════════════════

import { useEffect } from "react";

function isChunkLoadError(err: Error): boolean {
  const msg = `${err?.name ?? ""} ${err?.message ?? ""}`;
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(msg);
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isChunkLoadError(error)) {
      try {
        const KEY = "cs_chunk_reload_at";
        const last = Number(sessionStorage.getItem(KEY) ?? "0");
        if (Date.now() - last > 10_000) {
          sessionStorage.setItem(KEY, String(Date.now()));
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    } else {
      console.error("[global error boundary]", error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f7f3ec" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, width: "100%", borderRadius: 16, border: "1px solid #e6dccb", background: "#fff", padding: 32, textAlign: "center" }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#0f1e36", margin: "0 0 8px" }}>
              {isChunkLoadError(error) ? "Updating Cornerstone…" : "Something went wrong"}
            </h1>
            <p style={{ fontSize: 14, color: "#667085", margin: "0 0 20px" }}>
              {isChunkLoadError(error)
                ? "A newer version is available. Reloading…"
                : "Cornerstone hit an unexpected error. Your data is safe."}
            </p>
            <button
              onClick={() => reset()}
              style={{ background: "#0f1e36", color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer", minHeight: 44 }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
