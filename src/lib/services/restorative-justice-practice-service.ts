// ══════════════════════════════════════════════════════════════════════════════
// CARA — RESTORATIVE JUSTICE PRACTICE SERVICE
// Tracks restorative conversations, mediation sessions,
// relationship repair, and conflict resolution through
// restorative approaches.
// CHR 2015 Reg 19 (behaviour management — restorative approaches),
// Reg 34 (leadership — positive behaviour culture).
//
// Covers: practice type, outcome level, participation willingness,
// relationship impact, and resolution tracking.
//
// SCCIF: Experiences — "Restorative approaches are used effectively."
// "Children learn to repair relationships and resolve conflict."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type PracticeType =
  | "restorative_conversation"
  | "peer_mediation"
  | "community_conference"
  | "circle_time"
  | "shuttle_mediation"
  | "family_group_conference"
  | "written_apology"
  | "reparation_activity"
  | "relationship_repair"
  | "other";

export type OutcomeLevel =
  | "fully_resolved"
  | "mostly_resolved"
  | "partially_resolved"
  | "unresolved"
  | "escalated";

export type ParticipationWillingness =
  | "fully_willing"
  | "mostly_willing"
  | "reluctant"
  | "coerced"
  | "refused";

export type RelationshipImpact =
  | "significantly_improved"
  | "improved"
  | "no_change"
  | "worsened"
  | "significantly_worsened";

