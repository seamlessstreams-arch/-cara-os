// CARA — Staffing cover API
//   GET  /api/v1/staffing-cover?from&to → forward cover picture
//   POST /api/v1/staffing-cover { date, period, reason, comment } → log a reason
//        for extra cover (over the norm), flipping it from "explain" to "logged"
// Published shifts UNION pattern projections (published wins), minus anyone on
// approved leave / sickness, analysed against the home staffing policy.
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { expandPatterns, shiftTypeToPeriod } from "@/lib/rota/shift-patterns";
import { analyseStaffingCover, type CoverAssignment, type CoverReasonNote } from "@/lib/rota/staffing-cover-engine";
import type { ShiftCoverNote } from "@/lib/rota/rota-seeds";

export const dynamic = "force-dynamic";

const COVER_REASONS = new Set(["shadow_shift", "induction", "training", "child_plan_adjustment", "extra_support", "higher_ratio", "other"]);

function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
}

/** Compute the forward cover picture from the live store for a date range. */
function computeCover(store: any, from: string, to: string) {
  const today = new Date().toISOString().slice(0, 10);
  const inRange = (d: string) => d >= from && d <= to;

  // ── Published shifts in range ──
  const realShifts = (store.shifts ?? []).filter((s: any) => inRange(String(s.date).slice(0, 10)) && s.status !== "cancelled");
  const realKey = new Set(realShifts.map((s: any) => `${s.staff_id}|${String(s.date).slice(0, 10)}`));
  const assignments: CoverAssignment[] = realShifts.map((s: any) => ({
    date: String(s.date).slice(0, 10),
    period: shiftTypeToPeriod(String(s.shift_type)),
    staff_id: String(s.staff_id ?? ""),
    shift_type: String(s.shift_type),
    is_open: !!s.is_open_shift || !s.staff_id,
  }));

  // ── Pattern projections where no shift is published for that staff+date ──
  let projected = 0;
  for (const occ of expandPatterns(store.shiftPatterns ?? [], { from, to })) {
    if (realKey.has(`${occ.staff_id}|${occ.date}`)) continue;
    assignments.push({ date: occ.date, period: shiftTypeToPeriod(occ.shift_type), staff_id: occ.staff_id, shift_type: occ.shift_type, is_open: false });
    projected += 1;
  }

  // ── Unavailable: approved leave + sickness spanning each date ──
  const unavailable = new Set<string>();
  const mark = (staffId: string, start: string, end: string) => {
    if (!staffId || !start) return;
    let d = start < from ? from : start;
    const last = !end || end > to ? to : end;
    while (d <= last) { unavailable.add(`${staffId}|${d}`); d = addDays(d, 1); }
  };
  for (const l of store.leaveRequests ?? []) {
    if (l.status === "approved") mark(String(l.staff_id), String(l.start_date).slice(0, 10), String(l.end_date).slice(0, 10));
  }
  for (const sk of store.staffSicknessRecords ?? []) {
    mark(String(sk.staff_id), sk.date_started ? String(sk.date_started).slice(0, 10) : "", sk.date_ended ? String(sk.date_ended).slice(0, 10) : to);
  }

  const coverNotes: CoverReasonNote[] = (store.shiftCoverNotes ?? []).map((n: any) => ({
    date: String(n.date).slice(0, 10),
    period: n.period,
    reason: String(n.reason),
    comment: String(n.comment ?? ""),
  }));

  const staffName = new Map<string, string>(
    (store.staff ?? []).map((m: any) => [String(m.id), m.full_name || `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Unknown"]),
  );

  const result = analyseStaffingCover({
    today,
    range: { from, to },
    assignments,
    unavailable,
    policy: store.staffingPolicy,
    coverNotes,
    resolveStaff: (id) => staffName.get(id) ?? null,
  });

  return { ...result, policy: store.staffingPolicy, projected_count: projected };
}

export async function GET(req: Request) {
  const store = getStore() as any;
  const url = new URL(req.url);
  const today = new Date().toISOString().slice(0, 10);
  const from = url.searchParams.get("from") || today;
  const to = url.searchParams.get("to") || addDays(today, 13);
  return NextResponse.json({ data: computeCover(store, from, to) });
}

export async function POST(req: Request) {
  const store = getStore() as any;
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }

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
  store.shiftCoverNotes = (store.shiftCoverNotes ?? []).filter((n: any) => !(String(n.date).slice(0, 10) === date && n.period === period));
  store.shiftCoverNotes.push(note);

  // Recompute over the same fortnight so the row flips to "logged" in the response.
  const from = body.from || new Date().toISOString().slice(0, 10);
  const to = body.to || addDays(from, 13);
  return NextResponse.json({ data: computeCover(store, from, to), note });
}

// PATCH /api/v1/staffing-cover { min_day, min_night, expected_day, expected_night,
// waking_night_required, from?, to? } — update the home staffing policy
// ("updatable for need / risk") and recompute the forward picture.
export async function PATCH(req: Request) {
  const store = getStore() as any;
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }

  const cur = store.staffingPolicy ?? {};
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
  store.staffingPolicy = next;

  const from = body.from || new Date().toISOString().slice(0, 10);
  const to = body.to || addDays(from, 13);
  return NextResponse.json({ data: computeCover(store, from, to) });
}
