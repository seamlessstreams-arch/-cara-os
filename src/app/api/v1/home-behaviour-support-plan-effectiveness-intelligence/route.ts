// ==============================================================================
// CORNERSTONE -- HOME BEHAVIOUR SUPPORT PLAN EFFECTIVENESS INTELLIGENCE API ROUTE
// GET /api/v1/home-behaviour-support-plan-effectiveness-intelligence
// Cross-domain composite: behaviourSupportPlans + interventionRecords +
// deescalationRecords + positiveReinforcementRecords + restrictivePracticeRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeBehaviourSupportPlanEffectiveness,
  type BehaviourSupportPlanInput,
  type InterventionRecordInput,
  type DeescalationRecordInput,
  type PositiveReinforcementRecordInput,
  type RestrictivePracticeRecordInput,
} from "@/lib/engines/home-behaviour-support-plan-effectiveness-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawBSPs = (store.behaviourSupportPlans ?? []) as any[];
    const behaviour_support_plans: BehaviourSupportPlanInput[] = rawBSPs.map((b: any) => ({
      id: b.id ?? "",
      child_id: b.child_id ?? "",
      plan_name: b.plan_name ?? "",
      status: b.status ?? "active",
      created_date: (b.created_date ?? today).toString(),
      last_reviewed_date: b.last_reviewed_date ?? null,
      review_due_date: b.review_due_date ?? null,
      triggers_documented: !!b.triggers_documented,
      strategies_documented: !!b.strategies_documented,
      de_escalation_strategies_included: !!b.de_escalation_strategies_included,
      positive_reinforcement_included: !!b.positive_reinforcement_included,
      child_involved_in_creation: !!b.child_involved_in_creation,
      child_signed_off: !!b.child_signed_off,
      staff_trained_on_plan: !!b.staff_trained_on_plan,
      multi_agency_input: !!b.multi_agency_input,
      risk_assessment_linked: !!b.risk_assessment_linked,
      created_at: (b.created_at ?? today).toString(),
    }));

    const rawInterventions = (store.interventionRecords ?? []) as any[];
    const intervention_records: InterventionRecordInput[] = rawInterventions.map((i: any) => ({
      id: i.id ?? "",
      child_id: i.child_id ?? "",
      bsp_id: i.bsp_id ?? null,
      intervention_date: (i.intervention_date ?? today).toString(),
      intervention_type: i.intervention_type ?? "reactive",
      strategy_used: i.strategy_used ?? "",
      outcome: i.outcome ?? "unsuccessful",
      duration_minutes: i.duration_minutes ?? 0,
      staff_involved: i.staff_involved ?? 1,
      follow_up_completed: !!i.follow_up_completed,
      child_debriefed: !!i.child_debriefed,
      incident_prevented: !!i.incident_prevented,
      created_at: (i.created_at ?? today).toString(),
    }));

    const rawDeescalations = (store.deescalationRecords ?? []) as any[];
    const deescalation_records: DeescalationRecordInput[] = rawDeescalations.map((d: any) => ({
      id: d.id ?? "",
      child_id: d.child_id ?? "",
      date: (d.date ?? today).toString(),
      technique_used: d.technique_used ?? "",
      situation_severity: d.situation_severity ?? "medium",
      outcome: d.outcome ?? "partially_deescalated",
      time_to_calm_minutes: d.time_to_calm_minutes ?? 0,
      child_debriefed: !!d.child_debriefed,
      staff_debriefed: !!d.staff_debriefed,
      learning_recorded: !!d.learning_recorded,
      restrictive_practice_avoided: !!d.restrictive_practice_avoided,
      created_at: (d.created_at ?? today).toString(),
    }));

    const rawPositive = (store.positiveReinforcementRecords ?? []) as any[];
    const positive_reinforcement_records: PositiveReinforcementRecordInput[] = rawPositive.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      date: (p.date ?? today).toString(),
      reinforcement_type: p.reinforcement_type ?? "verbal_praise",
      behaviour_targeted: p.behaviour_targeted ?? "",
      child_response: p.child_response ?? "neutral",
      consistent_with_bsp: !!p.consistent_with_bsp,
      documented_in_daily_log: !!p.documented_in_daily_log,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawRestrictive = (store.restrictivePracticeRecords ?? []) as any[];
    const restrictive_practice_records: RestrictivePracticeRecordInput[] = rawRestrictive.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      practice_type: r.practice_type ?? "physical_restraint",
      duration_minutes: r.duration_minutes ?? 0,
      justified: !!r.justified,
      proportionate: !!r.proportionate,
      last_resort: !!r.last_resort,
      child_debriefed: !!r.child_debriefed,
      staff_debriefed: !!r.staff_debriefed,
      post_incident_review_completed: !!r.post_incident_review_completed,
      body_map_completed: !!r.body_map_completed,
      notified_authorities: !!r.notified_authorities,
      reduction_plan_in_place: !!r.reduction_plan_in_place,
      bsp_reviewed_after: !!r.bsp_reviewed_after,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeBehaviourSupportPlanEffectiveness({
      today,
      total_children,
      behaviour_support_plans,
      intervention_records,
      deescalation_records,
      positive_reinforcement_records,
      restrictive_practice_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
