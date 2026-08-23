// ══════════════════════════════════════════════════════════════════════════════
// CARA — HEALTHY EATING COOKING SKILLS SERVICE
// Tracks healthy eating sessions, cooking skill development, food hygiene,
// menu planning, nutrition education, and dietary management.
// CHR 2015 Reg 9(2)(a)(v) (healthy diet and cooking),
// Reg 8(2)(a)(vi) (independence — cooking).
//
// Covers: session type, skill level, engagement level,
// health outcome, and practical cooking skills.
//
// SCCIF: Experiences — "Children learn practical cooking skills."
// "Children are supported to develop healthy eating habits."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SessionType =
  | "meal_preparation"
  | "baking"
  | "food_hygiene"
  | "menu_planning"
  | "shopping_skills"
  | "budget_cooking"
  | "cultural_cuisine"
  | "nutrition_education"
  | "dietary_management"
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

export type HealthOutcome =
  | "significant_improvement"
  | "some_improvement"
  | "maintained"
  | "slight_decline"
  | "declined";

export interface HealthyEatingCookingSkillsRecord {
  id: string;
  home_id: string;
  session_type: SessionType;
  skill_level: SkillLevel;
  engagement_level: EngagementLevel;
  health_outcome: HealthOutcome;
  session_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  age_appropriate: boolean;
  food_hygiene_followed: boolean;
  child_chose_recipe: boolean;
  dietary_needs_met: boolean;
  allergy_awareness: boolean;
  kitchen_safety_followed: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  parent_informed: boolean;
  healthy_options_promoted: boolean;
  skills_transferable: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SESSION_TYPES: { sessionType: SessionType; label: string }[] = [
  { sessionType: "meal_preparation", label: "Meal Preparation" },
  { sessionType: "baking", label: "Baking" },
  { sessionType: "food_hygiene", label: "Food Hygiene" },
  { sessionType: "menu_planning", label: "Menu Planning" },
  { sessionType: "shopping_skills", label: "Shopping Skills" },
  { sessionType: "budget_cooking", label: "Budget Cooking" },
  { sessionType: "cultural_cuisine", label: "Cultural Cuisine" },
  { sessionType: "nutrition_education", label: "Nutrition Education" },
  { sessionType: "dietary_management", label: "Dietary Management" },
  { sessionType: "other", label: "Other" },
];

export const SKILL_LEVELS: { level: SkillLevel; label: string }[] = [
  { level: "advanced", label: "Advanced" },
  { level: "competent", label: "Competent" },
  { level: "developing", label: "Developing" },
  { level: "basic", label: "Basic" },
  { level: "not_started", label: "Not Started" },
];

export const ENGAGEMENT_LEVELS: { engagement: EngagementLevel; label: string }[] = [
  { engagement: "highly_engaged", label: "Highly Engaged" },
  { engagement: "engaged", label: "Engaged" },
  { engagement: "partially_engaged", label: "Partially Engaged" },
  { engagement: "disengaged", label: "Disengaged" },
  { engagement: "refused", label: "Refused" },
];

export const HEALTH_OUTCOMES: { outcome: HealthOutcome; label: string }[] = [
  { outcome: "significant_improvement", label: "Significant Improvement" },
  { outcome: "some_improvement", label: "Some Improvement" },
  { outcome: "maintained", label: "Maintained" },
  { outcome: "slight_decline", label: "Slight Decline" },
  { outcome: "declined", label: "Declined" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computeHealthyEatingMetrics(records: HealthyEatingCookingSkillsRecord[]): {
  total_sessions: number;
  not_started_count: number;
  disengaged_count: number;
  declined_count: number;
  refused_count: number;
  age_appropriate_rate: number | null;
  food_hygiene_rate: number | null;
  child_chose_recipe_rate: number | null;
  dietary_needs_rate: number | null;
  allergy_awareness_rate: number | null;
  kitchen_safety_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  parent_informed_rate: number | null;
  healthy_options_rate: number | null;
  skills_transferable_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_session_type: Record<string, number>;
  by_skill_level: Record<string, number>;
  by_engagement_level: Record<string, number>;
  by_health_outcome: Record<string, number>;
} {
  const notStarted = records.filter((r) => r.skill_level === "not_started").length;
  const disengaged = records.filter((r) => r.engagement_level === "disengaged" || r.engagement_level === "refused").length;
  const declined = records.filter((r) => r.health_outcome === "slight_decline" || r.health_outcome === "declined").length;
  const refused = records.filter((r) => r.engagement_level === "refused").length;

  const boolRate = (field: keyof HealthyEatingCookingSkillsRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const bySessionType: Record<string, number> = {};
  for (const r of records) bySessionType[r.session_type] = (bySessionType[r.session_type] ?? 0) + 1;

  const bySkillLevel: Record<string, number> = {};
  for (const r of records) bySkillLevel[r.skill_level] = (bySkillLevel[r.skill_level] ?? 0) + 1;

  const byEngagement: Record<string, number> = {};
  for (const r of records) byEngagement[r.engagement_level] = (byEngagement[r.engagement_level] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.health_outcome] = (byOutcome[r.health_outcome] ?? 0) + 1;

  return {
    total_sessions: records.length,
    not_started_count: notStarted,
    disengaged_count: disengaged,
    declined_count: declined,
    refused_count: refused,
    age_appropriate_rate: boolRate("age_appropriate"),
    food_hygiene_rate: boolRate("food_hygiene_followed"),
    child_chose_recipe_rate: boolRate("child_chose_recipe"),
    dietary_needs_rate: boolRate("dietary_needs_met"),
    allergy_awareness_rate: boolRate("allergy_awareness"),
    kitchen_safety_rate: boolRate("kitchen_safety_followed"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    healthy_options_rate: boolRate("healthy_options_promoted"),
    skills_transferable_rate: boolRate("skills_transferable"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_session_type: bySessionType,
    by_skill_level: bySkillLevel,
    by_engagement_level: byEngagement,
    by_health_outcome: byOutcome,
  };
}

export function identifyHealthyEatingAlerts(
  records: HealthyEatingCookingSkillsRecord[],
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

  // Refused and declining health — per-record critical
  for (const r of records) {
    if (r.engagement_level === "refused" && (r.health_outcome === "slight_decline" || r.health_outcome === "declined")) {
      alerts.push({
        type: "refused_declining",
        severity: "critical",
        message: `${r.child_name} refused engagement with ${r.health_outcome.replace(/_/g, " ")} health outcome — urgent intervention needed`,
        id: r.id,
      });
    }
  }

  // No food hygiene followed
  const noFoodHygiene = records.filter((r) => !r.food_hygiene_followed).length;
  if (noFoodHygiene >= 1) {
    alerts.push({
      type: "no_food_hygiene",
      severity: "high",
      message: `${noFoodHygiene} ${noFoodHygiene === 1 ? "session has" : "sessions have"} food hygiene not followed — essential for safety`,
      id: "no_food_hygiene",
    });
  }

  // No kitchen safety followed
  const noKitchenSafety = records.filter((r) => !r.kitchen_safety_followed).length;
  if (noKitchenSafety >= 1) {
    alerts.push({
      type: "no_kitchen_safety",
      severity: "high",
      message: `${noKitchenSafety} ${noKitchenSafety === 1 ? "session has" : "sessions have"} kitchen safety not followed — risk of harm`,
      id: "no_kitchen_safety",
    });
  }

  // No child choice
  const noChildChoice = records.filter((r) => !r.child_chose_recipe).length;
  if (noChildChoice >= 2) {
    alerts.push({
      type: "no_child_choice",
      severity: "medium",
      message: `${noChildChoice} sessions without child choosing recipe — child voice must guide cooking activities`,
      id: "no_child_choice",
    });
  }

  // No allergy awareness
  const noAllergyAwareness = records.filter((r) => !r.allergy_awareness).length;
  if (noAllergyAwareness >= 2) {
    alerts.push({
      type: "no_allergy_awareness",
      severity: "medium",
      message: `${noAllergyAwareness} sessions without allergy awareness — dietary safety must be prioritised`,
      id: "no_allergy_awareness",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    sessionType?: SessionType; skillLevel?: SkillLevel;
    engagementLevel?: EngagementLevel; healthOutcome?: HealthOutcome; limit?: number;
  },
): Promise<ServiceResult<HealthyEatingCookingSkillsRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  let q = (client.from("cs_healthy_eating_cooking_skills") as SB).select("*").eq("home_id", homeId);
  if (filters?.sessionType) q = q.eq("session_type", filters.sessionType);
  if (filters?.skillLevel) q = q.eq("skill_level", filters.skillLevel);
  if (filters?.engagementLevel) q = q.eq("engagement_level", filters.engagementLevel);
  if (filters?.healthOutcome) q = q.eq("health_outcome", filters.healthOutcome);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as HealthyEatingCookingSkillsRecord[] };
}

export async function createRecord(payload: {
  homeId: string; sessionType: SessionType; skillLevel: SkillLevel;
  engagementLevel: EngagementLevel; healthOutcome: HealthOutcome;
  sessionDate: string; childName: string; childId: string | null;
  supportedBy: string; ageAppropriate: boolean; foodHygieneFollowed: boolean;
  childChoseRecipe: boolean; dietaryNeedsMet: boolean; allergyAwareness: boolean;
  kitchenSafetyFollowed: boolean; carePlanReflects: boolean; socialWorkerInformed: boolean;
  parentInformed: boolean; healthyOptionsPromoted: boolean; skillsTransferable: boolean;
  recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
  nextReviewDate: string | null; notes: string | null;
}): Promise<ServiceResult<HealthyEatingCookingSkillsRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_healthy_eating_cooking_skills") as SB).insert({
    home_id: payload.homeId, session_type: payload.sessionType,
    skill_level: payload.skillLevel, engagement_level: payload.engagementLevel,
    health_outcome: payload.healthOutcome, session_date: payload.sessionDate,
    child_name: payload.childName, child_id: payload.childId, supported_by: payload.supportedBy,
    age_appropriate: payload.ageAppropriate, food_hygiene_followed: payload.foodHygieneFollowed,
    child_chose_recipe: payload.childChoseRecipe, dietary_needs_met: payload.dietaryNeedsMet,
    allergy_awareness: payload.allergyAwareness, kitchen_safety_followed: payload.kitchenSafetyFollowed,
    care_plan_reflects: payload.carePlanReflects, social_worker_informed: payload.socialWorkerInformed,
    parent_informed: payload.parentInformed, healthy_options_promoted: payload.healthyOptionsPromoted,
    skills_transferable: payload.skillsTransferable, recorded_promptly: payload.recordedPromptly,
    issues_found: payload.issuesFound, actions_taken: payload.actionsTaken,
    next_review_date: payload.nextReviewDate, notes: payload.notes,
  }).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as HealthyEatingCookingSkillsRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    sessionType: SessionType; skillLevel: SkillLevel;
    engagementLevel: EngagementLevel; healthOutcome: HealthOutcome;
    sessionDate: string; childName: string; childId: string | null;
    supportedBy: string; ageAppropriate: boolean; foodHygieneFollowed: boolean;
    childChoseRecipe: boolean; dietaryNeedsMet: boolean; allergyAwareness: boolean;
    kitchenSafetyFollowed: boolean; carePlanReflects: boolean; socialWorkerInformed: boolean;
    parentInformed: boolean; healthyOptionsPromoted: boolean; skillsTransferable: boolean;
    recordedPromptly: boolean; issuesFound: string[]; actionsTaken: string[];
    nextReviewDate: string | null; notes: string | null;
  }>,
): Promise<ServiceResult<HealthyEatingCookingSkillsRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.sessionType !== undefined) mapped.session_type = updates.sessionType;
  if (updates.skillLevel !== undefined) mapped.skill_level = updates.skillLevel;
  if (updates.engagementLevel !== undefined) mapped.engagement_level = updates.engagementLevel;
  if (updates.healthOutcome !== undefined) mapped.health_outcome = updates.healthOutcome;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.foodHygieneFollowed !== undefined) mapped.food_hygiene_followed = updates.foodHygieneFollowed;
  if (updates.childChoseRecipe !== undefined) mapped.child_chose_recipe = updates.childChoseRecipe;
  if (updates.dietaryNeedsMet !== undefined) mapped.dietary_needs_met = updates.dietaryNeedsMet;
  if (updates.allergyAwareness !== undefined) mapped.allergy_awareness = updates.allergyAwareness;
  if (updates.kitchenSafetyFollowed !== undefined) mapped.kitchen_safety_followed = updates.kitchenSafetyFollowed;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.healthyOptionsPromoted !== undefined) mapped.healthy_options_promoted = updates.healthyOptionsPromoted;
  if (updates.skillsTransferable !== undefined) mapped.skills_transferable = updates.skillsTransferable;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  const { data, error } = await (client.from("cs_healthy_eating_cooking_skills") as SB)
    .update(mapped).eq("id", id).select().single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as HealthyEatingCookingSkillsRecord };
}

export const _testing = { computeHealthyEatingMetrics, identifyHealthyEatingAlerts };
