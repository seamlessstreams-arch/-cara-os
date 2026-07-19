"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CAPTURE DETERRENCE (sensitive screens)
// Screenshots cannot be technically blocked in a browser — the OS captures the
// screen below the page. What this provides instead, honestly:
//   • AttributionWatermark — a faint tiled overlay (name · role · timestamp) so
//     any captured/printed image identifies who was signed in when it was taken.
//   • SensitiveSurface — blurs its content when the window loses focus or
//     visibility (screen-share leaks, shoulder-surfing, backgrounded tabs) and
//     mounts the watermark. Deterrence + accountability, never fake prevention.
// The Staff Trust Notice tells staff exactly which screens carry these controls.
// ══════════════════════════════════════════════════════════════════════════════

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { useMounted } from "@/hooks/use-mounted";

/** Faint tiled attribution across a sensitive surface. Visible enough to
 * attribute a leaked capture, faint enough not to fight the record itself.
 * Slightly stronger when printed. */
function AttributionWatermark({ className }: { className?: string }) {
  const { currentUser } = useAuthContext();
  // The identity (who · role) is stable across SSR and hydration; the clock is
  // not. Gate the timestamp behind mount so the first client render matches the
  // server HTML (no #418 hydration mismatch), then stamp the real view-time
  // clock on the next tick — which is also the honest value for a watermark
  // (when the screen was *seen*, not when it was built). A statically
  // prerendered page freezes its server HTML at build time, so an ungated
  // `new Date()` here mismatches on every view. See live-fiction-crawl.mjs.
  // Stamp once per mount — a per-render clock would defeat memo + churn tests.
  const mounted = useMounted();
  const stamp = useMemo(() => {
    const who = currentUser?.full_name ?? "Unattributed session";
    const role = currentUser?.role ? ` · ${String(currentUser.role).replace(/_/g, " ")}` : "";
    const at = mounted
      ? ` · ${new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`
      : "";
    return `${who}${role}${at}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, mounted]);

  return (
    <div
      aria-hidden
      data-capture-attribution
      className={cn(
        "pointer-events-none absolute inset-0 z-30 select-none overflow-hidden",
        "opacity-[0.05] print:opacity-20",
        className,
      )}
    >
      <div className="flex h-full w-full flex-wrap content-start gap-x-16 gap-y-14 p-6">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="-rotate-12 whitespace-nowrap text-xs font-semibold text-[var(--cs-navy)]"
          >
            {stamp}
          </span>
        ))}
      </div>
    </div>
  );
}

interface SensitiveSurfaceProps extends React.ComponentProps<"div"> {
  /** Set false to keep the blur-on-hidden behaviour without the watermark. */
  watermark?: boolean;
}

/** Wrap a sensitive screen: attribution watermark + blur when the window
 * loses focus or visibility. Content stays interactive while focused. */
function SensitiveSurface({ watermark = true, className, children, ...props }: SensitiveSurfaceProps) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    const onBlur = () => setHidden(true);
    const onFocus = () => setHidden(false);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <div className={cn("relative", className)} {...props}>
      {watermark && <AttributionWatermark />}
      <div className={cn("transition-[filter] duration-200", hidden && "blur-md")} aria-hidden={hidden || undefined}>
        {children}
      </div>
      {hidden && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <p className="rounded-lg border border-[var(--cs-border)] bg-white/90 px-4 py-2 text-xs font-medium text-[var(--cs-text-secondary)]">
            Content hidden while the window is inactive
          </p>
        </div>
      )}
    </div>
  );
}

export { AttributionWatermark, SensitiveSurface };
