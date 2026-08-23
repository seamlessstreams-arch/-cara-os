// ══════════════════════════════════════════════════════════════════════════════
// CARA — CREATIVE ENRICHMENT ACTIVITIES SERVICE
// Monitors participation in creative arts, hobbies,
// enrichment programmes, and cultural activities.
// CHR 2015 Reg 9 (leisure activities — creative expression),
// Reg 7 (children's wishes — interests and hobbies).
//
// Covers: activity type, engagement level, skill development,
// creative output, and therapeutic value.
//
// SCCIF: Experiences — "Children enjoy diverse creative opportunities."
// "Enrichment activities support emotional wellbeing."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type CreativeActivityType =
  | "art_drawing"
  | "music_instrument"
  | "singing_choir"
  | "drama_theatre"
  | "dance_movement"
  | "creative_writing"
  | "photography"
  | "cooking_baking"
  | "crafts_making"
  | "other";

export type EngagementLevel =
  | "deeply_engaged"
  | "engaged"
  | "participating"
  | "reluctant"
  | "refused";

export type SkillDevelopment =
  | "significant_progress"
  | "good_progress"
  | "some_progress"
  | "no_progress"
  | "not_assessed";

export type CreativeOutput =
  | "exhibited_shared"
  | "completed_piece"
  | "work_in_progress"
  | "exploratory"
  | "no_output";

