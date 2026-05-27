import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeInfectionControlHealthSafety,
  type InfectionRecordInput,
  type MarEntryInput,
  type MedTrainingInput,
  type FirstAiderInput,
} from "@/lib/engines/home-infection-control-health-safety-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.children ?? store.youngPeople ?? [];
  const staff = store.staff ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Infection records
  const rawInfections = (store.infectionRecords as any[] ?? []);
  const infections: InfectionRecordInput[] = rawInfections.map((i: any) => ({
    id: i.id ?? "",
    date: (i.date_reported ?? i.date ?? today).toString().slice(0, 10),
    severity: i.severity ?? "mild",
    status: i.status ?? "active",
    gp_consulted: !!(i.gp_consulted),
    control_measures_applied: !!(i.control_measures && (i.control_measures as any[]).length > 0),
    other_cases: i.other_cases_in_home ?? 0,
  }));

  // MAR entries
  const rawMar = (store.marEntries as any[] ?? []);
  const mar_entries: MarEntryInput[] = rawMar.map((m: any) => ({
    id: m.id ?? "",
    child_id: m.child_id ?? "",
    date: (m.date ?? today).toString().slice(0, 10),
    administered_correctly: !m.refused && !m.missed_dose,
    missed: !!(m.missed_dose),
    reason_for_miss: m.missed_reason ?? m.refusal_reason ?? null,
  }));

  // Med training records
  const rawMedTraining = (store.medTrainingRecords as any[] ?? []);
  const med_training: MedTrainingInput[] = rawMedTraining.map((t: any) => ({
    id: t.id ?? "",
    staff_id: t.staff_id ?? "",
    training_type: t.competency_type ?? "general",
    completed: t.status === "competent" || t.status === "passed" || !!(t.practical_assessment && t.written_assessment),
    expiry_date: (t.expiry_date ?? "").toString().slice(0, 10),
  }));

  // First aider records
  const rawFirstAiders = (store.firstAiderRecords as any[] ?? []);
  const first_aiders: FirstAiderInput[] = rawFirstAiders.map((f: any) => {
    const certs = (f.certifications ?? []) as any[];
    const hasCurrent = certs.some((c: any) => new Date(c.expiry_date) >= new Date(today));
    return {
      id: f.id ?? "",
      staff_id: f.staff_id ?? "",
      qualification: certs.length > 0 ? certs[0].level ?? "first_aid_at_work" : "first_aid_at_work",
      expiry_date: certs.length > 0 ? (certs[0].expiry_date ?? "").toString().slice(0, 10) : "",
      is_current: hasCurrent || !!(f.is_current_lead_first_aider),
    };
  });

  const result = computeHomeInfectionControlHealthSafety({
    today,
    total_children: (children as any[]).length,
    total_staff: (staff as any[]).length,
    infections,
    mar_entries,
    med_training,
    first_aiders,
  });

  return NextResponse.json({ data: result });
}
