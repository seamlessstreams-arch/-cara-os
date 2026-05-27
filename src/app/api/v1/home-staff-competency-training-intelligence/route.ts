import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStaffCompetencyTraining,
  type CompetencyInput,
  type TrainingMatrixInput,
  type CpdInput,
  type HandbookInput,
} from "@/lib/engines/home-staff-competency-training-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const staff = store.staff ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Staff competency records → CompetencyInput[]
  const rawComp = (store.staffCompetencyRecords as any[] ?? []);
  const competencies: CompetencyInput[] = [];
  for (const rec of rawComp) {
    const entries = (rec.entries ?? []) as any[];
    for (const e of entries) {
      competencies.push({
        id: e.id ?? rec.id ?? "",
        staff_id: rec.staff_id ?? "",
        level: e.level ?? "not_assessed",
        assessed: !!(e.assessed_date),
      });
    }
  }

  // Training matrix rows → TrainingMatrixInput[]
  const rawMatrix = (store.trainingMatrixRows as any[] ?? []);
  const training_matrix: TrainingMatrixInput[] = rawMatrix.map((r: any) => {
    const compliance = (r.overall_compliance ?? "non_compliant").toString();
    const complianceMap: Record<string, string> = {
      fully_compliant: "compliant",
      action_required: "at_risk",
      non_compliant: "non_compliant",
    };
    return {
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      total_courses: r.total_courses ?? 0,
      valid_count: r.valid_count ?? 0,
      expiring_count: r.expiring_count ?? 0,
      expired_count: r.expired_count ?? 0,
      overall_compliance: complianceMap[compliance] ?? compliance,
    };
  });

  // CPD records → CpdInput[]
  const rawCpd = (store.cpdRecords as any[] ?? []);
  const cpd_records: CpdInput[] = rawCpd.map((c: any) => ({
    id: c.id ?? "",
    staff_id: c.staff_id ?? "",
    status: c.status ?? "planned",
    cpd_hours: c.cpd_hours ?? 0,
    certificate_obtained: !!(c.certificate_obtained),
  }));

  // Staff handbook acknowledgement records → HandbookInput[]
  const rawHandbooks = (store.staffHandbookAcknowledgementRecords as any[] ?? []);
  const handbook_records: HandbookInput[] = rawHandbooks.map((h: any) => {
    const acks = (h.acknowledgements ?? []) as any[];
    const acknowledged = acks.filter((a: any) => !!(a.acknowledged_date)).length;
    return {
      id: h.id ?? "",
      total_staff_required: (staff as any[]).length,
      acknowledged_count: acknowledged,
    };
  });

  const result = computeStaffCompetencyTraining({
    today,
    total_staff: (staff as any[]).length,
    competencies,
    training_matrix,
    cpd_records,
    handbook_records,
  });

  return NextResponse.json({ data: result });
}