export interface CreativeEnrichmentActivitiesRecord {
  id: string;
  home_id: string;
  activity_type: CreativeActivityType;
  engagement_level: EngagementLevel;
  skill_development: SkillDevelopment;
  creative_output: CreativeOutput;
  activity_date: string;
  child_name: string;
  child_id: string | null;
  facilitated_by: string;
  child_choice_offered: boolean;
  age_appropriate: boolean;
  therapeutic_value: boolean;
  peer_interaction: boolean;
  self_expression_supported: boolean;
  achievement_recognised: boolean;
  resources_available: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  family_updated: boolean;
  continuation_planned: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CREATIVE_ACTIVITY_TYPES: { type: CreativeActivityType; label: string }[] = [
  { type: "art_drawing", label: "Art/Drawing" },
  { type: "music_instrument", label: "Music/Instrument" },
  { type: "singing_choir", label: "Singing/Choir" },
  { type: "drama_theatre", label: "Drama/Theatre" },
  { type: "dance_movement", label: "Dance/Movement" },
  { type: "creative_writing", label: "Creative Writing" },
  { type: "photography", label: "Photography" },
  { type: "cooking_baking", label: "Cooking/Baking" },
  { type: "crafts_making", label: "Crafts/Making" },
  { type: "other", label: "Other" },
];

export const ENGAGEMENT_LEVELS: { level: EngagementLevel; label: string }[] = [
  { level: "deeply_engaged", label: "Deeply Engaged" },
  { level: "engaged", label: "Engaged" },
  { level: "participating", label: "Participating" },
  { level: "reluctant", label: "Reluctant" },
  { level: "refused", label: "Refused" },
];

export const SKILL_DEVELOPMENTS: { development: SkillDevelopment; label: string }[] = [
  { development: "significant_progress", label: "Significant Progress" },
  { development: "good_progress", label: "Good Progress" },
  { development: "some_progress", label: "Some Progress" },
  { development: "no_progress", label: "No Progress" },
  { development: "not_assessed", label: "Not Assessed" },
];

export const CREATIVE_OUTPUTS: { output: CreativeOutput; label: string }[] = [
  { output: "exhibited_shared", label: "Exhibited/Shared" },
  { output: "completed_piece", label: "Completed Piece" },
  { output: "work_in_progress", label: "Work in Progress" },
  { output: "exploratory", label: "Exploratory" },
  { output: "no_output", label: "No Output" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeCreativeEnrichmentMetrics(
  records: CreativeEnrichmentActivitiesRecord[],
): {
  total_activities: number;
  refused_count: number;
  reluctant_count: number;
  no_progress_count: number;
  no_output_count: number;
  child_choice_rate: number | null;
  age_appropriate_rate: number | null;
  therapeutic_value_rate: number | null;
  peer_interaction_rate: number | null;
  self_expression_rate: number | null;
  achievement_rate: number | null;
  resources_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  family_updated_rate: number | null;
  continuation_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_activity_type: Record<string, number>;
  by_engagement_level: Record<string, number>;
  by_skill_development: Record<string, number>;
  by_creative_output: Record<string, number>;
} {
  const refused = records.filter((r) => r.engagement_level === "refused").length;
  const reluctant = records.filter((r) => r.engagement_level === "reluctant").length;
  const noProgress = records.filter((r) => r.skill_development === "no_progress").length;
  const noOutput = records.filter((r) => r.creative_output === "no_output").length;

  const boolRate = (field: keyof CreativeEnrichmentActivitiesRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.activity_type] = (byType[r.activity_type] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.engagement_level] = (byEngagement[r.engagement_level] ?? 0) + 1;

  const bySkill: Record<string, number> = {};
  for (const r of records) bySkill[r.skill_development] = (bySkill[r.skill_development] ?? 0) + 1;

  const byOutput: Record<string, number> = {};
  for (const r of records) byOutput[r.creative_output] = (byOutput[r.creative_output] ?? 0) + 1;

  return {
    total_activities: records.length,
    refused_count: refused,
    reluctant_count: reluctant,
    no_progress_count: noProgress,
    no_output_count: noOutput,
    child_choice_rate: boolRate("child_choice_offered"),
    age_appropriate_rate: boolRate("age_appropriate"),
    therapeutic_value_rate: boolRate("therapeutic_value"),
    peer_interaction_rate: boolRate("peer_interaction"),
    self_expression_rate: boolRate("self_expression_supported"),
    achievement_rate: boolRate("achievement_recognised"),
    resources_rate: boolRate("resources_available"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    family_updated_rate: boolRate("family_updated"),
    continuation_rate: boolRate("continuation_planned"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_activity_type: byType,
    by_engagement_level: byEngagement,
    by_skill_development: bySkill,
    by_creative_output: byOutput,
  };
}

export function identifyCreativeEnrichmentAlerts(
  records: CreativeEnrichmentActivitiesRecord[],
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

  // Refused with no self-expression support — per-record
  for (const r of records) {
    if (r.engagement_level === "refused" && !r.self_expression_supported) {
      alerts.push({
        type: "refused_no_expression",
        severity: "critical",
        message: `${r.child_name} refused ${r.activity_type.replace(/_/g, " ")} without self-expression support — explore alternative creative outlets`,
        id: r.id,
      });
    }
  }

  // Achievement not recognised
  const noAchievement = records.filter((r) => !r.achievement_recognised).length;
  if (noAchievement >= 1) {
    alerts.push({
      type: "achievement_not_recognised",
      severity: "high",
      message: `${noAchievement} ${noAchievement === 1 ? "activity has" : "activities have"} achievement not recognised — celebrate creative efforts`,
      id: "achievement_not_recognised",
    });
  }

  // No child choice offered
  const noChoice = records.filter((r) => !r.child_choice_offered).length;
  if (noChoice >= 1) {
    alerts.push({
      type: "no_child_choice",
      severity: "high",
      message: `${noChoice} ${noChoice === 1 ? "activity has" : "activities have"} no child choice offered — ensure child-led participation`,
      id: "no_child_choice",
    });
  }

  // Continuation not planned
  const noContinuation = records.filter((r) => !r.continuation_planned).length;
  if (noContinuation >= 2) {
    alerts.push({
      type: "continuation_not_planned",
      severity: "medium",
      message: `${noContinuation} activities without continuation planned — sustain creative engagement`,
      id: "continuation_not_planned",
    });
  }

  // Resources not available
  const noResources = records.filter((r) => !r.resources_available).length;
  if (noResources >= 2) {
    alerts.push({
      type: "resources_not_available",
      severity: "medium",
      message: `${noResources} activities with insufficient resources — review creative provisions`,
      id: "resources_not_available",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    activityType?: CreativeActivityType;
    engagementLevel?: EngagementLevel;
    skillDevelopment?: SkillDevelopment;
    creativeOutput?: CreativeOutput;
    limit?: number;
  },
): Promise<ServiceResult<CreativeEnrichmentActivitiesRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_creative_enrichment_activities") as SB).select("*").eq("home_id", homeId);
  if (filters?.activityType) q = q.eq("activity_type", filters.activityType);
  if (filters?.engagementLevel) q = q.eq("engagement_level", filters.engagementLevel);
  if (filters?.skillDevelopment) q = q.eq("skill_development", filters.skillDevelopment);
  if (filters?.creativeOutput) q = q.eq("creative_output", filters.creativeOutput);
  q = q.order("activity_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as CreativeEnrichmentActivitiesRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  activityType: CreativeActivityType;
  engagementLevel: EngagementLevel;
  skillDevelopment: SkillDevelopment;
  creativeOutput: CreativeOutput;
  activityDate: string;
  childName: string;
  childId?: string | null;
  facilitatedBy: string;
  childChoiceOffered?: boolean;
  ageAppropriate?: boolean;
  therapeuticValue?: boolean;
  peerInteraction?: boolean;
  selfExpressionSupported?: boolean;
  achievementRecognised?: boolean;
  resourcesAvailable?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  familyUpdated?: boolean;
  continuationPlanned?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<CreativeEnrichmentActivitiesRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_creative_enrichment_activities") as SB)
    .insert({
      home_id: payload.homeId,
      activity_type: payload.activityType,
      engagement_level: payload.engagementLevel,
      skill_development: payload.skillDevelopment,
      creative_output: payload.creativeOutput,
      activity_date: payload.activityDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      facilitated_by: payload.facilitatedBy,
      child_choice_offered: payload.childChoiceOffered ?? true,
      age_appropriate: payload.ageAppropriate ?? true,
      therapeutic_value: payload.therapeuticValue ?? true,
      peer_interaction: payload.peerInteraction ?? true,
      self_expression_supported: payload.selfExpressionSupported ?? true,
      achievement_recognised: payload.achievementRecognised ?? true,
      resources_available: payload.resourcesAvailable ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      family_updated: payload.familyUpdated ?? true,
      continuation_planned: payload.continuationPlanned ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as CreativeEnrichmentActivitiesRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    activityType: CreativeActivityType;
    engagementLevel: EngagementLevel;
    skillDevelopment: SkillDevelopment;
    creativeOutput: CreativeOutput;
    activityDate: string;
    childName: string;
    childId: string | null;
    facilitatedBy: string;
    childChoiceOffered: boolean;
    ageAppropriate: boolean;
    therapeuticValue: boolean;
    peerInteraction: boolean;
    selfExpressionSupported: boolean;
    achievementRecognised: boolean;
    resourcesAvailable: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    familyUpdated: boolean;
    continuationPlanned: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<CreativeEnrichmentActivitiesRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.activityType !== undefined) mapped.activity_type = updates.activityType;
  if (updates.engagementLevel !== undefined) mapped.engagement_level = updates.engagementLevel;
  if (updates.skillDevelopment !== undefined) mapped.skill_development = updates.skillDevelopment;
  if (updates.creativeOutput !== undefined) mapped.creative_output = updates.creativeOutput;
  if (updates.activityDate !== undefined) mapped.activity_date = updates.activityDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.facilitatedBy !== undefined) mapped.facilitated_by = updates.facilitatedBy;
  if (updates.childChoiceOffered !== undefined) mapped.child_choice_offered = updates.childChoiceOffered;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.therapeuticValue !== undefined) mapped.therapeutic_value = updates.therapeuticValue;
  if (updates.peerInteraction !== undefined) mapped.peer_interaction = updates.peerInteraction;
  if (updates.selfExpressionSupported !== undefined) mapped.self_expression_supported = updates.selfExpressionSupported;
  if (updates.achievementRecognised !== undefined) mapped.achievement_recognised = updates.achievementRecognised;
  if (updates.resourcesAvailable !== undefined) mapped.resources_available = updates.resourcesAvailable;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.familyUpdated !== undefined) mapped.family_updated = updates.familyUpdated;
  if (updates.continuationPlanned !== undefined) mapped.continuation_planned = updates.continuationPlanned;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_creative_enrichment_activities") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as CreativeEnrichmentActivitiesRecord };
}

export const _testing = { computeCreativeEnrichmentMetrics, identifyCreativeEnrichmentAlerts };
