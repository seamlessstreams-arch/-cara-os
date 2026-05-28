// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PHYSICAL ACTIVITY & RECREATION INTELLIGENCE API ROUTE
// GET /api/v1/home-physical-activity-recreation-intelligence
// Cross-domain composite: exerciseProgrammeRecords + recreationalActivityRecords +
// outdoorEngagementRecords + fitnessAssessmentRecords + activityAccessibilityRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePhysicalActivityRecreation,
  type ExerciseProgrammeInput,
  type RecreationalActivityInput,
  type OutdoorEngagementInput,
  type FitnessAssessmentInput,
  type ActivityAccessibilityInput,
} from "@/lib/engines/home-physical-activity-recreation-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawExerciseProgrammes = (store.exerciseProgrammeRecords ?? []) as any[];
    const exercise_programme_records: ExerciseProgrammeInput[] = rawExerciseProgrammes.map((e: any) => ({
      id: e.id ?? "",
      child_id: e.child_id ?? "",
      programme_name: e.programme_name ?? "",
      programme_type: e.programme_type ?? "individual",
      start_date: (e.start_date ?? today).toString(),
      end_date: e.end_date ?? null,
      active: e.active !== false,
      sessions_planned: e.sessions_planned ?? 0,
      sessions_attended: e.sessions_attended ?? 0,
      engagement_level: e.engagement_level ?? "moderate",
      progress_notes: e.progress_notes ?? null,
      child_enjoys: !!e.child_enjoys,
      staff_led: !!e.staff_led,
      external_provider: !!e.external_provider,
      goals_set: e.goals_set ?? 0,
      goals_achieved: e.goals_achieved ?? 0,
      reviewed: !!e.reviewed,
      review_date: e.review_date ?? null,
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawRecreationalActivities = (store.recreationalActivityRecords ?? []) as any[];
    const recreational_activity_records: RecreationalActivityInput[] = rawRecreationalActivities.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      activity_name: r.activity_name ?? "",
      activity_category: r.activity_category ?? "sport",
      date: (r.date ?? today).toString(),
      duration_minutes: r.duration_minutes ?? 0,
      child_choice: !!r.child_choice,
      child_enjoyed: !!r.child_enjoyed,
      participation_level: r.participation_level ?? "full",
      inclusive: r.inclusive !== false,
      skill_development: !!r.skill_development,
      peer_interaction: !!r.peer_interaction,
      new_experience: !!r.new_experience,
      staff_facilitated: !!r.staff_facilitated,
      community_based: !!r.community_based,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawOutdoorEngagements = (store.outdoorEngagementRecords ?? []) as any[];
    const outdoor_engagement_records: OutdoorEngagementInput[] = rawOutdoorEngagements.map((o: any) => ({
      id: o.id ?? "",
      child_id: o.child_id ?? "",
      date: (o.date ?? today).toString(),
      activity_type: o.activity_type ?? "other",
      duration_minutes: o.duration_minutes ?? 0,
      weather_appropriate: o.weather_appropriate !== false,
      child_initiated: !!o.child_initiated,
      supervised: o.supervised !== false,
      location: o.location ?? "",
      enjoyment_rating: o.enjoyment_rating ?? 3,
      physical_benefit: !!o.physical_benefit,
      wellbeing_benefit: !!o.wellbeing_benefit,
      risk_assessed: !!o.risk_assessed,
      created_at: (o.created_at ?? today).toString(),
    }));

    const rawFitnessAssessments = (store.fitnessAssessmentRecords ?? []) as any[];
    const fitness_assessment_records: FitnessAssessmentInput[] = rawFitnessAssessments.map((f: any) => ({
      id: f.id ?? "",
      child_id: f.child_id ?? "",
      assessment_date: (f.assessment_date ?? today).toString(),
      assessor: f.assessor ?? "",
      assessment_type: f.assessment_type ?? "periodic",
      fitness_level: f.fitness_level ?? "moderate",
      bmi_recorded: !!f.bmi_recorded,
      activity_recommendations_given: !!f.activity_recommendations_given,
      follow_up_planned: !!f.follow_up_planned,
      follow_up_completed: !!f.follow_up_completed,
      child_involved_in_goal_setting: !!f.child_involved_in_goal_setting,
      health_professional_involved: !!f.health_professional_involved,
      review_date: f.review_date ?? null,
      created_at: (f.created_at ?? today).toString(),
    }));

    const rawAccessibility = (store.activityAccessibilityRecords ?? []) as any[];
    const activity_accessibility_records: ActivityAccessibilityInput[] = rawAccessibility.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      date: (a.date ?? today).toString(),
      activity_type: a.activity_type ?? "",
      accessibility_need: a.accessibility_need ?? "none",
      adaptation_required: !!a.adaptation_required,
      adaptation_provided: !!a.adaptation_provided,
      barrier_identified: a.barrier_identified ?? null,
      barrier_resolved: !!a.barrier_resolved,
      child_able_to_participate: !!a.child_able_to_participate,
      equipment_available: !!a.equipment_available,
      transport_arranged: !!a.transport_arranged,
      cost_covered: !!a.cost_covered,
      equal_opportunity: !!a.equal_opportunity,
      created_at: (a.created_at ?? today).toString(),
    }));

    const result = computePhysicalActivityRecreation({
      today,
      total_children,
      exercise_programme_records,
      recreational_activity_records,
      outdoor_engagement_records,
      fitness_assessment_records,
      activity_accessibility_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
