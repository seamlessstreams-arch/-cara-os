// ══════════════════════════════════════════════════════════════════════════════
// Table-keyed fake Supabase module for LIVE-LEG route tests.
//
// Usage (the vi.mock factory must be self-contained, so import inside it):
//
//   vi.mock("@/lib/supabase/server", async () => {
//     const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
//     return makeFakeSupabaseModule({ young_people: [{ id: "yp-1", … }] });
//   });
//
// The fake is keyed by REAL table name: a query against a table you did not
// seed resolves { data: null, error } exactly like live PostgREST does for a
// missing relation — so phantom-table regressions (querying `children`
// instead of `young_people`) fail these tests by construction. Filter and
// order/limit calls are chainable no-ops; `.single()` terminates, and the
// builder is thenable so a bare awaited chain resolves the row set.
// ══════════════════════════════════════════════════════════════════════════════

type Row = Record<string, unknown>;

function table(rows: Row[] | null) {
  const terminal = { data: rows, error: rows ? null : { message: "relation does not exist" } };
  const b: Record<string, unknown> = {};
  for (const m of ["select", "eq", "neq", "in", "is", "not", "contains", "or", "gte", "lte", "gt", "lt", "like", "ilike", "order", "range", "limit",
    // Write chains are accepted and resolve to the seeded rows — enough to
    // smoke a service's call path; the DDL itself is validated in PGlite.
    "insert", "update", "upsert", "delete"]) {
    b[m] = () => b;
  }
  b.single = () => Promise.resolve({ data: rows?.[0] ?? null, error: rows?.length ? null : { message: "no rows" } });
  b.maybeSingle = () => Promise.resolve({ data: rows?.[0] ?? null, error: null });
  // `await` on the builder itself (no .limit/.single terminator) resolves the
  // full row set, matching supabase-js thenable builders.
  b.then = (resolve: (v: typeof terminal) => unknown) => Promise.resolve(terminal).then(resolve);
  return b;
}

export function makeFakeSupabaseModule(tables: Record<string, Row[] | null>) {
  return {
    createServerClient: () => ({ from: (t: string) => table(tables[t] ?? null) }),
    isSupabaseEnabled: () => true,
  };
}
