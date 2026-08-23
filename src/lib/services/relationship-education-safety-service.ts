// ══════════════════════════════════════════════════════════════════════════════
// CARA — RELATIONSHIP EDUCATION SAFETY SERVICE
// Tracks relationship education sessions, consent understanding, online safety,
// personal boundaries, emotional literacy, and age-appropriate content delivery.
// CHR 2015 Reg 12(2)(b) (online safety and relationships),
// Reg 5(c) (healthy relationships).
//
// Covers: topic area, understanding level, engagement quality,
// age appropriateness, and safeguarding in education.
//
// SCCIF: Experiences — "Children understand healthy relationships."
// "Children are supported to stay safe online and in person."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TopicArea =
  | "consent_understanding"
  | "healthy_relationships"
  | "body_safety"
  | "online_safety"
  | "personal_boundaries"
  | "gender_identity"
  | "emotional_literacy"
  | "peer_pressure"
  | "conflict_resolution"
  | "other";

export type UnderstandingLevel =
  | "confident"
  | "good_understanding"
  | "developing"
  | "limited"
  | "not_understood";

export type EngagementQuality =
  | "highly_engaged"
  | "engaged"
  | "partially_engaged"
  | "disengaged"
  | "refused";

export type AgeAppropriateness =
  | "very_appropriate"
  | "appropriate"
  | "somewhat_appropriate"
  | "not_appropriate"
  | "harmful";

