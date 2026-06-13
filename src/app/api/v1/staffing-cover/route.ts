// CARA — GET /api/v1/staffing-cover?from&to
// Forward staffing-cover picture: published shifts UNION pattern projections
// (published wins), minus anyone on approved leave / sickness, analysed against
// the home staffing policy. The anti-rota-blindness surface.
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { expandPatterns, shiftTypeToPeriod } from "@/lib/rota/shift-patterns";
import { analyseStaffingCover, type CoverAssignment, type CoverReasonNote } from "@/lib/rota/staffing-cover-engine";

export const dynamic = "force-dynamic";

function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const store = getStore() as any;
  const url = new URL(req.url);
  const today = new Date().toISOString().slice(0, 10);
  const from = url.searchParams.get("from") || today;
  const to = url.searchParams.get("to") || addDays(today, 13);
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

  return NextResponse.json({ data: { ...result, policy: store.staffingPolicy, projected_count: projected } });
}
