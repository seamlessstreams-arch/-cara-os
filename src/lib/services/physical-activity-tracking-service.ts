// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PHYSICAL ACTIVITY TRACKING SERVICE
// Monitors physical activity, exercise, sports participation,
// and active lifestyle support for children in care.
// CHR 2015 Reg 12 (health and wellbeing — physical health),
// Reg 9 (leisure activities — active lifestyle).
//
// Covers: activity type, participation level, fitness assessment,
// enjoyment rating, and health impact.
//
// SCCIF: Experiences — "Children enjoy a range of physical activities."
// "Health and fitness are actively promoted."
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

export type ActivityType =
  | "team_sport"
  | "individual_sport"
  | "swimming"
  | "gym_fitness"
  | "dance"
  | "martial_arts"
  | "outdoor_adventure"
  | "walking_cycling"
  | "playground"
  | "other";

export type ParticipationLevel =
  | "enthusiastic"
  | "willing"
  | "reluctant"
  | "refused"
  | "unable";

export type FitnessAssessment =
  | "excellent"
  | "good"
  | "average"
  | "below_average"
  | "not_assessed";

export type EnjoymentRating =
  | "loved_it"
  | "enjoyed"
  | "neutral"
  | "disliked"
  | "refused_to_rate";

export interface PhysicalActivityTrackingRecord {
  id: string;
  home_id: string;
  activity_type: ActivityType;
  participation_level: ParticipationLevel;
  fitness_assessment: FitnessAssessment;
  enjoyment_rating: EnjoymentRating;
  activity_date: string;
  child_name: string;
  child_id: string | null;
  supervised_by: string;
  child_choice_offered: boolean;
  age_appropriate: boolean;
  health_needs_considered: boolean;
  risk_assessed: boolean;
  inclusive_activity: boolean;
  peer_interaction_positive: boolean;
  equipment_suitable: boolean;
  safeguarding_considered: boolean;
  achievement_celebrated: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
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
  { type: "team_sport", label: "Team Sport" },
  { type: "individual_sport", label: "Individual Sport" },
  { type: "swimming", label: "Swimming" },
  { type: "gym_fitness", label: "Gym/Fitness" },
  { type: "dance", label: "Dance" },
  { type: "martial_arts", label: "Martial Arts" },
  { type: "outdoor_adventure", label: "Outdoor Adventure" },
  { type: "walking_cycling", label: "Walking/Cycling" },
  { type: "playground", label: "Playground" },
  { type: "other", label: "Other" },
];

export const PARTICIPATION_LEVELS: { level: ParticipationLevel; label: string }[] = [
  { level: "enthusiastic", label: "Enthusiastic" },
  { level: "willing", label: "Willing" },
  { level: "reluctant", label: "Reluctant" },
  { level: "refused", label: "Refused" },
  { level: "unable", label: "Unable" },
];

export const FITNESS_ASSESSMENTS: { assessment: FitnessAssessment; label: string }[] = [
  { assessment: "excellent", label: "Excellent" },
  { assessment: "good", label: "Good" },
  { assessment: "average", label: "Average" },
  { assessment: "below_average", label: "Below Average" },
  { assessment: "not_assessed", label: "Not Assessed" },
];

