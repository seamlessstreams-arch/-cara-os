// ══════════════════════════════════════════════════════════════════════════════
// CARA — CALENDAR recurrence (pure)
//
// Expands a recurring event into concrete occurrences within a window, and finds
// the next occurrence for reminders. Deterministic: date maths uses Date.UTC
// epoch arithmetic (never Date.now / new Date()), so it's fully testable and
// resume-safe. Occurrences preserve the base event's time-of-day; monthly
// recurrence clamps to the last valid day (Jan 31 → Feb 28).
// ══════════════════════════════════════════════════════════════════════════════

export type RecurrenceFreq = "daily" | "weekly" | "fortnightly" | "monthly";

export interface CalendarRecurrence {
  freq: RecurrenceFreq;
  /** Step multiplier (>=1). "every 2 weeks" = weekly interval 2. */
  interval: number;
  /** YYYY-MM-DD inclusive end, or null. */
  until: string | null;
  /** Total occurrences including the first, or null. */
  count: number | null;
}

interface DateParts {
  y: number;
  m: number; // 1-based
  d: number;
}

function parseDate(iso: string): DateParts {
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return { y: 1970, m: 1, d: 1 };
  return { y: +m[1], m: +m[2], d: +m[3] };
}

function timePart(iso: string): string {
  const m = iso.match(/T(\d{2}:\d{2}:\d{2})/);
  return m ? m[1] : "00:00:00";
}

function daysInMonth(y: number, m: number): number {
  // Day 0 of the next month = last day of month m.
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function addDays(p: DateParts, days: number): DateParts {
  const t = Date.UTC(p.y, p.m - 1, p.d) + days * 86_400_000;
  const dt = new Date(t);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function addMonths(p: DateParts, months: number): DateParts {
  const total = p.m - 1 + months;
  const ny = p.y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12 + 1;
  const nd = Math.min(p.d, daysInMonth(ny, nm));
  return { y: ny, m: nm, d: nd };
}

function fmtDate(p: DateParts): string {
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** ISO start of occurrence index k (0-based) for a base start. */
function occurrenceStart(baseIso: string, rec: CalendarRecurrence, k: number): string {
  const base = parseDate(baseIso);
  const interval = Math.max(1, rec.interval || 1);
  let p: DateParts;
  if (rec.freq === "daily") p = addDays(base, k * interval);
  else if (rec.freq === "weekly") p = addDays(base, k * interval * 7);
  else if (rec.freq === "fortnightly") p = addDays(base, k * interval * 14);
  else p = addMonths(base, k * interval); // monthly
  return `${fmtDate(p)}T${timePart(baseIso)}`;
}

/**
 * All occurrence starts within [window.from, window.to] (inclusive YYYY-MM-DD).
 * Occurrences before the window are still counted toward `count`/`until` but not
 * returned. hardCap bounds the loop (daily → ~1 year).
 */
export function expandOccurrences(
  baseIso: string,
  rec: CalendarRecurrence | null,
  window: { from: string; to: string },
  hardCap = 366,
): string[] {
  if (!rec) {
    const day = baseIso.slice(0, 10);
    return day >= window.from && day <= window.to ? [baseIso] : [];
  }
  const out: string[] = [];
  for (let k = 0; k < hardCap; k++) {
    if (rec.count != null && k >= rec.count) break;
    const occIso = occurrenceStart(baseIso, rec, k);
    const occDay = occIso.slice(0, 10);
    if (rec.until && occDay > rec.until) break;
    if (occDay > window.to) break;
    if (occDay >= window.from) out.push(occIso);
  }
  return out;
}

/** Earliest occurrence whose start is >= nowIso; null once the series has ended. */
export function nextOccurrenceStart(
  baseIso: string,
  rec: CalendarRecurrence | null,
  nowIso: string,
  hardCap = 732,
): string | null {
  const nowMs = Date.parse(nowIso);
  if (!rec) {
    return Date.parse(baseIso) >= nowMs ? baseIso : null;
  }
  for (let k = 0; k < hardCap; k++) {
    if (rec.count != null && k >= rec.count) return null;
    const occIso = occurrenceStart(baseIso, rec, k);
    if (rec.until && occIso.slice(0, 10) > rec.until) return null;
    if (Date.parse(occIso) >= nowMs) return occIso;
  }
  return null;
}

const UNIT: Record<RecurrenceFreq, string> = {
  daily: "day",
  weekly: "week",
  fortnightly: "fortnight",
  monthly: "month",
};
const ADVERB: Record<RecurrenceFreq, string> = {
  daily: "daily",
  weekly: "weekly",
  fortnightly: "fortnightly",
  monthly: "monthly",
};

/** Human summary for the editor and detail panel. */
export function describeRecurrence(rec: CalendarRecurrence | null): string {
  if (!rec) return "Does not repeat";
  const interval = Math.max(1, rec.interval || 1);
  let base = interval > 1 ? `Repeats every ${interval} ${UNIT[rec.freq]}s` : `Repeats ${ADVERB[rec.freq]}`;
  if (rec.until) base += ` until ${rec.until}`;
  else if (rec.count) base += ` for ${rec.count} occurrences`;
  return base;
}
