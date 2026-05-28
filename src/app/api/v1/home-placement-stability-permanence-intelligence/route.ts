// ==============================================================================
// CORNERSTONE -- HOME PLACEMENT STABILITY & PERMANENCE INTELLIGENCE API ROUTE
// GET /api/v1/home-placement-stability-permanence-intelligence
// Cross-domain composite: placementRecords + matchingAssessmentRecords +
// stabilityMeetingRecords + disruptionPreventionRecords + placementReviewRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePlacementStabilityPermanence,
  type PlacementRecordInput,
  type MatchingAssessmentRecordInput,
  type StabilityMeetingRecordInput,
  type DisruptionPreventionRecordInput,
  type PlacementReviewRecordInput,
} from "@/lib/engines/home-placement-stability-permanence-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawPlacement = ((store as any).placementRecords || []) as any[];
    const placement_records: PlacementRecordInput[] = rawPlacement.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      start_date: (r.start_date ?? today).toString(),
      end_date: r.end_date ? r.end_date.toString() : null,
      placement_type: r.placement_type ?? "planned",
      ending_type: r.ending_type ?? null,
      ending_reason: r.ending_reason ?? "",
      duration_days: r.duration_days ?? 0,
      stability_rating: r.stability_rating ?? 3,
      child_consulted_on_admission: !!r.child_consulted_on_admission,
      child_views_recorded: !!r.child_views_recorded,
      care_plan_in_place: !!r.care_plan_in_place,
      risk_assessment_completed: !!r.risk_assessment_completed,
      impact_assessment_completed: !!r.impact_assessment_completed,
      key_worker_assigned: !!r.key_worker_assigned,
      key_worker_assigned_within_48h: !!r.key_worker_assigned_within_48h,
      settling_in_plan: !!r.settling_in_plan,
      matching_score: r.matching_score ?? 0,
      parent_carer_notified: !!r.parent_carer_notified,
      social_worker_notified: !!r.social_worker_notified,
      disruption_meeting_held: !!r.disruption_meeting_held,
      placement_plan_reviewed: !!r.placement_plan_reviewed,
      child_satisfaction: r.child_satisfaction ?? 3,
      peer_impact_assessed: !!r.peer_impact_assessed,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawMatching = ((store as any).matchingAssessmentRecords || []) as any[];
    const matching_assessment_records: MatchingAssessmentRecordInput[] = rawMatching.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      assessment_date: (r.assessment_date ?? today).toString(),
      assessor: r.assessor ?? "",
      matching_criteria_met: !!r.matching_criteria_met,
      needs_assessment_completed: !!r.needs_assessment_completed,
      risk_compatibility_assessed: !!r.risk_compatibility_assessed,
      existing_residents_considered: !!r.existing_residents_considered,
      cultural_match_considered: !!r.cultural_match_considered,
      education_continuity_assessed: !!r.education_continuity_assessed,
      health_needs_assessed: !!r.health_needs_assessed,
      location_suitability_assessed: !!r.location_suitability_assessed,
      family_contact_impact_assessed: !!r.family_contact_impact_assessed,
      overall_match_score: r.overall_match_score ?? 0,
      match_approved: !!r.match_approved,
      conditions_attached: Array.isArray(r.conditions_attached) ? r.conditions_attached : [],
      child_views_sought: !!r.child_views_sought,
      child_views_positive: !!r.child_views_positive,
      outcome: r.outcome ?? "pending",
      reg_36_compliant: !!r.reg_36_compliant,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawStabilityMeetings = ((store as any).stabilityMeetingRecords || []) as any[];
    const stability_meeting_records: StabilityMeetingRecordInput[] = rawStabilityMeetings.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      meeting_date: (r.meeting_date ?? today).toString(),
      meeting_type: r.meeting_type ?? "scheduled",
      attendees_count: r.attendees_count ?? 0,
      child_attended: !!r.child_attended,
      child_views_represented: !!r.child_views_represented,
      social_worker_attended: !!r.social_worker_attended,
      parent_carer_attended: !!r.parent_carer_attended,
      key_issues_identified: Array.isArray(r.key_issues_identified) ? r.key_issues_identified : [],
      actions_agreed: r.actions_agreed ?? 0,
      actions_completed: r.actions_completed ?? 0,
      stability_risk_level: r.stability_risk_level ?? "low",
      outcome: r.outcome ?? "stable",
      follow_up_date: r.follow_up_date ? r.follow_up_date.toString() : null,
      follow_up_completed: !!r.follow_up_completed,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawDisruptionPrevention = ((store as any).disruptionPreventionRecords || []) as any[];
    const disruption_prevention_records: DisruptionPreventionRecordInput[] = rawDisruptionPrevention.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      identified_date: (r.identified_date ?? today).toString(),
      risk_level: r.risk_level ?? "medium",
      trigger_factors: Array.isArray(r.trigger_factors) ? r.trigger_factors : [],
      intervention_type: r.intervention_type ?? "additional_support",
      intervention_date: (r.intervention_date ?? today).toString(),
      intervention_timely: !!r.intervention_timely,
      outcome: r.outcome ?? "ongoing",
      placement_preserved: !!r.placement_preserved,
      child_consulted: !!r.child_consulted,
      multi_agency_involved: !!r.multi_agency_involved,
      review_completed: !!r.review_completed,
      lessons_learned_documented: !!r.lessons_learned_documented,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawPlacementReviews = ((store as any).placementReviewRecords || []) as any[];
    const placement_review_records: PlacementReviewRecordInput[] = rawPlacementReviews.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      review_date: (r.review_date ?? today).toString(),
      review_type: r.review_type ?? "statutory",
      child_attended: !!r.child_attended,
      child_views_captured: !!r.child_views_captured,
      social_worker_attended: !!r.social_worker_attended,
      parent_carer_involved: !!r.parent_carer_involved,
      placement_plan_updated: !!r.placement_plan_updated,
      care_plan_aligned: !!r.care_plan_aligned,
      permanence_plan_discussed: !!r.permanence_plan_discussed,
      permanence_plan_in_place: !!r.permanence_plan_in_place,
      outcomes_reviewed: !!r.outcomes_reviewed,
      actions_from_previous_review: r.actions_from_previous_review ?? 0,
      actions_completed_from_previous: r.actions_completed_from_previous ?? 0,
      next_review_date: r.next_review_date ? r.next_review_date.toString() : null,
      overall_placement_quality: r.overall_placement_quality ?? 3,
      recommendation: r.recommendation ?? "continue",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computePlacementStabilityPermanence({
      today,
      total_children,
      placement_records,
      matching_assessment_records,
      stability_meeting_records,
      disruption_prevention_records,
      placement_review_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
