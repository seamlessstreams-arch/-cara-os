export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStaffWellbeingRetention,
  type StaffSicknessRecordInput,
  type StaffWellbeingSurveyRecordInput,
  type StaffRetentionRecordInput,
  type WellbeingSupportRecordInput,
  type ExitInterviewRecordInput,
} from "@/lib/engines/home-staff-wellbeing-retention-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    // ── Total staff (NOT youngPeople) ──────────────────────────────────
    const total_staff = ((store.staff as any[]) || []).length;

    // ── Sickness records ───────────────────────────────────────────────
    const rawSickness = ((store as any).staffSicknessRecords || []) as any[];
    const staff_sickness_records: StaffSicknessRecordInput[] = rawSickness.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      date_from: (r.date_from ?? today).toString().slice(0, 10),
      date_to: (r.date_to ?? today).toString().slice(0, 10),
      reason: (r.reason ?? "other").toString(),
      days_lost: typeof r.days_lost === "number" ? r.days_lost : 0,
      return_to_work_interview_completed: !!(r.return_to_work_interview_completed),
      occupational_health_referral: !!(r.occupational_health_referral),
      phased_return: !!(r.phased_return),
      fit_note_received: !!(r.fit_note_received),
      manager_notified_promptly: !!(r.manager_notified_promptly),
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Wellbeing survey records ───────────────────────────────────────
    const rawSurveys = ((store as any).staffWellbeingSurveyRecords || []) as any[];
    const staff_wellbeing_survey_records: StaffWellbeingSurveyRecordInput[] = rawSurveys.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      overall_wellbeing_score: typeof r.overall_wellbeing_score === "number" ? r.overall_wellbeing_score : 5,
      workload_score: typeof r.workload_score === "number" ? r.workload_score : 5,
      team_support_score: typeof r.team_support_score === "number" ? r.team_support_score : 5,
      management_support_score: typeof r.management_support_score === "number" ? r.management_support_score : 5,
      work_life_balance_score: typeof r.work_life_balance_score === "number" ? r.work_life_balance_score : 5,
      job_satisfaction_score: typeof r.job_satisfaction_score === "number" ? r.job_satisfaction_score : 5,
      morale_score: typeof r.morale_score === "number" ? r.morale_score : 5,
      feels_valued: !!(r.feels_valued),
      would_recommend_employer: !!(r.would_recommend_employer),
      stress_factors: Array.isArray(r.stress_factors) ? r.stress_factors : [],
      positive_factors: Array.isArray(r.positive_factors) ? r.positive_factors : [],
      improvement_suggestions: r.improvement_suggestions ?? null,
      anonymous: !!(r.anonymous),
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Retention records ──────────────────────────────────────────────
    const rawRetention = ((store as any).staffRetentionRecords || []) as any[];
    const staff_retention_records: StaffRetentionRecordInput[] = rawRetention.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      event_type: (r.event_type ?? "joined").toString() as any,
      reason_for_leaving: r.reason_for_leaving ?? null,
      notice_period_served: !!(r.notice_period_served),
      length_of_service_months: typeof r.length_of_service_months === "number" ? r.length_of_service_months : 0,
      role: (r.role ?? "").toString(),
      replacement_recruited: !!(r.replacement_recruited),
      handover_completed: !!(r.handover_completed),
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Wellbeing support records ──────────────────────────────────────
    const rawSupport = ((store as any).wellbeingSupportRecords || []) as any[];
    const wellbeing_support_records: WellbeingSupportRecordInput[] = rawSupport.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      support_type: (r.support_type ?? "other").toString(),
      support_offered: !!(r.support_offered),
      support_accepted: !!(r.support_accepted),
      support_completed: !!(r.support_completed),
      outcome_rating: typeof r.outcome_rating === "number" ? r.outcome_rating : 3,
      follow_up_needed: !!(r.follow_up_needed),
      follow_up_completed: !!(r.follow_up_completed),
      referred_by: (r.referred_by ?? "").toString(),
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    // ── Exit interview records ─────────────────────────────────────────
    const rawExit = ((store as any).exitInterviewRecords || []) as any[];
    const exit_interview_records: ExitInterviewRecordInput[] = rawExit.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      conducted: !!(r.conducted),
      conducted_by: (r.conducted_by ?? "").toString(),
      overall_experience_rating: typeof r.overall_experience_rating === "number" ? r.overall_experience_rating : 5,
      management_rating: typeof r.management_rating === "number" ? r.management_rating : 5,
      team_rating: typeof r.team_rating === "number" ? r.team_rating : 5,
      development_rating: typeof r.development_rating === "number" ? r.development_rating : 5,
      workload_rating: typeof r.workload_rating === "number" ? r.workload_rating : 5,
      reasons_for_leaving: Array.isArray(r.reasons_for_leaving) ? r.reasons_for_leaving : [],
      what_could_improve: Array.isArray(r.what_could_improve) ? r.what_could_improve : [],
      would_return: !!(r.would_return),
      would_recommend: !!(r.would_recommend),
      themes_identified: Array.isArray(r.themes_identified) ? r.themes_identified : [],
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeStaffWellbeingRetention({
      today,
      total_staff,
      staff_sickness_records,
      staff_wellbeing_survey_records,
      staff_retention_records,
      wellbeing_support_records,
      exit_interview_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
