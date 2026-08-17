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

export interface MissingColumn {
  name: string;
  /** The migration that ADDS it — the one to run. */
  migration: string | null;
}

export interface TableProbeResult {
  table: string;
  status: TableStatus;
  /** The migration that creates it — what to run when status is "missing". */
  migration: string | null;
  /** Row count, only when the table was actually readable. */
  rows: number | null;
  /** Truncated failure text, for "errored" only. Never invented. */
  error: string | null;
  /**
   * Columns the app expects that this table does not have. Only meaningful for
   * a PRESENT table: a table can exist for months and be missing a column an
   * ALTER was supposed to add, and every read naming that column then fails
   * WHOLESALE — PostgREST rejects the entire select on one unknown column, so
   * the failure is not confined to the field that is missing.
   *
   * Empty array means checked and none missing. Null means not checked.
   */
  missing_columns: MissingColumn[] | null;
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

/**
 * Does this failure mean a COLUMN does not exist, and if so which one?
 *
 * `42703` is Postgres's undefined_column; `PGRST204` is PostgREST's schema-cache
 * equivalent. The name has to come out of the message because neither carries
 * it as a field, and without the name the loop cannot make progress — one
 * unknown column rejects the whole select, so they can only be found one at a
 * time.
 */
export function missingColumnName(
  error: { code?: string | null; message?: string | null } | null,
): string | null {
  if (!error) return null;
  const code = (error.code ?? "").toUpperCase();
  const message = error.message ?? "";
  const looksLikeColumn = code === "42703" || code === "PGRST204" || /column/i.test(message);
  if (!looksLikeColumn) return null;

  // `column staff_members.dbs_date does not exist`
  //             ↑ table-qualified, so take the part after the dot
  const qualified = message.match(/column\s+(?:[a-z_][a-z0-9_]*\.)?["']?([a-z_][a-z0-9_]*)["']?\s+does not exist/i);
  if (qualified) return qualified[1];

  // `Could not find the 'dbs_date' column of 'staff_members' in the schema cache`
  const cached = message.match(/could not find the ['"]([a-z_][a-z0-9_]*)['"] column/i);
  if (cached) return cached[1];

  return null;
}

/** Turn one probe outcome into a result. Pure — the awaiting happens outside. */
export function classifyProbe(
  table: string,
  migration: string | null,
  outcome: {
    count?: number | null;
    error?: { code?: string | null; message?: string | null } | null;
    missingColumns?: MissingColumn[] | null;
  },
): TableProbeResult {
  const { count, error, missingColumns = null } = outcome;

  if (isMissingTableError(error ?? null)) {
    return { table, status: "missing", migration, rows: null, error: null, missing_columns: null };
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
      missing_columns: null,
    };
  }
  // A present table with no rows is EMPTY, which is a fact about the data, not
  // about the schema. Never conflate the two — that conflation is the bug.
  return {
    table,
    status: "present",
    migration,
    rows: count ?? 0,
    error: null,
    missing_columns: missingColumns,
  };
}

export interface DriftSummary {
  checked: number;
  present: number;
  missing: number;
  errored: number;
  /** Tables that exist but are short a column an ALTER should have added. */
  tables_missing_columns: number;
  missing_column_count: number;
  /** Migrations that still need running, in the order they should be run. */
  pending_migrations: string[];
  /** One line a human can act on. */
  headline: string;
}

export function summariseDrift(results: TableProbeResult[]): DriftSummary {
  const missing = results.filter((r) => r.status === "missing");
  const errored = results.filter((r) => r.status === "errored");
  const shortColumns = results.filter((r) => (r.missing_columns?.length ?? 0) > 0);
  const missingColumnCount = shortColumns.reduce((n, r) => n + (r.missing_columns?.length ?? 0), 0);

  // Migration filenames are timestamp-prefixed, so sorting them IS run order.
  // A missing TABLE and a missing COLUMN both resolve to "run this file", so
  // they belong in one list — nobody wants two lists of migrations to run.
  const pending = [
    ...new Set([
      ...missing.map((r) => r.migration),
      ...shortColumns.flatMap((r) => (r.missing_columns ?? []).map((c) => c.migration)),
    ].filter((m): m is string => !!m)),
  ].sort();

  const parts: string[] = [];
  if (missing.length > 0) {
    parts.push(
      `${missing.length} of ${results.length} expected tables do NOT exist on this tenant — ` +
        "anything writing to them fails, and anything reading them renders as empty",
    );
  }
  if (missingColumnCount > 0) {
    parts.push(
      `${missingColumnCount} column${missingColumnCount === 1 ? "" : "s"} ` +
        `${missingColumnCount === 1 ? "is" : "are"} missing from ${shortColumns.length} ` +
        `table${shortColumns.length === 1 ? "" : "s"} that otherwise exist — and PostgREST rejects ` +
        "the WHOLE select on one unknown column, so every read naming one fails, not just that field",
    );
  }
  if (errored.length > 0) {
    parts.push(
      `${errored.length} table${errored.length === 1 ? "" : "s"} could not be checked at all — ` +
        "that is not the same as missing, and there is no migration to run for it",
    );
  }

  const headline =
    parts.length === 0
      ? `All ${results.length} expected tables exist on this tenant, with every expected column.`
      : `${parts.join(". ")}. ` +
        (pending.length
          ? `Run: ${pending.join(", ")}.`
          : "No migration in the repo supplies what is missing — that is a separate problem.");

  return {
    checked: results.length,
    present: results.filter((r) => r.status === "present").length,
    missing: missing.length,
    errored: errored.length,
    tables_missing_columns: shortColumns.length,
    missing_column_count: missingColumnCount,
    pending_migrations: pending,
    headline,
  };
}
