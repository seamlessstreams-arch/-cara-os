// ══════════════════════════════════════════════════════════════════════════════
// CARA — GARDEN & HORTICULTURE ACTIVITIES SERVICE
// Tracks garden and horticulture activities for children
// in residential care homes.
// CHR 2015 Reg 9 (enjoyment — outdoor and creative pursuits),
// Reg 12 (promoting good health via outdoor activity).
//
// Covers: activity type, skill level, engagement level,
// health benefit, and therapeutic gardening value.
//
// SCCIF: Experiences — "Children enjoy purposeful outdoor activities."
// "Gardening supports health, wellbeing, and life skills."
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
  | "vegetable_growing"
  | "flower_gardening"
  | "herb_cultivation"
  | "composting"
  | "wildlife_habitat"
  | "outdoor_classroom"
  | "therapeutic_gardening"
  | "seasonal_planting"
  | "garden_design"
  | "other";

export type SkillLevel =
  | "advanced"
  | "competent"
  | "developing"
  | "basic"
  | "not_started";

export type EngagementLevel =
  | "highly_engaged"
  | "engaged"
  | "partially_engaged"
  | "disengaged"
  | "refused";

export type HealthBenefit =
  | "significant_benefit"
  | "some_benefit"
  | "maintained"
  | "minimal_benefit"
  | "no_benefit";

