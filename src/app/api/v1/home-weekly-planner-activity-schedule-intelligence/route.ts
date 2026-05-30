// ==============================================================================
// CORNERSTONE -- HOME WEEKLY PLANNER & ACTIVITY SCHEDULE INTELLIGENCE API ROUTE
// GET /api/v1/home-weekly-planner-activity-schedule-intelligence
// Cross-domain composite: scheduleCreationRecords + activityVarietyRecords +
// childInputRecords + communicationRecords + adherenceRecords
// CHR 2015 Reg 5, Reg 6, Reg 7. SCCIF experiences and progress.
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeWeeklyPlannerActivitySchedule,
  type ScheduleCreationRecordInput,
  type ActivityVarietyRecordInput,
  type ChildInputRecordInput,
  type CommunicationRecordInput,
  type AdherenceRecordInput,
} from "@/lib/engines/home-weekly-planner-activity-schedule-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawScheduleCreation = (store.scheduleCreationRecords ?? []) as any[];
    const schedule_creation_records: ScheduleCreationRecordInput[] = rawScheduleCreation.map((r: any) => ({
      id: r.id ?? "",
      week_commencing: (r.week_commencing ?? today).toString(),
      created_date: (r.created_date ?? today).toString(),
      created_by: r.created_by ?? "",
      days_before_week_start: typeof r.days_before_week_start === "number" ? r.days_before_week_start : 0,
      includes_all_children: !!r.includes_all_children,
      includes_morning: !!r.includes_morning,
      includes_afternoon: !!r.includes_afternoon,
      includes_evening: !!r.includes_evening,
      includes_weekend: !!r.includes_weekend,
      total_activities_planned: typeof r.total_activities_planned === "number" ? r.total_activities_planned : 0,
      approved_by_manager: !!r.approved_by_manager,
      revision_count: typeof r.revision_count === "number" ? r.revision_count : 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawActivityVariety = (store.activityVarietyRecords ?? []) as any[];
    const activity_variety_records: ActivityVarietyRecordInput[] = rawActivityVariety.map((r: any) => ({
      id: r.id ?? "",
      week_commencing: (r.week_commencing ?? today).toString(),
      category: r.category ?? "",
      activity_title: r.activity_title ?? "",
      is_indoor: !!r.is_indoor,
      is_outdoor: !!r.is_outdoor,
      is_group: !!r.is_group,
      is_individual: !!r.is_individual,
      is_educational: !!r.is_educational,
      is_recreational: !!r.is_recreational,
      is_therapeutic: !!r.is_therapeutic,
      is_life_skills: !!r.is_life_skills,
      is_cultural: !!r.is_cultural,
      is_physical: !!r.is_physical,
      is_creative: !!r.is_creative,
      is_community: !!r.is_community,
      age_appropriate: !!r.age_appropriate,
      new_activity: !!r.new_activity,
      child_satisfaction: typeof r.child_satisfaction === "number" ? r.child_satisfaction : 3,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawChildInput = (store.childInputRecords ?? []) as any[];
    const child_input_records: ChildInputRecordInput[] = rawChildInput.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      child_name: r.child_name ?? "",
      week_commencing: (r.week_commencing ?? today).toString(),
      consulted_before_planning: !!r.consulted_before_planning,
      preferences_recorded: !!r.preferences_recorded,
      suggestions_included: typeof r.suggestions_included === "number" ? r.suggestions_included : 0,
      suggestions_acted_on: typeof r.suggestions_acted_on === "number" ? r.suggestions_acted_on : 0,
      attended_planning_session: !!r.attended_planning_session,
      feedback_given_after: !!r.feedback_given_after,
      felt_listened_to: !!r.felt_listened_to,
      satisfaction_score: typeof r.satisfaction_score === "number" ? r.satisfaction_score : 3,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCommunication = (store.communicationRecords ?? []) as any[];
    const communication_records: CommunicationRecordInput[] = rawCommunication.map((r: any) => ({
      id: r.id ?? "",
      week_commencing: (r.week_commencing ?? today).toString(),
      schedule_displayed: !!r.schedule_displayed,
      shared_with_children: !!r.shared_with_children,
      shared_with_staff: !!r.shared_with_staff,
      shared_with_carers: !!r.shared_with_carers,
      shared_before_week_start: !!r.shared_before_week_start,
      format_accessible: !!r.format_accessible,
      changes_communicated: !!r.changes_communicated,
      child_friendly_format: !!r.child_friendly_format,
      digital_copy_available: !!r.digital_copy_available,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawAdherence = (store.adherenceRecords ?? []) as any[];
    const adherence_records: AdherenceRecordInput[] = rawAdherence.map((r: any) => ({
      id: r.id ?? "",
      week_commencing: (r.week_commencing ?? today).toString(),
      activity_title: r.activity_title ?? "",
      was_planned: !!r.was_planned,
      was_delivered: !!r.was_delivered,
      delivered_as_planned: !!r.delivered_as_planned,
      reason_not_delivered: r.reason_not_delivered ?? "",
      alternative_provided: !!r.alternative_provided,
      child_informed_of_change: !!r.child_informed_of_change,
      child_satisfaction: typeof r.child_satisfaction === "number" ? r.child_satisfaction : 3,
      staff_id: r.staff_id ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeWeeklyPlannerActivitySchedule({
      today,
      total_children,
      schedule_creation_records,
      activity_variety_records,
      child_input_records,
      communication_records,
      adherence_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
