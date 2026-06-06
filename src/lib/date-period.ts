// ══════════════════════════════════════════════════════════════════════════════
// Date-period helpers — timestamp-safe range checks
//
// Many engines filter records to a reporting window with a raw lexicographic
// string comparison: `date >= periodStart && date <= periodEnd`. That is correct
// only while every value is a date-only "YYYY-MM-DD" string. The moment a date
// field carries a time component (e.g. an ISO timestamp like
// "2026-05-18T20:00:00Z", as Supabase `timestamptz` columns return), a record on
// the final day of the window sorts AFTER a date-only `periodEnd` and is silently
// dropped — under-counting the period.
//
// `withinPeriod` compares on the date-only prefix so a same-day timestamp is never
// dropped, regardless of whether the inputs are date-only or full timestamps.
// (Named `withinPeriod` to avoid colliding with the various local `inPeriod` /
// `isInPeriod` helpers already defined inside individual engines.)
// ══════════════════════════════════════════════════════════════════════════════

/** Date-only key (YYYY-MM-DD). Tolerates ISO timestamps and null/undefined. */
export function dayKey(d: string | null | undefined): string {
  return (d ?? "").slice(0, 10);
}

/**
 * True when `date` falls within [start, end] inclusive, compared on the date-only
 * prefix so a same-day timestamp at the end of the window is not dropped.
 */
export function withinPeriod(date: string | null | undefined, start: string, end: string): boolean {
  const d = dayKey(date);
  return d >= dayKey(start) && d <= dayKey(end);
}
