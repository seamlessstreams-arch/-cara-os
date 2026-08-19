"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

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
 *
 * useSyncExternalStore rather than the classic setState-in-effect: identical
 * observable behaviour (server false → post-hydration true), but React flips
 * the value during the hydration pass itself instead of scheduling a second
 * render from an effect — the exact cascade react-hooks/set-state-in-effect
 * exists to prevent, in the hook every hydration gate in the app consumes.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
