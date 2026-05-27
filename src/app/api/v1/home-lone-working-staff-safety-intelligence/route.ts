import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeLoneWorkingStaffSafety,
  type LoneWorkingRecordInput,
  type LoneWorkingAssessmentInput,
  type StaffSafetyCheckInput,
} from "@/lib/engines/home-lone-working-staff-safety-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const staff = store.staff ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Lone working records → LoneWorkingRecordInput[]
  const rawRecords = (store.loneWorkingRecords as any[] ?? []);
  const records: LoneWorkingRecordInput[] = rawRecords.map((r: any) => ({
    id: r.id ?? "",
    staff_id: r.staff_id ?? "",
    risk_level: r.risk_level ?? "low",
    status: r.status ?? "current",
    has_check_in_protocol: !!(r.check_in_protocol),
    personal_alarm_issued: !!(r.personal_alarm_issued),
    control_measures_count: (r.control_measures ?? []).length,
    hazards_count: (r.hazards ?? []).length,
  }));

  // Lone working risk assessments → LoneWorkingAssessmentInput[]
  const rawAssessments = (store.loneWorkingRiskAssessments as any[] ?? []);
  const assessments: LoneWorkingAssessmentInput[] = rawAssessments.map((a: any) => {
    const training = (a.training_completed ?? []) as any[];
    const validTraining = training.filter((t: any) => !!(t.valid));
    return {
      id: a.id ?? "",
      staff_id: a.staff_member ?? "",
      overall_risk: a.overall_risk_level ?? "low",
      scenarios_count: (a.scenarios ?? []).length,
      competency_evidence_count: (a.competency_evidence ?? []).length,
      training_valid_count: validTraining.length,
      training_total_count: training.length,
      approved_shifts_count: (a.approved_shifts ?? []).length,
    };
  });

  // Safety checks — derive from staff wellbeing records of type "post_incident" or build from lone working records
  // Since no dedicated safety check collection exists, derive from staffWellbeingRecords
  const rawWellbeing = (store.staffWellbeingRecords as any[] ?? []);
  const safetyChecks: StaffSafetyCheckInput[] = rawWellbeing
    .filter((w: any) => w.type === "post_incident" || w.type === "return_from_absence")
    .map((w: any) => ({
      id: w.id ?? "",
      staff_id: w.staff_id ?? "",
      check_completed: !!(w.overall_score && w.overall_score > 0),
      response_timely: !!(w.action_agreed),
    }));

  const result = computeLoneWorkingStaffSafety({
    today,
    total_staff: (staff as any[]).length,
    records,
    assessments,
    safety_checks: safetyChecks,
  });

  return NextResponse.json({ data: result });
}
