export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeSleepQualityRestManagement,
  type SleepRoutineRecordInput,
  type SleepEnvironmentRecordInput,
  type SleepDisturbanceRecordInput,
  type BedtimeSupportRecordInput,
  type SleepImprovementRecordInput,
} from "@/lib/engines/home-sleep-quality-rest-management-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawRoutines = (store.sleepRoutineRecords ?? []) as any[];
    const sleep_routine_records: SleepRoutineRecordInput[] = rawRoutines.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      bedtime_target: r.bedtime_target ?? "21:00",
      actual_bedtime: r.actual_bedtime ?? "",
      wake_time_target: r.wake_time_target ?? "07:00",
      actual_wake_time: r.actual_wake_time ?? "",
      routine_followed: r.routine_followed ?? false,
      wind_down_completed: r.wind_down_completed ?? false,
      screen_free_period: r.screen_free_period ?? false,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawEnvironments = (store.sleepEnvironmentRecords ?? []) as any[];
    const sleep_environment_records: SleepEnvironmentRecordInput[] = rawEnvironments.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      assessment_date: (r.assessment_date ?? today).toString(),
      room_temperature_ok: r.room_temperature_ok ?? false,
      noise_level_ok: r.noise_level_ok ?? false,
      lighting_ok: r.lighting_ok ?? false,
      bedding_appropriate: r.bedding_appropriate ?? false,
      comfort_items_available: r.comfort_items_available ?? false,
      overall_environment_score: r.overall_environment_score ?? 3,
      issues_identified: r.issues_identified ?? "",
      actions_taken: r.actions_taken ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawDisturbances = (store.sleepDisturbanceRecords ?? []) as any[];
    const sleep_disturbance_records: SleepDisturbanceRecordInput[] = rawDisturbances.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      time: r.time ?? "",
      disturbance_type: r.disturbance_type ?? "nightmare",
      duration_minutes: r.duration_minutes ?? 0,
      intervention_provided: r.intervention_provided ?? "",
      resolution_achieved: r.resolution_achieved ?? false,
      staff_id: r.staff_id ?? "",
      follow_up_needed: r.follow_up_needed ?? false,
      follow_up_completed: r.follow_up_completed ?? false,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawBedtime = (store.bedtimeSupportRecords ?? []) as any[];
    const bedtime_support_records: BedtimeSupportRecordInput[] = rawBedtime.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      support_type: r.support_type ?? "routine",
      staff_id: r.staff_id ?? "",
      child_settled: r.child_settled ?? false,
      anxiety_level: r.anxiety_level ?? 1,
      techniques_used: r.techniques_used ?? "",
      effectiveness_rating: r.effectiveness_rating ?? 3,
      child_feedback: r.child_feedback ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawImprovement = (store.sleepImprovementRecords ?? []) as any[];
    const sleep_improvement_records: SleepImprovementRecordInput[] = rawImprovement.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      plan_date: (r.plan_date ?? today).toString(),
      goals: r.goals ?? "",
      strategies: r.strategies ?? "",
      review_date: r.review_date ?? "",
      progress_rating: r.progress_rating ?? 3,
      active: r.active ?? true,
      professional_input: r.professional_input ?? false,
      child_involved: r.child_involved ?? false,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeSleepQualityRestManagement({
      today,
      total_children,
      sleep_routine_records,
      sleep_environment_records,
      sleep_disturbance_records,
      bedtime_support_records,
      sleep_improvement_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
