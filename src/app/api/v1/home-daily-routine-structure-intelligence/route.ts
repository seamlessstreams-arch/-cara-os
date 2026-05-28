export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeDailyRoutineStructure,
  type RoutineScheduleRecordInput,
  type ActivityPlanRecordInput,
  type MealRoutineRecordInput,
  type BedtimeRoutineRecordInput,
  type ChildParticipationRecordInput,
} from "@/lib/engines/home-daily-routine-structure-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawRoutines = (store.routineScheduleRecords ?? []) as any[];
    const routine_schedule_records: RoutineScheduleRecordInput[] = rawRoutines.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      child_id: r.child_id ?? "",
      routine_type: r.routine_type ?? "full_day",
      scheduled_start_time: r.scheduled_start_time ?? "07:00",
      actual_start_time: r.actual_start_time ?? null,
      scheduled_end_time: r.scheduled_end_time ?? "21:00",
      actual_end_time: r.actual_end_time ?? null,
      routine_followed: r.routine_followed ?? false,
      deviation_reason: r.deviation_reason ?? null,
      flexibility_shown: r.flexibility_shown ?? false,
      child_informed_of_plan: r.child_informed_of_plan ?? false,
      staff_member: r.staff_member ?? "",
      consistency_rating: r.consistency_rating ?? 3,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawActivities = (store.activityPlanRecords ?? []) as any[];
    const activity_plan_records: ActivityPlanRecordInput[] = rawActivities.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      child_id: r.child_id ?? "",
      activity_type: r.activity_type ?? "recreational",
      activity_name: r.activity_name ?? "",
      planned: r.planned ?? false,
      completed: r.completed ?? false,
      child_enjoyed: r.child_enjoyed ?? false,
      child_chose_activity: r.child_chose_activity ?? false,
      duration_minutes: r.duration_minutes ?? 0,
      staff_member: r.staff_member ?? "",
      outcome_notes: r.outcome_notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawMeals = (store.mealRoutineRecords ?? []) as any[];
    const meal_routine_records: MealRoutineRecordInput[] = rawMeals.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      child_id: r.child_id ?? "",
      meal_type: r.meal_type ?? "lunch",
      scheduled_time: r.scheduled_time ?? "12:00",
      actual_time: r.actual_time ?? null,
      meal_on_time: r.meal_on_time ?? false,
      child_present: r.child_present ?? false,
      child_involved_in_preparation: r.child_involved_in_preparation ?? false,
      dietary_needs_met: r.dietary_needs_met ?? false,
      healthy_options_provided: r.healthy_options_provided ?? false,
      social_dining_environment: r.social_dining_environment ?? false,
      child_feedback_positive: r.child_feedback_positive ?? false,
      staff_member: r.staff_member ?? "",
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawBedtime = (store.bedtimeRoutineRecords ?? []) as any[];
    const bedtime_routine_records: BedtimeRoutineRecordInput[] = rawBedtime.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      child_id: r.child_id ?? "",
      planned_bedtime: r.planned_bedtime ?? "21:00",
      actual_bedtime: r.actual_bedtime ?? null,
      bedtime_routine_followed: r.bedtime_routine_followed ?? false,
      wind_down_activity_provided: r.wind_down_activity_provided ?? false,
      child_settled_within_30_min: r.child_settled_within_30_min ?? false,
      age_appropriate_bedtime: r.age_appropriate_bedtime ?? false,
      consistent_with_previous_nights: r.consistent_with_previous_nights ?? false,
      deviation_reason: r.deviation_reason ?? null,
      child_feedback: r.child_feedback ?? null,
      staff_member: r.staff_member ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawParticipation = (store.childParticipationRecords ?? []) as any[];
    const child_participation_records: ChildParticipationRecordInput[] = rawParticipation.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      child_id: r.child_id ?? "",
      participation_type: r.participation_type ?? "daily_planning",
      child_consulted: r.child_consulted ?? false,
      child_views_recorded: r.child_views_recorded ?? false,
      views_actioned: r.views_actioned ?? false,
      child_satisfied_with_outcome: r.child_satisfied_with_outcome ?? false,
      staff_member: r.staff_member ?? "",
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeDailyRoutineStructure({
      today,
      total_children,
      routine_schedule_records,
      activity_plan_records,
      meal_routine_records,
      bedtime_routine_records,
      child_participation_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
