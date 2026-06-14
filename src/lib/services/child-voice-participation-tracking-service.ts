// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE & PARTICIPATION TRACKING SERVICE
// Tracks how children's voices are heard and influence decisions.
// Participation in reviews, care planning, house meetings, complaints,
// feedback loops, advocacy meetings, and regulatory visits.
// CHR 2015 Reg 7 (views, wishes and feelings of children),
// CHR 2015 Reg 44/45 (children consulted during visits/reviews),
// UNCRC Article 12 (right to be heard).
//
// SCCIF: Overall Experiences & Progress — "Children's views influence
// their care." Ofsted expects evidence that children's voices are
// systematically sought, recorded, and acted upon, and that outcomes
// are fed back to children in age-appropriate ways.
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Enums ─────────────────────────────────────────────────────────────────

export const PARTICIPATION_TYPES = [
  "care_plan_review",
  "house_meeting",
  "complaints_process",
  "reg44_visit",
  "reg45_review",
  "placement_plan",
  "individual_review",
  "feedback_session",
  "advocacy_meeting",
  "informal_consultation",
] as const;
export type ParticipationType = (typeof PARTICIPATION_TYPES)[number];

export const VOICE_OUTCOMES = [
  "views_fully_incorporated",
  "views_partially_incorporated",
  "views_acknowledged",
  "views_not_sought",
  "child_declined",
  "unable_to_participate",
] as const;
export type VoiceOutcome = (typeof VOICE_OUTCOMES)[number];

export const PARTICIPATION_LEVELS = [
  "leading",
  "active",
  "consulted",
  "informed",
  "passive",
  "not_involved",
] as const;
export type ParticipationLevel = (typeof PARTICIPATION_LEVELS)[number];

export const FEEDBACK_METHODS = [
  "verbal",
  "written",
  "digital",
  "pictorial",
  "advocate",
  "sign_language",
  "other",
] as const;
export type FeedbackMethod = (typeof FEEDBACK_METHODS)[number];

// ── Row type ──────────────────────────────────────────────────────────────

export interface ChildVoiceParticipationTrackingRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  participation_date: string;
  participation_type: ParticipationType;
  voice_outcome: VoiceOutcome;
  participation_level: ParticipationLevel;
  feedback_method: FeedbackMethod;
  child_prepared_beforehand: boolean;
  child_understood_process: boolean;
  child_felt_heard: boolean;
  outcome_fed_back: boolean;
  advocate_present: boolean;
  age_appropriate_methods: boolean;
  decision_changed_by_voice: boolean;
  child_satisfied_with_outcome: boolean;
  facilitator_name: string | null;
  child_feedback_verbatim: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeVoiceParticipationMetrics(
  rows: ChildVoiceParticipationTrackingRow[],
): {
  total_records: number;
  views_not_sought_count: number;
  not_involved_count: number;
  declined_count: number;
  decision_changed_count: number;
  child_prepared_rate: number;
  child_understood_rate: number;
  child_felt_heard_rate: number;
  outcome_fed_back_rate: number;
  advocate_present_rate: number;
  age_appropriate_rate: number;
  decision_changed_rate: number;
  child_satisfied_rate: number;
  participation_type_breakdown: Record<string, number>;
  outcome_breakdown: Record<string, number>;
  unique_children: number;
} {
  const viewsNotSought = rows.filter((r) => r.voice_outcome === "views_not_sought").length;
  const notInvolved = rows.filter((r) => r.participation_level === "not_involved").length;
  const declined = rows.filter((r) => r.voice_outcome === "child_declined").length;
  const decisionChanged = rows.filter((r) => r.decision_changed_by_voice).length;

  const boolRate = (field: keyof ChildVoiceParticipationTrackingRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0
      ? Math.round((count / rows.length) * 1000) / 10
      : 0;
  };

  const participationTypeBreakdown: Record<string, number> = {};
  for (const r of rows) participationTypeBreakdown[r.participation_type] = (participationTypeBreakdown[r.participation_type] ?? 0) + 1;

  const outcomeBreakdown: Record<string, number> = {};
  for (const r of rows) outcomeBreakdown[r.voice_outcome] = (outcomeBreakdown[r.voice_outcome] ?? 0) + 1;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  return {
    total_records: rows.length,
    views_not_sought_count: viewsNotSought,
    not_involved_count: notInvolved,
    declined_count: declined,
    decision_changed_count: decisionChanged,
    child_prepared_rate: boolRate("child_prepared_beforehand"),
    child_understood_rate: boolRate("child_understood_process"),
    child_felt_heard_rate: boolRate("child_felt_heard"),
    outcome_fed_back_rate: boolRate("outcome_fed_back"),
    advocate_present_rate: boolRate("advocate_present"),
    age_appropriate_rate: boolRate("age_appropriate_methods"),
    decision_changed_rate: boolRate("decision_changed_by_voice"),
    child_satisfied_rate: boolRate("child_satisfied_with_outcome"),
    participation_type_breakdown: participationTypeBreakdown,
    outcome_breakdown: outcomeBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computeVoiceParticipationAlerts(
  rows: ChildVoiceParticipationTrackingRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: views_not_sought in care_plan_review or reg44_visit or reg45_review
  for (const r of rows) {
    if (
      r.voice_outcome === "views_not_sought" &&
      (r.participation_type === "care_plan_review" ||
        r.participation_type === "reg44_visit" ||
        r.participation_type === "reg45_review")
    ) {
      alerts.push({
        type: "views_not_sought_formal",
        severity: "critical",
        message: `${r.child_name}'s views were not sought during ${r.participation_type.replace(/_/g, " ")} — Reg 7 requires children's views to be actively sought in all formal reviews`,
        record_id: r.id,
      });
    }
  }

  // High: child did not feel heard and outcome not fed back
  for (const r of rows) {
    if (!r.child_felt_heard && !r.outcome_fed_back) {
      alerts.push({
        type: "not_heard_no_feedback",
        severity: "high",
        message: `${r.child_name} did not feel heard and was not informed of the outcome for ${r.participation_type.replace(/_/g, " ")} — children must know their voice matters`,
        record_id: r.id,
      });
    }
  }

  // High: not_involved participation level in formal review
  for (const r of rows) {
    if (
      r.participation_level === "not_involved" &&
      (r.participation_type === "care_plan_review" ||
        r.participation_type === "reg44_visit" ||
        r.participation_type === "reg45_review" ||
        r.participation_type === "individual_review" ||
        r.participation_type === "placement_plan")
    ) {
      alerts.push({
        type: "not_involved_formal_review",
        severity: "high",
        message: `${r.child_name} was not involved in ${r.participation_type.replace(/_/g, " ")} — UNCRC Article 12 requires children to participate in decisions affecting them`,
        record_id: r.id,
      });
    }
  }

  // Medium: advocate not present when child unable to participate
  for (const r of rows) {
    if (r.voice_outcome === "unable_to_participate" && !r.advocate_present) {
      alerts.push({
        type: "no_advocate_unable",
        severity: "medium",
        message: `No advocate present for ${r.child_name} who was unable to participate in ${r.participation_type.replace(/_/g, " ")} — consider advocacy support`,
        record_id: r.id,
      });
    }
  }

  // Medium: outcome not fed back to child after decision
  for (const r of rows) {
    if (
      !r.outcome_fed_back &&
      r.voice_outcome !== "views_not_sought" &&
      r.voice_outcome !== "child_declined" &&
      r.voice_outcome !== "unable_to_participate"
    ) {
      alerts.push({
        type: "outcome_not_fed_back",
        severity: "medium",
        message: `Outcome not fed back to ${r.child_name} after ${r.participation_type.replace(/_/g, " ")} — children should be told how their views influenced decisions`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateVoiceParticipationCaraInsights(
  rows: ChildVoiceParticipationTrackingRow[],
): string[] {
  const metrics = computeVoiceParticipationMetrics(rows);
  const alerts = computeVoiceParticipationAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary counts
  insights.push(
    `[violet] ${metrics.total_records} voice and participation records tracked across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.views_not_sought_count} instance${metrics.views_not_sought_count === 1 ? "" : "s"} where views were not sought. ` +
      `Child felt heard rate: ${metrics.child_felt_heard_rate}%. ` +
      `Decision changed by child's voice rate: ${metrics.decision_changed_rate}%.`,
  );

  // Insight 2: Priority findings
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority concerns identified. ` +
        `Outcome fed back rate: ${metrics.outcome_fed_back_rate}%. ` +
        `Child prepared rate: ${metrics.child_prepared_rate}%. ` +
        `Age-appropriate methods rate: ${metrics.age_appropriate_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority concerns identified. ` +
        `Outcome fed back rate: ${metrics.outcome_fed_back_rate}%. ` +
        `Child prepared rate: ${metrics.child_prepared_rate}%. ` +
        `Age-appropriate methods rate: ${metrics.age_appropriate_rate}%.`,
    );
  }

  // Insight 3: Reflective question
  insights.push(
    `[reflect] Are children genuinely influencing decisions about their care, or is participation a tick-box exercise? ` +
      `Review whether preparation, age-appropriate methods, and feedback loops are enabling meaningful voice for every child.`,
  );

  return insights;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildVoiceParticipation(
  homeId: string,
): Promise<ServiceResult<ChildVoiceParticipationTrackingRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_voice_participation_tracking") as SB)
    .select("*")
    .eq("home_id", homeId);
  q = q.order("participation_date", { ascending: false }).limit(200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildVoiceParticipation(input: {
  homeId: string;
  childName: string;
  childId?: string | null;
  participationDate: string;
  participationType: ParticipationType;
  voiceOutcome: VoiceOutcome;
  participationLevel: ParticipationLevel;
  feedbackMethod: FeedbackMethod;
  childPreparedBeforehand?: boolean;
  childUnderstoodProcess?: boolean;
  childFeltHeard?: boolean;
  outcomeFedBack?: boolean;
  advocatePresent?: boolean;
  ageAppropriateMethods?: boolean;
  decisionChangedByVoice?: boolean;
  childSatisfiedWithOutcome?: boolean;
  facilitatorName?: string | null;
  childFeedbackVerbatim?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<ChildVoiceParticipationTrackingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_voice_participation_tracking") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      participation_date: input.participationDate,
      participation_type: input.participationType,
      voice_outcome: input.voiceOutcome,
      participation_level: input.participationLevel,
      feedback_method: input.feedbackMethod,
      child_prepared_beforehand: input.childPreparedBeforehand ?? false,
      child_understood_process: input.childUnderstoodProcess ?? false,
      child_felt_heard: input.childFeltHeard ?? false,
      outcome_fed_back: input.outcomeFedBack ?? false,
      advocate_present: input.advocatePresent ?? false,
      age_appropriate_methods: input.ageAppropriateMethods ?? true,
      decision_changed_by_voice: input.decisionChangedByVoice ?? false,
      child_satisfied_with_outcome: input.childSatisfiedWithOutcome ?? false,
      facilitator_name: input.facilitatorName ?? null,
      child_feedback_verbatim: input.childFeedbackVerbatim ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeVoiceParticipationMetrics,
  computeVoiceParticipationAlerts,
  generateVoiceParticipationCaraInsights,
};
