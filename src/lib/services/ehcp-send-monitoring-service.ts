// ══════════════════════════════════════════════════════════════════════════════
// CARA — EHCP & SEND MONITORING SERVICE
// Tracks Education, Health and Care Plans for children with Special
// Educational Needs and Disabilities. Monitors EHCP compliance, annual
// reviews, provision delivery, and outcomes.
// CHR 2015 Reg 8 (education), Reg 5 (quality and purpose of care),
// Reg 14 (care planning).
// Children and Families Act 2014.
//
// SCCIF: "Children's educational needs are understood and met."
// "Children with SEND receive appropriate support."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SendCategory =
  | "cognition_learning"
  | "communication_interaction"
  | "social_emotional_mental_health"
  | "sensory_physical"
  | "autism_spectrum"
  | "specific_learning_difficulty"
  | "moderate_learning_difficulty"
  | "severe_learning_difficulty"
  | "speech_language"
  | "other";

export type EhcpStatus =
  | "assessment_requested"
  | "assessment_in_progress"
  | "plan_issued"
  | "annual_review_due"
  | "annual_review_completed"
  | "plan_amended"
  | "plan_ceased"
  | "tribunal_pending"
  | "mediation"
  | "other";

export type ProvisionDelivery =
  | "fully_delivered"
  | "mostly_delivered"
  | "partially_delivered"
  | "not_delivered"
  | "under_review";

export type OutcomeProgress =
  | "exceeding"
  | "on_track"
  | "below_expected"
  | "significantly_below"
  | "not_assessed";

export interface EhcpSendMonitoringRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  send_category: SendCategory;
  ehcp_status: EhcpStatus;
  provision_delivery: ProvisionDelivery;
  outcome_progress: OutcomeProgress;
  session_date: string;
  recorded_by: string;
  primary_need_description: string;
  provision_summary: string;
  specialist_provision: string | null;
  therapy_provision: string | null;
  annual_review_date: string | null;
  last_review_outcome: string | null;
  outcomes_detail: string | null;
  parent_carer_views: string | null;
  child_views: string | null;
  professional_advice: string | null;
  local_authority_contact: string | null;
  approved_by: string | null;
  approved_at: string | null;
  next_review_date: string | null;
  notes: string | null;
  ehcp_in_place: boolean;
  annual_review_completed: boolean;
  provision_monitored: boolean;
  outcomes_tracked: boolean;
  child_views_captured: boolean;
  parent_views_captured: boolean;
  professional_advice_sought: boolean;
  local_authority_engaged: boolean;
  school_liaison_active: boolean;
  transport_arranged: boolean;
  transition_planned: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SEND_CATEGORIES: { category: SendCategory; label: string }[] = [
  { category: "cognition_learning", label: "Cognition & Learning" },
  { category: "communication_interaction", label: "Communication & Interaction" },
  { category: "social_emotional_mental_health", label: "Social, Emotional & Mental Health" },
  { category: "sensory_physical", label: "Sensory & Physical" },
  { category: "autism_spectrum", label: "Autism Spectrum" },
  { category: "specific_learning_difficulty", label: "Specific Learning Difficulty" },
  { category: "moderate_learning_difficulty", label: "Moderate Learning Difficulty" },
  { category: "severe_learning_difficulty", label: "Severe Learning Difficulty" },
  { category: "speech_language", label: "Speech & Language" },
  { category: "other", label: "Other" },
];

export const EHCP_STATUSES: { status: EhcpStatus; label: string }[] = [
  { status: "assessment_requested", label: "Assessment Requested" },
  { status: "assessment_in_progress", label: "Assessment in Progress" },
  { status: "plan_issued", label: "Plan Issued" },
  { status: "annual_review_due", label: "Annual Review Due" },
  { status: "annual_review_completed", label: "Annual Review Completed" },
  { status: "plan_amended", label: "Plan Amended" },
  { status: "plan_ceased", label: "Plan Ceased" },
  { status: "tribunal_pending", label: "Tribunal Pending" },
  { status: "mediation", label: "Mediation" },
  { status: "other", label: "Other" },
];

export const PROVISION_DELIVERIES: { delivery: ProvisionDelivery; label: string }[] = [
  { delivery: "fully_delivered", label: "Fully Delivered" },
  { delivery: "mostly_delivered", label: "Mostly Delivered" },
  { delivery: "partially_delivered", label: "Partially Delivered" },
  { delivery: "not_delivered", label: "Not Delivered" },
  { delivery: "under_review", label: "Under Review" },
];

