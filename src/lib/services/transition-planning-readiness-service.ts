// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRANSITION PLANNING READINESS SERVICE
// Monitors transition/leaving care preparation, independence
// skills, pathway planning, and readiness indicators.
// CHR 2015 Reg 13 (leaving care — preparing children for leaving),
// Reg 14 (care planning — pathway plans).
//
// Covers: transition type, readiness level, independence skill,
// pathway plan status, and support provision.
//
// SCCIF: Experiences — "Children are well prepared for transitions."
// "Independence skills are actively developed."
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

export type TransitionType =
  | "leaving_care"
  | "placement_move"
  | "school_transition"
  | "age_transition"
  | "step_down"
  | "return_home"
  | "semi_independence"
  | "supported_living"
  | "adoption"
  | "other";

export type ReadinessLevel =
  | "fully_ready"
  | "mostly_ready"
  | "partially_ready"
  | "not_ready"
  | "not_assessed";

export type IndependenceSkill =
  | "excellent"
  | "good"
  | "developing"
  | "limited"
  | "not_assessed";

export type PathwayPlanStatus =
  | "in_place"
  | "in_progress"
  | "overdue"
  | "not_started"
  | "not_applicable";

export interface TransitionPlanningReadinessRecord {
  id: string;
  home_id: string;
  transition_type: TransitionType;
  readiness_level: ReadinessLevel;
  independence_skill: IndependenceSkill;
  pathway_plan_status: PathwayPlanStatus;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  assessed_by: string;
  child_views_included: boolean;
  life_skills_assessed: boolean;
  budgeting_skills: boolean;
  cooking_skills: boolean;
  housing_identified: boolean;
  education_employment_plan: boolean;
  health_needs_addressed: boolean;
  social_network_mapped: boolean;
  personal_advisor_allocated: boolean;
  social_worker_involved: boolean;
  care_plan_reflects: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TRANSITION_TYPES: { type: TransitionType; label: string }[] = [
  { type: "leaving_care", label: "Leaving Care" },
  { type: "placement_move", label: "Placement Move" },
  { type: "school_transition", label: "School Transition" },
  { type: "age_transition", label: "Age Transition" },
  { type: "step_down", label: "Step Down" },
  { type: "return_home", label: "Return Home" },
  { type: "semi_independence", label: "Semi-Independence" },
  { type: "supported_living", label: "Supported Living" },
  { type: "adoption", label: "Adoption" },
  { type: "other", label: "Other" },
];

export const READINESS_LEVELS: { level: ReadinessLevel; label: string }[] = [
  { level: "fully_ready", label: "Fully Ready" },
  { level: "mostly_ready", label: "Mostly Ready" },
  { level: "partially_ready", label: "Partially Ready" },
  { level: "not_ready", label: "Not Ready" },
  { level: "not_assessed", label: "Not Assessed" },
];

export const INDEPENDENCE_SKILLS: { skill: IndependenceSkill; label: string }[] = [
  { skill: "excellent", label: "Excellent" },
  { skill: "good", label: "Good" },
  { skill: "developing", label: "Developing" },
  { skill: "limited", label: "Limited" },
  { skill: "not_assessed", label: "Not Assessed" },
];

export const PATHWAY_PLAN_STATUSES: { status: PathwayPlanStatus; label: string }[] = [
  { status: "in_place", label: "In Place" },
  { status: "in_progress", label: "In Progress" },
  { status: "overdue", label: "Overdue" },
  { status: "not_started", label: "Not Started" },
  { status: "not_applicable", label: "Not Applicable" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeTransitionPlanningMetrics(
  records: TransitionPlanningReadinessRecord[],
): {
  total_assessments: number;
  not_ready_count: number;
  not_assessed_count: number;
  overdue_pathway_count: number;
  not_started_pathway_count: number;
  child_views_rate: number;
  life_skills_rate: number;
  budgeting_rate: number;
  cooking_rate: number;
  housing_rate: number;
  education_employment_rate: number;
  health_needs_rate: number;
  social_network_rate: number;
  personal_advisor_rate: number;
  social_worker_rate: number;
  care_plan_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_transition_type: Record<string, number>;
  by_readiness_level: Record<string, number>;
  by_independence_skill: Record<string, number>;
  by_pathway_plan_status: Record<string, number>;
} {
  const notReady = records.filter((r) => r.readiness_level === "not_ready").length;
  const notAssessed = records.filter((r) => r.readiness_level === "not_assessed").length;
  const overduePathway = records.filter((r) => r.pathway_plan_status === "overdue").length;
  const notStartedPathway = records.filter((r) => r.pathway_plan_status === "not_started").length;

  const boolRate = (field: keyof TransitionPlanningReadinessRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.transition_type] = (byType[r.transition_type] ?? 0) + 1;

  const byReadiness: Record<string, number> = {};
  for (const r of records) byReadiness[r.readiness_level] = (byReadiness[r.readiness_level] ?? 0) + 1;

  const bySkill: Record<string, number> = {};
  for (const r of records) bySkill[r.independence_skill] = (bySkill[r.independence_skill] ?? 0) + 1;

  const byPathway: Record<string, number> = {};
  for (const r of records) byPathway[r.pathway_plan_status] = (byPathway[r.pathway_plan_status] ?? 0) + 1;

  return {
    total_assessments: records.length,
    not_ready_count: notReady,
    not_assessed_count: notAssessed,
    overdue_pathway_count: overduePathway,
    not_started_pathway_count: notStartedPathway,
    child_views_rate: boolRate("child_views_included"),
    life_skills_rate: boolRate("life_skills_assessed"),
    budgeting_rate: boolRate("budgeting_skills"),
    cooking_rate: boolRate("cooking_skills"),
    housing_rate: boolRate("housing_identified"),
    education_employment_rate: boolRate("education_employment_plan"),
    health_needs_rate: boolRate("health_needs_addressed"),
    social_network_rate: boolRate("social_network_mapped"),
    personal_advisor_rate: boolRate("personal_advisor_allocated"),
    social_worker_rate: boolRate("social_worker_involved"),
    care_plan_rate: boolRate("care_plan_reflects"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_transition_type: byType,
    by_readiness_level: byReadiness,
    by_independence_skill: bySkill,
    by_pathway_plan_status: byPathway,
  };
}

export function identifyTransitionPlanningAlerts(
  records: TransitionPlanningReadinessRecord[],
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

  // Leaving care not ready with no pathway plan — per-record
  for (const r of records) {
    if (r.transition_type === "leaving_care" && r.readiness_level === "not_ready" && (r.pathway_plan_status === "not_started" || r.pathway_plan_status === "overdue")) {
      alerts.push({
        type: "leaving_care_not_ready",
        severity: "critical",
        message: `${r.child_name} not ready for leaving care with pathway plan ${r.pathway_plan_status.replace(/_/g, " ")} — urgent planning needed`,
        id: r.id,
      });
    }
  }

  // Pathway plan overdue
  const overduePathway = records.filter((r) => r.pathway_plan_status === "overdue").length;
  if (overduePathway >= 1) {
    alerts.push({
      type: "pathway_overdue",
      severity: "high",
      message: `${overduePathway} ${overduePathway === 1 ? "assessment has" : "assessments have"} overdue pathway plan — prioritise completion`,
      id: "pathway_overdue",
    });
  }

  // Housing not identified
  const noHousing = records.filter((r) => !r.housing_identified).length;
  if (noHousing >= 1) {
    alerts.push({
      type: "housing_not_identified",
      severity: "high",
      message: `${noHousing} ${noHousing === 1 ? "assessment has" : "assessments have"} no housing identified — address accommodation needs`,
      id: "housing_not_identified",
    });
  }

  // Life skills not assessed
  const noLifeSkills = records.filter((r) => !r.life_skills_assessed).length;
  if (noLifeSkills >= 2) {
    alerts.push({
      type: "life_skills_not_assessed",
      severity: "medium",
      message: `${noLifeSkills} assessments without life skills assessment — strengthen independence preparation`,
      id: "life_skills_not_assessed",
    });
  }

  // Personal advisor not allocated
  const noAdvisor = records.filter((r) => !r.personal_advisor_allocated).length;
  if (noAdvisor >= 2) {
    alerts.push({
      type: "no_personal_advisor",
      severity: "medium",
      message: `${noAdvisor} assessments without personal advisor allocated — ensure support provision`,
      id: "no_personal_advisor",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    transitionType?: TransitionType;
    readinessLevel?: ReadinessLevel;
    independenceSkill?: IndependenceSkill;
    pathwayPlanStatus?: PathwayPlanStatus;
    limit?: number;
  },
): Promise<ServiceResult<TransitionPlanningReadinessRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_transition_planning_readiness") as SB).select("*").eq("home_id", homeId);
  if (filters?.transitionType) q = q.eq("transition_type", filters.transitionType);
  if (filters?.readinessLevel) q = q.eq("readiness_level", filters.readinessLevel);
  if (filters?.independenceSkill) q = q.eq("independence_skill", filters.independenceSkill);
  if (filters?.pathwayPlanStatus) q = q.eq("pathway_plan_status", filters.pathwayPlanStatus);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    transitionType: TransitionType;
    readinessLevel: ReadinessLevel;
    independenceSkill: IndependenceSkill;
    pathwayPlanStatus: PathwayPlanStatus;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    assessedBy: string;
    childViewsIncluded?: boolean;
    lifeSkillsAssessed?: boolean;
    budgetingSkills?: boolean;
    cookingSkills?: boolean;
    housingIdentified?: boolean;
    educationEmploymentPlan?: boolean;
    healthNeedsAddressed?: boolean;
    socialNetworkMapped?: boolean;
    personalAdvisorAllocated?: boolean;
    socialWorkerInvolved?: boolean;
    carePlanReflects?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<TransitionPlanningReadinessRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_transition_planning_readiness") as SB)
    .insert({
      home_id: payload.homeId,
      transition_type: payload.transitionType,
      readiness_level: payload.readinessLevel,
      independence_skill: payload.independenceSkill,
      pathway_plan_status: payload.pathwayPlanStatus,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      assessed_by: payload.assessedBy,
      child_views_included: payload.childViewsIncluded ?? true,
      life_skills_assessed: payload.lifeSkillsAssessed ?? true,
      budgeting_skills: payload.budgetingSkills ?? true,
      cooking_skills: payload.cookingSkills ?? true,
      housing_identified: payload.housingIdentified ?? true,
      education_employment_plan: payload.educationEmploymentPlan ?? true,
      health_needs_addressed: payload.healthNeedsAddressed ?? true,
      social_network_mapped: payload.socialNetworkMapped ?? true,
      personal_advisor_allocated: payload.personalAdvisorAllocated ?? true,
      social_worker_involved: payload.socialWorkerInvolved ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
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
    transitionType: TransitionType;
    readinessLevel: ReadinessLevel;
    independenceSkill: IndependenceSkill;
    pathwayPlanStatus: PathwayPlanStatus;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    assessedBy: string;
    childViewsIncluded: boolean;
    lifeSkillsAssessed: boolean;
    budgetingSkills: boolean;
    cookingSkills: boolean;
    housingIdentified: boolean;
    educationEmploymentPlan: boolean;
    healthNeedsAddressed: boolean;
    socialNetworkMapped: boolean;
    personalAdvisorAllocated: boolean;
    socialWorkerInvolved: boolean;
    carePlanReflects: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<TransitionPlanningReadinessRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.transitionType !== undefined) mapped.transition_type = updates.transitionType;
  if (updates.readinessLevel !== undefined) mapped.readiness_level = updates.readinessLevel;
  if (updates.independenceSkill !== undefined) mapped.independence_skill = updates.independenceSkill;
  if (updates.pathwayPlanStatus !== undefined) mapped.pathway_plan_status = updates.pathwayPlanStatus;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.childViewsIncluded !== undefined) mapped.child_views_included = updates.childViewsIncluded;
  if (updates.lifeSkillsAssessed !== undefined) mapped.life_skills_assessed = updates.lifeSkillsAssessed;
  if (updates.budgetingSkills !== undefined) mapped.budgeting_skills = updates.budgetingSkills;
  if (updates.cookingSkills !== undefined) mapped.cooking_skills = updates.cookingSkills;
  if (updates.housingIdentified !== undefined) mapped.housing_identified = updates.housingIdentified;
  if (updates.educationEmploymentPlan !== undefined) mapped.education_employment_plan = updates.educationEmploymentPlan;
  if (updates.healthNeedsAddressed !== undefined) mapped.health_needs_addressed = updates.healthNeedsAddressed;
  if (updates.socialNetworkMapped !== undefined) mapped.social_network_mapped = updates.socialNetworkMapped;
  if (updates.personalAdvisorAllocated !== undefined) mapped.personal_advisor_allocated = updates.personalAdvisorAllocated;
  if (updates.socialWorkerInvolved !== undefined) mapped.social_worker_involved = updates.socialWorkerInvolved;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_transition_planning_readiness") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeTransitionPlanningMetrics,
  identifyTransitionPlanningAlerts,
};
