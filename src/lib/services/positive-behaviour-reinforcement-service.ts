// ══════════════════════════════════════════════════════════════════════════════
// CARA — POSITIVE BEHAVIOUR REINFORCEMENT SERVICE
// Tracks positive reinforcement practices, praise frequency,
// reward consistency, and child response to encouragement.
// CHR 2015 Reg 19(2)(a) (promoting positive behaviour through praise),
// Reg 11(2)(b) (nurturing wellbeing through encouragement).
//
// Covers: reinforcement type, praise quality, child response,
// consistency level, and relationship impact.
//
// SCCIF: Experiences — "Children receive praise and recognition."
// "Positive behaviour is encouraged through consistent reinforcement."
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

export type ReinforcementType =
  | "verbal_praise"
  | "written_recognition"
  | "reward_chart"
  | "special_privilege"
  | "activity_reward"
  | "token_economy"
  | "peer_recognition"
  | "certificate_award"
  | "family_celebration"
  | "other";

export type PraiseQuality =
  | "specific_genuine"
  | "appropriate"
  | "generic"
  | "inconsistent"
  | "absent";

export type ChildResponse =
  | "very_positive"
  | "positive"
  | "neutral"
  | "indifferent"
  | "negative";

export type ConsistencyLevel =
  | "highly_consistent"
  | "consistent"
  | "variable"
  | "inconsistent"
  | "absent";

