// ══════════════════════════════════════════════════════════════════════════════
// CARA — SELF-ESTEEM CONFIDENCE BUILDING SERVICE
// Tracks self-esteem interventions, confidence measurements,
// progress assessments, and positive identity development.
// CHR 2015 Reg 10(2)(a) (building self-esteem through relationships),
// Reg 11(2)(a) (promoting positive self-image and identity).
//
// Covers: intervention type, confidence level, progress assessment,
// self-image rating, and identity development.
//
// SCCIF: Experiences — "Children develop positive self-esteem."
// "Staff actively build children's confidence and self-worth."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type InterventionType =
  | "one_to_one_session"
  | "group_activity"
  | "achievement_recognition"
  | "skill_building"
  | "peer_support"
  | "creative_expression"
  | "physical_activity"
  | "therapeutic_support"
  | "role_modelling"
  | "other";

export type ConfidenceLevel =
  | "very_confident"
  | "confident"
  | "developing"
  | "low_confidence"
  | "very_low";

export type ProgressAssessment =
  | "significant_improvement"
  | "some_improvement"
  | "maintained"
  | "slight_decline"
  | "significant_decline";

export type SelfImageRating =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative";

export interface SelfEsteemConfidenceBuildingRecord {
  id: string;
  home_id: string;
  intervention_type: InterventionType;
  confidence_level: ConfidenceLevel;
  progress_assessment: ProgressAssessment;
  self_image_rating: SelfImageRating;
  session_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  child_led_activity: boolean;
  strengths_identified: boolean;
  goals_set: boolean;
  achievements_celebrated: boolean;
  safe_space_provided: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  peers_supportive: boolean;
  culturally_affirming: boolean;
  progress_shared: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const INTERVENTION_TYPES: { type: InterventionType; label: string }[] = [
  { type: "one_to_one_session", label: "One-to-One Session" },
  { type: "group_activity", label: "Group Activity" },
  { type: "achievement_recognition", label: "Achievement Recognition" },
  { type: "skill_building", label: "Skill Building" },
  { type: "peer_support", label: "Peer Support" },
  { type: "creative_expression", label: "Creative Expression" },
  { type: "physical_activity", label: "Physical Activity" },
  { type: "therapeutic_support", label: "Therapeutic Support" },
  { type: "role_modelling", label: "Role Modelling" },
  { type: "other", label: "Other" },
];

export const CONFIDENCE_LEVELS: { level: ConfidenceLevel; label: string }[] = [
  { level: "very_confident", label: "Very Confident" },
  { level: "confident", label: "Confident" },
  { level: "developing", label: "Developing" },
  { level: "low_confidence", label: "Low Confidence" },
  { level: "very_low", label: "Very Low" },
];

export const PROGRESS_ASSESSMENTS: { assessment: ProgressAssessment; label: string }[] = [
  { assessment: "significant_improvement", label: "Significant Improvement" },
  { assessment: "some_improvement", label: "Some Improvement" },
  { assessment: "maintained", label: "Maintained" },
  { assessment: "slight_decline", label: "Slight Decline" },
  { assessment: "significant_decline", label: "Significant Decline" },
];

export const SELF_IMAGE_RATINGS: { rating: SelfImageRating; label: string }[] = [
  { rating: "very_positive", label: "Very Positive" },
  { rating: "positive", label: "Positive" },
  { rating: "neutral", label: "Neutral" },
  { rating: "negative", label: "Negative" },
  { rating: "very_negative", label: "Very Negative" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computeSelfEsteemMetrics(records: SelfEsteemConfidenceBuildingRecord[]): {
  total_sessions: number;
  very_low_count: number;
  decline_count: number;
  negative_image_count: number;
  significant_decline_count: number;
  child_led_rate: number | null;
  strengths_identified_rate: number | null;
  goals_set_rate: number | null;
  achievements_celebrated_rate: number | null;
  safe_space_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  peers_supportive_rate: number | null;
  culturally_affirming_rate: number | null;
  progress_shared_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_intervention_type: Record<string, number>;
  by_confidence_level: Record<string, number>;
  by_progress_assessment: Record<string, number>;
  by_self_image_rating: Record<string, number>;
} {
  const veryLow = records.filter((r) => r.confidence_level === "very_low").length;
  const decline = records.filter((r) => r.progress_assessment === "slight_decline" || r.progress_assessment === "significant_decline").length;
  const negativeImage = records.filter((r) => r.self_image_rating === "negative" || r.self_image_rating === "very_negative").length;
  const significantDecline = records.filter((r) => r.progress_assessment === "significant_decline").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof SelfEsteemConfidenceBuildingRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.intervention_type] = (byType[r.intervention_type] ?? 0) + 1;

  const byConfidence: Record<string, number> = {};
  for (const r of records) byConfidence[r.confidence_level] = (byConfidence[r.confidence_level] ?? 0) + 1;

  const byProgress: Record<string, number> = {};
  for (const r of records) byProgress[r.progress_assessment] = (byProgress[r.progress_assessment] ?? 0) + 1;

  const byImage: Record<string, number> = {};
  for (const r of records) byImage[r.self_image_rating] = (byImage[r.self_image_rating] ?? 0) + 1;

  return {
    total_sessions: records.length,
    very_low_count: veryLow,
    decline_count: decline,
    negative_image_count: negativeImage,
    significant_decline_count: significantDecline,
    child_led_rate: boolRate("child_led_activity"),
    strengths_identified_rate: boolRate("strengths_identified"),
    goals_set_rate: boolRate("goals_set"),
    achievements_celebrated_rate: boolRate("achievements_celebrated"),
    safe_space_rate: boolRate("safe_space_provided"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    peers_supportive_rate: boolRate("peers_supportive"),
    culturally_affirming_rate: boolRate("culturally_affirming"),
    progress_shared_rate: boolRate("progress_shared"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_intervention_type: byType,
    by_confidence_level: byConfidence,
    by_progress_assessment: byProgress,
    by_self_image_rating: byImage,
  };
}

export function identifySelfEsteemAlerts(
  records: SelfEsteemConfidenceBuildingRecord[],
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

  // Very low confidence with significant decline — per-record critical
  for (const r of records) {
    if (r.confidence_level === "very_low" && r.progress_assessment === "significant_decline") {
      alerts.push({
        type: "very_low_declining",
        severity: "critical",
        message: `${r.child_name} has very low confidence with significant decline — urgent therapeutic intervention needed`,
        id: r.id,
      });
    }
  }

  // Strengths not identified
  const noStrengths = records.filter((r) => !r.strengths_identified).length;
  if (noStrengths >= 1) {
    alerts.push({
      type: "no_strengths_identified",
      severity: "high",
      message: `${noStrengths} ${noStrengths === 1 ? "session has" : "sessions have"} no strengths identified — strengths-based approach is essential`,
      id: "no_strengths_identified",
    });
  }

  // Not child-led
  const notChildLed = records.filter((r) => !r.child_led_activity).length;
  if (notChildLed >= 1) {
    alerts.push({
      type: "not_child_led",
      severity: "high",
      message: `${notChildLed} ${notChildLed === 1 ? "session is" : "sessions are"} not child-led — children must have agency in building confidence`,
      id: "not_child_led",
    });
  }

  // No safe space
  const noSafeSpace = records.filter((r) => !r.safe_space_provided).length;
  if (noSafeSpace >= 2) {
    alerts.push({
      type: "no_safe_space",
      severity: "medium",
      message: `${noSafeSpace} sessions without safe space provided — emotional safety is prerequisite`,
      id: "no_safe_space",
    });
  }

  // Not culturally affirming
  const notCultural = records.filter((r) => !r.culturally_affirming).length;
  if (notCultural >= 2) {
    alerts.push({
      type: "not_culturally_affirming",
      severity: "medium",
      message: `${notCultural} sessions not culturally affirming — identity development must respect heritage`,
      id: "not_culturally_affirming",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    interventionType?: InterventionType; confidenceLevel?: ConfidenceLevel;
    progressAssessment?: ProgressAssessment; selfImageRating?: SelfImageRating; limit?: number;
  },
): Promise<ServiceResult<SelfEsteemConfidenceBuildingRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  let q = (client.from("cs_self_esteem_confidence_building") as SB).select("*").eq("home_id", homeId);
  if (filters?.interventionType) q = q.eq("intervention_type", filters.interventionType);
  if (filters?.confidenceLevel) q = q.eq("confidence_level", filters.confidenceLevel);
  if (filters?.progressAssessment) q = q.eq("progress_assessment", filters.progressAssessment);
  if (filters?.selfImageRating) q = q.eq("self_image_rating", filters.selfImageRating);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as SelfEsteemConfidenceBuildingRecord[] };
}

export async function createRecord(payload: {
  homeId: string; interventionType: InterventionType; confidenceLevel: ConfidenceLevel;
  progressAssessment: ProgressAssessment; selfImageRating: SelfImageRating;
  sessionDate: string; childName: string; childId: string | null;
  supportedBy: string; childLedActivity: boolean; strengthsIdentified: boolean;
  goalsSet: boolean; achievementsCelebrated: boolean; safeSpaceProvided: boolean;
  carePlanReflects: boolean; socialWorkerInformed: boolean; parentInformed: boolean;
  peersSupportive: boolean; culturallyAffirming: boolean; progressShared: boolean;
  recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
  nextReviewDate: string | null; notes: string | null;
}): Promise<ServiceResult<SelfEsteemConfidenceBuildingRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_self_esteem_confidence_building") as SB).insert({
    home_id: payload.homeId, intervention_type: payload.interventionType,
    confidence_level: payload.confidenceLevel, progress_assessment: payload.progressAssessment,
    self_image_rating: payload.selfImageRating, session_date: payload.sessionDate,
    child_name: payload.childName, child_id: payload.childId, supported_by: payload.supportedBy,
    child_led_activity: payload.childLedActivity, strengths_identified: payload.strengthsIdentified,
    goals_set: payload.goalsSet, achievements_celebrated: payload.achievementsCelebrated,
    safe_space_provided: payload.safeSpaceProvided, care_plan_reflects: payload.carePlanReflects,
    social_worker_informed: payload.socialWorkerInformed, parent_informed: payload.parentInformed,
    peers_supportive: payload.peersSupportive, culturally_affirming: payload.culturallyAffirming,
    progress_shared: payload.progressShared, recorded_promptly: payload.recordedPromptly,
    issues_found: payload.issuesFound, actions_taken: payload.actionsTaken,
    next_review_date: payload.nextReviewDate, notes: payload.notes,
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as SelfEsteemConfidenceBuildingRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    interventionType: InterventionType; confidenceLevel: ConfidenceLevel;
    progressAssessment: ProgressAssessment; selfImageRating: SelfImageRating;
    sessionDate: string; childName: string; childId: string | null;
    supportedBy: string; childLedActivity: boolean; strengthsIdentified: boolean;
    goalsSet: boolean; achievementsCelebrated: boolean; safeSpaceProvided: boolean;
    carePlanReflects: boolean; socialWorkerInformed: boolean; parentInformed: boolean;
    peersSupportive: boolean; culturallyAffirming: boolean; progressShared: boolean;
    recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
    nextReviewDate: string | null; notes: string | null;
  }>,
): Promise<ServiceResult<SelfEsteemConfidenceBuildingRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.interventionType !== undefined) mapped.intervention_type = updates.interventionType;
  if (updates.confidenceLevel !== undefined) mapped.confidence_level = updates.confidenceLevel;
  if (updates.progressAssessment !== undefined) mapped.progress_assessment = updates.progressAssessment;
  if (updates.selfImageRating !== undefined) mapped.self_image_rating = updates.selfImageRating;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.childLedActivity !== undefined) mapped.child_led_activity = updates.childLedActivity;
  if (updates.strengthsIdentified !== undefined) mapped.strengths_identified = updates.strengthsIdentified;
  if (updates.goalsSet !== undefined) mapped.goals_set = updates.goalsSet;
  if (updates.achievementsCelebrated !== undefined) mapped.achievements_celebrated = updates.achievementsCelebrated;
  if (updates.safeSpaceProvided !== undefined) mapped.safe_space_provided = updates.safeSpaceProvided;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.peersSupportive !== undefined) mapped.peers_supportive = updates.peersSupportive;
  if (updates.culturallyAffirming !== undefined) mapped.culturally_affirming = updates.culturallyAffirming;
  if (updates.progressShared !== undefined) mapped.progress_shared = updates.progressShared;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  const { data, error } = await (client.from("cs_self_esteem_confidence_building") as SB)
    .update(mapped).eq("id", id).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as SelfEsteemConfidenceBuildingRecord };
}

export const _testing = { computeSelfEsteemMetrics, identifySelfEsteemAlerts };
