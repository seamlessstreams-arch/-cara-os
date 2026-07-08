// ══════════════════════════════════════════════════════════════════════════════
// CARA — Staffing cover: store → StaffingCoverResult (shared mapper)
//
// Extracted from /api/v1/staffing-cover so the SAME rota-safety read powers the
// API, Ask CARA and any future consumer — one mapper, one answer. Published
// shifts UNION pattern projections (published wins), minus anyone on approved
// leave / sickness, analysed against the home staffing policy.
// ══════════════════════════════════════════════════════════════════════════════

import { expandPatterns, shiftTypeToPeriod } from "@/lib/rota/shift-patterns";
import { analyseStaffingCover, type CoverAssignment, type CoverReasonNote, type StaffingCoverResult } from "@/lib/rota/staffing-cover-engine";

export function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
}

/** Compute the forward cover picture from the live store for a date range. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeStaffingCoverFromStore(store: any, from: string, to: string): StaffingCoverResult & { policy: unknown; projected_count: number } {
  const today = new Date().toISOString().slice(0, 10);
  const inRange = (d: string) => d >= from && d <= to;

  // ── Published shifts in range ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realShifts = (store.shifts ?? []).filter((s: any) => inRange(String(s.date).slice(0, 10)) && s.status !== "cancelled");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realKey = new Set(realShifts.map((s: any) => `${s.staff_id}|${String(s.date).slice(0, 10)}`));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coverNotes: CoverReasonNote[] = (store.shiftCoverNotes ?? []).map((n: any) => ({
    date: String(n.date).slice(0, 10),
    period: n.period,
    reason: String(n.reason),
    comment: String(n.comment ?? ""),
  }));

  const staffName = new Map<string, string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
