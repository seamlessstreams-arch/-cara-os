// ══════════════════════════��════════════════════════════════��══════════════════
// CARA — ROTA INTELLIGENCE API ROUTE
// GET /api/v1/rota-intelligence
// Returns rota coverage, staffing levels, overtime, and workforce alerts.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import {
  computeRotaIntelligence,
  type ShiftInput,
  type AbsenceInput,
  type StaffRef,
} from "@/lib/engines/rota-intelligence-engine";

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole dashboard.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const [allShifts, allLeaveRequests, allStaff] = await Promise.all([
    safeList(dal.shifts.findAll()),
    safeList(dal.leave.findAll()),
    safeList(dal.staff.findAll()),
  ]);

  // ── Map shifts ────────��──────────────────────��──────────────────────────
  const shifts: ShiftInput[] = (allShifts).map((s: any) => ({
    id: s.id,
    staff_id: s.staff_id ?? "",
    date: typeof s.date === "string" ? s.date.slice(0, 10) : s.date,
    shift_type: s.shift_type ?? "day",
    start_time: s.start_time ?? "08:00",
    end_time: s.end_time ?? "17:00",
    break_minutes: s.break_minutes ?? 0,
    overtime_minutes: s.overtime_minutes ?? 0,
    status: s.status ?? "scheduled",
    is_open_shift: s.is_open_shift ?? false,
    notes: s.notes ?? null,
  }));

  // ── Map absences (from leave requests where type is sick/compassionate) ─
  const absences: AbsenceInput[] = (allLeaveRequests)
    .filter((l: any) => l.status === "approved")
    .map((a: any) => ({
      id: a.id,
      staff_id: a.staff_id ?? "",
      start_date: typeof a.start_date === "string" ? a.start_date.slice(0, 10) : a.start_date,
      end_date: typeof a.end_date === "string" ? a.end_date.slice(0, 10) : a.end_date,
      type: a.leave_type ?? "sick",
      return_to_work_completed: a.return_to_work_completed ?? false,
    }));

  // ── Map staff ──────────���──────────────────────────────��─────────────────
  const staff: StaffRef[] = (allStaff)
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  // ── Run engine ─────────���────────────────────────────────────────────────
  const result = computeRotaIntelligence({ shifts, absences, staff });

  return NextResponse.json({ data: result });
}
