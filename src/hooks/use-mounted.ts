"use client";

import { useEffect, useState } from "react";

/**
 * `false` on the server render and the first client render, then `true` after
 * mount.
 *
 * Gate any value that legitimately differs between the SSR instant and
 * hydration — wall-clock reads (`new Date()`, `Date.now()`), locale/timezone
 * text, `formatRelative` — behind this. The first client render then matches
 * the server HTML exactly (no hydration mismatch / React error #418), and the
 * real, client-accurate value paints on the next tick.
 *
 * This matters most on statically-prerendered pages: their "server" HTML is
 * frozen at *build* time, so an ungated clock is a guaranteed mismatch every
 * time the page is viewed later — not a rare sub-second race. See
 * scripts/live-fiction-crawl.mjs, which reports these as recoverable mismatches.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
