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

/** Writes captured by the fake, newest last — lets a test assert WHAT a
 *  service sent, e.g. that payload keys all exist in the real migration.
 *  The same module instance backs the vi.mock factory and the test file,
 *  so importing this array in the test reads the recorded calls. */
export const recordedWrites: Array<{ table: string; op: string; payload: unknown }> = [];
export function clearRecordedWrites() {
  recordedWrites.length = 0;
}

function table(rows: Row[] | null, name = "") {
  const terminal = { data: rows, error: rows ? null : { message: "relation does not exist" } };
  const b: Record<string, unknown> = {};
  for (const m of ["select", "eq", "neq", "in", "is", "not", "contains", "or", "gte", "lte", "gt", "lt", "like", "ilike", "order", "range", "limit"]) {
    b[m] = () => b;
  }
  // Write chains are accepted, RECORDED, and resolve to the seeded rows —
  // enough to smoke a call path and to assert the payload a service sent;
  // the DDL itself is validated in PGlite.
  for (const m of ["insert", "update", "upsert", "delete"]) {
    b[m] = (payload?: unknown) => {
      recordedWrites.push({ table: name, op: m, payload });
      return b;
    };
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
    createServerClient: () => ({ from: (t: string) => table(tables[t] ?? null, t) }),
    isSupabaseEnabled: () => true,
  };
}