export interface GardenHorticultureActivitiesRecord {
  id: string;
  home_id: string;
  activity_type: ActivityType;
  skill_level: SkillLevel;
  engagement_level: EngagementLevel;
  health_benefit: HealthBenefit;
  session_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  age_appropriate: boolean;
  risk_assessment_done: boolean;
  tools_safe: boolean;
  supervision_adequate: boolean;
  child_chose_activity: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  therapeutic_value_noted: boolean;
  seasonal_learning: boolean;
  organic_methods_used: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ACTIVITY_TYPES: { activity: ActivityType; label: string }[] = [
  { activity: "vegetable_growing", label: "Vegetable Growing" },
  { activity: "flower_gardening", label: "Flower Gardening" },
  { activity: "herb_cultivation", label: "Herb Cultivation" },
  { activity: "composting", label: "Composting" },
  { activity: "wildlife_habitat", label: "Wildlife Habitat" },
  { activity: "outdoor_classroom", label: "Outdoor Classroom" },
  { activity: "therapeutic_gardening", label: "Therapeutic Gardening" },
  { activity: "seasonal_planting", label: "Seasonal Planting" },
  { activity: "garden_design", label: "Garden Design" },
  { activity: "other", label: "Other" },
];

export const SKILL_LEVELS: { level: SkillLevel; label: string }[] = [
  { level: "advanced", label: "Advanced" },
  { level: "competent", label: "Competent" },
  { level: "developing", label: "Developing" },
  { level: "basic", label: "Basic" },
  { level: "not_started", label: "Not Started" },
];

export const ENGAGEMENT_LEVELS: { level: EngagementLevel; label: string }[] = [
  { level: "highly_engaged", label: "Highly Engaged" },
  { level: "engaged", label: "Engaged" },
  { level: "partially_engaged", label: "Partially Engaged" },
  { level: "disengaged", label: "Disengaged" },
  { level: "refused", label: "Refused" },
];

export const HEALTH_BENEFITS: { quality: HealthBenefit; label: string }[] = [
  { quality: "significant_benefit", label: "Significant Benefit" },
  { quality: "some_benefit", label: "Some Benefit" },
  { quality: "maintained", label: "Maintained" },
  { quality: "minimal_benefit", label: "Minimal Benefit" },
  { quality: "no_benefit", label: "No Benefit" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeGardenHorticultureMetrics(
  records: GardenHorticultureActivitiesRecord[],
): {
  total_sessions: number;
  not_started_count: number;
  disengaged_count: number;
  no_benefit_count: number;
  refused_count: number;
  age_appropriate_rate: number | null;
  risk_assessment_rate: number | null;
  tools_safe_rate: number | null;
  supervision_rate: number | null;
  child_chose_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  therapeutic_value_rate: number | null;
  seasonal_learning_rate: number | null;
  organic_methods_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_activity_type: Record<string, number>;
  by_skill_level: Record<string, number>;
  by_engagement_level: Record<string, number>;
  by_health_benefit: Record<string, number>;
} {
  const notStarted = records.filter((r) => r.skill_level === "not_started").length;
  const disengaged = records.filter((r) => r.engagement_level === "disengaged" || r.engagement_level === "refused").length;
  const noBenefit = records.filter((r) => r.health_benefit === "no_benefit").length;
  const refused = records.filter((r) => r.engagement_level === "refused").length;

  const boolRate = (field: keyof GardenHorticultureActivitiesRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.activity_type] = (byType[r.activity_type] ?? 0) + 1;

  const bySkill: Record<string, number> = {};
  for (const r of records) bySkill[r.skill_level] = (bySkill[r.skill_level] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.engagement_level] = (byEngagement[r.engagement_level] ?? 0) + 1;

  const byBenefit: Record<string, number> = {};
  for (const r of records) byBenefit[r.health_benefit] = (byBenefit[r.health_benefit] ?? 0) + 1;

  return {
    total_sessions: records.length,
    not_started_count: notStarted,
    disengaged_count: disengaged,
    no_benefit_count: noBenefit,
    refused_count: refused,
    age_appropriate_rate: boolRate("age_appropriate"),
    risk_assessment_rate: boolRate("risk_assessment_done"),
    tools_safe_rate: boolRate("tools_safe"),
    supervision_rate: boolRate("supervision_adequate"),
    child_chose_rate: boolRate("child_chose_activity"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    therapeutic_value_rate: boolRate("therapeutic_value_noted"),
    seasonal_learning_rate: boolRate("seasonal_learning"),
    organic_methods_rate: boolRate("organic_methods_used"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_activity_type: byType,
    by_skill_level: bySkill,
    by_engagement_level: byEngagement,
    by_health_benefit: byBenefit,
  };
}

export function identifyGardenHorticultureAlerts(
  records: GardenHorticultureActivitiesRecord[],
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

  // Refused with no health benefit — per-record critical
  for (const r of records) {
    if (r.engagement_level === "refused" && r.health_benefit === "no_benefit") {
      alerts.push({
        type: "refused_no_benefit",
        severity: "critical",
        message: `${r.child_name} refused garden activities with no health benefit — review engagement approach`,
        id: r.id,
      });
    }
  }

  // No risk assessment completed
  const noRiskAssessment = records.filter((r) => !r.risk_assessment_done).length;
  if (noRiskAssessment >= 1) {
    alerts.push({
      type: "no_risk_assessment",
      severity: "high",
      message: `${noRiskAssessment} ${noRiskAssessment === 1 ? "session has" : "sessions have"} no risk assessment completed`,
      id: "no_risk_assessment",
    });
  }

  // Unsafe tools reported
  const toolsNotSafe = records.filter((r) => !r.tools_safe).length;
  if (toolsNotSafe >= 1) {
    alerts.push({
      type: "tools_not_safe",
      severity: "high",
      message: `${toolsNotSafe} ${toolsNotSafe === 1 ? "session has" : "sessions have"} unsafe tools reported`,
      id: "tools_not_safe",
    });
  }

  // No child choice
  const noChildChoice = records.filter((r) => !r.child_chose_activity).length;
  if (noChildChoice >= 2) {
    alerts.push({
      type: "no_child_choice",
      severity: "medium",
      message: `${noChildChoice} sessions have children not choosing their activity`,
      id: "no_child_choice",
    });
  }

  // No therapeutic value noted
  const noTherapeuticValue = records.filter((r) => !r.therapeutic_value_noted).length;
  if (noTherapeuticValue >= 2) {
    alerts.push({
      type: "no_therapeutic_value",
      severity: "medium",
      message: `${noTherapeuticValue} sessions have no therapeutic value noted`,
      id: "no_therapeutic_value",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listGardenHorticultureActivities(
  homeId: string,
  filters?: {
    activityType?: ActivityType;
    skillLevel?: SkillLevel;
    engagementLevel?: EngagementLevel;
    healthBenefit?: HealthBenefit;
    limit?: number;
  },
): Promise<ServiceResult<GardenHorticultureActivitiesRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_garden_horticulture_activities") as SB).select("*").eq("home_id", homeId);
  if (filters?.activityType) q = q.eq("activity_type", filters.activityType);
  if (filters?.skillLevel) q = q.eq("skill_level", filters.skillLevel);
  if (filters?.engagementLevel) q = q.eq("engagement_level", filters.engagementLevel);
  if (filters?.healthBenefit) q = q.eq("health_benefit", filters.healthBenefit);
  q = q.order("session_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as GardenHorticultureActivitiesRecord[] };
}

export async function createGardenHorticultureActivity(payload: {
  homeId: string;
  activityType: ActivityType;
  skillLevel: SkillLevel;
  engagementLevel: EngagementLevel;
  healthBenefit: HealthBenefit;
  sessionDate: string;
  childName: string;
  childId?: string | null;
  supportedBy: string;
  ageAppropriate?: boolean;
  riskAssessmentDone?: boolean;
  toolsSafe?: boolean;
  supervisionAdequate?: boolean;
  childChoseActivity?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  parentInformed?: boolean;
  therapeuticValueNoted?: boolean;
  seasonalLearning?: boolean;
  organicMethodsUsed?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<GardenHorticultureActivitiesRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_garden_horticulture_activities") as SB)
    .insert({
      home_id: payload.homeId,
      activity_type: payload.activityType,
      skill_level: payload.skillLevel,
      engagement_level: payload.engagementLevel,
      health_benefit: payload.healthBenefit,
      session_date: payload.sessionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      supported_by: payload.supportedBy,
      age_appropriate: payload.ageAppropriate ?? true,
      risk_assessment_done: payload.riskAssessmentDone ?? true,
      tools_safe: payload.toolsSafe ?? true,
      supervision_adequate: payload.supervisionAdequate ?? true,
      child_chose_activity: payload.childChoseActivity ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      parent_informed: payload.parentInformed ?? true,
      therapeutic_value_noted: payload.therapeuticValueNoted ?? true,
      seasonal_learning: payload.seasonalLearning ?? true,
      organic_methods_used: payload.organicMethodsUsed ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as GardenHorticultureActivitiesRecord };
}

export async function updateGardenHorticultureActivity(
  id: string,
  updates: Partial<{
    activityType: ActivityType;
    skillLevel: SkillLevel;
    engagementLevel: EngagementLevel;
    healthBenefit: HealthBenefit;
    sessionDate: string;
    childName: string;
    childId: string | null;
    supportedBy: string;
    ageAppropriate: boolean;
    riskAssessmentDone: boolean;
    toolsSafe: boolean;
    supervisionAdequate: boolean;
    childChoseActivity: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    therapeuticValueNoted: boolean;
    seasonalLearning: boolean;
    organicMethodsUsed: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<GardenHorticultureActivitiesRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.activityType !== undefined) mapped.activity_type = updates.activityType;
  if (updates.skillLevel !== undefined) mapped.skill_level = updates.skillLevel;
  if (updates.engagementLevel !== undefined) mapped.engagement_level = updates.engagementLevel;
  if (updates.healthBenefit !== undefined) mapped.health_benefit = updates.healthBenefit;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.riskAssessmentDone !== undefined) mapped.risk_assessment_done = updates.riskAssessmentDone;
  if (updates.toolsSafe !== undefined) mapped.tools_safe = updates.toolsSafe;
  if (updates.supervisionAdequate !== undefined) mapped.supervision_adequate = updates.supervisionAdequate;
  if (updates.childChoseActivity !== undefined) mapped.child_chose_activity = updates.childChoseActivity;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.therapeuticValueNoted !== undefined) mapped.therapeutic_value_noted = updates.therapeuticValueNoted;
  if (updates.seasonalLearning !== undefined) mapped.seasonal_learning = updates.seasonalLearning;
  if (updates.organicMethodsUsed !== undefined) mapped.organic_methods_used = updates.organicMethodsUsed;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_garden_horticulture_activities") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as GardenHorticultureActivitiesRecord };
}

export const _testing = { computeGardenHorticultureMetrics, identifyGardenHorticultureAlerts };
