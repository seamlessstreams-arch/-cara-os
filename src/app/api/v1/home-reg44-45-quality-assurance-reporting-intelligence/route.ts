// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME REG 44/45 QUALITY ASSURANCE REPORTING INTELLIGENCE API ROUTE
// GET /api/v1/home-reg44-45-quality-assurance-reporting-intelligence
// Cross-domain composite: reg44ReportRecords + reg45ReviewRecords +
// actionPlanRecords + qualityImprovementRecords + notificationRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeReg4445QualityAssuranceReporting,
  type Reg44ReportInput,
  type Reg45ReviewInput,
  type ActionPlanInput,
  type QualityImprovementInput,
  type NotificationInput,
} from "@/lib/engines/home-reg44-45-quality-assurance-reporting-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawReg44 = (store.reg44ReportRecords ?? []) as any[];
    const reg44_report_records: Reg44ReportInput[] = rawReg44.map((r: any) => ({
      id: r.id ?? "",
      visit_date: (r.visit_date ?? today).toString(),
      visitor_name: r.visitor_name ?? "",
      visitor_independent: !!r.visitor_independent,
      report_submitted: !!r.report_submitted,
      report_submission_date: r.report_submission_date ?? null,
      submitted_within_deadline: !!r.submitted_within_deadline,
      report_shared_with_ofsted: !!r.report_shared_with_ofsted,
      report_shared_with_placing_authorities: !!r.report_shared_with_placing_authorities,
      children_spoken_to: r.children_spoken_to ?? 0,
      children_available: r.children_available ?? 0,
      staff_interviewed: r.staff_interviewed ?? 0,
      areas_inspected: Array.isArray(r.areas_inspected) ? r.areas_inspected : [],
      shortfalls_identified: r.shortfalls_identified ?? 0,
      shortfalls_actioned: r.shortfalls_actioned ?? 0,
      positive_observations: r.positive_observations ?? 0,
      previous_actions_reviewed: !!r.previous_actions_reviewed,
      previous_actions_resolved: r.previous_actions_resolved ?? 0,
      previous_actions_total: r.previous_actions_total ?? 0,
      report_quality_rating: r.report_quality_rating ?? 3,
      child_views_captured: !!r.child_views_captured,
      night_visit_included: !!r.night_visit_included,
      unannounced: !!r.unannounced,
      medication_records_checked: !!r.medication_records_checked,
      sanctions_records_checked: !!r.sanctions_records_checked,
      complaints_reviewed: !!r.complaints_reviewed,
      safeguarding_reviewed: !!r.safeguarding_reviewed,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawReg45 = (store.reg45ReviewRecords ?? []) as any[];
    const reg45_review_records: Reg45ReviewInput[] = rawReg45.map((r: any) => ({
      id: r.id ?? "",
      review_period_start: (r.review_period_start ?? today).toString(),
      review_period_end: (r.review_period_end ?? today).toString(),
      review_date: (r.review_date ?? today).toString(),
      completed_on_time: !!r.completed_on_time,
      reviewer_name: r.reviewer_name ?? "",
      reviewer_role: r.reviewer_role ?? "",
      review_covers_all_standards: !!r.review_covers_all_standards,
      development_plan_updated: !!r.development_plan_updated,
      reg44_reports_considered: r.reg44_reports_considered ?? 0,
      reg44_reports_available: r.reg44_reports_available ?? 0,
      children_consulted: r.children_consulted ?? 0,
      children_total: r.children_total ?? 0,
      staff_consulted: r.staff_consulted ?? 0,
      placing_authorities_consulted: r.placing_authorities_consulted ?? 0,
      parents_carers_consulted: r.parents_carers_consulted ?? 0,
      professionals_consulted: r.professionals_consulted ?? 0,
      strengths_identified: r.strengths_identified ?? 0,
      areas_for_improvement_identified: r.areas_for_improvement_identified ?? 0,
      actions_set: r.actions_set ?? 0,
      actions_from_previous_review_completed: r.actions_from_previous_review_completed ?? 0,
      actions_from_previous_review_total: r.actions_from_previous_review_total ?? 0,
      review_quality_rating: r.review_quality_rating ?? 3,
      shared_with_ofsted: !!r.shared_with_ofsted,
      shared_with_placing_authorities: !!r.shared_with_placing_authorities,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawActions = (store.actionPlanRecords ?? []) as any[];
    const action_plan_records: ActionPlanInput[] = rawActions.map((a: any) => ({
      id: a.id ?? "",
      source: a.source ?? "other",
      source_id: a.source_id ?? "",
      action_description: a.action_description ?? "",
      assigned_to: a.assigned_to ?? "",
      date_raised: (a.date_raised ?? today).toString(),
      target_completion_date: (a.target_completion_date ?? today).toString(),
      actual_completion_date: a.actual_completion_date ?? null,
      status: a.status ?? "open",
      priority: a.priority ?? "medium",
      evidence_of_completion: !!a.evidence_of_completion,
      verified_by_manager: !!a.verified_by_manager,
      impact_on_children_assessed: !!a.impact_on_children_assessed,
      follow_up_required: !!a.follow_up_required,
      follow_up_completed: !!a.follow_up_completed,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawQuality = (store.qualityImprovementRecords ?? []) as any[];
    const quality_improvement_records: QualityImprovementInput[] = rawQuality.map((q: any) => ({
      id: q.id ?? "",
      cycle_name: q.cycle_name ?? "",
      cycle_start_date: (q.cycle_start_date ?? today).toString(),
      cycle_end_date: q.cycle_end_date ?? null,
      status: q.status ?? "planning",
      identified_issue: q.identified_issue ?? "",
      improvement_goal: q.improvement_goal ?? "",
      baseline_measure: q.baseline_measure ?? 0,
      current_measure: q.current_measure ?? 0,
      target_measure: q.target_measure ?? 100,
      actions_planned: q.actions_planned ?? 0,
      actions_completed: q.actions_completed ?? 0,
      staff_involved: q.staff_involved ?? 0,
      children_consulted: !!q.children_consulted,
      evidence_collected: !!q.evidence_collected,
      outcome_measured: !!q.outcome_measured,
      improvement_achieved: !!q.improvement_achieved,
      sustained_over_time: !!q.sustained_over_time,
      linked_to_reg44_finding: !!q.linked_to_reg44_finding,
      linked_to_reg45_finding: !!q.linked_to_reg45_finding,
      created_at: (q.created_at ?? today).toString(),
    }));

    const rawNotifications = (store.notificationRecords ?? []) as any[];
    const notification_records: NotificationInput[] = rawNotifications.map((n: any) => ({
      id: n.id ?? "",
      notification_type: n.notification_type ?? "other",
      event_date: (n.event_date ?? today).toString(),
      notification_date: (n.notification_date ?? today).toString(),
      notified_within_24_hours: !!n.notified_within_24_hours,
      notified_ofsted: !!n.notified_ofsted,
      notified_placing_authority: !!n.notified_placing_authority,
      notified_local_authority: !!n.notified_local_authority,
      follow_up_report_required: !!n.follow_up_report_required,
      follow_up_report_submitted: !!n.follow_up_report_submitted,
      follow_up_submitted_on_time: !!n.follow_up_submitted_on_time,
      investigation_completed: !!n.investigation_completed,
      actions_arising: n.actions_arising ?? 0,
      actions_completed: n.actions_completed ?? 0,
      child_id: n.child_id ?? "",
      child_informed_of_outcome: !!n.child_informed_of_outcome,
      documented_in_records: !!n.documented_in_records,
      created_at: (n.created_at ?? today).toString(),
    }));

    const result = computeReg4445QualityAssuranceReporting({
      today,
      total_children,
      reg44_report_records,
      reg45_review_records,
      action_plan_records,
      quality_improvement_records,
      notification_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
