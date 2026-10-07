// ══════════════════════════════════════════════════════════════════════════
// CARA — live people cache
//
// The name helpers in seed-data (getStaffName / getStaffById / getYPName /
// getYPById) resolve a stored id against the DEMO SEED arrays. On a live tenant
// every real staff/child id is a Supabase uuid that misses the seed, so a
// record renders "Unknown" for who wrote it and which child it is about —
// across ~400 pages that call these helpers.
//
// This module is a tiny id→row cache the helpers consult BEFORE the seed.
// PeopleCacheProvider (mounted once in the platform layout) loads /staff and
// /young-people and publishes the rows here, so a stored id resolves to the
// real person. No per-page change is needed: the existing helpers stop missing.
//
// It is deliberately framework-free (plain module Maps, no React, no imports)
// so seed-data — imported almost everywhere, on the server too — can read it
// without pulling in React or the data layer and without a circular import. On
// the server (or before the provider has loaded) the Maps are null and the
// helpers fall back to the seed, exactly as before.
// ══════════════════════════════════════════════════════════════════════════

/** The subset of a staff/child row the name helpers read. The runtime rows are
 *  the full /staff and /young-people records, so other fields are present too;
 *  this is only what resolving a name needs to see (callers that want the whole
 *  record get it through getStaffById / getYPById, which cast to the full type). */
export interface CachedPersonRow {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
}

let staffById: Map<string, CachedPersonRow> | null = null;
let childById: Map<string, CachedPersonRow> | null = null;

export function setStaffCache(rows: readonly CachedPersonRow[]): void {
  staffById = new Map(rows.map((r) => [r.id, r]));
}

export function setChildCache(rows: readonly CachedPersonRow[]): void {
  childById = new Map(rows.map((r) => [r.id, r]));
}

/** The live staff row for this id, or undefined when the cache is empty (server
 *  / pre-load) or the id is not a staff member of this home. */
export function cachedStaff(id: string): CachedPersonRow | undefined {
  return staffById?.get(id);
}

/** The live child row for this id, or undefined when the cache is empty
 *  (server / pre-load) or the id is not a child of this home. */
export function cachedChild(id: string): CachedPersonRow | undefined {
  return childById?.get(id);
}