export interface PositiveBehaviourReinforcementRecord {
  id: string;
  home_id: string;
  reinforcement_type: ReinforcementType;
  praise_quality: PraiseQuality;
  child_response: ChildResponse;
  consistency_level: ConsistencyLevel;
  session_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  behaviour_specific: boolean;
  age_appropriate: boolean;
  culturally_sensitive: boolean;
  timely_delivery: boolean;
  proportionate_response: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  peers_included: boolean;
  child_input_sought: boolean;
  progress_tracked: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const REINFORCEMENT_TYPES: { type: ReinforcementType; label: string }[] = [
  { type: "verbal_praise", label: "Verbal Praise" },
  { type: "written_recognition", label: "Written Recognition" },
  { type: "reward_chart", label: "Reward Chart" },
  { type: "special_privilege", label: "Special Privilege" },
  { type: "activity_reward", label: "Activity Reward" },
  { type: "token_economy", label: "Token Economy" },
  { type: "peer_recognition", label: "Peer Recognition" },
  { type: "certificate_award", label: "Certificate/Award" },
  { type: "family_celebration", label: "Family Celebration" },
  { type: "other", label: "Other" },
];

export const PRAISE_QUALITIES: { quality: PraiseQuality; label: string }[] = [
  { quality: "specific_genuine", label: "Specific & Genuine" },
  { quality: "appropriate", label: "Appropriate" },
  { quality: "generic", label: "Generic" },
  { quality: "inconsistent", label: "Inconsistent" },
  { quality: "absent", label: "Absent" },
];

export const CHILD_RESPONSES: { response: ChildResponse; label: string }[] = [
  { response: "very_positive", label: "Very Positive" },
  { response: "positive", label: "Positive" },
  { response: "neutral", label: "Neutral" },
  { response: "indifferent", label: "Indifferent" },
  { response: "negative", label: "Negative" },
];

export const CONSISTENCY_LEVELS: { level: ConsistencyLevel; label: string }[] = [
  { level: "highly_consistent", label: "Highly Consistent" },
  { level: "consistent", label: "Consistent" },
  { level: "variable", label: "Variable" },
  { level: "inconsistent", label: "Inconsistent" },
  { level: "absent", label: "Absent" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computePositiveBehaviourMetrics(records: PositiveBehaviourReinforcementRecord[]): {
  total_sessions: number;
  absent_praise_count: number;
  negative_response_count: number;
  inconsistent_count: number;
  indifferent_count: number;
  behaviour_specific_rate: number | null;
  age_appropriate_rate: number | null;
  culturally_sensitive_rate: number | null;
  timely_delivery_rate: number | null;
  proportionate_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  peers_included_rate: number | null;
  child_input_rate: number | null;
  progress_tracked_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_reinforcement_type: Record<string, number>;
  by_praise_quality: Record<string, number>;
  by_child_response: Record<string, number>;
  by_consistency_level: Record<string, number>;
} {
  const absentPraise = records.filter((r) => r.praise_quality === "absent").length;
  const negativeResponse = records.filter((r) => r.child_response === "negative").length;
  const inconsistent = records.filter((r) => r.consistency_level === "inconsistent" || r.consistency_level === "absent").length;
  const indifferent = records.filter((r) => r.child_response === "indifferent" || r.child_response === "negative").length;

  const boolRate = (field: keyof PositiveBehaviourReinforcementRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.reinforcement_type] = (byType[r.reinforcement_type] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.praise_quality] = (byQuality[r.praise_quality] ?? 0) + 1;

  const byResponse: Record<string, number> = {};
  for (const r of records) byResponse[r.child_response] = (byResponse[r.child_response] ?? 0) + 1;

  const byConsistency: Record<string, number> = {};
  for (const r of records) byConsistency[r.consistency_level] = (byConsistency[r.consistency_level] ?? 0) + 1;

  return {
    total_sessions: records.length,
    absent_praise_count: absentPraise,
    negative_response_count: negativeResponse,
    inconsistent_count: inconsistent,
    indifferent_count: indifferent,
    behaviour_specific_rate: boolRate("behaviour_specific"),
    age_appropriate_rate: boolRate("age_appropriate"),
    culturally_sensitive_rate: boolRate("culturally_sensitive"),
    timely_delivery_rate: boolRate("timely_delivery"),
    proportionate_rate: boolRate("proportionate_response"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    peers_included_rate: boolRate("peers_included"),
    child_input_rate: boolRate("child_input_sought"),
    progress_tracked_rate: boolRate("progress_tracked"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_reinforcement_type: byType,
    by_praise_quality: byQuality,
    by_child_response: byResponse,
    by_consistency_level: byConsistency,
  };
}

export function identifyPositiveBehaviourAlerts(
  records: PositiveBehaviourReinforcementRecord[],
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

  // Absent praise with negative response — per-record critical
  for (const r of records) {
    if (r.praise_quality === "absent" && r.child_response === "negative") {
      alerts.push({
        type: "absent_negative",
        severity: "critical",
        message: `${r.child_name} receiving no praise and responding negatively — immediate positive intervention needed`,
        id: r.id,
      });
    }
  }

  // Not behaviour specific
  const notSpecific = records.filter((r) => !r.behaviour_specific).length;
  if (notSpecific >= 1) {
    alerts.push({
      type: "not_behaviour_specific",
      severity: "high",
      message: `${notSpecific} ${notSpecific === 1 ? "session has" : "sessions have"} non-specific praise — praise must be linked to specific behaviours`,
      id: "not_behaviour_specific",
    });
  }

  // Not timely
  const notTimely = records.filter((r) => !r.timely_delivery).length;
  if (notTimely >= 1) {
    alerts.push({
      type: "not_timely",
      severity: "high",
      message: `${notTimely} ${notTimely === 1 ? "session has" : "sessions have"} delayed reinforcement — praise must be immediate to be effective`,
      id: "not_timely",
    });
  }

  // No child input
  const noInput = records.filter((r) => !r.child_input_sought).length;
  if (noInput >= 2) {
    alerts.push({
      type: "no_child_input",
      severity: "medium",
      message: `${noInput} sessions without child input on rewards — children should help choose reinforcement`,
      id: "no_child_input",
    });
  }

  // Not culturally sensitive
  const notCultural = records.filter((r) => !r.culturally_sensitive).length;
  if (notCultural >= 2) {
    alerts.push({
      type: "not_culturally_sensitive",
      severity: "medium",
      message: `${notCultural} sessions not culturally sensitive — reinforcement must respect cultural background`,
      id: "not_culturally_sensitive",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    reinforcementType?: ReinforcementType; praiseQuality?: PraiseQuality;
    childResponse?: ChildResponse; consistencyLevel?: ConsistencyLevel; limit?: number;
  },
): Promise<ServiceResult<PositiveBehaviourReinforcementRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  let q = (client.from("cs_positive_behaviour_reinforcement") as SB).select("*").eq("home_id", homeId);
  if (filters?.reinforcementType) q = q.eq("reinforcement_type", filters.reinforcementType);
  if (filters?.praiseQuality) q = q.eq("praise_quality", filters.praiseQuality);
  if (filters?.childResponse) q = q.eq("child_response", filters.childResponse);
  if (filters?.consistencyLevel) q = q.eq("consistency_level", filters.consistencyLevel);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as PositiveBehaviourReinforcementRecord[] };
}

export async function createRecord(payload: {
  homeId: string; reinforcementType: ReinforcementType; praiseQuality: PraiseQuality;
  childResponse: ChildResponse; consistencyLevel: ConsistencyLevel;
  sessionDate: string; childName: string; childId: string | null;
  supportedBy: string; behaviourSpecific: boolean; ageAppropriate: boolean;
  culturallySensitive: boolean; timelyDelivery: boolean; proportionateResponse: boolean;
  carePlanReflects: boolean; socialWorkerInformed: boolean; parentInformed: boolean;
  peersIncluded: boolean; childInputSought: boolean; progressTracked: boolean;
  recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
  nextReviewDate: string | null; notes: string | null;
}): Promise<ServiceResult<PositiveBehaviourReinforcementRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_positive_behaviour_reinforcement") as SB).insert({
    home_id: payload.homeId, reinforcement_type: payload.reinforcementType,
    praise_quality: payload.praiseQuality, child_response: payload.childResponse,
    consistency_level: payload.consistencyLevel, session_date: payload.sessionDate,
    child_name: payload.childName, child_id: payload.childId, supported_by: payload.supportedBy,
    behaviour_specific: payload.behaviourSpecific, age_appropriate: payload.ageAppropriate,
    culturally_sensitive: payload.culturallySensitive, timely_delivery: payload.timelyDelivery,
    proportionate_response: payload.proportionateResponse, care_plan_reflects: payload.carePlanReflects,
    social_worker_informed: payload.socialWorkerInformed, parent_informed: payload.parentInformed,
    peers_included: payload.peersIncluded, child_input_sought: payload.childInputSought,
    progress_tracked: payload.progressTracked, recorded_promptly: payload.recordedPromptly,
    issues_found: payload.issuesFound, actions_taken: payload.actionsTaken,
    next_review_date: payload.nextReviewDate, notes: payload.notes,
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as PositiveBehaviourReinforcementRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    reinforcementType: ReinforcementType; praiseQuality: PraiseQuality;
    childResponse: ChildResponse; consistencyLevel: ConsistencyLevel;
    sessionDate: string; childName: string; childId: string | null;
    supportedBy: string; behaviourSpecific: boolean; ageAppropriate: boolean;
    culturallySensitive: boolean; timelyDelivery: boolean; proportionateResponse: boolean;
    carePlanReflects: boolean; socialWorkerInformed: boolean; parentInformed: boolean;
    peersIncluded: boolean; childInputSought: boolean; progressTracked: boolean;
    recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
    nextReviewDate: string | null; notes: string | null;
  }>,
): Promise<ServiceResult<PositiveBehaviourReinforcementRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.reinforcementType !== undefined) mapped.reinforcement_type = updates.reinforcementType;
  if (updates.praiseQuality !== undefined) mapped.praise_quality = updates.praiseQuality;
  if (updates.childResponse !== undefined) mapped.child_response = updates.childResponse;
  if (updates.consistencyLevel !== undefined) mapped.consistency_level = updates.consistencyLevel;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.behaviourSpecific !== undefined) mapped.behaviour_specific = updates.behaviourSpecific;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.culturallySensitive !== undefined) mapped.culturally_sensitive = updates.culturallySensitive;
  if (updates.timelyDelivery !== undefined) mapped.timely_delivery = updates.timelyDelivery;
  if (updates.proportionateResponse !== undefined) mapped.proportionate_response = updates.proportionateResponse;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.peersIncluded !== undefined) mapped.peers_included = updates.peersIncluded;
  if (updates.childInputSought !== undefined) mapped.child_input_sought = updates.childInputSought;
  if (updates.progressTracked !== undefined) mapped.progress_tracked = updates.progressTracked;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  const { data, error } = await (client.from("cs_positive_behaviour_reinforcement") as SB)
    .update(mapped).eq("id", id).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as PositiveBehaviourReinforcementRecord };
}

export const _testing = { computePositiveBehaviourMetrics, identifyPositiveBehaviourAlerts };
