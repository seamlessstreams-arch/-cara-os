// CARA — GET /api/v1/staff-compliance
// Every active staff member's compliance picture, computed deterministically
// from the staff record + training records.
import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { computeStaffCompliance } from "@/lib/engines/staff-compliance-engine";

export const dynamic = "force-dynamic";

// Read a dal collection defensively: on a live tenant a transient query failure
// must degrade to an empty section, never 500 the whole route.
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
  const today = new Date().toISOString().slice(0, 10);

  const [staffList, trainingRecords] = await Promise.all([
    safeList(dal.staff.findAll()),
    safeList(dal.training.findAll()),
  ]);

  const result = computeStaffCompliance({
    today,
    staff: staffList.map((s: any) => ({
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
    training: trainingRecords.map((t: any) => ({
      staff_id: String(t.staff_id),
      course_name: String(t.course_name ?? "Training"),
      expiry_date: t.expiry_date ? String(t.expiry_date).slice(0, 10) : null,
      is_mandatory: !!t.is_mandatory,
      completed_date: t.completed_date ? String(t.completed_date).slice(0, 10) : null,
      status: t.status ?? null,
    })),
  });

  return NextResponse.json({ data: result });
}