export interface RelationshipEducationSafetyRecord {
  id: string;
  home_id: string;
  topic_area: TopicArea;
  understanding_level: UnderstandingLevel;
  engagement_quality: EngagementQuality;
  age_appropriateness: AgeAppropriateness;
  session_date: string;
  child_name: string;
  child_id: string | null;
  delivered_by: string;
  child_consented: boolean;
  age_appropriate_content: boolean;
  safe_space_provided: boolean;
  trigger_warnings_given: boolean;
  child_led_pace: boolean;
  resources_provided: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  follow_up_offered: boolean;
  confidentiality_maintained: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TOPIC_AREAS: { topicArea: TopicArea; label: string }[] = [
  { topicArea: "consent_understanding", label: "Consent Understanding" },
  { topicArea: "healthy_relationships", label: "Healthy Relationships" },
  { topicArea: "body_safety", label: "Body Safety" },
  { topicArea: "online_safety", label: "Online Safety" },
  { topicArea: "personal_boundaries", label: "Personal Boundaries" },
  { topicArea: "gender_identity", label: "Gender Identity" },
  { topicArea: "emotional_literacy", label: "Emotional Literacy" },
  { topicArea: "peer_pressure", label: "Peer Pressure" },
  { topicArea: "conflict_resolution", label: "Conflict Resolution" },
  { topicArea: "other", label: "Other" },
];

export const UNDERSTANDING_LEVELS: { level: UnderstandingLevel; label: string }[] = [
  { level: "confident", label: "Confident" },
  { level: "good_understanding", label: "Good Understanding" },
  { level: "developing", label: "Developing" },
  { level: "limited", label: "Limited" },
  { level: "not_understood", label: "Not Understood" },
];

export const ENGAGEMENT_QUALITIES: { quality: EngagementQuality; label: string }[] = [
  { quality: "highly_engaged", label: "Highly Engaged" },
  { quality: "engaged", label: "Engaged" },
  { quality: "partially_engaged", label: "Partially Engaged" },
  { quality: "disengaged", label: "Disengaged" },
  { quality: "refused", label: "Refused" },
];

export const AGE_APPROPRIATENESS_LEVELS: { appropriateness: AgeAppropriateness; label: string }[] = [
  { appropriateness: "very_appropriate", label: "Very Appropriate" },
  { appropriateness: "appropriate", label: "Appropriate" },
  { appropriateness: "somewhat_appropriate", label: "Somewhat Appropriate" },
  { appropriateness: "not_appropriate", label: "Not Appropriate" },
  { appropriateness: "harmful", label: "Harmful" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computeRelationshipEducationMetrics(records: RelationshipEducationSafetyRecord[]): {
  total_sessions: number;
  not_understood_count: number;
  disengaged_count: number;
  not_appropriate_count: number;
  harmful_count: number;
  child_consented_rate: number | null;
  age_appropriate_content_rate: number | null;
  safe_space_rate: number | null;
  trigger_warnings_rate: number | null;
  child_led_pace_rate: number | null;
  resources_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  follow_up_rate: number | null;
  confidentiality_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_topic_area: Record<string, number>;
  by_understanding_level: Record<string, number>;
  by_engagement_quality: Record<string, number>;
  by_age_appropriateness: Record<string, number>;
} {
  const notUnderstood = records.filter((r) => r.understanding_level === "not_understood").length;
  const disengaged = records.filter((r) => r.engagement_quality === "disengaged" || r.engagement_quality === "refused").length;
  const notAppropriate = records.filter((r) => r.age_appropriateness === "not_appropriate" || r.age_appropriateness === "harmful").length;
  const harmful = records.filter((r) => r.age_appropriateness === "harmful").length;

  const boolRate = (field: keyof RelationshipEducationSafetyRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byTopic: Record<string, number> = {};
  for (const r of records) byTopic[r.topic_area] = (byTopic[r.topic_area] ?? 0) + 1;

  const byUnderstanding: Record<string, number> = {};
  for (const r of records) byUnderstanding[r.understanding_level] = (byUnderstanding[r.understanding_level] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.engagement_quality] = (byEngagement[r.engagement_quality] ?? 0) + 1;

  const byAppropriateness: Record<string, number> = {};
  for (const r of records) byAppropriateness[r.age_appropriateness] = (byAppropriateness[r.age_appropriateness] ?? 0) + 1;

  return {
    total_sessions: records.length,
    not_understood_count: notUnderstood,
    disengaged_count: disengaged,
    not_appropriate_count: notAppropriate,
    harmful_count: harmful,
    child_consented_rate: boolRate("child_consented"),
    age_appropriate_content_rate: boolRate("age_appropriate_content"),
    safe_space_rate: boolRate("safe_space_provided"),
    trigger_warnings_rate: boolRate("trigger_warnings_given"),
    child_led_pace_rate: boolRate("child_led_pace"),
    resources_rate: boolRate("resources_provided"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    follow_up_rate: boolRate("follow_up_offered"),
    confidentiality_rate: boolRate("confidentiality_maintained"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_topic_area: byTopic,
    by_understanding_level: byUnderstanding,
    by_engagement_quality: byEngagement,
    by_age_appropriateness: byAppropriateness,
  };
}

export function identifyRelationshipEducationAlerts(
  records: RelationshipEducationSafetyRecord[],
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

  // Harmful content with not understood — per-record critical
  for (const r of records) {
    if (r.age_appropriateness === "harmful" && r.understanding_level === "not_understood") {
      alerts.push({
        type: "harmful_not_understood",
        severity: "critical",
        message: `${r.child_name} exposed to harmful content with no understanding — immediate safeguarding review needed`,
        id: r.id,
      });
    }
  }

  // No safe space provided
  const noSafeSpace = records.filter((r) => !r.safe_space_provided).length;
  if (noSafeSpace >= 1) {
    alerts.push({
      type: "no_safe_space",
      severity: "high",
      message: `${noSafeSpace} ${noSafeSpace === 1 ? "session has" : "sessions have"} no safe space provided — essential for sensitive topics`,
      id: "no_safe_space",
    });
  }

  // No consent obtained
  const noConsent = records.filter((r) => !r.child_consented).length;
  if (noConsent >= 1) {
    alerts.push({
      type: "no_consent",
      severity: "high",
      message: `${noConsent} ${noConsent === 1 ? "session has" : "sessions have"} no child consent obtained — consent is fundamental`,
      id: "no_consent",
    });
  }

  // No trigger warnings
  const noTriggerWarnings = records.filter((r) => !r.trigger_warnings_given).length;
  if (noTriggerWarnings >= 2) {
    alerts.push({
      type: "no_trigger_warnings",
      severity: "medium",
      message: `${noTriggerWarnings} sessions without trigger warnings — children must be prepared for sensitive content`,
      id: "no_trigger_warnings",
    });
  }

  // No confidentiality maintained
  const noConfidentiality = records.filter((r) => !r.confidentiality_maintained).length;
  if (noConfidentiality >= 2) {
    alerts.push({
      type: "no_confidentiality",
      severity: "medium",
      message: `${noConfidentiality} sessions without confidentiality maintained — trust and safety must be protected`,
      id: "no_confidentiality",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    topicArea?: TopicArea; understandingLevel?: UnderstandingLevel;
    engagementQuality?: EngagementQuality; ageAppropriateness?: AgeAppropriateness; limit?: number;
  },
): Promise<ServiceResult<RelationshipEducationSafetyRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  let q = (client.from("cs_relationship_education_safety") as SB).select("*").eq("home_id", homeId);
  if (filters?.topicArea) q = q.eq("topic_area", filters.topicArea);
  if (filters?.understandingLevel) q = q.eq("understanding_level", filters.understandingLevel);
  if (filters?.engagementQuality) q = q.eq("engagement_quality", filters.engagementQuality);
  if (filters?.ageAppropriateness) q = q.eq("age_appropriateness", filters.ageAppropriateness);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as RelationshipEducationSafetyRecord[] };
}

export async function createRecord(payload: {
  homeId: string; topicArea: TopicArea; understandingLevel: UnderstandingLevel;
  engagementQuality: EngagementQuality; ageAppropriateness: AgeAppropriateness;
  sessionDate: string; childName: string; childId: string | null;
  deliveredBy: string; childConsented: boolean; ageAppropriateContent: boolean;
  safeSpaceProvided: boolean; triggerWarningsGiven: boolean; childLedPace: boolean;
  resourcesProvided: boolean; carePlanReflects: boolean; socialWorkerInformed: boolean;
  parentInformed: boolean; followUpOffered: boolean; confidentialityMaintained: boolean;
  recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
  nextReviewDate: string | null; notes: string | null;
}): Promise<ServiceResult<RelationshipEducationSafetyRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_relationship_education_safety") as SB).insert({
    home_id: payload.homeId, topic_area: payload.topicArea,
    understanding_level: payload.understandingLevel, engagement_quality: payload.engagementQuality,
    age_appropriateness: payload.ageAppropriateness, session_date: payload.sessionDate,
    child_name: payload.childName, child_id: payload.childId, delivered_by: payload.deliveredBy,
    child_consented: payload.childConsented, age_appropriate_content: payload.ageAppropriateContent,
    safe_space_provided: payload.safeSpaceProvided, trigger_warnings_given: payload.triggerWarningsGiven,
    child_led_pace: payload.childLedPace, resources_provided: payload.resourcesProvided,
    care_plan_reflects: payload.carePlanReflects, social_worker_informed: payload.socialWorkerInformed,
    parent_informed: payload.parentInformed, follow_up_offered: payload.followUpOffered,
    confidentiality_maintained: payload.confidentialityMaintained, recorded_promptly: payload.recordedPromptly,
    issues_found: payload.issuesFound, actions_taken: payload.actionsTaken,
    next_review_date: payload.nextReviewDate, notes: payload.notes,
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as RelationshipEducationSafetyRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    topicArea: TopicArea; understandingLevel: UnderstandingLevel;
    engagementQuality: EngagementQuality; ageAppropriateness: AgeAppropriateness;
    sessionDate: string; childName: string; childId: string | null;
    deliveredBy: string; childConsented: boolean; ageAppropriateContent: boolean;
    safeSpaceProvided: boolean; triggerWarningsGiven: boolean; childLedPace: boolean;
    resourcesProvided: boolean; carePlanReflects: boolean; socialWorkerInformed: boolean;
    parentInformed: boolean; followUpOffered: boolean; confidentialityMaintained: boolean;
    recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
    nextReviewDate: string | null; notes: string | null;
  }>,
): Promise<ServiceResult<RelationshipEducationSafetyRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.topicArea !== undefined) mapped.topic_area = updates.topicArea;
  if (updates.understandingLevel !== undefined) mapped.understanding_level = updates.understandingLevel;
  if (updates.engagementQuality !== undefined) mapped.engagement_quality = updates.engagementQuality;
  if (updates.ageAppropriateness !== undefined) mapped.age_appropriateness = updates.ageAppropriateness;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.deliveredBy !== undefined) mapped.delivered_by = updates.deliveredBy;
  if (updates.childConsented !== undefined) mapped.child_consented = updates.childConsented;
  if (updates.ageAppropriateContent !== undefined) mapped.age_appropriate_content = updates.ageAppropriateContent;
  if (updates.safeSpaceProvided !== undefined) mapped.safe_space_provided = updates.safeSpaceProvided;
  if (updates.triggerWarningsGiven !== undefined) mapped.trigger_warnings_given = updates.triggerWarningsGiven;
  if (updates.childLedPace !== undefined) mapped.child_led_pace = updates.childLedPace;
  if (updates.resourcesProvided !== undefined) mapped.resources_provided = updates.resourcesProvided;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.followUpOffered !== undefined) mapped.follow_up_offered = updates.followUpOffered;
  if (updates.confidentialityMaintained !== undefined) mapped.confidentiality_maintained = updates.confidentialityMaintained;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  const { data, error } = await (client.from("cs_relationship_education_safety") as SB)
    .update(mapped).eq("id", id).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as RelationshipEducationSafetyRecord };
}

export const _testing = { computeRelationshipEducationMetrics, identifyRelationshipEducationAlerts };
