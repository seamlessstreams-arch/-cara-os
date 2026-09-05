// ══════════════════════════════════════════════════════════════════════════════
// safeList — await a collection read, degrade to [] on failure.
//
// Before this file the identical helper was copy-pasted into ~45 API routes,
// 44 of them typed `Promise<any[]>` with a per-line eslint-disable — the same
// decision made 45 times and reviewed nowhere. The generic form needs no
// escape hatch at all: the element type flows from the dal call at the site.
//
// Degrading to [] is deliberate for aggregation routes: one failed source must
// not blank a whole dashboard. Routes that must DISTINGUISH "empty" from
// "unreadable" (e.g. tenant listing) should not use this — return an error.
// ══════════════════════════════════════════════════════════════════════════════

export async function safeList<T>(p: Promise<T[]>): Promise<T[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}
