// ══════════════════════════════════════════════════════════════════════════════
// CARA — WELFARE CHECKS (night-check rounds + per-child checks + safeguarding meta)
//
// GET  /api/v1/welfare-checks?date=&child_id=  → { data, checks, meta }
// POST /api/v1/welfare-checks                  → create a round
//
// WHY THIS ROUTE EXISTS: `useWelfareChecks` has always declared
// `{ data, checks, meta }` where meta carries total_rounds, today_rounds,
// total_checks, concerns_flagged and consecutive_days — but there was no
// /api/v1/welfare-checks route, so the request fell through to the catch-all
// dispatcher, which answers `{ data, meta: { total } }`. Every one of the five
// stat tiles on the welfare-checks page therefore read undefined and rendered a
// permanent 0 — including "concerns flagged", a safeguarding signal, which on a
// night-checks page is the number a manager most needs to be true.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";
import type { WelfareCheck, WelfareCheckRound } from "@/types/extended";

export const dynamic = "force-dynamic";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** A check that needs a manager's eye tonight. */
function isConcern(c: WelfareCheck): boolean {
  return c.status === "concern" || c.status === "not_in_room" || Boolean(c.physical_marks_noted);
}

/**
 * Consecutive days (ending today) on which at least one round was completed —
 * the "unbroken run of night checks" an inspector asks about. Counts back from
 * today and stops at the first day with no round.
 */
function consecutiveDays(rounds: WelfareCheckRound[]): number {
  const days = new Set(rounds.map((r) => r.round_date));
  let streak = 0;
  const cursor = new Date(todayStr() + "T00:00:00Z");
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const childId = searchParams.get("child_id");
  const today = todayStr();

  const allRounds = db.welfareCheckRounds.findAll();

  // Filters narrow what is LISTED; meta always describes the whole picture, so
  // the stat tiles don't silently change meaning when a filter is applied.
  let rounds = allRounds;
  if (date) rounds = rounds.filter((r) => r.round_date === date);
  if (childId) rounds = rounds.filter((r) => (r.checks ?? []).some((c) => c.child_id === childId));

  const sorted = [...rounds].sort((a, b) =>
    `${b.round_date}_${b.round_time}`.localeCompare(`${a.round_date}_${a.round_time}`),
  );

  let checks: WelfareCheck[] = sorted.flatMap((r) => r.checks ?? []);
  if (childId) checks = checks.filter((c) => c.child_id === childId);

  const allChecks = allRounds.flatMap((r) => r.checks ?? []);

  return NextResponse.json({
    data: sorted,
    checks,
    meta: {
      total_rounds: allRounds.length,
      today_rounds: allRounds.filter((r) => r.round_date === today).length,
      total_checks: allChecks.length,
      concerns_flagged: allChecks.filter(isConcern).length,
      consecutive_days: consecutiveDays(allRounds),
    },
  });
}

export async function POST(req: NextRequest) {
  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  try {
    const round = db.welfareCheckRounds.create(parsed.data);
    return NextResponse.json({ data: round }, { status: 201 });
  } catch (err) {
    console.error("[api/welfare-checks] create failed:", err);
    return NextResponse.json({ error: "Could not save the welfare check round" }, { status: 500 });
  }
}
