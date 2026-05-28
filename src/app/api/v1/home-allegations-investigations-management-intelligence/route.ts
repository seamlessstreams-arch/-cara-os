// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ALLEGATIONS & INVESTIGATIONS MANAGEMENT API ROUTE
// GET /api/v1/home-allegations-investigations-management-intelligence
// Cross-domain composite: allegationRecords + ladoReferralRecords +
// investigationRecords + outcomeRecords + safeguardingResponseRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeAllegationsInvestigationsManagement,
  type AllegationRecordInput,
  type LadoReferralRecordInput,
  type InvestigationRecordInput,
  type OutcomeRecordInput,
  type SafeguardingResponseRecordInput,
} from "@/lib/engines/home-allegations-investigations-management-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawAllegations = (store.allegationRecords ?? []) as any[];
    const allegation_records: AllegationRecordInput[] = rawAllegations.map((a: any) => ({
      id: a.id ?? "",
      date_received: (a.date_received ?? today).toString(),
      date_recorded: (a.date_recorded ?? today).toString(),
      allegation_type: a.allegation_type ?? "other",
      subject_role: a.subject_role ?? "permanent_staff",
      child_id: a.child_id ?? null,
      recorded_within_24h: !!a.recorded_within_24h,
      initial_risk_assessment_completed: !!a.initial_risk_assessment_completed,
      child_safeguarded_immediately: !!a.child_safeguarded_immediately,
      staff_member_suspended: !!a.staff_member_suspended,
      witness_statements_taken: !!a.witness_statements_taken,
      evidence_preserved: !!a.evidence_preserved,
      chronology_maintained: !!a.chronology_maintained,
      dbs_check_current: !!a.dbs_check_current,
      reporter_type: a.reporter_type ?? "other",
      severity: a.severity ?? "medium",
      status: a.status ?? "open",
      created_at: (a.created_at ?? today).toString(),
    }));

    const rawLadoReferrals = (store.ladoReferralRecords ?? []) as any[];
    const lado_referral_records: LadoReferralRecordInput[] = rawLadoReferrals.map((r: any) => ({
      id: r.id ?? "",
      allegation_id: r.allegation_id ?? "",
      date_allegation_received: (r.date_allegation_received ?? today).toString(),
      date_lado_contacted: (r.date_lado_contacted ?? today).toString(),
      referred_within_1_working_day: !!r.referred_within_1_working_day,
      lado_acknowledged: !!r.lado_acknowledged,
      strategy_meeting_held: !!r.strategy_meeting_held,
      strategy_meeting_date: r.strategy_meeting_date ?? null,
      strategy_meeting_within_5_days: !!r.strategy_meeting_within_5_days,
      ofsted_notified: !!r.ofsted_notified,
      ofsted_notification_date: r.ofsted_notification_date ?? null,
      ofsted_notified_within_required_timeframe: !!r.ofsted_notified_within_required_timeframe,
      dbs_referral_made: !!r.dbs_referral_made,
      police_involved: !!r.police_involved,
      local_authority_informed: !!r.local_authority_informed,
      multi_agency_approach: !!r.multi_agency_approach,
      outcome_shared_with_home: !!r.outcome_shared_with_home,
      referral_quality_adequate: !!r.referral_quality_adequate,
      status: r.status ?? "pending",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawInvestigations = (store.investigationRecords ?? []) as any[];
    const investigation_records: InvestigationRecordInput[] = rawInvestigations.map((i: any) => ({
      id: i.id ?? "",
      allegation_id: i.allegation_id ?? "",
      investigation_type: i.investigation_type ?? "internal",
      date_opened: (i.date_opened ?? today).toString(),
      date_closed: i.date_closed ?? null,
      is_open: i.is_open !== false,
      target_completion_days: i.target_completion_days ?? 28,
      actual_completion_days: i.actual_completion_days ?? -1,
      completed_within_target: !!i.completed_within_target,
      investigation_plan_in_place: !!i.investigation_plan_in_place,
      terms_of_reference_set: !!i.terms_of_reference_set,
      investigator_independent: !!i.investigator_independent,
      witness_interviews_completed: !!i.witness_interviews_completed,
      evidence_reviewed: !!i.evidence_reviewed,
      interim_measures_in_place: !!i.interim_measures_in_place,
      child_supported_throughout: !!i.child_supported_throughout,
      staff_member_supported: !!i.staff_member_supported,
      regular_updates_provided: !!i.regular_updates_provided,
      findings_documented: !!i.findings_documented,
      management_oversight: !!i.management_oversight,
      quality_assured: !!i.quality_assured,
      created_at: (i.created_at ?? today).toString(),
    }));

    const rawOutcomes = (store.outcomeRecords ?? []) as any[];
    const outcome_records: OutcomeRecordInput[] = rawOutcomes.map((o: any) => ({
      id: o.id ?? "",
      allegation_id: o.allegation_id ?? "",
      investigation_id: o.investigation_id ?? null,
      outcome_type: o.outcome_type ?? "pending",
      date_outcome_reached: (o.date_outcome_reached ?? today).toString(),
      outcome_documented: !!o.outcome_documented,
      outcome_shared_with_subject: !!o.outcome_shared_with_subject,
      outcome_shared_with_child: !!o.outcome_shared_with_child,
      outcome_shared_with_parents: !!o.outcome_shared_with_parents,
      outcome_shared_with_placing_authority: !!o.outcome_shared_with_placing_authority,
      action_plan_created: !!o.action_plan_created,
      action_plan_implemented: !!o.action_plan_implemented,
      lessons_learned_recorded: !!o.lessons_learned_recorded,
      lessons_shared_with_team: !!o.lessons_shared_with_team,
      policy_review_triggered: !!o.policy_review_triggered,
      training_needs_identified: !!o.training_needs_identified,
      training_delivered: !!o.training_delivered,
      dbs_status_updated: !!o.dbs_status_updated,
      single_central_record_updated: !!o.single_central_record_updated,
      appeal_process_offered: !!o.appeal_process_offered,
      support_plan_for_child: !!o.support_plan_for_child,
      support_plan_for_staff: !!o.support_plan_for_staff,
      regulatory_notifications_completed: !!o.regulatory_notifications_completed,
      created_at: (o.created_at ?? today).toString(),
    }));

    const rawSafeguardingResponses = (store.safeguardingResponseRecords ?? []) as any[];
    const safeguarding_response_records: SafeguardingResponseRecordInput[] = rawSafeguardingResponses.map((s: any) => ({
      id: s.id ?? "",
      allegation_id: s.allegation_id ?? "",
      date_allegation_received: (s.date_allegation_received ?? today).toString(),
      date_response_initiated: (s.date_response_initiated ?? today).toString(),
      response_within_1_hour: !!s.response_within_1_hour,
      child_safety_plan_in_place: !!s.child_safety_plan_in_place,
      child_wishes_captured: !!s.child_wishes_captured,
      child_informed_age_appropriately: !!s.child_informed_age_appropriately,
      independent_advocate_offered: !!s.independent_advocate_offered,
      other_children_risk_assessed: !!s.other_children_risk_assessed,
      contact_restrictions_applied: !!s.contact_restrictions_applied,
      supervision_arrangements_reviewed: !!s.supervision_arrangements_reviewed,
      staff_deployment_adjusted: !!s.staff_deployment_adjusted,
      whistleblowing_policy_followed: !!s.whistleblowing_policy_followed,
      no_unsupervised_contact: !!s.no_unsupervised_contact,
      safeguarding_lead_informed: !!s.safeguarding_lead_informed,
      ri_informed: !!s.ri_informed,
      management_oversight_documented: !!s.management_oversight_documented,
      follow_up_actions_set: !!s.follow_up_actions_set,
      follow_up_actions_completed: !!s.follow_up_actions_completed,
      created_at: (s.created_at ?? today).toString(),
    }));

    const result = computeAllegationsInvestigationsManagement({
      today,
      total_children,
      allegation_records,
      lado_referral_records,
      investigation_records,
      outcome_records,
      safeguarding_response_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
