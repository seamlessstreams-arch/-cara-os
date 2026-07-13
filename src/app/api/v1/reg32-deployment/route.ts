// CARA — GET /api/v1/reg32-deployment[?from=&to=&staff_id=]
//
// Phase 4 · Module 1. The Reg 32 deployment-suitability board: for every person
// ASSIGNED to a shift in the window, is that person fit to be deployed? Reuses
// the existing per-staff compliance verdict (computeStaffCompliance) + reads
// employment status off the staff record + the rota off store.shifts. Pure
// read-only projection — detects and advises, changes no record and never edits
// the rota. Posture mirrors the sibling /staff-compliance route (demo).
import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeStaffCompliance } from "@/lib/engines/staff-compliance-engine";
import {
  computeDeploymentSuitability,
  deploymentReasonsFromCompliance,
  type Reg32Shift,
  type Reg32Staff,
  type ComplianceVerdictLite,
} from "@/lib/reg32-deployment/reg32-deployment-engine";

export const dynamic = "force-dynamic";

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const store = getStore() as any;
  const today = new Date().toISOString().slice(0, 10);

  const from = req.nextUrl.searchParams.get("from")?.slice(0, 10) || today;
  const to = req.nextUrl.searchParams.get("to")?.slice(0, 10) || addDays(today, 13); // default: 2-week window
  const staffId = req.nextUrl.searchParams.get("staff_id");

  // Reuse the mature compliance engine — identical mapping to /staff-compliance.
  const compliance = computeStaffCompliance({
    today,
    staff: (store.staff ?? []).map((s: any) => ({
      id: String(s.id),
      full_name: s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "Unknown",
      role: String(s.role ?? ""),
      job_title: String(s.job_title ?? ""),
      is_active: s.is_active !== false && s.employment_status !== "inactive",
      start_date: s.start_date ?? null,
      probation_end_date: s.probation_end_date ?? null,
      dbs_issue_date: s.dbs_issue_date ?? null,
      dbs_update_service: !!s.dbs_update_service,
      next_supervision_due: s.next_supervision_due ?? null,
      next_appraisal_due: s.next_appraisal_due ?? null,
    })),
    training: (store.trainingRecords ?? []).map((t: any) => ({
      staff_id: String(t.staff_id),
      course_name: String(t.course_name ?? "Training"),
      expiry_date: t.expiry_date ? String(t.expiry_date).slice(0, 10) : null,
      is_mandatory: !!t.is_mandatory,
      completed_date: t.completed_date ? String(t.completed_date).slice(0, 10) : null,
      status: t.status ?? null,
    })),
  });

  // Distil each compliance row → the deployment-relevant verdict (supervision /
  // appraisal deliberately excluded; they are not deployment bars).
  const verdicts: ComplianceVerdictLite[] = compliance.rows.map((r) => ({
    staff_id: r.staff_id,
    level: r.level,
    deployment_reasons: deploymentReasonsFromCompliance({ training: r.training, dbs: r.dbs }),
  }));

  const staff: Reg32Staff[] = (store.staff ?? []).map((s: any) => ({
    id: String(s.id),
    full_name: s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "Unknown",
    role: String(s.role ?? ""),
    home_id: String(s.home_id ?? ""),
    employment_status: s.employment_status ?? undefined,
    is_active: s.is_active,
  }));

  let shifts: Reg32Shift[] = (store.shifts ?? []).map((s: any) => ({
    id: String(s.id),
    staff_id: String(s.staff_id ?? ""),
    date: String(s.date ?? "").slice(0, 10),
    shift_type: String(s.shift_type ?? ""),
    home_id: String(s.home_id ?? ""),
    is_open_shift: !!s.is_open_shift,
    status: s.status ?? undefined,
  }));
  if (staffId) shifts = shifts.filter((s) => s.staff_id === staffId);

  const board = computeDeploymentSuitability({ shifts, staff, compliance: verdicts, fromDate: from, toDate: to });

  return NextResponse.json({ data: board });
}
