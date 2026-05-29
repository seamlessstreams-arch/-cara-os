// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SENSORY DIET & REGULATION INTELLIGENCE API ROUTE
// GET /api/v1/home-sensory-diet-regulation-intelligence
// Cross-domain composite: sensoryDietPlanRecords + regulationStrategyRecords +
// sensoryBreakRecords + occupationalTherapyRecords + selfRegulationRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeSensoryDietRegulation,
  type SensoryDietPlanInput,
  type RegulationStrategyInput,
  type SensoryBreakInput,
  type OccupationalTherapyInput,
  type SelfRegulationInput,
} from "@/lib/engines/home-sensory-diet-regulation-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawDietPlans = (store.sensoryDietPlanRecords ?? []) as any[];
    const sensory_diet_plan_records: SensoryDietPlanInput[] = rawDietPlans.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      plan_created_date: (p.plan_created_date ?? today).toString(),
      plan_type: p.plan_type ?? "full",
      created_by: p.created_by ?? "",
      ot_involved: !!p.ot_involved,
      activities_prescribed: p.activities_prescribed ?? 0,
      activities_implemented: p.activities_implemented ?? 0,
      review_date: p.review_date ?? null,
      review_overdue: !!p.review_overdue,
      child_participated_in_planning: !!p.child_participated_in_planning,
      parent_carer_informed: !!p.parent_carer_informed,
      staff_trained_on_plan: !!p.staff_trained_on_plan,
      plan_accessible_to_staff: p.plan_accessible_to_staff !== false,
      last_updated: (p.last_updated ?? today).toString(),
      active: p.active !== false,
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawStrategies = (store.regulationStrategyRecords ?? []) as any[];
    const regulation_strategy_records: RegulationStrategyInput[] = rawStrategies.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      strategy_name: s.strategy_name ?? "",
      strategy_type: s.strategy_type ?? "calming",
      date_introduced: (s.date_introduced ?? today).toString(),
      effectiveness_rating: s.effectiveness_rating ?? 3,
      child_engagement_rating: s.child_engagement_rating ?? 3,
      used_independently_by_child: !!s.used_independently_by_child,
      staff_consistency_rating: s.staff_consistency_rating ?? 3,
      times_used_last_30_days: s.times_used_last_30_days ?? 0,
      positive_outcome_count: s.positive_outcome_count ?? 0,
      negative_outcome_count: s.negative_outcome_count ?? 0,
      neutral_outcome_count: s.neutral_outcome_count ?? 0,
      active: s.active !== false,
      review_date: s.review_date ?? null,
      review_overdue: !!s.review_overdue,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawBreaks = (store.sensoryBreakRecords ?? []) as any[];
    const sensory_break_records: SensoryBreakInput[] = rawBreaks.map((b: any) => ({
      id: b.id ?? "",
      child_id: b.child_id ?? "",
      break_date: (b.break_date ?? today).toString(),
      scheduled: !!b.scheduled,
      break_type: b.break_type ?? "combined",
      duration_minutes: b.duration_minutes ?? 0,
      timing_appropriate: b.timing_appropriate !== false,
      child_requested: !!b.child_requested,
      staff_initiated: !!b.staff_initiated,
      outcome_rating: b.outcome_rating ?? 3,
      returned_to_activity: b.returned_to_activity !== false,
      regulation_improved: !!b.regulation_improved,
      notes_recorded: !!b.notes_recorded,
      created_at: (b.created_at ?? today).toString(),
    }));

    const rawOT = (store.occupationalTherapyRecords ?? []) as any[];
    const occupational_therapy_records: OccupationalTherapyInput[] = rawOT.map((o: any) => ({
      id: o.id ?? "",
      child_id: o.child_id ?? "",
      therapist_name: o.therapist_name ?? "",
      session_date: (o.session_date ?? today).toString(),
      session_type: o.session_type ?? "consultation",
      goals_set: o.goals_set ?? 0,
      goals_progressed: o.goals_progressed ?? 0,
      goals_achieved: o.goals_achieved ?? 0,
      recommendations_made: o.recommendations_made ?? 0,
      recommendations_implemented: o.recommendations_implemented ?? 0,
      staff_training_provided: !!o.staff_training_provided,
      next_session_date: o.next_session_date ?? null,
      session_overdue: !!o.session_overdue,
      report_provided: !!o.report_provided,
      care_plan_updated: !!o.care_plan_updated,
      child_present: o.child_present !== false,
      active: o.active !== false,
      created_at: (o.created_at ?? today).toString(),
    }));

    const rawSelfReg = (store.selfRegulationRecords ?? []) as any[];
    const self_regulation_records: SelfRegulationInput[] = rawSelfReg.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      assessment_date: (r.assessment_date ?? today).toString(),
      assessor: r.assessor ?? "",
      baseline_score: r.baseline_score ?? 1,
      current_score: r.current_score ?? 1,
      target_score: r.target_score ?? 10,
      emotional_regulation_score: r.emotional_regulation_score ?? 5,
      sensory_regulation_score: r.sensory_regulation_score ?? 5,
      behavioural_regulation_score: r.behavioural_regulation_score ?? 5,
      can_identify_triggers: !!r.can_identify_triggers,
      can_request_help: !!r.can_request_help,
      can_use_strategies_independently: !!r.can_use_strategies_independently,
      strategies_known_count: r.strategies_known_count ?? 0,
      strategies_used_count: r.strategies_used_count ?? 0,
      progress_trend: r.progress_trend ?? "stable",
      review_date: r.review_date ?? null,
      review_overdue: !!r.review_overdue,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeSensoryDietRegulation({
      today,
      total_children,
      sensory_diet_plan_records,
      regulation_strategy_records,
      sensory_break_records,
      occupational_therapy_records,
      self_regulation_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
