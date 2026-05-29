export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHazardNearMissReporting,
  type HazardReportRecordInput,
  type NearMissRecordInput,
  type CorrectiveActionRecordInput,
  type SafetyWalkRecordInput,
  type IncidentLearningRecordInput,
} from "@/lib/engines/home-hazard-near-miss-reporting-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawHazards = (store.hazardReportRecords ?? []) as any[];
    const hazard_report_records: HazardReportRecordInput[] = rawHazards.map((r: any) => ({
      id: r.id ?? "",
      reported_by: r.reported_by ?? "",
      reporter_role: r.reporter_role ?? "staff",
      date_reported: (r.date_reported ?? today).toString(),
      location: r.location ?? "",
      hazard_type: r.hazard_type ?? "other",
      severity: r.severity ?? "low",
      description: r.description ?? "",
      immediate_action_taken: r.immediate_action_taken ?? false,
      immediate_action_description: r.immediate_action_description ?? null,
      photograph_attached: r.photograph_attached ?? false,
      risk_assessment_completed: r.risk_assessment_completed ?? false,
      risk_assessment_date: r.risk_assessment_date ?? null,
      status: r.status ?? "open",
      resolved_date: r.resolved_date ?? null,
      resolution_description: r.resolution_description ?? null,
      resolution_verified: r.resolution_verified ?? false,
      days_to_resolve: r.days_to_resolve ?? null,
      recurrence_flag: r.recurrence_flag ?? false,
      escalated_to_manager: r.escalated_to_manager ?? false,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawNearMisses = (store.nearMissRecords ?? []) as any[];
    const near_miss_records: NearMissRecordInput[] = rawNearMisses.map((r: any) => ({
      id: r.id ?? "",
      reported_by: r.reported_by ?? "",
      reporter_role: r.reporter_role ?? "staff",
      date_reported: (r.date_reported ?? today).toString(),
      date_of_incident: (r.date_of_incident ?? today).toString(),
      location: r.location ?? "",
      near_miss_type: r.near_miss_type ?? "other",
      potential_severity: r.potential_severity ?? "minor",
      description: r.description ?? "",
      contributing_factors: r.contributing_factors ?? [],
      immediate_action_taken: r.immediate_action_taken ?? false,
      reported_within_24h: r.reported_within_24h ?? false,
      investigated: r.investigated ?? false,
      investigation_date: r.investigation_date ?? null,
      investigation_findings: r.investigation_findings ?? null,
      preventive_actions_identified: r.preventive_actions_identified ?? false,
      preventive_actions_completed: r.preventive_actions_completed ?? false,
      preventive_action_completion_date: r.preventive_action_completion_date ?? null,
      shared_with_team: r.shared_with_team ?? false,
      child_involved: r.child_involved ?? false,
      child_id: r.child_id ?? null,
      status: r.status ?? "open",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawActions = (store.correctiveActionRecords ?? []) as any[];
    const corrective_action_records: CorrectiveActionRecordInput[] = rawActions.map((r: any) => ({
      id: r.id ?? "",
      source_type: r.source_type ?? "other",
      source_id: r.source_id ?? null,
      action_description: r.action_description ?? "",
      assigned_to: r.assigned_to ?? "",
      assigned_date: (r.assigned_date ?? today).toString(),
      due_date: (r.due_date ?? today).toString(),
      priority: r.priority ?? "medium",
      status: r.status ?? "pending",
      completed_date: r.completed_date ?? null,
      completed_on_time: r.completed_on_time ?? false,
      effectiveness_verified: r.effectiveness_verified ?? false,
      verification_date: r.verification_date ?? null,
      verification_notes: r.verification_notes ?? null,
      follow_up_required: r.follow_up_required ?? false,
      follow_up_completed: r.follow_up_completed ?? false,
      cost_incurred: r.cost_incurred ?? false,
      recurrence_prevented: r.recurrence_prevented ?? false,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawWalks = (store.safetyWalkRecords ?? []) as any[];
    const safety_walk_records: SafetyWalkRecordInput[] = rawWalks.map((r: any) => ({
      id: r.id ?? "",
      conducted_by: r.conducted_by ?? "",
      conductor_role: r.conductor_role ?? "manager",
      date_conducted: (r.date_conducted ?? today).toString(),
      areas_inspected: r.areas_inspected ?? [],
      total_areas_planned: r.total_areas_planned ?? 0,
      total_areas_completed: r.total_areas_completed ?? 0,
      hazards_identified: r.hazards_identified ?? 0,
      near_misses_identified: r.near_misses_identified ?? 0,
      positive_observations: r.positive_observations ?? 0,
      staff_engaged_during_walk: r.staff_engaged_during_walk ?? false,
      children_consulted: r.children_consulted ?? false,
      report_completed: r.report_completed ?? false,
      report_shared_with_team: r.report_shared_with_team ?? false,
      actions_raised: r.actions_raised ?? 0,
      actions_completed: r.actions_completed ?? 0,
      follow_up_walk_scheduled: r.follow_up_walk_scheduled ?? false,
      follow_up_walk_date: r.follow_up_walk_date ?? null,
      overall_compliance_score: r.overall_compliance_score ?? 3,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawLearnings = (store.incidentLearningRecords ?? []) as any[];
    const incident_learning_records: IncidentLearningRecordInput[] = rawLearnings.map((r: any) => ({
      id: r.id ?? "",
      incident_id: r.incident_id ?? null,
      incident_type: r.incident_type ?? "other",
      incident_date: (r.incident_date ?? today).toString(),
      review_date: (r.review_date ?? today).toString(),
      review_conducted_by: r.review_conducted_by ?? "",
      root_cause_identified: r.root_cause_identified ?? false,
      root_cause_description: r.root_cause_description ?? null,
      lessons_identified: r.lessons_identified ?? [],
      lessons_shared_with_team: r.lessons_shared_with_team ?? false,
      lessons_shared_date: r.lessons_shared_date ?? null,
      lessons_shared_method: r.lessons_shared_method ?? null,
      policy_update_required: r.policy_update_required ?? false,
      policy_update_completed: r.policy_update_completed ?? false,
      training_need_identified: r.training_need_identified ?? false,
      training_delivered: r.training_delivered ?? false,
      training_date: r.training_date ?? null,
      improvement_action_identified: r.improvement_action_identified ?? false,
      improvement_action_completed: r.improvement_action_completed ?? false,
      improvement_action_effective: r.improvement_action_effective ?? false,
      child_debrief_completed: r.child_debrief_completed ?? false,
      staff_debrief_completed: r.staff_debrief_completed ?? false,
      systemic_issue_identified: r.systemic_issue_identified ?? false,
      recurrence_check_date: r.recurrence_check_date ?? null,
      recurrence_occurred: r.recurrence_occurred ?? false,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeHazardNearMissReporting({
      today,
      total_children,
      hazard_report_records,
      near_miss_records,
      corrective_action_records,
      safety_walk_records,
      incident_learning_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
