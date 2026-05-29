// ==============================================================================
// CORNERSTONE -- HOME ANXIETY & MENTAL HEALTH SCREENING INTELLIGENCE API ROUTE
// GET /api/v1/home-anxiety-mental-health-screening-intelligence
// Cross-domain composite: screeningRecords + anxietyAssessmentRecords +
// camhsReferralRecords + wellbeingCheckinRecords + earlyInterventionRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeAnxietyMentalHealthScreening,
  type ScreeningRecordInput,
  type AnxietyAssessmentRecordInput,
  type CamhsReferralRecordInput,
  type WellbeingCheckinRecordInput,
  type EarlyInterventionRecordInput,
} from "@/lib/engines/home-anxiety-mental-health-screening-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawScreenings = (store.screeningRecords ?? []) as any[];
    const screening_records: ScreeningRecordInput[] = rawScreenings.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      screening_date: (s.screening_date ?? today).toString(),
      screening_type: s.screening_type ?? "initial",
      tool_used: s.tool_used ?? "",
      completed: !!s.completed,
      score: s.score ?? 0,
      threshold_exceeded: !!s.threshold_exceeded,
      follow_up_required: !!s.follow_up_required,
      follow_up_completed: !!s.follow_up_completed,
      screener_name: s.screener_name ?? "",
      child_consented: !!s.child_consented,
      review_date: s.review_date ?? null,
      review_overdue: !!s.review_overdue,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawAssessments = (store.anxietyAssessmentRecords ?? []) as any[];
    const anxiety_assessment_records: AnxietyAssessmentRecordInput[] = rawAssessments.map((a: any) => ({
      id: a.id ?? "",
      child_id: a.child_id ?? "",
      assessment_date: (a.assessment_date ?? today).toString(),
      assessment_type: a.assessment_type ?? "clinical",
      assessor_name: a.assessor_name ?? "",
      severity: a.severity ?? "minimal",
      score: a.score ?? 0,
      previous_score: a.previous_score ?? null,
      improvement_noted: !!a.improvement_noted,
      child_involved: !!a.child_involved,
      professional_input: !!a.professional_input,
      action_plan_created: !!a.action_plan_created,
      review_date: a.review_date ?? null,
      review_overdue: !!a.review_overdue,
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawReferrals = (store.camhsReferralRecords ?? []) as any[];
    const camhs_referral_records: CamhsReferralRecordInput[] = rawReferrals.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      referral_date: (r.referral_date ?? today).toString(),
      reason: r.reason ?? "",
      urgency: r.urgency ?? "routine",
      accepted: !!r.accepted,
      acceptance_date: r.acceptance_date ?? null,
      first_appointment_date: r.first_appointment_date ?? null,
      days_to_first_appointment: r.days_to_first_appointment ?? null,
      currently_active: !!r.currently_active,
      discharged: !!r.discharged,
      discharge_date: r.discharge_date ?? null,
      outcome_positive: !!r.outcome_positive,
      child_engaged: !!r.child_engaged,
      home_supported_attendance: !!r.home_supported_attendance,
      review_date: r.review_date ?? null,
      review_overdue: !!r.review_overdue,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCheckins = (store.wellbeingCheckinRecords ?? []) as any[];
    const wellbeing_checkin_records: WellbeingCheckinRecordInput[] = rawCheckins.map((w: any) => ({
      id: w.id ?? "",
      child_id: w.child_id ?? "",
      checkin_date: (w.checkin_date ?? today).toString(),
      checkin_type: w.checkin_type ?? "weekly",
      mood_rating: w.mood_rating ?? 5,
      concerns_raised: !!w.concerns_raised,
      concerns_actioned: !!w.concerns_actioned,
      child_engaged: !!w.child_engaged,
      staff_name: w.staff_name ?? "",
      follow_up_required: !!w.follow_up_required,
      follow_up_completed: !!w.follow_up_completed,
      notes_recorded: !!w.notes_recorded,
      created_at: (w.created_at ?? today).toString(),
    }));

    const rawInterventions = (store.earlyInterventionRecords ?? []) as any[];
    const early_intervention_records: EarlyInterventionRecordInput[] = rawInterventions.map((i: any) => ({
      id: i.id ?? "",
      child_id: i.child_id ?? "",
      intervention_type: i.intervention_type ?? "other",
      start_date: (i.start_date ?? today).toString(),
      end_date: i.end_date ?? null,
      active: i.active !== false,
      sessions_planned: i.sessions_planned ?? 0,
      sessions_completed: i.sessions_completed ?? 0,
      baseline_score: i.baseline_score ?? 1,
      current_score: i.current_score ?? 1,
      target_score: i.target_score ?? 10,
      child_reported_improvement: !!i.child_reported_improvement,
      staff_reported_improvement: !!i.staff_reported_improvement,
      professional_involved: !!i.professional_involved,
      review_date: i.review_date ?? null,
      review_overdue: !!i.review_overdue,
      created_at: (i.created_at ?? today).toString(),
    }));

    const result = computeAnxietyMentalHealthScreening({
      today,
      total_children,
      screening_records,
      anxiety_assessment_records,
      camhs_referral_records,
      wellbeing_checkin_records,
      early_intervention_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
