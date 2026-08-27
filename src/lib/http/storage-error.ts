// ─────────────────────────────────────────────────────────────────────────────
// Honest failure for a storage read/write that the database rejected.
//
// The routes that persist to Supabase used to answer a failed query with a bare
//   { error: "A server error occurred." }  → 500
// which tells the manager nothing and, on a page with several such calls, takes
// the whole screen down with no clue which feature is unavailable or why.
//
// The one thing this must never do is answer with empty data. An empty list
// renders as "nothing recorded yet", which is a claim about the home — the
// fabricated-absence prohibition. A failed read means we could not look, and
// the response has to say exactly that.
//
// So: 503 (the storage is unavailable, the code is fine), no data field at all,
// and flags the UI can branch on — `storage_unavailable` to distinguish this
// from a genuine fault, `storage_missing` when Postgres says the table or
// column simply is not there (the usual cause: a migration applied to one
// environment but not another).
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

/** Postgres / PostgREST codes meaning "the thing you queried does not exist". */
const MISSING_STORAGE_CODES = new Set([
  "42P01", // undefined_table
  "42703", // undefined_column
  "PGRST202", // schema cache: function not found
  "PGRST204", // schema cache: column not found
  "PGRST205", // schema cache: table not found
]);

export type StorageQueryError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
} | null;

/**
 * Build the response for a storage read/write the database refused.
 *
 * `feature` names the thing the caller was trying to read, in the manager's
 * words ("manager attention items"), so the message is actionable on screen.
 * The Postgres code travels with it because it is machine-readable and carries
 * no record content; the full error is logged server-side only.
 */
export function storageFailure(feature: string, error: StorageQueryError): NextResponse {
  const code = error?.code ?? null;
  const missing = code !== null && MISSING_STORAGE_CODES.has(code);

  console.error(`[api] storage failure — ${feature}:`, error);

  return NextResponse.json(
    {
      ok: false,
      error: missing
        ? `${feature} could not be loaded: its storage is not set up in this environment.`
        : `${feature} could not be loaded: the storage request failed.`,
      storage_unavailable: true,
      storage_missing: missing,
      code,
      feature,
    },
    { status: 503 },
  );
}
