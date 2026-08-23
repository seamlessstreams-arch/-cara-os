// ══════════════════════════════════════════════════════════════════════════════
// CARA — LEISURE RECREATION ACTIVITIES SERVICE
// Tracks leisure activities, hobbies, recreational participation,
// community engagement, and enrichment opportunities.
// CHR 2015 Reg 9(2)(a) (leisure activities appropriate to needs),
// Reg 9(2)(b) (opportunity for hobbies and interests).
//
// Covers: activity type, participation level, enjoyment rating,
// skill development, and community integration.
//
// SCCIF: Experiences — "Children enjoy a range of leisure activities."
// "Hobbies and interests are actively supported and encouraged."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ActivityType =
  | "sport"
  | "creative_arts"
  | "music"
  | "outdoor_adventure"
  | "community_group"
  | "cultural_activity"
  | "reading_library"
  | "gaming_technology"
  | "cooking_baking"
  | "other";

export type ParticipationLevel =
  | "enthusiastic"
  | "willing"
  | "reluctant"
  | "refused"
  | "unable";

export type EnjoymentRating =
  | "loved_it"
  | "enjoyed"
  | "neutral"
  | "disliked"
  | "hated";

export type SkillDevelopment =
  | "significant_growth"
  | "good_growth"
  | "some_growth"
  | "no_growth"
  | "decline";

