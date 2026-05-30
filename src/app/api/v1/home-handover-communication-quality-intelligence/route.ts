export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHandoverCommunicationQuality,
  type HandoverRecordInput,
  type CommunicationLogRecordInput,
  type CriticalInfoRecordInput,
  type TimelinessRecordInput,
  type ActionCompletionRecordInput,
} from "@/lib/engines/home-handover-communication-quality-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const total_staff = (store.staff as any[] || []).length;

    const rawHandovers = (store.handoverRecords as any[] ?? []);
    const handover_records: HandoverRecordInput[] = rawHandovers.map((r: any) => ({
      id: r.id ?? "",
      shift_date: (r.shift_date ?? r.date ?? today).toString(),
      shift_type: r.shift_type ?? "day_to_night",
      outgoing_staff_id: r.outgoing_staff_id ?? r.outgoing_staff ?? "",
      incoming_staff_id: r.incoming_staff_id ?? r.incoming_staff ?? "",
      handover_completed: !!(r.handover_completed ?? r.completed),
      handover_method: r.handover_method ?? r.method ?? "face_to_face",
      all_children_covered: !!(r.all_children_covered ?? r.children_covered),
      behaviour_updates_included: !!(r.behaviour_updates_included ?? r.behaviour_updates),
      medication_updates_included: !!(r.medication_updates_included ?? r.medication_updates),
      safeguarding_updates_included: !!(r.safeguarding_updates_included ?? r.safeguarding_updates),
      incident_updates_included: !!(r.incident_updates_included ?? r.incident_updates),
      emotional_wellbeing_covered: !!(r.emotional_wellbeing_covered ?? r.emotional_wellbeing),
      appointments_handover_included: !!(r.appointments_handover_included ?? r.appointments_covered),
      quality_rating: r.quality_rating ?? r.rating ?? 3,
      manager_reviewed: !!(r.manager_reviewed),
      issues_identified: r.issues_identified ?? [],
      issues_resolved: !!(r.issues_resolved),
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCommLogs = (store.communicationLogRecords as any[] ?? []);
    const communication_log_records: CommunicationLogRecordInput[] = rawCommLogs.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      staff_id: r.staff_id ?? "",
      log_type: r.log_type ?? r.type ?? "daily_log",
      completeness_score: r.completeness_score ?? r.completeness ?? 3,
      timely_entry: !!(r.timely_entry ?? r.timely),
      relevant_detail_included: !!(r.relevant_detail_included ?? r.relevant_detail),
      professional_language_used: !!(r.professional_language_used ?? r.professional_language),
      actions_documented: !!(r.actions_documented),
      follow_up_identified: !!(r.follow_up_identified ?? r.follow_up_needed),
      follow_up_completed: !!(r.follow_up_completed),
      reviewed_by_manager: !!(r.reviewed_by_manager ?? r.manager_reviewed),
      child_ids_referenced: r.child_ids_referenced ?? r.children ?? [],
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCriticalInfo = (store.criticalInfoRecords as any[] ?? []);
    const critical_info_records: CriticalInfoRecordInput[] = rawCriticalInfo.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      info_type: r.info_type ?? r.type ?? "safeguarding_alert",
      originating_staff_id: r.originating_staff_id ?? r.staff_id ?? "",
      priority: r.priority ?? "standard",
      all_relevant_staff_notified: !!(r.all_relevant_staff_notified ?? r.all_notified),
      notification_method: r.notification_method ?? r.method ?? "face_to_face",
      acknowledged_by_count: r.acknowledged_by_count ?? r.acknowledged_count ?? 0,
      total_staff_to_notify: r.total_staff_to_notify ?? r.staff_to_notify ?? 0,
      documented_in_handover: !!(r.documented_in_handover),
      follow_up_actions_set: !!(r.follow_up_actions_set ?? r.follow_up_set),
      follow_up_completed: !!(r.follow_up_completed),
      escalated_to_manager: !!(r.escalated_to_manager ?? r.escalated),
      time_to_notify_minutes: r.time_to_notify_minutes ?? r.notification_time ?? null,
      information_accurate: !!(r.information_accurate ?? r.accurate ?? true),
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawTimeliness = (store.handoverTimelinessRecords as any[] ?? []);
    const timeliness_records: TimelinessRecordInput[] = rawTimeliness.map((r: any) => ({
      id: r.id ?? "",
      shift_date: (r.shift_date ?? r.date ?? today).toString(),
      shift_type: r.shift_type ?? "day_to_night",
      scheduled_handover_time: r.scheduled_handover_time ?? r.scheduled_time ?? "",
      actual_handover_time: r.actual_handover_time ?? r.actual_time ?? null,
      handover_started_on_time: !!(r.handover_started_on_time ?? r.on_time),
      handover_duration_minutes: r.handover_duration_minutes ?? r.duration ?? 15,
      adequate_duration: !!(r.adequate_duration),
      overlap_period_available: !!(r.overlap_period_available ?? r.overlap_available),
      rushing_noted: !!(r.rushing_noted ?? r.rushed),
      both_staff_present: !!(r.both_staff_present ?? r.both_present),
      interruptions_count: r.interruptions_count ?? r.interruptions ?? 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawActions = (store.handoverActionCompletionRecords as any[] ?? []);
    const action_completion_records: ActionCompletionRecordInput[] = rawActions.map((r: any) => ({
      id: r.id ?? "",
      handover_date: (r.handover_date ?? r.date ?? today).toString(),
      action_description: r.action_description ?? r.description ?? "",
      assigned_to_staff_id: r.assigned_to_staff_id ?? r.assigned_to ?? "",
      priority: r.priority ?? "standard",
      due_by: r.due_by ?? r.deadline ?? null,
      completed: !!(r.completed),
      completed_on_time: !!(r.completed_on_time ?? r.on_time),
      completion_date: r.completion_date ?? null,
      verified_by_manager: !!(r.verified_by_manager ?? r.manager_verified),
      outcome_recorded: !!(r.outcome_recorded),
      carried_forward_count: r.carried_forward_count ?? r.carry_forward ?? 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeHandoverCommunicationQuality({
      today,
      total_staff,
      handover_records,
      communication_log_records,
      critical_info_records,
      timeliness_records,
      action_completion_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
