// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORKFORCE INTELLIGENCE API ROUTE
// GET /api/v1/workforce-intelligence
// Returns aggregated workforce intelligence from the engine.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeWorkforceIntelligence,
  type StaffInput,
  type TrainingInput,
  type SupervisionInput,
  type ShiftInput,
  type LeaveInput,
} from "@/lib/engines/workforce-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map staff ────────────────────────────────────────────────────────
  const staff: StaffInput[] = store.staff.map((s) => ({
    id: s.id,
    full_name: s.full_name,
    role: s.role,
    employment_type: s.employment_type,
    employment_status: s.employment_status,
    start_date: s.start_date,
    probation_end_date: s.probation_end_date,
    contracted_hours: s.contracted_hours,
    dbs_number: s.dbs_number,
    dbs_issue_date: s.dbs_issue_date,
    dbs_update_service: s.dbs_update_service,
    next_supervision_due: s.next_supervision_due,
    next_appraisal_due: s.next_appraisal_due,
    is_active: s.is_active,
  }));

  // ── Map training ─────────────────────────────────────────────────────
  const training: TrainingInput[] = store.trainingRecords.map((t) => ({
    id: t.id,
    staff_id: t.staff_id,
    course_name: t.course_name,
    category: t.category,
    completed_date: t.completed_date,
    expiry_date: t.expiry_date,
    status: t.status,
    is_mandatory: t.is_mandatory,
  }));

  // ── Map supervisions ─────────────────────────────────────────────────
  const supervisions: SupervisionInput[] = store.supervisions.map((s) => ({
    id: s.id,
    staff_id: s.staff_id,
    scheduled_date: s.scheduled_date,
    actual_date: s.actual_date,
    status: s.status,
    type: s.type,
    wellbeing_score: s.wellbeing_score,
  }));

  // ── Map shifts ───────────────────────────────────────────────────────
  const shifts: ShiftInput[] = store.shifts.map((s) => ({
    id: s.id,
    staff_id: s.staff_id,
    date: s.date,
    shift_type: s.shift_type,
    start_time: s.start_time,
    end_time: s.end_time,
    status: s.status,
    overtime_minutes: s.overtime_minutes,
  }));

  // ── Map leave ────────────────────────────────────────────────────────
  const leave: LeaveInput[] = store.leaveRequests.map((l) => ({
    id: l.id,
    staff_id: l.staff_id,
    leave_type: l.leave_type,
    start_date: l.start_date,
    end_date: l.end_date,
    total_days: l.total_days,
    status: l.status,
  }));

  // ── Run engine ───────────────────────────────────────────────────────
  const result = computeWorkforceIntelligence({
    staff,
    training,
    supervisions,
    shifts,
    leave,
  });

  return NextResponse.json({ data: result });
}
