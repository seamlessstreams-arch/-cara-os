// ─────────────────────────────────────────────────────────────────────────────
// A record of something that HAPPENED cannot be dated in the future.
//
// Cara reads dates as fact. A future-dated incident sorts to the top of a
// child's chronology, counts inside "last 21 days" windows that have not
// happened yet, and shifts the cumulative-risk and escalation-quality engines
// — all of which measure recency. One fat-fingered year (2027 for 2026) is
// enough, and nothing downstream can tell it from a real event.
//
// This is deliberately NOT a blanket rule about dates. A review date, a target
// date, an expiry, a next-visit, a planned admission and a rota shift are all
// legitimately in the future; bounding those would break real work. Only
// fields that ATTEST TO A PAST EVENT belong here, named one at a time.
//
// London, not UTC: `todayStr()` is the tenant's civil date, so a 23:30 BST
// entry is not rejected for being "tomorrow" in UTC.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";
import { todayStr } from "@/lib/utils";

/** True when `value` is a YYYY-MM-DD (or ISO) date after today in London. */
export function isFutureDate(value: unknown, today = todayStr()): boolean {
  if (typeof value !== "string") return false;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false; // unparseable is not our call
  return day > today;
}

/**
 * 400 when any named field carries a future date, else null.
 * Pass only fields that record something already observed.
 */
export function rejectFutureDates(
  body: Record<string, unknown>,
  fields: readonly string[],
  today = todayStr(),
): NextResponse | null {
  const future = fields.filter((f) => isFutureDate(body[f], today));
  if (future.length === 0) return null;

  return NextResponse.json(
    {
      error:
        `This record describes something that has happened, so ${future.join(", ")} ` +
        `cannot be in the future (today is ${today}). Check the date — a mistyped year ` +
        `puts the record at the top of the child's chronology.`,
      future,
    },
    { status: 400 },
  );
}
