"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — READ A CLIENT-ONLY VALUE WITHOUT COPYING IT INTO STATE
//
// The repo's commonest set-state-in-effect shape was
//
//   useEffect(() => { setX(readSomethingClientOnly()) }, []);
//
// for URL params, localStorage, matchMedia, window size. That is React's
// external-store problem, and useSyncExternalStore is its sanctioned answer:
// the server snapshot keeps SSR/hydration consistent, the client snapshot
// reads the real value, and React swaps them after hydration without a
// mismatch error or a cascading second render from an effect.
//
// getSnapshot MUST return a stable value for unchanged data (usSES loops on
// fresh object identities), so these helpers are typed for primitives; parse
// objects from the returned string at the call site, memoised.
// ══════════════════════════════════════════════════════════════════════════════

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * A one-shot client-side read: URL param, localStorage key, feature support.
 * `getClient` runs only in the browser; `serverValue` is what SSR and the
 * hydration render see.
 */
export function useClientValue<T extends string | number | boolean | null>(
  getClient: () => T,
  serverValue: T,
): T {
  return useSyncExternalStore(noopSubscribe, getClient, () => serverValue);
}

/**
 * A query-string parameter, read once — "" when absent or on the server.
 *
 * Deliberately NOT next/navigation's useSearchParams: that requires a Suspense
 * boundary and dynamic rendering, which is why these pages read
 * window.location directly in the first place (see /oversight-workflow).
 * Deep-links land with a full navigation, so a mount-time read is the true
 * semantics — this does not track client-side query changes.
 */
export function useUrlParam(name: string): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get(name) ?? "",
    () => "",
  );
}
