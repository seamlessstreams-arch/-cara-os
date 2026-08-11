// ─────────────────────────────────────────────────────────────────────────────
// Which report ids the demo fallback is allowed to answer for.
//
// In demo mode (Supabase absent) there is no report store: generateChildReport
// mints an id with demoId() — `demo-<timestamp>-<random>` — and returns the
// objects in memory rather than persisting them. The detail page then worked
// only because getReport() fabricated a report for WHATEVER id it was handed.
//
// That meant GET /api/cara/reports/<any string at all> returned a complete,
// confident report about a named child, including a clinical assertion —
// "There was one low-level incident which was managed well" — and a risk tier.
// The route's own 404 branch was unreachable, and the same fiction backed the
// /actions and /challenge endpoints through a second copy of the fallback.
//
// Restricting the fallback to ids the demo generator actually minted keeps the
// generate-then-view flow working, makes the 404 reachable, and closes the
// env-drift case: real report ids are UUIDs, so if a configured tenant ever
// lost its Supabase credentials the reports would 404 rather than quietly
// serve someone else's invented narrative.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_REPORT_ID_PREFIX = "demo-";

export function isDemoReportId(reportId: string): boolean {
  return reportId.startsWith(DEMO_REPORT_ID_PREFIX);
}