export const OUTCOME_PROGRESSES: { progress: OutcomeProgress; label: string }[] = [
  { progress: "exceeding", label: "Exceeding" },
  { progress: "on_track", label: "On Track" },
  { progress: "below_expected", label: "Below Expected" },
  { progress: "significantly_below", label: "Significantly Below" },
  { progress: "not_assessed", label: "Not Assessed" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computeEhcpSendMetrics(records: EhcpSendMonitoringRecord[]): {
  total_records: number;
  not_delivered_count: number;
  below_expected_count: number;
  review_due_count: number;
  no_ehcp_count: number;
  ehcp_in_place_rate: number | null;
  annual_review_rate: number | null;
  provision_monitored_rate: number | null;
  outcomes_tracked_rate: number | null;
  child_views_rate: number | null;
  parent_views_rate: number | null;
  professional_advice_rate: number | null;
  la_engaged_rate: number | null;
  school_liaison_rate: number | null;
  transport_rate: number | null;
  transition_planned_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_send_category: Record<string, number>;
  by_ehcp_status: Record<string, number>;
  by_provision_delivery: Record<string, number>;
  by_outcome_progress: Record<string, number>;
} {
  const notDelivered = records.filter((r) => r.provision_delivery === "not_delivered").length;
  const belowExpected = records.filter((r) => r.outcome_progress === "below_expected" || r.outcome_progress === "significantly_below").length;
  const reviewDue = records.filter((r) => r.ehcp_status === "annual_review_due").length;
  const noEhcp = records.filter((r) => r.ehcp_in_place === false).length;

  // Rated over the rows where the question was answered either way — with the
  // judgement columns tri-state, silence in the denominator would read as "no".
  // While every field is still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof EhcpSendMonitoringRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0 ? Math.round((count / recorded.length) * 1000) / 10 : null;
  };

  const bySendCategory: Record<string, number> = {};
  for (const r of records) bySendCategory[r.send_category] = (bySendCategory[r.send_category] ?? 0) + 1;
  const byEhcpStatus: Record<string, number> = {};
  for (const r of records) byEhcpStatus[r.ehcp_status] = (byEhcpStatus[r.ehcp_status] ?? 0) + 1;
  const byProvisionDelivery: Record<string, number> = {};
  for (const r of records) byProvisionDelivery[r.provision_delivery] = (byProvisionDelivery[r.provision_delivery] ?? 0) + 1;
  const byOutcomeProgress: Record<string, number> = {};
  for (const r of records) byOutcomeProgress[r.outcome_progress] = (byOutcomeProgress[r.outcome_progress] ?? 0) + 1;

  return {
    total_records: records.length,
    not_delivered_count: notDelivered,
    below_expected_count: belowExpected,
    review_due_count: reviewDue,
    no_ehcp_count: noEhcp,
    ehcp_in_place_rate: boolRate("ehcp_in_place"),
    annual_review_rate: boolRate("annual_review_completed"),
    provision_monitored_rate: boolRate("provision_monitored"),
    outcomes_tracked_rate: boolRate("outcomes_tracked"),
    child_views_rate: boolRate("child_views_captured"),
    parent_views_rate: boolRate("parent_views_captured"),
    professional_advice_rate: boolRate("professional_advice_sought"),
    la_engaged_rate: boolRate("local_authority_engaged"),
    school_liaison_rate: boolRate("school_liaison_active"),
    transport_rate: boolRate("transport_arranged"),
    transition_planned_rate: boolRate("transition_planned"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_send_category: bySendCategory,
    by_ehcp_status: byEhcpStatus,
    by_provision_delivery: byProvisionDelivery,
    by_outcome_progress: byOutcomeProgress,
  };
}

// ── Alerts ──────────────────────────────────────────────────────────────

export function identifyEhcpSendAlerts(
  records: EhcpSendMonitoringRecord[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical per-record: provision not delivered AND outcomes below expected
  for (const r of records) {
    if (r.provision_delivery === "not_delivered" && (r.outcome_progress === "below_expected" || r.outcome_progress === "significantly_below")) {
      alerts.push({
        type: "not_delivered_below_expected",
        severity: "critical",
        message: `${r.child_name} has SEND provision not delivered with below-expected outcomes — urgent action needed.`,
        record_id: r.id,
      });
    }
  }

  // High >= 1: no EHCP in place
  const noEhcp = records.filter((r) => r.ehcp_in_place === false).length;
  if (noEhcp >= 1) {
    alerts.push({
      type: "no_ehcp_in_place",
      severity: "high",
      message: `${noEhcp} child record${noEhcp === 1 ? " has" : "s have"} no EHCP in place.`,
    });
  }

  // High >= 1: child views not captured
  const noChildViews = records.filter((r) => r.child_views_captured === false).length;
  if (noChildViews >= 1) {
    alerts.push({
      type: "child_views_not_captured",
      severity: "high",
      message: `${noChildViews} record${noChildViews === 1 ? " has" : "s have"} child views not captured.`,
    });
  }

  // Medium >= 2: annual review not completed
  const noReview = records.filter((r) => r.annual_review_completed === false).length;
  if (noReview >= 2) {
    alerts.push({
      type: "annual_review_overdue",
      severity: "medium",
      message: `${noReview} records have annual review not completed.`,
    });
  }

  // Medium >= 2: no transition planned
  const noTransition = records.filter((r) => r.transition_planned === false).length;
  if (noTransition >= 2) {
    alerts.push({
      type: "no_transition_planned",
      severity: "medium",
      message: `${noTransition} records have no transition plan in place.`,
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listEhcpSendMonitoring(
  homeId: string,
): Promise<ServiceResult<EhcpSendMonitoringRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_ehcp_send_monitoring") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as EhcpSendMonitoringRecord[] };
}

export async function createEhcpSendMonitoring(input: {
  homeId: string;
  childName: string;
  childId?: string | null;
  sendCategory: SendCategory;
  ehcpStatus: EhcpStatus;
  provisionDelivery: ProvisionDelivery;
  outcomeProgress: OutcomeProgress;
  sessionDate: string;
  recordedBy: string;
  primaryNeedDescription: string;
  provisionSummary: string;
  specialistProvision?: string | null;
  therapyProvision?: string | null;
  annualReviewDate?: string | null;
  lastReviewOutcome?: string | null;
  outcomesDetail?: string | null;
  parentCarerViews?: string | null;
  childViews?: string | null;
  professionalAdvice?: string | null;
  localAuthorityContact?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  nextReviewDate?: string | null;
  notes?: string | null;
  ehcpInPlace: boolean;
  annualReviewCompleted: boolean;
  provisionMonitored: boolean;
  outcomesTracked: boolean;
  childViewsCaptured: boolean;
  parentViewsCaptured: boolean;
  professionalAdviceSought: boolean;
  localAuthorityEngaged: boolean;
  schoolLiaisonActive: boolean;
  transportArranged: boolean;
  transitionPlanned: boolean;
  recordedPromptly: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
}): Promise<ServiceResult<EhcpSendMonitoringRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_ehcp_send_monitoring") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      send_category: input.sendCategory,
      ehcp_status: input.ehcpStatus,
      provision_delivery: input.provisionDelivery,
      outcome_progress: input.outcomeProgress,
      session_date: input.sessionDate,
      recorded_by: input.recordedBy,
      primary_need_description: input.primaryNeedDescription,
      provision_summary: input.provisionSummary,
      specialist_provision: input.specialistProvision ?? null,
      therapy_provision: input.therapyProvision ?? null,
      annual_review_date: input.annualReviewDate ?? null,
      last_review_outcome: input.lastReviewOutcome ?? null,
      outcomes_detail: input.outcomesDetail ?? null,
      parent_carer_views: input.parentCarerViews ?? null,
      child_views: input.childViews ?? null,
      professional_advice: input.professionalAdvice ?? null,
      local_authority_contact: input.localAuthorityContact ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
      ehcp_in_place: input.ehcpInPlace,
      annual_review_completed: input.annualReviewCompleted,
      provision_monitored: input.provisionMonitored,
      outcomes_tracked: input.outcomesTracked,
      child_views_captured: input.childViewsCaptured,
      parent_views_captured: input.parentViewsCaptured,
      professional_advice_sought: input.professionalAdviceSought,
      local_authority_engaged: input.localAuthorityEngaged,
      school_liaison_active: input.schoolLiaisonActive,
      transport_arranged: input.transportArranged,
      transition_planned: input.transitionPlanned,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as EhcpSendMonitoringRecord };
}

export async function updateEhcpSendMonitoring(
  id: string,
  updates: Partial<Omit<EhcpSendMonitoringRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<EhcpSendMonitoringRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_ehcp_send_monitoring") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as EhcpSendMonitoringRecord };
}

// ── Testing export ─────────────────────────────────────────────────────

export const _testing = { computeEhcpSendMetrics, identifyEhcpSendAlerts };
