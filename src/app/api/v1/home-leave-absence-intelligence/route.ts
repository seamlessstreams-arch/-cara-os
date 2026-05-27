// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LEAVE & ABSENCE INTELLIGENCE API ROUTE
// GET /api/v1/home-leave-absence-intelligence
// Workforce availability: leave patterns, sickness, approval governance.
// CHR 2015 Reg 33. SCCIF: "Staffing arrangements — availability and adequacy."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeLeaveAbsence,
  type LeaveInput,
} from "@/lib/engines/home-leave-absence-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Leave Requests ────────────────────────────────────────────────────
  const leaveRequests: LeaveInput[] = (
    (store.leaveRequests ?? []) as any[]
  ).map((l: any) => ({
    id: l.id ?? "",
    staff_id: l.staff_id ?? "",
    leave_type: (l.leave_type ?? "annual_leave").toString(),
    start_date: (l.start_date ?? "").toString().slice(0, 10),
    end_date: (l.end_date ?? "").toString().slice(0, 10),
    total_days: typeof l.total_days === "number" ? l.total_days : 0,
    status: (l.status ?? "pending").toString(),
    approved_by: l.approved_by ?? null,
    return_to_work_required: !!(l.return_to_work_required),
    return_to_work_completed: !!(l.return_to_work_completed),
  }));

  // ── Total staff ───────────────────────────────────────────────────────
  const totalStaff = (store.staff ?? []).filter(
    (s: any) => s.status === "active",
  ).length;

  const result = computeHomeLeaveAbsence({
    today,
    leave_requests: leaveRequests,
    total_staff: totalStaff,
  });

  return NextResponse.json({ data: result });
}
