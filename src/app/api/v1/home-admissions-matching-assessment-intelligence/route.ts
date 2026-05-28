// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ADMISSIONS & MATCHING ASSESSMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-admissions-matching-assessment-intelligence
// Cross-domain composite: referralAssessmentRecords + impactRiskAssessmentRecords +
// matchingCriteriaRecords + placementSuitabilityRecords + admissionPlanningRecords
// CHR 2015 Reg 36 — Review of placement. SCCIF — Overall effectiveness.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeAdmissionsMatchingAssessment,
  type ReferralAssessmentRecordInput,
  type ImpactRiskAssessmentRecordInput,
  type MatchingCriteriaRecordInput,
  type PlacementSuitabilityRecordInput,
  type AdmissionPlanningRecordInput,
} from "@/lib/engines/home-admissions-matching-assessment-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    // ── Referral Assessment Records ────────────────────────────────────
    const rawReferralAssessments = (store.referralAssessmentRecords ?? []) as any[];
    const referral_assessment_records: ReferralAssessmentRecordInput[] = rawReferralAssessments.map((r: any) => ({
      id: r.id ?? "",
      referral_date: (r.referral_date ?? today).toString().slice(0, 10),
      child_id: r.child_id ?? "",
      referral_source: r.referral_source ?? "local_authority",
      status: r.status ?? "not_started",
      assessment_completed: !!r.assessment_completed,
      assessment_timely: !!r.assessment_timely,
      presenting_needs_documented: !!r.presenting_needs_documented,
      risk_factors_identified: !!r.risk_factors_identified,
      risk_factors_count: r.risk_factors_count ?? 0,
      background_history_reviewed: !!r.background_history_reviewed,
      previous_placements_reviewed: !!r.previous_placements_reviewed,
      education_needs_assessed: !!r.education_needs_assessed,
      health_needs_assessed: !!r.health_needs_assessed,
      emotional_needs_assessed: !!r.emotional_needs_assessed,
      family_context_reviewed: !!r.family_context_reviewed,
      safeguarding_history_checked: !!r.safeguarding_history_checked,
      statement_of_purpose_aligned: !!r.statement_of_purpose_aligned,
      assessor_name: r.assessor_name ?? "",
      quality_rating: r.quality_rating ?? 3,
      has_notes: !!r.has_notes,
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Impact Risk Assessment Records ─────────────────────────────────
    const rawImpactAssessments = (store.impactRiskAssessmentRecords ?? []) as any[];
    const impact_risk_assessment_records: ImpactRiskAssessmentRecordInput[] = rawImpactAssessments.map((a: any) => ({
      id: a.id ?? "",
      referral_id: a.referral_id ?? "",
      date: (a.date ?? today).toString().slice(0, 10),
      existing_children_count: a.existing_children_count ?? 0,
      children_consulted_count: a.children_consulted_count ?? 0,
      individual_impacts_assessed: !!a.individual_impacts_assessed,
      risk_level: a.risk_level ?? "medium",
      risks_identified_count: a.risks_identified_count ?? 0,
      mitigations_documented_count: a.mitigations_documented_count ?? 0,
      mitigations_adequate: !!a.mitigations_adequate,
      staff_capacity_assessed: !!a.staff_capacity_assessed,
      environmental_impact_assessed: !!a.environmental_impact_assessed,
      peer_dynamics_considered: !!a.peer_dynamics_considered,
      safeguarding_implications_reviewed: !!a.safeguarding_implications_reviewed,
      trigger_risks_assessed: !!a.trigger_risks_assessed,
      has_manager_sign_off: !!a.has_manager_sign_off,
      has_review_date: !!a.has_review_date,
      quality_rating: a.quality_rating ?? 3,
      has_notes: !!a.has_notes,
      created_at: (a.created_at ?? today).toString(),
    }));

    // ── Matching Criteria Records ──────────────────────────────────────
    const rawMatchingCriteria = (store.matchingCriteriaRecords ?? []) as any[];
    const matching_criteria_records: MatchingCriteriaRecordInput[] = rawMatchingCriteria.map((m: any) => ({
      id: m.id ?? "",
      referral_id: m.referral_id ?? "",
      date: (m.date ?? today).toString().slice(0, 10),
      criteria_count: m.criteria_count ?? 0,
      criteria_met_count: m.criteria_met_count ?? 0,
      age_compatibility_assessed: !!m.age_compatibility_assessed,
      gender_compatibility_assessed: !!m.gender_compatibility_assessed,
      needs_compatibility_assessed: !!m.needs_compatibility_assessed,
      risk_compatibility_assessed: !!m.risk_compatibility_assessed,
      cultural_compatibility_assessed: !!m.cultural_compatibility_assessed,
      educational_compatibility_assessed: !!m.educational_compatibility_assessed,
      emotional_compatibility_assessed: !!m.emotional_compatibility_assessed,
      behavioural_compatibility_assessed: !!m.behavioural_compatibility_assessed,
      overall_match_rating: m.overall_match_rating ?? "acceptable",
      child_views_sought: !!m.child_views_sought,
      child_views_count: m.child_views_count ?? 0,
      staff_views_sought: !!m.staff_views_sought,
      placing_authority_views_obtained: !!m.placing_authority_views_obtained,
      has_rationale: !!m.has_rationale,
      quality_rating: m.quality_rating ?? 3,
      has_notes: !!m.has_notes,
      created_at: (m.created_at ?? today).toString(),
    }));

    // ── Placement Suitability Records ──────────────────────────────────
    const rawSuitability = (store.placementSuitabilityRecords ?? []) as any[];
    const placement_suitability_records: PlacementSuitabilityRecordInput[] = rawSuitability.map((s: any) => ({
      id: s.id ?? "",
      referral_id: s.referral_id ?? "",
      date: (s.date ?? today).toString().slice(0, 10),
      suitability_determined: !!s.suitability_determined,
      statement_of_purpose_check: !!s.statement_of_purpose_check,
      bed_availability_confirmed: !!s.bed_availability_confirmed,
      staffing_capacity_assessed: !!s.staffing_capacity_assessed,
      specialist_provision_available: !!s.specialist_provision_available,
      location_suitability_assessed: !!s.location_suitability_assessed,
      education_provision_confirmed: !!s.education_provision_confirmed,
      health_provision_confirmed: !!s.health_provision_confirmed,
      contact_arrangements_feasible: !!s.contact_arrangements_feasible,
      regulatory_requirements_met: !!s.regulatory_requirements_met,
      outcome: s.outcome ?? "deferred",
      conditions_count: s.conditions_count ?? 0,
      conditions_documented: !!s.conditions_documented,
      has_decision_rationale: !!s.has_decision_rationale,
      decision_maker: s.decision_maker ?? "",
      quality_rating: s.quality_rating ?? 3,
      has_notes: !!s.has_notes,
      created_at: (s.created_at ?? today).toString(),
    }));

    // ── Admission Planning Records ─────────────────────────────────────
    const rawAdmissionPlanning = (store.admissionPlanningRecords ?? []) as any[];
    const admission_planning_records: AdmissionPlanningRecordInput[] = rawAdmissionPlanning.map((a: any) => ({
      id: a.id ?? "",
      referral_id: a.referral_id ?? "",
      child_id: a.child_id ?? "",
      date: (a.date ?? today).toString().slice(0, 10),
      admission_date_planned: (a.admission_date_planned ?? today).toString().slice(0, 10),
      introductory_visit_completed: !!a.introductory_visit_completed,
      introductory_visit_child_feedback_positive: !!a.introductory_visit_child_feedback_positive,
      child_preparation_plan: !!a.child_preparation_plan,
      existing_children_prepared: !!a.existing_children_prepared,
      staff_briefing_completed: !!a.staff_briefing_completed,
      key_worker_allocated: !!a.key_worker_allocated,
      bedroom_prepared: !!a.bedroom_prepared,
      placement_plan_drafted: !!a.placement_plan_drafted,
      risk_management_plan_updated: !!a.risk_management_plan_updated,
      education_arrangements_confirmed: !!a.education_arrangements_confirmed,
      health_appointments_booked: !!a.health_appointments_booked,
      contact_plan_agreed: !!a.contact_plan_agreed,
      welcome_pack_provided: !!a.welcome_pack_provided,
      child_consulted: !!a.child_consulted,
      child_views_recorded: !!a.child_views_recorded,
      first_review_scheduled: !!a.first_review_scheduled,
      quality_rating: a.quality_rating ?? 3,
      has_notes: !!a.has_notes,
      created_at: (a.created_at ?? today).toString(),
    }));

    // ── Compute ─────────────────────────────────────────────────────────
    const result = computeAdmissionsMatchingAssessment({
      today,
      total_children,
      referral_assessment_records,
      impact_risk_assessment_records,
      matching_criteria_records,
      placement_suitability_records,
      admission_planning_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
