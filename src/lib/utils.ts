import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Both formatters pin Europe/London rather than the runtime zone. For a London
// browser the output is identical, but the runtime zone is UTC in SSR and the
// viewer's zone anywhere else — and a date-only string parses as UTC midnight,
// so a manager checking from west of UTC saw every record dated a day early
// ("2026-09-13" rendered as 12 Sept in New York). Same class as todayStr.
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return typeof date === "string" ? date : "";
  return d.toLocaleDateString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return typeof date === "string" ? date : "";
  return d.toLocaleDateString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * Whole London calendar days from today to the given instant: +1 = tomorrow,
 * -1 = yesterday, 0 = today. NaN for an unparseable input.
 *
 * This is the ONLY correct basis for "Today"/"Yesterday"/"n days ago" labels.
 * Rolling-window maths — Math.round((target - now) / 86400000) — compounds two
 * zone bugs: a date-only string ("2026-08-13") parses as UTC MIDNIGHT, which is
 * 01:00 during BST, so from ~12:30 that afternoon the rounded diff hit -1 and a
 * task due TODAY read "Yesterday" — and one due tomorrow read "Today" all
 * evening. Half of every summer day, on every surface labelling days. Comparing
 * London calendar dates asks the question the reader is actually asking.
 */
export function londonDayDiff(date: string | Date): number {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return NaN;
  const [ty, tm, td] = todayStr().split("-").map(Number);
  const [dy, dm, dd] = londonDateStr(d).split("-").map(Number);
  return Math.round((Date.UTC(dy, dm - 1, dd) - Date.UTC(ty, tm - 1, td)) / 86400000);
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return typeof date === "string" ? date : "";
  const diff = londonDayDiff(d);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < -1) return `${Math.abs(diff)} days ago`;
  if (diff <= 7) return `In ${diff} days`;
  return formatDate(d);
}

export function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Calendar dates are ALWAYS Europe/London ────────────────────────────────
// The homes are in the UK and their records are legal documents, so "what day
// is it" must mean the day the staff on shift are living in — never the
// server's day.
//
// Two ways to get this wrong, both of which were live here:
//   • toISOString() is UTC. During BST (≈late Mar–late Oct, half the year) a
//     record written between 00:00 and 00:59 was filed under YESTERDAY — night
//     shifts are exactly when incidents, medication rounds and missing-from-care
//     episodes get recorded.
//   • getFullYear()/getMonth()/getDate() are the RUNTIME's local zone. That is
//     London in the browser but UTC on Vercel, so "use local parts" silently
//     reverts to the same bug in every server route and rendered page.
// Naming the zone is the only thing that holds in both places.
const LONDON_TZ = "Europe/London";

const londonDateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: LONDON_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar date in Europe/London as YYYY-MM-DD. */
export function londonDateStr(d: Date = new Date()): string {
  return londonDateParts.format(d);
}

const londonDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON_TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const londonLongDateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON_TZ,
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * A timestamp shown to a reader, in London ("9 Aug 2026, 00:30").
 * Server-rendered output (report packs, generated titles) would otherwise use
 * the runtime zone — UTC on Vercel — and show a 22:45 incident as 21:45.
 */
export function londonDateTimeStr(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return typeof d === "string" ? d : "";
  return londonDateTime.format(dt).replace(",", " ·");
}

/** A long-form London date ("9 August 2026") for titles and prose. */
export function londonLongDate(d: Date = new Date()): string {
  return londonLongDateFmt.format(d);
}

/**
 * Format an instant for DISPLAY pinned to London, with the caller's own
 * Intl options. Client components rendering "today" via a bare
 * `new Date().toLocaleDateString("en-GB", …)` use the RUNTIME zone — London in
 * the browser but UTC in SSR/prerender — so between 00:00 and 00:59 BST the
 * two renders disagree on the date and React reports a hydration mismatch,
 * with the header briefly showing yesterday. Pinning the zone makes the server
 * and client strings identical and, more importantly, makes the displayed
 * "today" agree with the todayStr() value the form actually persists.
 */
export function londonDisplay(opts: Intl.DateTimeFormatOptions, d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: LONDON_TZ, ...opts }).format(d);
}

/** The current month name in London ("August"). */
export function londonMonthName(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: LONDON_TZ, month: "long" }).format(d);
}

/**
 * A date n days from today in London terms. Calendar arithmetic on the date
 * parts (not +n×86400000ms), so the clock changes can't shift the answer.
 */
export function daysFromNow(n: number): string {
  const [y, m, d] = londonDateStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function todayStr(): string {
  return londonDateStr();
}

/**
 * "YYYY-MM" for the current month in London. Month-scoped alerts and defaults
 * read this, and keys built from local-midnight month starts used to collide
 * at the spring clock change (Mar/Apr both mapping to "YYYY-03"), duplicating
 * React keys.
 */
export function localMonthKey(dt: Date = new Date()): string {
  return londonDateStr(dt).slice(0, 7);
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  if (status === "completed") return false;
  if (!dueDate) return false;
  return dueDate < todayStr();
}

export function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return dueDate === todayStr();
}

export function generateId(prefix: string = "rec"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || singular + "s");
}