export interface RestorativeJusticePracticeRecord {
  id: string;
  home_id: string;
  practice_type: PracticeType;
  outcome_level: OutcomeLevel;
  participation_willingness: ParticipationWillingness;
  relationship_impact: RelationshipImpact;
  session_date: string;
  child_name: string;
  child_id: string | null;
  facilitated_by: string;
  child_voice_heard: boolean;
  victim_supported: boolean;
  voluntary_participation: boolean;
  agreement_reached: boolean;
  follow_up_planned: boolean;
  empathy_demonstrated: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  staff_trained: boolean;
  safeguarding_considered: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PRACTICE_TYPES: { type: PracticeType; label: string }[] = [
  { type: "restorative_conversation", label: "Restorative Conversation" },
  { type: "peer_mediation", label: "Peer Mediation" },
  { type: "community_conference", label: "Community Conference" },
  { type: "circle_time", label: "Circle Time" },
  { type: "shuttle_mediation", label: "Shuttle Mediation" },
  { type: "family_group_conference", label: "Family Group Conference" },
  { type: "written_apology", label: "Written Apology" },
  { type: "reparation_activity", label: "Reparation Activity" },
  { type: "relationship_repair", label: "Relationship Repair" },
  { type: "other", label: "Other" },
];

export const OUTCOME_LEVELS: { level: OutcomeLevel; label: string }[] = [
  { level: "fully_resolved", label: "Fully Resolved" },
  { level: "mostly_resolved", label: "Mostly Resolved" },
  { level: "partially_resolved", label: "Partially Resolved" },
  { level: "unresolved", label: "Unresolved" },
  { level: "escalated", label: "Escalated" },
];

export const PARTICIPATION_WILLINGNESS_LEVELS: { willingness: ParticipationWillingness; label: string }[] = [
  { willingness: "fully_willing", label: "Fully Willing" },
  { willingness: "mostly_willing", label: "Mostly Willing" },
  { willingness: "reluctant", label: "Reluctant" },
  { willingness: "coerced", label: "Coerced" },
  { willingness: "refused", label: "Refused" },
];

export const RELATIONSHIP_IMPACTS: { impact: RelationshipImpact; label: string }[] = [
  { impact: "significantly_improved", label: "Significantly Improved" },
  { impact: "improved", label: "Improved" },
  { impact: "no_change", label: "No Change" },
  { impact: "worsened", label: "Worsened" },
  { impact: "significantly_worsened", label: "Significantly Worsened" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeRestorativeJusticeMetrics(
  records: RestorativeJusticePracticeRecord[],
): {
  total_sessions: number;
  escalated_count: number;
  unresolved_count: number;
  coerced_count: number;
  worsened_count: number;
  child_voice_rate: number | null;
  victim_supported_rate: number | null;
  voluntary_rate: number | null;
  agreement_rate: number | null;
  follow_up_rate: number | null;
  empathy_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  staff_trained_rate: number | null;
  safeguarding_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_practice_type: Record<string, number>;
  by_outcome_level: Record<string, number>;
  by_participation_willingness: Record<string, number>;
  by_relationship_impact: Record<string, number>;
} {
  const escalated = records.filter((r) => r.outcome_level === "escalated").length;
  const unresolved = records.filter((r) => r.outcome_level === "unresolved").length;
  const coerced = records.filter((r) => r.participation_willingness === "coerced").length;
  const worsened = records.filter((r) => r.relationship_impact === "worsened" || r.relationship_impact === "significantly_worsened").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof RestorativeJusticePracticeRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.practice_type] = (byType[r.practice_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.outcome_level] = (byOutcome[r.outcome_level] ?? 0) + 1;

  const byWillingness: Record<string, number> = {};
  for (const r of records) byWillingness[r.participation_willingness] = (byWillingness[r.participation_willingness] ?? 0) + 1;

  const byImpact: Record<string, number> = {};
  for (const r of records) byImpact[r.relationship_impact] = (byImpact[r.relationship_impact] ?? 0) + 1;

  return {
    total_sessions: records.length,
    escalated_count: escalated,
    unresolved_count: unresolved,
    coerced_count: coerced,
    worsened_count: worsened,
    child_voice_rate: boolRate("child_voice_heard"),
    victim_supported_rate: boolRate("victim_supported"),
    voluntary_rate: boolRate("voluntary_participation"),
    agreement_rate: boolRate("agreement_reached"),
    follow_up_rate: boolRate("follow_up_planned"),
    empathy_rate: boolRate("empathy_demonstrated"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    staff_trained_rate: boolRate("staff_trained"),
    safeguarding_rate: boolRate("safeguarding_considered"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_practice_type: byType,
    by_outcome_level: byOutcome,
    by_participation_willingness: byWillingness,
    by_relationship_impact: byImpact,
  };
}

export function identifyRestorativeJusticeAlerts(
  records: RestorativeJusticePracticeRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Coerced participation with worsened relationship — per-record
  for (const r of records) {
    if (r.participation_willingness === "coerced" && (r.relationship_impact === "worsened" || r.relationship_impact === "significantly_worsened")) {
      alerts.push({
        type: "coerced_worsened",
        severity: "critical",
        message: `${r.child_name} was coerced into ${r.practice_type.replace(/_/g, " ")} and relationship worsened — review approach immediately`,
        id: r.id,
      });
    }
  }

  // No child voice heard
  const noVoice = records.filter((r) => !r.child_voice_heard).length;
  if (noVoice >= 1) {
    alerts.push({
      type: "child_voice_not_heard",
      severity: "high",
      message: `${noVoice} ${noVoice === 1 ? "session has" : "sessions have"} child voice not heard — fundamental to restorative practice`,
      id: "child_voice_not_heard",
    });
  }

  // Victim not supported
  const noVictim = records.filter((r) => !r.victim_supported).length;
  if (noVictim >= 1) {
    alerts.push({
      type: "victim_not_supported",
      severity: "high",
      message: `${noVictim} ${noVictim === 1 ? "session has" : "sessions have"} victim not supported — ensure victim-centred approach`,
      id: "victim_not_supported",
    });
  }

  // Staff not trained
  const noTrained = records.filter((r) => !r.staff_trained).length;
  if (noTrained >= 2) {
    alerts.push({
      type: "staff_not_trained",
      severity: "medium",
      message: `${noTrained} sessions facilitated by untrained staff — arrange restorative practice training`,
      id: "staff_not_trained",
    });
  }

  // No follow-up planned
  const noFollowUp = records.filter((r) => !r.follow_up_planned).length;
  if (noFollowUp >= 2) {
    alerts.push({
      type: "no_follow_up",
      severity: "medium",
      message: `${noFollowUp} sessions without follow-up planned — monitor relationship progress`,
      id: "no_follow_up",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    practiceType?: PracticeType;
    outcomeLevel?: OutcomeLevel;
    participationWillingness?: ParticipationWillingness;
    relationshipImpact?: RelationshipImpact;
    limit?: number;
  },
): Promise<ServiceResult<RestorativeJusticePracticeRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_restorative_justice_practice") as SB).select("*").eq("home_id", homeId);
  if (filters?.practiceType) q = q.eq("practice_type", filters.practiceType);
  if (filters?.outcomeLevel) q = q.eq("outcome_level", filters.outcomeLevel);
  if (filters?.participationWillingness) q = q.eq("participation_willingness", filters.participationWillingness);
  if (filters?.relationshipImpact) q = q.eq("relationship_impact", filters.relationshipImpact);
  q = q.order("session_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as RestorativeJusticePracticeRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  practiceType: PracticeType;
  outcomeLevel: OutcomeLevel;
  participationWillingness: ParticipationWillingness;
  relationshipImpact: RelationshipImpact;
  sessionDate: string;
  childName: string;
  childId?: string | null;
  facilitatedBy: string;
  childVoiceHeard?: boolean;
  victimSupported?: boolean;
  voluntaryParticipation?: boolean;
  agreementReached?: boolean;
  followUpPlanned?: boolean;
  empathyDemonstrated?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  parentInformed?: boolean;
  staffTrained?: boolean;
  safeguardingConsidered?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<RestorativeJusticePracticeRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_restorative_justice_practice") as SB)
    .insert({
      home_id: payload.homeId,
      practice_type: payload.practiceType,
      outcome_level: payload.outcomeLevel,
      participation_willingness: payload.participationWillingness,
      relationship_impact: payload.relationshipImpact,
      session_date: payload.sessionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      facilitated_by: payload.facilitatedBy,
      child_voice_heard: payload.childVoiceHeard ?? true,
      victim_supported: payload.victimSupported ?? true,
      voluntary_participation: payload.voluntaryParticipation ?? true,
      agreement_reached: payload.agreementReached ?? true,
      follow_up_planned: payload.followUpPlanned ?? true,
      empathy_demonstrated: payload.empathyDemonstrated ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? true,
      staff_trained: payload.staffTrained ?? true,
      safeguarding_considered: payload.safeguardingConsidered ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as RestorativeJusticePracticeRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    practiceType: PracticeType;
    outcomeLevel: OutcomeLevel;
    participationWillingness: ParticipationWillingness;
    relationshipImpact: RelationshipImpact;
    sessionDate: string;
    childName: string;
    childId: string | null;
    facilitatedBy: string;
    childVoiceHeard: boolean;
    victimSupported: boolean;
    voluntaryParticipation: boolean;
    agreementReached: boolean;
    followUpPlanned: boolean;
    empathyDemonstrated: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    staffTrained: boolean;
    safeguardingConsidered: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<RestorativeJusticePracticeRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.practiceType !== undefined) mapped.practice_type = updates.practiceType;
  if (updates.outcomeLevel !== undefined) mapped.outcome_level = updates.outcomeLevel;
  if (updates.participationWillingness !== undefined) mapped.participation_willingness = updates.participationWillingness;
  if (updates.relationshipImpact !== undefined) mapped.relationship_impact = updates.relationshipImpact;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.facilitatedBy !== undefined) mapped.facilitated_by = updates.facilitatedBy;
  if (updates.childVoiceHeard !== undefined) mapped.child_voice_heard = updates.childVoiceHeard;
  if (updates.victimSupported !== undefined) mapped.victim_supported = updates.victimSupported;
  if (updates.voluntaryParticipation !== undefined) mapped.voluntary_participation = updates.voluntaryParticipation;
  if (updates.agreementReached !== undefined) mapped.agreement_reached = updates.agreementReached;
  if (updates.followUpPlanned !== undefined) mapped.follow_up_planned = updates.followUpPlanned;
  if (updates.empathyDemonstrated !== undefined) mapped.empathy_demonstrated = updates.empathyDemonstrated;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.staffTrained !== undefined) mapped.staff_trained = updates.staffTrained;
  if (updates.safeguardingConsidered !== undefined) mapped.safeguarding_considered = updates.safeguardingConsidered;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_restorative_justice_practice") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as RestorativeJusticePracticeRecord };
}

export const _testing = { computeRestorativeJusticeMetrics, identifyRestorativeJusticeAlerts };
