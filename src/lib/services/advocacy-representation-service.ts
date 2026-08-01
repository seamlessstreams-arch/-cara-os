// ══════════════════════════════════════════════════════════════════════════════
// CARA — ADVOCACY REPRESENTATION SERVICE
// Tracks advocacy provision, independent representation,
// children's voice in decisions, and rights awareness.
// CHR 2015 Reg 7 (children's views — advocacy and representation),
// Reg 14(2)(b)(iv) (access to advocacy services).
//
// Covers: advocacy type, representation quality, child satisfaction,
// outcome effectiveness, and rights awareness.
//
// SCCIF: Experiences — "Children have access to advocacy."
// "Their views are sought, listened to, and acted upon."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AdvocacyType =
  | "independent_advocate"
  | "peer_advocacy"
  | "self_advocacy"
  | "formal_representation"
  | "informal_support"
  | "complaints_advocacy"
  | "review_advocacy"
  | "rights_education"
  | "group_advocacy"
  | "other";

export type RepresentationQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "not_provided";

export type ChildSatisfaction =
  | "very_satisfied"
  | "satisfied"
  | "neutral"
  | "dissatisfied"
  | "very_dissatisfied";

export type OutcomeEffectiveness =
  | "fully_effective"
  | "mostly_effective"
  | "partially_effective"
  | "ineffective"
  | "counterproductive";

export interface AdvocacyRepresentationRecord {
  id: string;
  home_id: string;
  advocacy_type: AdvocacyType;
  representation_quality: RepresentationQuality;
  child_satisfaction: ChildSatisfaction;
  outcome_effectiveness: OutcomeEffectiveness;
  session_date: string;
  child_name: string;
  child_id: string | null;
  facilitated_by: string;
  child_voice_heard: boolean;
  child_understood_rights: boolean;
  independent_access: boolean;
  confidentiality_maintained: boolean;
  outcome_communicated: boolean;
  follow_up_arranged: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  irm_notified: boolean;
  decision_influenced: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ADVOCACY_TYPES: { type: AdvocacyType; label: string }[] = [
  { type: "independent_advocate", label: "Independent Advocate" },
  { type: "peer_advocacy", label: "Peer Advocacy" },
  { type: "self_advocacy", label: "Self-Advocacy" },
  { type: "formal_representation", label: "Formal Representation" },
  { type: "informal_support", label: "Informal Support" },
  { type: "complaints_advocacy", label: "Complaints Advocacy" },
  { type: "review_advocacy", label: "Review Advocacy" },
  { type: "rights_education", label: "Rights Education" },
  { type: "group_advocacy", label: "Group Advocacy" },
  { type: "other", label: "Other" },
];

export const REPRESENTATION_QUALITIES: { quality: RepresentationQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "poor", label: "Poor" },
  { quality: "not_provided", label: "Not Provided" },
];

export const CHILD_SATISFACTIONS: { satisfaction: ChildSatisfaction; label: string }[] = [
  { satisfaction: "very_satisfied", label: "Very Satisfied" },
  { satisfaction: "satisfied", label: "Satisfied" },
  { satisfaction: "neutral", label: "Neutral" },
  { satisfaction: "dissatisfied", label: "Dissatisfied" },
  { satisfaction: "very_dissatisfied", label: "Very Dissatisfied" },
];

