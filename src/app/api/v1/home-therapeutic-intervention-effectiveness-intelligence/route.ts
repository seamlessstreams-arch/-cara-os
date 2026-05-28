// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME THERAPEUTIC INTERVENTION EFFECTIVENESS INTELLIGENCE API ROUTE
// GET /api/v1/home-therapeutic-intervention-effectiveness-intelligence
// Cross-domain composite: therapySessionRecords + interventionOutcomeRecords +
// therapeuticProgressRecords + treatmentPlanRecords + therapeuticRelationshipRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeTherapeuticInterventionEffectiveness,
  type TherapySessionInput,
  type InterventionOutcomeInput,
  type TherapeuticProgressInput,
  type TreatmentPlanInput,
  type TherapeuticRelationshipInput,
} from "@/lib/engines/home-therapeutic-intervention-effectiveness-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawTherapySessions = (store.therapySessionRecords ?? []) as any[];
    const therapy_sessions: TherapySessionInput[] = rawTherapySessions.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      session_date: (s.session_date ?? today).toString(),
      therapist_name: s.therapist_name ?? "",
      therapy_type: s.therapy_type ?? "other",
      scheduled: s.scheduled !== false,
      attended: !!s.attended,
      cancellation_reason: s.cancellation_reason ?? null,
      cancelled_by: s.cancelled_by ?? null,
      session_duration_minutes: s.session_duration_minutes ?? 0,
      session_quality_rating: s.session_quality_rating ?? 3,
      child_engagement_rating: s.child_engagement_rating ?? 3,
      goals_addressed: s.goals_addressed ?? 0,
      goals_total: s.goals_total ?? 0,
      follow_up_actions_identified: s.follow_up_actions_identified ?? 0,
      follow_up_actions_completed: s.follow_up_actions_completed ?? 0,
      notes_completed: !!s.notes_completed,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawInterventionOutcomes = (store.interventionOutcomeRecords ?? []) as any[];
    const intervention_outcomes: InterventionOutcomeInput[] = rawInterventionOutcomes.map((i: any) => ({
      id: i.id ?? "",
      child_id: i.child_id ?? "",
      intervention_name: i.intervention_name ?? "",
      intervention_type: i.intervention_type ?? "therapeutic",
      start_date: (i.start_date ?? today).toString(),
      end_date: i.end_date ?? null,
      active: i.active !== false,
      baseline_score: i.baseline_score ?? 0,
      current_score: i.current_score ?? 0,
      target_score: i.target_score ?? 0,
      measurement_tool: i.measurement_tool ?? "",
      positive_outcome: !!i.positive_outcome,
      outcome_measured: !!i.outcome_measured,
      review_date: i.review_date ?? null,
      review_completed: !!i.review_completed,
      evidence_documented: !!i.evidence_documented,
      created_at: (i.created_at ?? today).toString(),
    }));

    const rawTherapeuticProgress = (store.therapeuticProgressRecords ?? []) as any[];
    const therapeutic_progress_records: TherapeuticProgressInput[] = rawTherapeuticProgress.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      assessment_date: (p.assessment_date ?? today).toString(),
      assessment_type: p.assessment_type ?? "progress_review",
      assessor_name: p.assessor_name ?? "",
      domains_assessed: p.domains_assessed ?? 0,
      domains_improving: p.domains_improving ?? 0,
      domains_stable: p.domains_stable ?? 0,
      domains_declining: p.domains_declining ?? 0,
      overall_progress: p.overall_progress ?? "stable",
      risk_level: p.risk_level ?? "low",
      next_review_date: p.next_review_date ?? null,
      recommendations_made: p.recommendations_made ?? 0,
      recommendations_actioned: p.recommendations_actioned ?? 0,
      child_involved_in_assessment: !!p.child_involved_in_assessment,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawTreatmentPlans = (store.treatmentPlanRecords ?? []) as any[];
    const treatment_plans: TreatmentPlanInput[] = rawTreatmentPlans.map((t: any) => ({
      id: t.id ?? "",
      child_id: t.child_id ?? "",
      plan_name: t.plan_name ?? "",
      plan_type: t.plan_type ?? "individual",
      created_date: (t.created_date ?? today).toString(),
      review_date: t.review_date ?? null,
      active: t.active !== false,
      total_goals: t.total_goals ?? 0,
      goals_on_track: t.goals_on_track ?? 0,
      goals_achieved: t.goals_achieved ?? 0,
      goals_behind: t.goals_behind ?? 0,
      goals_not_started: t.goals_not_started ?? 0,
      interventions_planned: t.interventions_planned ?? 0,
      interventions_delivered: t.interventions_delivered ?? 0,
      child_involved_in_planning: !!t.child_involved_in_planning,
      carer_involved_in_planning: !!t.carer_involved_in_planning,
      multi_agency_input: !!t.multi_agency_input,
      last_reviewed_date: t.last_reviewed_date ?? null,
      review_overdue: !!t.review_overdue,
      created_at: (t.created_at ?? today).toString(),
    }));

    const rawTherapeuticRelationships = (store.therapeuticRelationshipRecords ?? []) as any[];
    const therapeutic_relationship_records: TherapeuticRelationshipInput[] = rawTherapeuticRelationships.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      therapist_name: r.therapist_name ?? "",
      relationship_start_date: (r.relationship_start_date ?? today).toString(),
      active: r.active !== false,
      trust_rating: r.trust_rating ?? 3,
      rapport_rating: r.rapport_rating ?? 3,
      communication_rating: r.communication_rating ?? 3,
      consistency_rating: r.consistency_rating ?? 3,
      child_feedback_positive: !!r.child_feedback_positive,
      child_feels_heard: !!r.child_feels_heard,
      child_feels_safe: !!r.child_feels_safe,
      therapeutic_alliance_score: r.therapeutic_alliance_score ?? 50,
      continuity_maintained: !!r.continuity_maintained,
      therapist_changes: r.therapist_changes ?? 0,
      assessment_date: (r.assessment_date ?? today).toString(),
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeTherapeuticInterventionEffectiveness({
      today,
      total_children,
      therapy_sessions,
      intervention_outcomes,
      therapeutic_progress_records,
      treatment_plans,
      therapeutic_relationship_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
