// ══════════════════════════════════════════════════════════════════════════════
// CARA — IS THE TABLE ACTUALLY THERE?
//
// Migrations reach the live tenant BY HAND. There is no `supabase db push` in
// CI, in vercel.json, or in package.json scripts — so a merged and deployed
// migration proves the BUILD shipped, not that the table exists.
//
// When it does not exist, nothing says so. PostgREST answers PGRST205, the
// service returns an error, and the page renders an empty list. That is the
// fabricated-absence class one layer down: not a failed read of a collection,
// but a whole collection that was never created — and it reads identically.
//
// So the classification matters more than the probe. "Missing" has a fix (run
// this migration). "Errored" does not (the read failed for some other reason,
// and the table may be full of records). Reporting the second as the first
// would send someone to re-run a migration against a table that already holds
// a home's data.
// ══════════════════════════════════════════════════════════════════════════════

export type TableStatus = "present" | "missing" | "errored";

export interface TableProbeResult {
  table: string;
  status: TableStatus;
  /** The migration that creates it — what to run when status is "missing". */
  migration: string | null;
  /** Row count, only when the table was actually readable. */
  rows: number | null;
  /** Truncated failure text, for "errored" only. Never invented. */
  error: string | null;
}

/**
 * Does this PostgREST failure mean the relation does not exist?
 *
 * Two codes, because they come from different layers: `42P01` is Postgres's own
 * undefined_table, and `PGRST205` is PostgREST failing to find it in its schema
 * cache — which is what a freshly-unmigrated table gives on the live tenant.
 * The message forms are the fallback for clients that surface neither.
 */
export function isMissingTableError(error: { code?: string | null; message?: string | null } | null): boolean {
  if (!error) return false;
  const code = (error.code ?? "").toUpperCase();
  if (code === "42P01" || code === "PGRST205") return true;

  const message = (error.message ?? "").toLowerCase();
  if (!message) return false;
  return (
    message.includes("could not find the table") ||
    /relation .* does not exist/.test(message) ||
    (message.includes("schema cache") && message.includes("table"))
  );
}

/** Turn one probe outcome into a result. Pure — the awaiting happens outside. */
export function classifyProbe(
  table: string,
  migration: string | null,
  outcome: { count?: number | null; error?: { code?: string | null; message?: string | null } | null },
): TableProbeResult {
  const { count, error } = outcome;

  if (isMissingTableError(error ?? null)) {
    return { table, status: "missing", migration, rows: null, error: null };
  }
  if (error) {
    return {
      table,
      status: "errored",
      migration,
      rows: null,
      // Truncated: this is an admin surface, but an error string is still
      // internal detail and has no business growing without bound.
      error: (error.message ?? "the read failed").slice(0, 120),
    };
  }
  // A present table with no rows is EMPTY, which is a fact about the data, not
  // about the schema. Never conflate the two — that conflation is the bug.
  return { table, status: "present", migration, rows: count ?? 0, error: null };
}

export interface DriftSummary {
  checked: number;
  present: number;
  missing: number;
  errored: number;
  /** Migrations that still need running, in the order they should be run. */
  pending_migrations: string[];
  /** One line a human can act on. */
  headline: string;
}

export function summariseDrift(results: TableProbeResult[]): DriftSummary {
  const missing = results.filter((r) => r.status === "missing");
  const errored = results.filter((r) => r.status === "errored");

  // Migration filenames are timestamp-prefixed, so sorting them IS run order.
  const pending = [...new Set(missing.map((r) => r.migration).filter((m): m is string => !!m))].sort();

  let headline: string;
  if (missing.length === 0 && errored.length === 0) {
    headline = `All ${results.length} expected tables exist on this tenant.`;
  } else if (missing.length > 0) {
    headline =
      `${missing.length} of ${results.length} expected tables do NOT exist on this tenant. ` +
      "Anything writing to them fails, and anything reading them renders as empty. " +
      (pending.length
        ? `Run: ${pending.join(", ")}.`
        : "No migration in the repo creates them — that is a separate problem.");
  } else {
    headline =
      `${errored.length} of ${results.length} tables could not be checked. That is not the same as ` +
      "missing — they may exist and hold records. The error text is on each row.";
  }

  return {
    checked: results.length,
    present: results.filter((r) => r.status === "present").length,
    missing: missing.length,
    errored: errored.length,
    pending_migrations: pending,
    headline,
  };
}
