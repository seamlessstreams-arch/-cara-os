// CARA — Staffing cover API
//   GET  /api/v1/staffing-cover?from&to → forward cover picture
//   POST /api/v1/staffing-cover { date, period, reason, comment } → log a reason
//        for extra cover (over the norm), flipping it from "explain" to "logged"
// Published shifts UNION pattern projections (published wins), minus anyone on
// approved leave / sickness, analysed against the home staffing policy.
import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { generateId, todayStr } from "@/lib/utils";
import { computeStaffingCoverFromStore, addDays } from "@/lib/rota/compute-cover";
import type { ShiftCoverNote } from "@/lib/rota/rota-seeds";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

const COVER_REASONS = new Set(["shadow_shift", "induction", "training", "child_plan_adjustment", "extra_support", "higher_ratio", "other"]);

// The store→cover mapping lives in @/lib/rota/compute-cover so Ask CARA and
// this API share ONE rota-safety read.
const computeCover = computeStaffingCoverFromStore;

/** Compose exactly the collections computeCover's Pick requires, via the dal.
 *  Called fresh after any write so the recompute reflects the new state. */
async function loadCoverShape() {
  const [leaveRequests, shiftCoverNotes, shiftPatterns, shifts, staff, staffSicknessRecords, staffingPolicy] = await Promise.all([
    dal.leaveRequests.findAll(), dal.shiftCoverNotes.findAll(), dal.shiftPatterns.findAll(),
    dal.shifts.findAll(), dal.staff.findAll(), dal.staffSicknessRecords.findAll(), dal.staffingPolicy.get(),
  ]);
  return { leaveRequests, shiftCoverNotes, shiftPatterns, shifts, staff, staffSicknessRecords, staffingPolicy };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const today = todayStr();
  const from = url.searchParams.get("from") || today;
  const to = url.searchParams.get("to") || addDays(today, 13);
  return NextResponse.json({ data: computeCover(await loadCoverShape(), from, to) });
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  const __parsed2 = await readJsonBody(req);
  if (!__parsed2.ok) return __parsed2.response;
  try { body = __parsed2.data; } catch { body = {}; }

  const date = String(body.date ?? "").slice(0, 10);
  const period = body.period === "night" ? "night" : "day";
  const reason = String(body.reason ?? "");
  const comment = String(body.comment ?? "").slice(0, 500);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "A valid date (YYYY-MM-DD) is required." }, { status: 400 });
  }
  if (!COVER_REASONS.has(reason)) {
    return NextResponse.json({ error: "A recognised reason is required." }, { status: 400 });
  }

  const recorded_by = req.headers.get("cs_user_id") || "system";
  const note: ShiftCoverNote = {
    id: generateId("covernote"),
    date,
    period,
    reason,
    comment,
    recorded_by,
    created_at: new Date().toISOString(),
    home_id: "home_oak",
  };

  // One reason per date+period — replace any existing so re-logging updates it.
  await dal.shiftCoverNotes.removeByDatePeriod(date, period);
  await dal.shiftCoverNotes.create(note);

  // Recompute over the same fortnight so the row flips to "logged" in the response.
  const from = String(body.from ?? "") || todayStr();
  const to = String(body.to ?? "") || addDays(from, 13);
  return NextResponse.json({ data: computeCover(await loadCoverShape(), from, to), note });
}

// PATCH /api/v1/staffing-cover { min_day, min_night, expected_day, expected_night,
// waking_night_required, from?, to? } — update the home staffing policy
// ("updatable for need / risk") and recompute the forward picture.
export async function PATCH(req: Request) {
  let body: Record<string, unknown> = {};
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; } catch { body = {}; }

  const cur = (((await dal.staffingPolicy.get()) ?? {}));
  const intOr = (v: any, fallback: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(20, Math.max(0, n)) : fallback;
  };
  const next = {
    min_day: intOr(body.min_day, cur.min_day ?? 2),
    min_night: intOr(body.min_night, cur.min_night ?? 1),
    // The norm can't sensibly sit below the minimum — clamp up to it.
    expected_day: Math.max(intOr(body.expected_day, cur.expected_day ?? 2), intOr(body.min_day, cur.min_day ?? 2)),
    expected_night: Math.max(intOr(body.expected_night, cur.expected_night ?? 1), intOr(body.min_night, cur.min_night ?? 1)),
    waking_night_required: typeof body.waking_night_required === "boolean" ? body.waking_night_required : !!cur.waking_night_required,
  };
  await dal.staffingPolicy.set(next);

  const from = String(body.from ?? "") || todayStr();
  const to = String(body.to ?? "") || addDays(from, 13);
  return NextResponse.json({ data: computeCover(await loadCoverShape(), from, to) });
}
