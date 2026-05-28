// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CONSENT & CAPACITY MANAGEMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-consent-capacity-management-intelligence
// Cross-domain composite: consentFormRecords + gillickAssessmentRecords +
// capacityReviewRecords + informedConsentRecords + consentWithdrawalRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeConsentCapacityManagement,
  type ConsentFormInput,
  type GillickAssessmentInput,
  type CapacityReviewInput,
  type InformedConsentInput,
  type ConsentWithdrawalInput,
} from "@/lib/engines/home-consent-capacity-management-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawConsentForms = ((store as any).consentFormRecords || []) as any[];
    const consent_form_records: ConsentFormInput[] = rawConsentForms.map((f: any) => ({
      id: f.id ?? "",
      child_id: f.child_id ?? "",
      consent_type: f.consent_type ?? "general",
      date_requested: (f.date_requested ?? today).toString(),
      date_completed: f.date_completed ?? null,
      completed: !!f.completed,
      person_giving_consent: f.person_giving_consent ?? "parent",
      consent_granted: f.consent_granted !== false,
      expiry_date: f.expiry_date ?? null,
      expired: !!f.expired,
      reviewed: !!f.reviewed,
      review_date: f.review_date ?? null,
      review_overdue: !!f.review_overdue,
      child_consulted: !!f.child_consulted,
      child_views_recorded: !!f.child_views_recorded,
      accessible_format_used: !!f.accessible_format_used,
      staff_name: f.staff_name ?? "",
      created_at: (f.created_at ?? today).toString(),
    }));

    const rawGillick = ((store as any).gillickAssessmentRecords || []) as any[];
    const gillick_assessment_records: GillickAssessmentInput[] = rawGillick.map((g: any) => ({
      id: g.id ?? "",
      child_id: g.child_id ?? "",
      assessment_date: (g.assessment_date ?? today).toString(),
      assessor_name: g.assessor_name ?? "",
      assessment_area: g.assessment_area ?? "general_health",
      child_age_at_assessment: g.child_age_at_assessment ?? 0,
      competence_determined: !!g.competence_determined,
      competence_outcome: g.competence_outcome ?? "deferred",
      evidence_documented: !!g.evidence_documented,
      child_understanding_verified: !!g.child_understanding_verified,
      information_provided_age_appropriate: !!g.information_provided_age_appropriate,
      multi_disciplinary_input: !!g.multi_disciplinary_input,
      outcome_explained_to_child: !!g.outcome_explained_to_child,
      review_date: g.review_date ?? null,
      review_overdue: !!g.review_overdue,
      created_at: (g.created_at ?? today).toString(),
    }));

    const rawCapacity = ((store as any).capacityReviewRecords || []) as any[];
    const capacity_review_records: CapacityReviewInput[] = rawCapacity.map((c: any) => ({
      id: c.id ?? "",
      child_id: c.child_id ?? "",
      review_date: (c.review_date ?? today).toString(),
      reviewer_name: c.reviewer_name ?? "",
      review_type: c.review_type ?? "scheduled",
      capacity_area: c.capacity_area ?? "daily_living",
      capacity_outcome: c.capacity_outcome ?? "developing",
      decision_specific: !!c.decision_specific,
      best_interests_considered: !!c.best_interests_considered,
      child_supported_to_participate: !!c.child_supported_to_participate,
      reasonable_adjustments_made: !!c.reasonable_adjustments_made,
      advocacy_offered: !!c.advocacy_offered,
      outcome_communicated_to_child: !!c.outcome_communicated_to_child,
      next_review_date: c.next_review_date ?? null,
      next_review_overdue: !!c.next_review_overdue,
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawInformed = ((store as any).informedConsentRecords || []) as any[];
    const informed_consent_records: InformedConsentInput[] = rawInformed.map((ic: any) => ({
      id: ic.id ?? "",
      child_id: ic.child_id ?? "",
      consent_date: (ic.consent_date ?? today).toString(),
      decision_type: ic.decision_type ?? "assessment",
      information_provided: !!ic.information_provided,
      information_age_appropriate: !!ic.information_age_appropriate,
      risks_explained: !!ic.risks_explained,
      benefits_explained: !!ic.benefits_explained,
      alternatives_discussed: !!ic.alternatives_discussed,
      questions_encouraged: !!ic.questions_encouraged,
      child_understanding_confirmed: !!ic.child_understanding_confirmed,
      time_given_to_decide: !!ic.time_given_to_decide,
      consent_documented: !!ic.consent_documented,
      witness_present: !!ic.witness_present,
      interpreter_needed: !!ic.interpreter_needed,
      interpreter_provided: !!ic.interpreter_provided,
      created_at: (ic.created_at ?? today).toString(),
    }));

    const rawWithdrawals = ((store as any).consentWithdrawalRecords || []) as any[];
    const consent_withdrawal_records: ConsentWithdrawalInput[] = rawWithdrawals.map((w: any) => ({
      id: w.id ?? "",
      child_id: w.child_id ?? "",
      withdrawal_date: (w.withdrawal_date ?? today).toString(),
      original_consent_type: w.original_consent_type ?? "general",
      reason_recorded: !!w.reason_recorded,
      child_views_sought: !!w.child_views_sought,
      withdrawal_respected: !!w.withdrawal_respected,
      action_taken_promptly: !!w.action_taken_promptly,
      relevant_parties_notified: !!w.relevant_parties_notified,
      alternative_options_discussed: !!w.alternative_options_discussed,
      impact_assessment_completed: !!w.impact_assessment_completed,
      documentation_updated: !!w.documentation_updated,
      manager_informed: !!w.manager_informed,
      follow_up_planned: !!w.follow_up_planned,
      created_at: (w.created_at ?? today).toString(),
    }));

    const result = computeConsentCapacityManagement({
      today,
      total_children,
      consent_form_records,
      gillick_assessment_records,
      capacity_review_records,
      informed_consent_records,
      consent_withdrawal_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
