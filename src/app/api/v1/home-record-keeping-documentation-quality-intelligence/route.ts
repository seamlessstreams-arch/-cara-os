// ==============================================================================
// CORNERSTONE -- HOME RECORD KEEPING & DOCUMENTATION QUALITY INTELLIGENCE API ROUTE
// GET /api/v1/home-record-keeping-documentation-quality-intelligence
// Cross-domain composite: dailyLogRecords + carePlanRecords +
// riskAssessmentRecords + incidentReportRecords + regulatoryDocumentRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeRecordKeepingDocumentationQuality,
  type DailyLogInput,
  type CarePlanInput,
  type RiskAssessmentInput,
  type IncidentReportInput,
  type RegulatoryDocumentInput,
} from "@/lib/engines/home-record-keeping-documentation-quality-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawDailyLogs = ((store as any).dailyLogRecords ?? []) as any[];
    const daily_log_records: DailyLogInput[] = rawDailyLogs.map((l: any) => ({
      id: l.id ?? "",
      child_id: l.child_id ?? "",
      log_date: (l.log_date ?? today).toString(),
      author_name: l.author_name ?? "",
      entry_type: l.entry_type ?? "routine",
      word_count: l.word_count ?? 0,
      completed_on_time: !!l.completed_on_time,
      covers_wellbeing: !!l.covers_wellbeing,
      covers_activities: !!l.covers_activities,
      covers_mood: !!l.covers_mood,
      covers_interactions: !!l.covers_interactions,
      covers_meals: !!l.covers_meals,
      manager_reviewed: !!l.manager_reviewed,
      review_date: l.review_date ?? null,
      amendments_made: !!l.amendments_made,
      factual_and_objective: !!l.factual_and_objective,
      signed_by_author: !!l.signed_by_author,
      created_at: (l.created_at ?? today).toString(),
    }));

    const rawCarePlans = ((store as any).carePlanRecords ?? []) as any[];
    const care_plan_records: CarePlanInput[] = rawCarePlans.map((cp: any) => ({
      id: cp.id ?? "",
      child_id: cp.child_id ?? "",
      plan_type: cp.plan_type ?? "placement",
      created_date: (cp.created_date ?? today).toString(),
      last_reviewed_date: cp.last_reviewed_date ?? null,
      review_due_date: cp.review_due_date ?? null,
      review_overdue: !!cp.review_overdue,
      is_current: cp.is_current !== false,
      objectives_count: cp.objectives_count ?? 0,
      objectives_met: cp.objectives_met ?? 0,
      child_participated: !!cp.child_participated,
      child_signed: !!cp.child_signed,
      parent_carer_consulted: !!cp.parent_carer_consulted,
      social_worker_consulted: !!cp.social_worker_consulted,
      professional_input: !!cp.professional_input,
      plan_quality_rating: cp.plan_quality_rating ?? 3,
      created_at: (cp.created_at ?? today).toString(),
    }));

    const rawRiskAssessments = ((store as any).riskAssessmentRecords ?? []) as any[];
    const risk_assessment_records: RiskAssessmentInput[] = rawRiskAssessments.map((ra: any) => ({
      id: ra.id ?? "",
      child_id: ra.child_id ?? "",
      assessment_type: ra.assessment_type ?? "individual",
      assessment_date: (ra.assessment_date ?? today).toString(),
      assessed_by: ra.assessed_by ?? "",
      risk_level: ra.risk_level ?? "medium",
      review_date: ra.review_date ?? null,
      review_overdue: !!ra.review_overdue,
      is_current: ra.is_current !== false,
      mitigations_identified: ra.mitigations_identified ?? 0,
      mitigations_implemented: ra.mitigations_implemented ?? 0,
      child_involved: !!ra.child_involved,
      multi_agency_input: !!ra.multi_agency_input,
      dynamic_risk_factors_recorded: !!ra.dynamic_risk_factors_recorded,
      linked_to_care_plan: !!ra.linked_to_care_plan,
      created_at: (ra.created_at ?? today).toString(),
    }));

    const rawIncidentReports = ((store as any).incidentReportRecords ?? []) as any[];
    const incident_report_records: IncidentReportInput[] = rawIncidentReports.map((ir: any) => ({
      id: ir.id ?? "",
      child_id: ir.child_id ?? "",
      incident_date: (ir.incident_date ?? today).toString(),
      incident_type: ir.incident_type ?? "behaviour",
      report_completed_date: ir.report_completed_date ?? null,
      completed_within_24h: !!ir.completed_within_24h,
      severity: ir.severity ?? "medium",
      witness_statements_obtained: !!ir.witness_statements_obtained,
      body_map_completed: !!ir.body_map_completed,
      manager_notified: !!ir.manager_notified,
      manager_signed_off: !!ir.manager_signed_off,
      ofsted_notified: !!ir.ofsted_notified,
      ofsted_notification_required: !!ir.ofsted_notification_required,
      local_authority_notified: !!ir.local_authority_notified,
      local_authority_notification_required: !!ir.local_authority_notification_required,
      follow_up_actions_identified: ir.follow_up_actions_identified ?? 0,
      follow_up_actions_completed: ir.follow_up_actions_completed ?? 0,
      lessons_learned_recorded: !!ir.lessons_learned_recorded,
      created_at: (ir.created_at ?? today).toString(),
    }));

    const rawRegDocs = ((store as any).regulatoryDocumentRecords ?? []) as any[];
    const regulatory_document_records: RegulatoryDocumentInput[] = rawRegDocs.map((rd: any) => ({
      id: rd.id ?? "",
      document_type: rd.document_type ?? "reg_44",
      title: rd.title ?? "",
      due_date: rd.due_date ?? null,
      completed_date: rd.completed_date ?? null,
      is_current: rd.is_current !== false,
      is_overdue: !!rd.is_overdue,
      quality_rating: rd.quality_rating ?? 3,
      author_name: rd.author_name ?? "",
      reviewed_by_manager: !!rd.reviewed_by_manager,
      meets_statutory_requirements: !!rd.meets_statutory_requirements,
      last_updated_date: rd.last_updated_date ?? null,
      update_frequency_days: rd.update_frequency_days ?? 0,
      days_since_last_update: rd.days_since_last_update ?? 0,
      created_at: (rd.created_at ?? today).toString(),
    }));

    const result = computeRecordKeepingDocumentationQuality({
      today,
      total_children,
      daily_log_records,
      care_plan_records,
      risk_assessment_records,
      incident_report_records,
      regulatory_document_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