export interface LeisureRecreationActivitiesRecord {
  id: string;
  home_id: string;
  activity_type: ActivityType;
  participation_level: ParticipationLevel;
  enjoyment_rating: EnjoymentRating;
  skill_development: SkillDevelopment;
  activity_date: string;
  child_name: string;
  child_id: string | null;
  facilitated_by: string;
  child_chose_activity: boolean;
  age_appropriate: boolean;
  inclusive_access: boolean;
  peer_interaction: boolean;
  community_based: boolean;
  new_experience: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  risk_assessed: boolean;
  transport_arranged: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ACTIVITY_TYPES: { type: ActivityType; label: string }[] = [
  { type: "sport", label: "Sport" },
  { type: "creative_arts", label: "Creative Arts" },
  { type: "music", label: "Music" },
  { type: "outdoor_adventure", label: "Outdoor Adventure" },
  { type: "community_group", label: "Community Group" },
  { type: "cultural_activity", label: "Cultural Activity" },
  { type: "reading_library", label: "Reading / Library" },
  { type: "gaming_technology", label: "Gaming / Technology" },
  { type: "cooking_baking", label: "Cooking / Baking" },
  { type: "other", label: "Other" },
];

export const PARTICIPATION_LEVELS: { level: ParticipationLevel; label: string }[] = [
  { level: "enthusiastic", label: "Enthusiastic" },
  { level: "willing", label: "Willing" },
  { level: "reluctant", label: "Reluctant" },
  { level: "refused", label: "Refused" },
  { level: "unable", label: "Unable" },
];

export const ENJOYMENT_RATINGS: { rating: EnjoymentRating; label: string }[] = [
  { rating: "loved_it", label: "Loved It" },
  { rating: "enjoyed", label: "Enjoyed" },
  { rating: "neutral", label: "Neutral" },
  { rating: "disliked", label: "Disliked" },
  { rating: "hated", label: "Hated" },
];

export const SKILL_DEVELOPMENTS: { development: SkillDevelopment; label: string }[] = [
  { development: "significant_growth", label: "Significant Growth" },
  { development: "good_growth", label: "Good Growth" },
  { development: "some_growth", label: "Some Growth" },
  { development: "no_growth", label: "No Growth" },
  { development: "decline", label: "Decline" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeLeisureRecreationMetrics(
  records: LeisureRecreationActivitiesRecord[],
): {
  total_activities: number;
  refused_count: number;
  disliked_count: number;
  decline_count: number;
  no_choice_count: number;
  child_chose_rate: number | null;
  age_appropriate_rate: number | null;
  inclusive_access_rate: number | null;
  peer_interaction_rate: number | null;
  community_based_rate: number | null;
  new_experience_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  risk_assessed_rate: number | null;
  transport_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_activity_type: Record<string, number>;
  by_participation_level: Record<string, number>;
  by_enjoyment_rating: Record<string, number>;
  by_skill_development: Record<string, number>;
} {
  const refused = records.filter((r) => r.participation_level === "refused").length;
  const disliked = records.filter((r) => r.enjoyment_rating === "disliked" || r.enjoyment_rating === "hated").length;
  const decline = records.filter((r) => r.skill_development === "decline").length;
  const noChoice = records.filter((r) => !r.child_chose_activity).length;

  const boolRate = (field: keyof LeisureRecreationActivitiesRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.activity_type] = (byType[r.activity_type] ?? 0) + 1;

  const byParticipation: Record<string, number> = {};
  for (const r of records) byParticipation[r.participation_level] = (byParticipation[r.participation_level] ?? 0) + 1;

  const byEnjoyment: Record<string, number> = {};
  for (const r of records) byEnjoyment[r.enjoyment_rating] = (byEnjoyment[r.enjoyment_rating] ?? 0) + 1;

  const bySkill: Record<string, number> = {};
  for (const r of records) bySkill[r.skill_development] = (bySkill[r.skill_development] ?? 0) + 1;

  return {
    total_activities: records.length,
    refused_count: refused,
    disliked_count: disliked,
    decline_count: decline,
    no_choice_count: noChoice,
    child_chose_rate: boolRate("child_chose_activity"),
    age_appropriate_rate: boolRate("age_appropriate"),
    inclusive_access_rate: boolRate("inclusive_access"),
    peer_interaction_rate: boolRate("peer_interaction"),
    community_based_rate: boolRate("community_based"),
    new_experience_rate: boolRate("new_experience"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    risk_assessed_rate: boolRate("risk_assessed"),
    transport_rate: boolRate("transport_arranged"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_activity_type: byType,
    by_participation_level: byParticipation,
    by_enjoyment_rating: byEnjoyment,
    by_skill_development: bySkill,
  };
}

export function identifyLeisureRecreationAlerts(
  records: LeisureRecreationActivitiesRecord[],
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

  // Refused and declining — per-record critical
  for (const r of records) {
    if (r.participation_level === "refused" && r.skill_development === "decline") {
      alerts.push({
        type: "refused_declining",
        severity: "critical",
        message: `${r.child_name} refused ${r.activity_type.replace(/_/g, " ")} and showing skill decline — explore barriers and motivations`,
        id: r.id,
      });
    }
  }

  // No child choice
  const noChoice = records.filter((r) => !r.child_chose_activity).length;
  if (noChoice >= 1) {
    alerts.push({
      type: "no_child_choice",
      severity: "high",
      message: `${noChoice} ${noChoice === 1 ? "activity has" : "activities have"} child not choosing — ensure child-led participation`,
      id: "no_child_choice",
    });
  }

  // Not inclusive
  const notInclusive = records.filter((r) => !r.inclusive_access).length;
  if (notInclusive >= 1) {
    alerts.push({
      type: "not_inclusive",
      severity: "high",
      message: `${notInclusive} ${notInclusive === 1 ? "activity has" : "activities have"} inclusive access not ensured — review accessibility`,
      id: "not_inclusive",
    });
  }

  // Not risk assessed
  const noRisk = records.filter((r) => !r.risk_assessed).length;
  if (noRisk >= 2) {
    alerts.push({
      type: "not_risk_assessed",
      severity: "medium",
      message: `${noRisk} activities without risk assessment — ensure all activities are properly assessed`,
      id: "not_risk_assessed",
    });
  }

  // No community activities
  const noCommunity = records.filter((r) => !r.community_based).length;
  if (noCommunity >= 2) {
    alerts.push({
      type: "no_community_activities",
      severity: "medium",
      message: `${noCommunity} activities not community-based — increase community integration opportunities`,
      id: "no_community_activities",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    activityType?: ActivityType;
    participationLevel?: ParticipationLevel;
    enjoymentRating?: EnjoymentRating;
    skillDevelopment?: SkillDevelopment;
    limit?: number;
  },
): Promise<ServiceResult<LeisureRecreationActivitiesRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_leisure_recreation_activities") as SB).select("*").eq("home_id", homeId);
  if (filters?.activityType) q = q.eq("activity_type", filters.activityType);
  if (filters?.participationLevel) q = q.eq("participation_level", filters.participationLevel);
  if (filters?.enjoymentRating) q = q.eq("enjoyment_rating", filters.enjoymentRating);
  if (filters?.skillDevelopment) q = q.eq("skill_development", filters.skillDevelopment);
  q = q.order("activity_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as LeisureRecreationActivitiesRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  activityType: ActivityType;
  participationLevel: ParticipationLevel;
  enjoymentRating: EnjoymentRating;
  skillDevelopment: SkillDevelopment;
  activityDate: string;
  childName: string;
  childId?: string | null;
  facilitatedBy: string;
  childChoseActivity?: boolean;
  ageAppropriate?: boolean;
  inclusiveAccess?: boolean;
  peerInteraction?: boolean;
  communityBased?: boolean;
  newExperience?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  parentInformed?: boolean;
  riskAssessed?: boolean;
  transportArranged?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<LeisureRecreationActivitiesRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_leisure_recreation_activities") as SB)
    .insert({
      home_id: payload.homeId,
      activity_type: payload.activityType,
      participation_level: payload.participationLevel,
      enjoyment_rating: payload.enjoymentRating,
      skill_development: payload.skillDevelopment,
      activity_date: payload.activityDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      facilitated_by: payload.facilitatedBy,
      child_chose_activity: payload.childChoseActivity ?? true,
      age_appropriate: payload.ageAppropriate ?? true,
      inclusive_access: payload.inclusiveAccess ?? true,
      peer_interaction: payload.peerInteraction ?? true,
      community_based: payload.communityBased ?? true,
      new_experience: payload.newExperience ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? true,
      risk_assessed: payload.riskAssessed ?? true,
      transport_arranged: payload.transportArranged ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as LeisureRecreationActivitiesRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    activityType: ActivityType;
    participationLevel: ParticipationLevel;
    enjoymentRating: EnjoymentRating;
    skillDevelopment: SkillDevelopment;
    activityDate: string;
    childName: string;
    childId: string | null;
    facilitatedBy: string;
    childChoseActivity: boolean;
    ageAppropriate: boolean;
    inclusiveAccess: boolean;
    peerInteraction: boolean;
    communityBased: boolean;
    newExperience: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    riskAssessed: boolean;
    transportArranged: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<LeisureRecreationActivitiesRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.activityType !== undefined) mapped.activity_type = updates.activityType;
  if (updates.participationLevel !== undefined) mapped.participation_level = updates.participationLevel;
  if (updates.enjoymentRating !== undefined) mapped.enjoyment_rating = updates.enjoymentRating;
  if (updates.skillDevelopment !== undefined) mapped.skill_development = updates.skillDevelopment;
  if (updates.activityDate !== undefined) mapped.activity_date = updates.activityDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.facilitatedBy !== undefined) mapped.facilitated_by = updates.facilitatedBy;
  if (updates.childChoseActivity !== undefined) mapped.child_chose_activity = updates.childChoseActivity;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.inclusiveAccess !== undefined) mapped.inclusive_access = updates.inclusiveAccess;
  if (updates.peerInteraction !== undefined) mapped.peer_interaction = updates.peerInteraction;
  if (updates.communityBased !== undefined) mapped.community_based = updates.communityBased;
  if (updates.newExperience !== undefined) mapped.new_experience = updates.newExperience;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.riskAssessed !== undefined) mapped.risk_assessed = updates.riskAssessed;
  if (updates.transportArranged !== undefined) mapped.transport_arranged = updates.transportArranged;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_leisure_recreation_activities") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as LeisureRecreationActivitiesRecord };
}

export const _testing = { computeLeisureRecreationMetrics, identifyLeisureRecreationAlerts };
