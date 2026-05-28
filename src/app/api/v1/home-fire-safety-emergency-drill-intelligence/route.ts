// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FIRE SAFETY & EMERGENCY DRILL INTELLIGENCE API ROUTE
// GET /api/v1/home-fire-safety-emergency-drill-intelligence
// Cross-domain composite: fireDrillRecords + fireRiskAssessmentRecords +
// fireEquipmentCheckRecords + fireTrainingRecords + fireSafetyDocumentRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeFireSafetyEmergencyDrill,
  type FireDrillRecordInput,
  type FireRiskAssessmentRecordInput,
  type FireEquipmentCheckRecordInput,
  type FireTrainingRecordInput,
  type FireSafetyDocumentRecordInput,
} from "@/lib/engines/home-fire-safety-emergency-drill-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawDrills = (store.fireDrillRecords ?? []) as any[];
    const fire_drill_records: FireDrillRecordInput[] = rawDrills.map((d: any) => ({
      id: d.id ?? "",
      date: (d.date ?? today).toString(),
      time_of_day: d.time_of_day ?? "day",
      drill_type: d.drill_type ?? "scheduled",
      evacuation_time_seconds: d.evacuation_time_seconds ?? 0,
      target_evacuation_time_seconds: d.target_evacuation_time_seconds ?? 180,
      within_target: !!d.within_target,
      all_occupants_evacuated: !!d.all_occupants_evacuated,
      children_present_count: d.children_present_count ?? 0,
      staff_present_count: d.staff_present_count ?? 0,
      result: d.result ?? "satisfactory",
      issues_found: Array.isArray(d.issues_found) ? d.issues_found : [],
      actions_taken: Array.isArray(d.actions_taken) ? d.actions_taken : [],
      all_issues_resolved: !!d.all_issues_resolved,
      conducted_by: d.conducted_by ?? "",
      notes: d.notes ?? "",
      created_at: (d.created_at ?? today).toString(),
    }));

    const rawRiskAssessments = (store.fireRiskAssessmentRecords ?? []) as any[];
    const fire_risk_assessment_records: FireRiskAssessmentRecordInput[] = rawRiskAssessments.map((r: any) => ({
      id: r.id ?? "",
      assessment_date: (r.assessment_date ?? today).toString(),
      next_review_date: (r.next_review_date ?? today).toString(),
      assessor: r.assessor ?? "",
      risk_level: r.risk_level ?? "medium",
      areas_assessed: r.areas_assessed ?? 0,
      areas_compliant: r.areas_compliant ?? 0,
      actions_required: r.actions_required ?? 0,
      actions_completed: r.actions_completed ?? 0,
      significant_findings: Array.isArray(r.significant_findings) ? r.significant_findings : [],
      is_current: !!r.is_current,
      documented: !!r.documented,
      shared_with_staff: !!r.shared_with_staff,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawEquipmentChecks = (store.fireEquipmentCheckRecords ?? []) as any[];
    const fire_equipment_check_records: FireEquipmentCheckRecordInput[] = rawEquipmentChecks.map((e: any) => ({
      id: e.id ?? "",
      check_date: (e.check_date ?? today).toString(),
      equipment_type: e.equipment_type ?? "smoke_alarm",
      location: e.location ?? "",
      passed: !!e.passed,
      defects_found: Array.isArray(e.defects_found) ? e.defects_found : [],
      defects_rectified: !!e.defects_rectified,
      next_check_due: (e.next_check_due ?? today).toString(),
      checked_by: e.checked_by ?? "",
      professional_service: !!e.professional_service,
      certificate_held: !!e.certificate_held,
      notes: e.notes ?? "",
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawTraining = (store.fireTrainingRecords ?? []) as any[];
    const fire_training_records: FireTrainingRecordInput[] = rawTraining.map((t: any) => ({
      id: t.id ?? "",
      staff_id: t.staff_id ?? "",
      training_date: (t.training_date ?? today).toString(),
      training_type: t.training_type ?? "annual_refresher",
      completed: !!t.completed,
      passed: !!t.passed,
      certificate_issued: !!t.certificate_issued,
      expiry_date: t.expiry_date ?? null,
      provider: t.provider ?? "",
      duration_hours: t.duration_hours ?? 0,
      notes: t.notes ?? "",
      created_at: (t.created_at ?? today).toString(),
    }));

    const rawDocuments = (store.fireSafetyDocumentRecords ?? []) as any[];
    const fire_safety_document_records: FireSafetyDocumentRecordInput[] = rawDocuments.map((d: any) => ({
      id: d.id ?? "",
      document_type: d.document_type ?? "fire_policy",
      title: d.title ?? "",
      is_current: !!d.is_current,
      last_reviewed: (d.last_reviewed ?? today).toString(),
      next_review_due: (d.next_review_due ?? today).toString(),
      approved_by: d.approved_by ?? "",
      accessible_to_staff: !!d.accessible_to_staff,
      accessible_to_children: !!d.accessible_to_children,
      version: d.version ?? "",
      notes: d.notes ?? "",
      created_at: (d.created_at ?? today).toString(),
    }));

    const result = computeFireSafetyEmergencyDrill({
      today,
      total_children,
      fire_drill_records,
      fire_risk_assessment_records,
      fire_equipment_check_records,
      fire_training_records,
      fire_safety_document_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