export const OUTCOME_EFFECTIVENESSES: { effectiveness: OutcomeEffectiveness; label: string }[] = [
  { effectiveness: "fully_effective", label: "Fully Effective" },
  { effectiveness: "mostly_effective", label: "Mostly Effective" },
  { effectiveness: "partially_effective", label: "Partially Effective" },
  { effectiveness: "ineffective", label: "Ineffective" },
  { effectiveness: "counterproductive", label: "Counterproductive" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeAdvocacyRepresentationMetrics(
  records: AdvocacyRepresentationRecord[],
): {
  total_sessions: number;
  poor_quality_count: number;
  dissatisfied_count: number;
  ineffective_count: number;
  counterproductive_count: number;
  child_voice_rate: number | null;
  rights_understood_rate: number | null;
  independent_access_rate: number | null;
  confidentiality_rate: number | null;
  outcome_communicated_rate: number | null;
  follow_up_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  irm_notified_rate: number | null;
  decision_influenced_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_advocacy_type: Record<string, number>;
  by_representation_quality: Record<string, number>;
  by_child_satisfaction: Record<string, number>;
  by_outcome_effectiveness: Record<string, number>;
} {
  const poorQuality = records.filter((r) => r.representation_quality === "poor" || r.representation_quality === "not_provided").length;
  const dissatisfied = records.filter((r) => r.child_satisfaction === "dissatisfied" || r.child_satisfaction === "very_dissatisfied").length;
  const ineffective = records.filter((r) => r.outcome_effectiveness === "ineffective").length;
  const counterproductive = records.filter((r) => r.outcome_effectiveness === "counterproductive").length;

  const boolRate = (field: keyof AdvocacyRepresentationRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.advocacy_type] = (byType[r.advocacy_type] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.representation_quality] = (byQuality[r.representation_quality] ?? 0) + 1;

  const bySatisfaction: Record<string, number> = {};
  for (const r of records) bySatisfaction[r.child_satisfaction] = (bySatisfaction[r.child_satisfaction] ?? 0) + 1;

  const byEffectiveness: Record<string, number> = {};
  for (const r of records) byEffectiveness[r.outcome_effectiveness] = (byEffectiveness[r.outcome_effectiveness] ?? 0) + 1;

  return {
    total_sessions: records.length,
    poor_quality_count: poorQuality,
    dissatisfied_count: dissatisfied,
    ineffective_count: ineffective,
    counterproductive_count: counterproductive,
    child_voice_rate: boolRate("child_voice_heard"),
    rights_understood_rate: boolRate("child_understood_rights"),
    independent_access_rate: boolRate("independent_access"),
    confidentiality_rate: boolRate("confidentiality_maintained"),
    outcome_communicated_rate: boolRate("outcome_communicated"),
    follow_up_rate: boolRate("follow_up_arranged"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    irm_notified_rate: boolRate("irm_notified"),
    decision_influenced_rate: boolRate("decision_influenced"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_advocacy_type: byType,
    by_representation_quality: byQuality,
    by_child_satisfaction: bySatisfaction,
    by_outcome_effectiveness: byEffectiveness,
  };
}

export function identifyAdvocacyRepresentationAlerts(
  records: AdvocacyRepresentationRecord[],
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

  // Dissatisfied and counterproductive — per-record critical
  for (const r of records) {
    if ((r.child_satisfaction === "dissatisfied" || r.child_satisfaction === "very_dissatisfied") && r.outcome_effectiveness === "counterproductive") {
      alerts.push({
        type: "dissatisfied_counterproductive",
        severity: "critical",
        message: `${r.child_name} dissatisfied with ${r.advocacy_type.replace(/_/g, " ")} and outcome counterproductive — review advocacy approach immediately`,
        id: r.id,
      });
    }
  }

  // No independent access
  const noAccess = records.filter((r) => !r.independent_access).length;
  if (noAccess >= 1) {
    alerts.push({
      type: "no_independent_access",
      severity: "high",
      message: `${noAccess} ${noAccess === 1 ? "session has" : "sessions have"} no independent access to advocacy — fundamental right under Reg 7`,
      id: "no_independent_access",
    });
  }

  // Child voice not heard
  const noVoice = records.filter((r) => !r.child_voice_heard).length;
  if (noVoice >= 1) {
    alerts.push({
      type: "child_voice_not_heard",
      severity: "high",
      message: `${noVoice} ${noVoice === 1 ? "session has" : "sessions have"} child voice not heard — advocacy must amplify child views`,
      id: "child_voice_not_heard",
    });
  }

  // No confidentiality
  const noConfidentiality = records.filter((r) => !r.confidentiality_maintained).length;
  if (noConfidentiality >= 2) {
    alerts.push({
      type: "confidentiality_breach",
      severity: "medium",
      message: `${noConfidentiality} sessions without confidentiality maintained — advocacy conversations must be private`,
      id: "confidentiality_breach",
    });
  }

  // Rights not understood
  const noRights = records.filter((r) => !r.child_understood_rights).length;
  if (noRights >= 2) {
    alerts.push({
      type: "rights_not_understood",
      severity: "medium",
      message: `${noRights} sessions where child did not understand their rights — strengthen rights education`,
      id: "rights_not_understood",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    advocacyType?: AdvocacyType;
    representationQuality?: RepresentationQuality;
    childSatisfaction?: ChildSatisfaction;
    outcomeEffectiveness?: OutcomeEffectiveness;
    limit?: number;
  },
): Promise<ServiceResult<AdvocacyRepresentationRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_advocacy_representation") as SB).select("*").eq("home_id", homeId);
  if (filters?.advocacyType) q = q.eq("advocacy_type", filters.advocacyType);
  if (filters?.representationQuality) q = q.eq("representation_quality", filters.representationQuality);
  if (filters?.childSatisfaction) q = q.eq("child_satisfaction", filters.childSatisfaction);
  if (filters?.outcomeEffectiveness) q = q.eq("outcome_effectiveness", filters.outcomeEffectiveness);
  q = q.order("session_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as AdvocacyRepresentationRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  advocacyType: AdvocacyType;
  representationQuality: RepresentationQuality;
  childSatisfaction: ChildSatisfaction;
  outcomeEffectiveness: OutcomeEffectiveness;
  sessionDate: string;
  childName: string;
  childId?: string | null;
  facilitatedBy: string;
  childVoiceHeard?: boolean;
  childUnderstoodRights?: boolean;
  independentAccess?: boolean;
  confidentialityMaintained?: boolean;
  outcomeCommunicated?: boolean;
  followUpArranged?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  parentInformed?: boolean;
  irmNotified?: boolean;
  decisionInfluenced?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<AdvocacyRepresentationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_advocacy_representation") as SB)
    .insert({
      home_id: payload.homeId,
      advocacy_type: payload.advocacyType,
      representation_quality: payload.representationQuality,
      child_satisfaction: payload.childSatisfaction,
      outcome_effectiveness: payload.outcomeEffectiveness,
      session_date: payload.sessionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      facilitated_by: payload.facilitatedBy,
      child_voice_heard: payload.childVoiceHeard ?? true,
      child_understood_rights: payload.childUnderstoodRights ?? true,
      independent_access: payload.independentAccess ?? true,
      confidentiality_maintained: payload.confidentialityMaintained ?? true,
      outcome_communicated: payload.outcomeCommunicated ?? true,
      follow_up_arranged: payload.followUpArranged ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? true,
      irm_notified: payload.irmNotified ?? true,
      decision_influenced: payload.decisionInfluenced ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as AdvocacyRepresentationRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    advocacyType: AdvocacyType;
    representationQuality: RepresentationQuality;
    childSatisfaction: ChildSatisfaction;
    outcomeEffectiveness: OutcomeEffectiveness;
    sessionDate: string;
    childName: string;
    childId: string | null;
    facilitatedBy: string;
    childVoiceHeard: boolean;
    childUnderstoodRights: boolean;
    independentAccess: boolean;
    confidentialityMaintained: boolean;
    outcomeCommunicated: boolean;
    followUpArranged: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    irmNotified: boolean;
    decisionInfluenced: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<AdvocacyRepresentationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.advocacyType !== undefined) mapped.advocacy_type = updates.advocacyType;
  if (updates.representationQuality !== undefined) mapped.representation_quality = updates.representationQuality;
  if (updates.childSatisfaction !== undefined) mapped.child_satisfaction = updates.childSatisfaction;
  if (updates.outcomeEffectiveness !== undefined) mapped.outcome_effectiveness = updates.outcomeEffectiveness;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.facilitatedBy !== undefined) mapped.facilitated_by = updates.facilitatedBy;
  if (updates.childVoiceHeard !== undefined) mapped.child_voice_heard = updates.childVoiceHeard;
  if (updates.childUnderstoodRights !== undefined) mapped.child_understood_rights = updates.childUnderstoodRights;
  if (updates.independentAccess !== undefined) mapped.independent_access = updates.independentAccess;
  if (updates.confidentialityMaintained !== undefined) mapped.confidentiality_maintained = updates.confidentialityMaintained;
  if (updates.outcomeCommunicated !== undefined) mapped.outcome_communicated = updates.outcomeCommunicated;
  if (updates.followUpArranged !== undefined) mapped.follow_up_arranged = updates.followUpArranged;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.irmNotified !== undefined) mapped.irm_notified = updates.irmNotified;
  if (updates.decisionInfluenced !== undefined) mapped.decision_influenced = updates.decisionInfluenced;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_advocacy_representation") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as AdvocacyRepresentationRecord };
}

export const _testing = { computeAdvocacyRepresentationMetrics, identifyAdvocacyRepresentationAlerts };
