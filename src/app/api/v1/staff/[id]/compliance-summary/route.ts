// CARA — GET /api/v1/staff/[id]/compliance-summary
// One staff member's consolidated compliance + absence picture, reusing the
// home-level engines scoped to a single person. Deterministic.
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeStaffCompliance } from "@/lib/engines/staff-compliance-engine";
import { computeWorkforceAbsence } from "@/lib/engines/workforce-absence-engine";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const store = getStore() as any;
  const today = new Date().toISOString().slice(0, 10);

  const s = (store.staff ?? []).find((m: any) => String(m.id) === String(id));
  if (!s) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  const staffLite = [{
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
  }];

  const compliance = computeStaffCompliance({
    today,
    staff: staffLite,
    training: (store.trainingRecords ?? [])
      .filter((t: any) => String(t.staff_id) === String(id))
      .map((t: any) => ({
        staff_id: String(t.staff_id),
        course_name: String(t.course_name ?? "Training"),
        expiry_date: t.expiry_date ? String(t.expiry_date).slice(0, 10) : null,
        is_mandatory: !!t.is_mandatory,
        completed_date: t.completed_date ? String(t.completed_date).slice(0, 10) : null,
        status: t.status ?? null,
      })),
  });

  const absence = computeWorkforceAbsence({
    today,
    staff: staffLite.map((x) => ({ id: x.id, full_name: x.full_name })),
    records: (store.staffSicknessRecords ?? [])
      .filter((r: any) => String(r.staff_id) === String(id))
      .map((r: any) => ({
        staff_id: String(r.staff_id),
        date_started: r.date_started ? String(r.date_started).slice(0, 10) : "",
        date_ended: r.date_ended ? String(r.date_ended).slice(0, 10) : null,
        total_days: Number(r.total_days) || 0,
        category: String(r.category ?? "short_term"),
        reason: String(r.reason ?? "other"),
        rtw_status: String(r.rtw_status ?? "not_required"),
        occupational_health_referral: !!r.occupational_health_referral,
      })),
  });

  return NextResponse.json({
    data: {
      compliance: compliance.rows[0] ?? null,
      absence: absence.rows[0] ?? null,
    },
  });
}
