// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HEALTH & WELLBEING OVERSIGHT INTELLIGENCE API ROUTE
// GET /api/v1/home-health-wellbeing-oversight-intelligence
// Cross-domain composite: healthAssessments + dentalRecords + healthMonitoring
// + healthPassports + healthRecordEntries
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHealthWellbeingOversight,
  type HealthAssessmentInput,
  type DentalRecordInput,
  type HealthMonitoringInput,
  type HealthPassportInput,
  type HealthRecordEntryInput,
} from "@/lib/engines/home-health-wellbeing-oversight-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawAssessments = (store.healthAssessments ?? []) as any[];
    const health_assessments: HealthAssessmentInput[] = rawAssessments.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      assessment_date: (a.assessment_date ?? a.date ?? today).toString(),
      assessment_type: a.assessment_type ?? "annual",
      outcome: a.outcome ?? "",
      actions_identified: typeof a.actions_identified === "number" ? a.actions_identified : 0,
      actions_completed: typeof a.actions_completed === "number" ? a.actions_completed : 0,
      next_due_date: (a.next_due_date ?? "").toString(),
      completed_by: a.completed_by ?? "",
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawDental = (store.dentalRecords ?? []) as any[];
    const dental_records: DentalRecordInput[] = rawDental.map((d: any) => ({
      id: d.id ?? "",
      child_id: d.child_id ?? "",
      appointment_date: (d.appointment_date ?? d.date ?? today).toString(),
      check_type: d.check_type ?? "routine",
      outcome: d.outcome ?? "",
      next_due_date: (d.next_due_date ?? "").toString(),
      attended: d.attended !== false,
      created_at: (d.created_at ?? today).toString(),
    }));

    const rawMonitoring = (store.healthMonitoring ?? []) as any[];
    const health_monitoring: HealthMonitoringInput[] = rawMonitoring.map((m: any) => ({
      id: m.id ?? "",
      child_id: m.child_id ?? "",
      date: (m.date ?? today).toString(),
      monitoring_type: m.monitoring_type ?? "",
      readings_recorded: !!m.readings_recorded,
      concerns_flagged: !!m.concerns_flagged,
      actions_taken: m.actions_taken ?? "",
      reviewed_by: m.reviewed_by ?? "",
      created_at: (m.created_at ?? today).toString(),
    }));

    const rawPassports = (store.healthPassports ?? []) as any[];
    const health_passports: HealthPassportInput[] = rawPassports.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      last_updated: (p.last_updated ?? p.updated_at ?? today).toString(),
      immunisations_current: !!p.immunisations_current,
      allergies_documented: !!p.allergies_documented,
      medications_documented: !!p.medications_documented,
      gp_registered: !!p.gp_registered,
      dentist_registered: !!p.dentist_registered,
      optician_registered: !!p.optician_registered,
      consent_forms_signed: !!p.consent_forms_signed,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawEntries = (store.healthRecordEntries ?? []) as any[];
    const health_record_entries: HealthRecordEntryInput[] = rawEntries.map((e: any) => ({
      id: e.id ?? "",
      child_id: e.child_id ?? "",
      date: (e.date ?? today).toString(),
      entry_type: e.entry_type ?? "observation",
      description: e.description ?? "",
      outcome: e.outcome ?? "",
      follow_up_required: !!e.follow_up_required,
      follow_up_completed: !!e.follow_up_completed,
      created_at: (e.created_at ?? today).toString(),
    }));

    const result = computeHealthWellbeingOversight({
      today,
      total_children,
      health_assessments,
      dental_records,
      health_monitoring,
      health_passports,
      health_record_entries,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
