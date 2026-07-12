// CARA — POST /api/v1/rota/generate
//   { from?, to?, mode?: "preview" | "publish" }
// Generate shifts in advance from staff patterns. "preview" (default) proposes
// the rota without writing; "publish" persists the proposal as real scheduled
// shifts. Already-published dates and staff on approved leave / sickness are
// skipped so the published rota reflects who is genuinely rostered.
import { NextResponse } from "next/server";
import { getStore, db } from "@/lib/db/store";
import { planShiftGeneration } from "@/lib/rota/shift-generation";
import type { ShiftType } from "@/lib/constants";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

function addDays(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const store = getStore() as any;
  let body: any = {};
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; } catch { body = {}; }

  const today = new Date().toISOString().slice(0, 10);
  const from = typeof body.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.from) ? body.from : today;
  const to = typeof body.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.to) ? body.to : addDays(from, 13);
  const mode = body.mode === "publish" ? "publish" : "preview";

  // Existing (non-cancelled) shifts in range — don't double-book.
  const existingKeys = new Set<string>();
  for (const s of store.shifts ?? []) {
    const d = String(s.date).slice(0, 10);
    if (d >= from && d <= to && s.status !== "cancelled" && s.staff_id) existingKeys.add(`${s.staff_id}|${d}`);
  }

  // Unavailable: approved leave + sickness spanning each date (same rule as the cover view).
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

  const plan = planShiftGeneration({ patterns: store.shiftPatterns ?? [], range: { from, to }, existingKeys, unavailable });

  const staffName = new Map<string, string>(
    (store.staff ?? []).map((m: any) => [String(m.id), m.full_name || `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Unknown"]),
  );
  const withNames = plan.candidates.map((c) => ({ ...c, staff_name: staffName.get(c.staff_id) ?? c.staff_id }));
  const byStaff = plan.by_staff.map((s) => ({ ...s, staff_name: staffName.get(s.staff_id) ?? s.staff_id })).sort((a, b) => a.staff_name.localeCompare(b.staff_name));

  let published = 0;
  if (mode === "publish") {
    const actor = req.headers.get("x-user-id") || req.headers.get("cs_user_id") || "system";
    for (const c of plan.candidates) {
      db.shifts.create({
        staff_id: c.staff_id,
        date: c.date,
        shift_type: c.shift_type as ShiftType,
        start_time: c.start_time,
        end_time: c.end_time,
        break_minutes: 0,
        actual_start: null,
        actual_end: null,
        clock_in_at: null,
        clock_out_at: null,
        overtime_minutes: 0,
        notes: "Generated from shift pattern",
        status: "scheduled",
        is_open_shift: false,
        home_id: c.shift_type ? (store.shiftPatterns?.find((p: any) => p.id === c.pattern_id)?.home_id ?? "home_oak") : "home_oak",
        created_by: actor,
        updated_by: actor,
      });
      published += 1;
    }
  }

  return NextResponse.json({
    data: {
      mode,
      range: { from, to },
      candidates: withNames,
      total: plan.total,
      published,
      skipped_existing: plan.skipped_existing,
      skipped_unavailable: plan.skipped_unavailable,
      by_staff: byStaff,
      by_date: plan.by_date,
    },
  });
}
