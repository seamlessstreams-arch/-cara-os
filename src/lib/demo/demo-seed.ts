// ══════════════════════════════════════════════════════════════════════════════
// CLIENT-SIDE DEMO-SEED GATE (go-live)
//
// Some pages render hardcoded DEMO_ arrays directly — fictional children,
// professionals, drafts — with no API call behind them. The store gates
// (src/lib/db/store.ts + the two parallel stores) never reach these, because
// the data never leaves the component. So on a live tenant a real children's
// home could open a page and see fabricated children or contacts presented as
// its own records, which is the exact harm the seed gate exists to prevent.
//
// `demoSeed()` is the client-safe counterpart to those store gates: in a live
// tenant it returns an empty array (the page's own empty state renders); in the
// demo it returns the seed untouched. It reads NEXT_PUBLIC_CARA_MODE via
// isLiveTenant(), which is inlined at build time and therefore valid in a
// client component.
//
// Use it at the DATA SOURCE — the useState initialiser or the array a page
// maps/filters over — so a live tenant starts empty and nothing fictional ever
// renders:
//
//   const [contacts] = useState(demoSeed(DEMO_CONTACTS));
//   {demoSeed(DEMO_CHILDREN).map(...)}
//
// A page that shows fictional PEOPLE or CHILD RECORDS must route its seed
// through this. scripts/check-demo-seed.js enforces that so the class cannot
// quietly return.
// ══════════════════════════════════════════════════════════════════════════════

import { isLiveTenant } from "@/lib/db/live-mode";

/** Demo seed for direct client-side render: empty on a live tenant, untouched
 *  in the demo. Gate at the data source, not the render, so counts and filters
 *  computed off it are empty too. */
export function demoSeed<T>(seed: readonly T[]): T[] {
  return isLiveTenant() ? [] : [...seed];
}

/** For a single seeded object (a dashboard summary, a scorecard) rather than a
 *  list: null on a live tenant so the page can show its own empty state. */
export function demoSeedOne<T>(seed: T): T | null {
  return isLiveTenant() ? null : seed;
}
