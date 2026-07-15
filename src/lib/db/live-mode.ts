// ══════════════════════════════════════════════════════════════════════════════
// CARA — LIVE TENANT SIGNAL
//
// Is this deployment a real home, or the seeded demo?
//
// The in-memory store ships ~500 seeded collections — Chamberlain House, its
// children, its staff — so the demo has something to show. A live tenant must
// never see any of it: seeded children rendered beside real ones are
// indistinguishable once on screen, and in a children's home that is
// indefensible.
//
// WHY ITS OWN MODULE, AND WHY THIS PARTICULAR SIGNAL
//
//   • It must agree on BOTH sides of the wire. `src/lib/db/store.ts` is a
//     runtime import in 12 client components, so the store is evaluated in the
//     browser too. `isSupabaseEnabled()` reads SUPABASE_SERVICE_ROLE_KEY, which
//     is server-only — in the browser it is undefined, so gating on it would
//     empty the server's store and leave the browser's fully seeded. Every
//     NEXT_PUBLIC_* value is inlined at build time, so it reads identically in
//     both places.
//
//   • It must not pull the Supabase client into the client bundle, which
//     importing `@/lib/supabase/server` from the store would do. This module has
//     no imports on purpose — keep it that way.
//
//   • Going live must be a DECISION, not a side effect. Configuring a Supabase
//     key does not silently wipe the demo; someone has to say "this deployment
//     is a live tenant" out loud. Fail-safe direction: the default is the demo.
//
// Set NEXT_PUBLIC_CARA_MODE=live on a live tenant's deployment. Anything else —
// unset, "demo", a typo — means the seeded demo, which is the safe default.
// ══════════════════════════════════════════════════════════════════════════════

/** True when this deployment serves a real home rather than the seeded demo. */
export function isLiveTenant(): boolean {
  return process.env.NEXT_PUBLIC_CARA_MODE === "live";
}