export const ENJOYMENT_RATINGS: { rating: EnjoymentRating; label: string }[] = [
  { rating: "loved_it", label: "Loved It" },
  { rating: "enjoyed", label: "Enjoyed" },
  { rating: "neutral", label: "Neutral" },
  { rating: "disliked", label: "Disliked" },
  { rating: "refused_to_rate", label: "Refused to Rate" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePhysicalActivityMetrics(
  records: PhysicalActivityTrackingRecord[],
): {
  total_activities: number;
  refused_count: number;
  unable_count: number;
  disliked_count: number;
  below_average_count: number;
  child_choice_rate: number;
  age_appropriate_rate: number;
  health_needs_rate: number;
  risk_assessed_rate: number;
  inclusive_rate: number;
  peer_interaction_rate: number;
  equipment_rate: number;
  safeguarding_rate: number;
  achievement_rate: number;
  care_plan_rate: number;
  social_worker_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_activity_type: Record<string, number>;
  by_participation_level: Record<string, number>;
  by_fitness_assessment: Record<string, number>;
  by_enjoyment_rating: Record<string, number>;
} {
  const refused = records.filter((r) => r.participation_level === "refused").length;
  const unable = records.filter((r) => r.participation_level === "unable").length;
  const disliked = records.filter((r) => r.enjoyment_rating === "disliked").length;
  const belowAverage = records.filter((r) => r.fitness_assessment === "below_average").length;

  const boolRate = (field: keyof PhysicalActivityTrackingRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.activity_type] = (byType[r.activity_type] ?? 0) + 1;

  const byParticipation: Record<string, number> = {};
  for (const r of records) byParticipation[r.participation_level] = (byParticipation[r.participation_level] ?? 0) + 1;

  const byFitness: Record<string, number> = {};
  for (const r of records) byFitness[r.fitness_assessment] = (byFitness[r.fitness_assessment] ?? 0) + 1;

  const byEnjoyment: Record<string, number> = {};
  for (const r of records) byEnjoyment[r.enjoyment_rating] = (byEnjoyment[r.enjoyment_rating] ?? 0) + 1;

  return {
    total_activities: records.length,
    refused_count: refused,
    unable_count: unable,
    disliked_count: disliked,
    below_average_count: belowAverage,
    child_choice_rate: boolRate("child_choice_offered"),
    age_appropriate_rate: boolRate("age_appropriate"),
    health_needs_rate: boolRate("health_needs_considered"),
    risk_assessed_rate: boolRate("risk_assessed"),
    inclusive_rate: boolRate("inclusive_activity"),
    peer_interaction_rate: boolRate("peer_interaction_positive"),
    equipment_rate: boolRate("equipment_suitable"),
    safeguarding_rate: boolRate("safeguarding_considered"),
    achievement_rate: boolRate("achievement_celebrated"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_activity_type: byType,
    by_participation_level: byParticipation,
    by_fitness_assessment: byFitness,
    by_enjoyment_rating: byEnjoyment,
  };
}

export function identifyPhysicalActivityAlerts(
  records: PhysicalActivityTrackingRecord[],
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

  // Refused without health consideration — per-record
  for (const r of records) {
    if (r.participation_level === "refused" && !r.health_needs_considered) {
      alerts.push({
        type: "refused_no_health_check",
        severity: "critical",
        message: `${r.child_name} refused ${r.activity_type.replace(/_/g, " ")} without health needs consideration — assess wellbeing`,
        id: r.id,
      });
    }
  }

  // Child choice not offered
  const noChoice = records.filter((r) => !r.child_choice_offered).length;
  if (noChoice >= 1) {
    alerts.push({
      type: "no_child_choice",
      severity: "high",
      message: `${noChoice} ${noChoice === 1 ? "activity has" : "activities have"} no child choice offered — respect preferences`,
      id: "no_child_choice",
    });
  }

  // Risk not assessed
  const noRisk = records.filter((r) => !r.risk_assessed).length;
  if (noRisk >= 1) {
    alerts.push({
      type: "risk_not_assessed",
      severity: "high",
      message: `${noRisk} ${noRisk === 1 ? "activity has" : "activities have"} no risk assessment — ensure safety`,
      id: "risk_not_assessed",
    });
  }

  // Achievement not celebrated
  const noAchievement = records.filter((r) => !r.achievement_celebrated).length;
  if (noAchievement >= 2) {
    alerts.push({
      type: "achievement_not_celebrated",
      severity: "medium",
      message: `${noAchievement} activities without achievement celebration — strengthen positive reinforcement`,
      id: "achievement_not_celebrated",
    });
  }

  // Not inclusive
  const notInclusive = records.filter((r) => !r.inclusive_activity).length;
  if (notInclusive >= 2) {
    alerts.push({
      type: "not_inclusive",
      severity: "medium",
      message: `${notInclusive} activities not inclusive — review accessibility and participation barriers`,
      id: "not_inclusive",
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
    fitnessAssessment?: FitnessAssessment;
    enjoymentRating?: EnjoymentRating;
    limit?: number;
  },
): Promise<ServiceResult<PhysicalActivityTrackingRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_physical_activity_tracking") as SB).select("*").eq("home_id", homeId);
  if (filters?.activityType) q = q.eq("activity_type", filters.activityType);
  if (filters?.participationLevel) q = q.eq("participation_level", filters.participationLevel);
  if (filters?.fitnessAssessment) q = q.eq("fitness_assessment", filters.fitnessAssessment);
  if (filters?.enjoymentRating) q = q.eq("enjoyment_rating", filters.enjoymentRating);
  q = q.order("activity_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    activityType: ActivityType;
    participationLevel: ParticipationLevel;
    fitnessAssessment: FitnessAssessment;
    enjoymentRating: EnjoymentRating;
    activityDate: string;
    childName: string;
    childId?: string | null;
    supervisedBy: string;
    childChoiceOffered?: boolean;
    ageAppropriate?: boolean;
    healthNeedsConsidered?: boolean;
    riskAssessed?: boolean;
    inclusiveActivity?: boolean;
    peerInteractionPositive?: boolean;
    equipmentSuitable?: boolean;
    safeguardingConsidered?: boolean;
    achievementCelebrated?: boolean;
    carePlanReflects?: boolean;
    socialWorkerInformed?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<PhysicalActivityTrackingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_physical_activity_tracking") as SB)
    .insert({
      home_id: payload.homeId,
      activity_type: payload.activityType,
      participation_level: payload.participationLevel,
      fitness_assessment: payload.fitnessAssessment,
      enjoyment_rating: payload.enjoymentRating,
      activity_date: payload.activityDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      supervised_by: payload.supervisedBy,
      child_choice_offered: payload.childChoiceOffered ?? true,
      age_appropriate: payload.ageAppropriate ?? true,
      health_needs_considered: payload.healthNeedsConsidered ?? true,
      risk_assessed: payload.riskAssessed ?? true,
      inclusive_activity: payload.inclusiveActivity ?? true,
      peer_interaction_positive: payload.peerInteractionPositive ?? true,
      equipment_suitable: payload.equipmentSuitable ?? true,
      safeguarding_considered: payload.safeguardingConsidered ?? true,
      achievement_celebrated: payload.achievementCelebrated ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    activityType: ActivityType;
    participationLevel: ParticipationLevel;
    fitnessAssessment: FitnessAssessment;
    enjoymentRating: EnjoymentRating;
    activityDate: string;
    childName: string;
    childId: string | null;
    supervisedBy: string;
    childChoiceOffered: boolean;
    ageAppropriate: boolean;
    healthNeedsConsidered: boolean;
    riskAssessed: boolean;
    inclusiveActivity: boolean;
    peerInteractionPositive: boolean;
    equipmentSuitable: boolean;
    safeguardingConsidered: boolean;
    achievementCelebrated: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<PhysicalActivityTrackingRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.activityType !== undefined) mapped.activity_type = updates.activityType;
  if (updates.participationLevel !== undefined) mapped.participation_level = updates.participationLevel;
  if (updates.fitnessAssessment !== undefined) mapped.fitness_assessment = updates.fitnessAssessment;
  if (updates.enjoymentRating !== undefined) mapped.enjoyment_rating = updates.enjoymentRating;
  if (updates.activityDate !== undefined) mapped.activity_date = updates.activityDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supervisedBy !== undefined) mapped.supervised_by = updates.supervisedBy;
  if (updates.childChoiceOffered !== undefined) mapped.child_choice_offered = updates.childChoiceOffered;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.healthNeedsConsidered !== undefined) mapped.health_needs_considered = updates.healthNeedsConsidered;
  if (updates.riskAssessed !== undefined) mapped.risk_assessed = updates.riskAssessed;
  if (updates.inclusiveActivity !== undefined) mapped.inclusive_activity = updates.inclusiveActivity;
  if (updates.peerInteractionPositive !== undefined) mapped.peer_interaction_positive = updates.peerInteractionPositive;
  if (updates.equipmentSuitable !== undefined) mapped.equipment_suitable = updates.equipmentSuitable;
  if (updates.safeguardingConsidered !== undefined) mapped.safeguarding_considered = updates.safeguardingConsidered;
  if (updates.achievementCelebrated !== undefined) mapped.achievement_celebrated = updates.achievementCelebrated;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_physical_activity_tracking") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePhysicalActivityMetrics,
  identifyPhysicalActivityAlerts,
};
