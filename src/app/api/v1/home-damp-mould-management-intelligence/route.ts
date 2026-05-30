// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DAMP & MOULD MANAGEMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-damp-mould-management-intelligence
// Cross-domain composite: dampSurveyRecords + mouldInspectionRecords +
// remediationRecords + ventilationAssessmentRecords + healthImpactRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeDampMouldManagement,
  type DampSurveyRecordInput,
  type MouldInspectionRecordInput,
  type RemediationRecordInput,
  type VentilationAssessmentRecordInput,
  type HealthImpactRecordInput,
} from "@/lib/engines/home-damp-mould-management-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawDampSurveys = (store.dampSurveyRecords ?? []) as any[];
    const damp_survey_records: DampSurveyRecordInput[] = rawDampSurveys.map((s: any) => ({
      id: s.id ?? "",
      date: (s.date ?? today).toString(),
      surveyor: s.surveyor ?? "",
      survey_type: s.survey_type ?? "routine",
      area_surveyed: s.area_surveyed ?? "",
      damp_detected: !!s.damp_detected,
      damp_type: s.damp_type ?? "none",
      severity: s.severity ?? "none",
      moisture_reading: s.moisture_reading ?? 0,
      moisture_threshold: s.moisture_threshold ?? 0,
      within_acceptable_range: !!s.within_acceptable_range,
      photographs_taken: !!s.photographs_taken,
      action_required: !!s.action_required,
      action_taken: !!s.action_taken,
      follow_up_date: s.follow_up_date ?? null,
      follow_up_completed: !!s.follow_up_completed,
      child_rooms_affected: !!s.child_rooms_affected,
      rooms_affected_count: s.rooms_affected_count ?? 0,
      recommendations_made: s.recommendations_made ?? 0,
      recommendations_actioned: s.recommendations_actioned ?? 0,
      notes: s.notes ?? "",
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawMouldInspections = (store.mouldInspectionRecords ?? []) as any[];
    const mould_inspection_records: MouldInspectionRecordInput[] = rawMouldInspections.map((m: any) => ({
      id: m.id ?? "",
      date: (m.date ?? today).toString(),
      inspector: m.inspector ?? "",
      inspection_type: m.inspection_type ?? "routine",
      area_inspected: m.area_inspected ?? "",
      mould_found: !!m.mould_found,
      mould_type: m.mould_type ?? "none",
      surface_area_affected_sqm: m.surface_area_affected_sqm ?? 0,
      severity: m.severity ?? "none",
      location_type: m.location_type ?? "other",
      child_bedroom_affected: !!m.child_bedroom_affected,
      spore_risk_assessed: !!m.spore_risk_assessed,
      immediate_action_taken: !!m.immediate_action_taken,
      treatment_applied: !!m.treatment_applied,
      treatment_type: m.treatment_type ?? "",
      re_inspection_scheduled: !!m.re_inspection_scheduled,
      re_inspection_date: m.re_inspection_date ?? null,
      photographs_taken: !!m.photographs_taken,
      reported_to_management: !!m.reported_to_management,
      notes: m.notes ?? "",
      created_at: (m.created_at ?? today).toString(),
    }));

    const rawRemediations = (store.remediationRecords ?? []) as any[];
    const remediation_records: RemediationRecordInput[] = rawRemediations.map((r: any) => ({
      id: r.id ?? "",
      date_raised: (r.date_raised ?? today).toString(),
      date_completed: r.date_completed ?? null,
      remediation_type: r.remediation_type ?? "other",
      contractor: r.contractor ?? "",
      area_treated: r.area_treated ?? "",
      severity_at_referral: r.severity_at_referral ?? "mild",
      completed: !!r.completed,
      completed_within_target: !!r.completed_within_target,
      target_days: r.target_days ?? 0,
      actual_days: r.actual_days ?? 0,
      cost_gbp: r.cost_gbp ?? 0,
      quality_checked: !!r.quality_checked,
      quality_satisfactory: !!r.quality_satisfactory,
      follow_up_inspection_completed: !!r.follow_up_inspection_completed,
      recurrence_detected: !!r.recurrence_detected,
      child_room_involved: !!r.child_room_involved,
      child_temporarily_relocated: !!r.child_temporarily_relocated,
      child_informed_of_works: !!r.child_informed_of_works,
      warranty_period_months: r.warranty_period_months ?? 0,
      warranty_active: !!r.warranty_active,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawVentilation = (store.ventilationAssessmentRecords ?? []) as any[];
    const ventilation_assessment_records: VentilationAssessmentRecordInput[] = rawVentilation.map((v: any) => ({
      id: v.id ?? "",
      date: (v.date ?? today).toString(),
      assessor: v.assessor ?? "",
      room_assessed: v.room_assessed ?? "",
      room_type: v.room_type ?? "other",
      ventilation_type: v.ventilation_type ?? "natural",
      ventilation_adequate: !!v.ventilation_adequate,
      airflow_measured: !!v.airflow_measured,
      airflow_rate_lps: v.airflow_rate_lps ?? 0,
      minimum_required_lps: v.minimum_required_lps ?? 0,
      meets_building_regs: !!v.meets_building_regs,
      humidity_level_percent: v.humidity_level_percent ?? 0,
      humidity_acceptable: !!v.humidity_acceptable,
      extractor_fan_working: !!v.extractor_fan_working,
      trickle_vents_open: !!v.trickle_vents_open,
      windows_openable: !!v.windows_openable,
      condensation_observed: !!v.condensation_observed,
      recommendations_made: v.recommendations_made ?? 0,
      recommendations_actioned: v.recommendations_actioned ?? 0,
      child_bedroom: !!v.child_bedroom,
      maintenance_required: !!v.maintenance_required,
      maintenance_completed: !!v.maintenance_completed,
      notes: v.notes ?? "",
      created_at: (v.created_at ?? today).toString(),
    }));

    const rawHealthImpacts = (store.healthImpactRecords ?? []) as any[];
    const health_impact_records: HealthImpactRecordInput[] = rawHealthImpacts.map((h: any) => ({
      id: h.id ?? "",
      child_id: h.child_id ?? "",
      date: (h.date ?? today).toString(),
      health_concern_type: h.health_concern_type ?? "other",
      linked_to_damp_mould: !!h.linked_to_damp_mould,
      confirmed_by_professional: !!h.confirmed_by_professional,
      professional_type: h.professional_type ?? "none",
      severity: h.severity ?? "mild",
      treatment_required: !!h.treatment_required,
      treatment_provided: !!h.treatment_provided,
      medication_prescribed: !!h.medication_prescribed,
      days_affected: h.days_affected ?? 0,
      school_absence: !!h.school_absence,
      school_absence_days: h.school_absence_days ?? 0,
      room_assessment_triggered: !!h.room_assessment_triggered,
      remediation_triggered: !!h.remediation_triggered,
      environment_modified: !!h.environment_modified,
      child_views_recorded: !!h.child_views_recorded,
      social_worker_informed: !!h.social_worker_informed,
      placing_authority_informed: !!h.placing_authority_informed,
      follow_up_health_check: !!h.follow_up_health_check,
      follow_up_completed: !!h.follow_up_completed,
      outcome: h.outcome ?? "ongoing",
      notes: h.notes ?? "",
      created_at: (h.created_at ?? today).toString(),
    }));

    const result = computeDampMouldManagement({
      today,
      total_children,
      damp_survey_records,
      mould_inspection_records,
      remediation_records,
      ventilation_assessment_records,
      health_impact_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
