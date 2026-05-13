// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INDEPENDENCE PREPARATION SERVICE
// Tracks preparation for independence — practical life skills assessment,
// readiness tracking, and preparation milestones for young people
// approaching independence (distinct from leaving care which covers
// the formal pathway plan).
// CHR 2015 Reg 5 (engaging with the wider community),
// Reg 6 (quality and purpose of care — preparing for independence),
// Reg 7 (children's views — independence goals).
//
// Covers practical skills: cooking, budgeting, travel, healthcare,
// employment readiness, housing knowledge, and social skills.
//
// SCCIF: Overall Experiences — "Young people are supported to develop
// skills for independence." "Preparation begins early."
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

export type SkillArea =
  | "cooking_nutrition"
  | "budgeting_finance"
  | "household_tasks"
  | "personal_hygiene"
  | "healthcare_management"
  | "travel_transport"
  | "employment_readiness"
  | "education_training"
  | "housing_knowledge"
  | "social_relationships"
  | "digital_literacy"
  | "emotional_resilience"
  | "safety_awareness"
  | "rights_entitlements"
  | "community_engagement";

export type CompetencyLevel =
  | "not_started"
  | "emerging"
  | "developing"
  | "competent"
  | "independent";

export type AssessmentFrequency =
  | "monthly"
  | "quarterly"
  | "six_monthly";

export interface IndependenceSkill {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  skill_area: SkillArea;
  competency_level: CompetencyLevel;
  assessed_date: string;
  assessed_by: string;
  target_level: CompetencyLevel;
  target_date: string | null;
  activities_completed: string[];
  young_person_views: string | null;
  next_steps: string[];
  support_needed: string | null;
  mentor_assigned: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SKILL_AREAS: { area: SkillArea; label: string }[] = [
  { area: "cooking_nutrition", label: "Cooking & Nutrition" },
  { area: "budgeting_finance", label: "Budgeting & Finance" },
  { area: "household_tasks", label: "Household Tasks" },
  { area: "personal_hygiene", label: "Personal Hygiene" },
  { area: "healthcare_management", label: "Healthcare Management" },
  { area: "travel_transport", label: "Travel & Transport" },
  { area: "employment_readiness", label: "Employment Readiness" },
  { area: "education_training", label: "Education & Training" },
  { area: "housing_knowledge", label: "Housing Knowledge" },
  { area: "social_relationships", label: "Social Relationships" },
  { area: "digital_literacy", label: "Digital Literacy" },
  { area: "emotional_resilience", label: "Emotional Resilience" },
  { area: "safety_awareness", label: "Safety Awareness" },
  { area: "rights_entitlements", label: "Rights & Entitlements" },
  { area: "community_engagement", label: "Community Engagement" },
];

export const COMPETENCY_LEVELS: { level: CompetencyLevel; label: string }[] = [
  { level: "not_started", label: "Not Started" },
  { level: "emerging", label: "Emerging" },
  { level: "developing", label: "Developing" },
  { level: "competent", label: "Competent" },
  { level: "independent", label: "Independent" },
];

export const ASSESSMENT_FREQUENCIES: { frequency: AssessmentFrequency; label: string }[] = [
  { frequency: "monthly", label: "Monthly" },
  { frequency: "quarterly", label: "Quarterly" },
  { frequency: "six_monthly", label: "Six Monthly" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute independence preparation metrics.
 */
export function computeIndependenceMetrics(
  skills: IndependenceSkill[],
  totalChildren: number,
): {
  total_assessments: number;
  children_assessed: number;
  assessment_coverage: number;
  not_started_count: number;
  emerging_count: number;
  developing_count: number;
  competent_count: number;
  independent_count: number;
  on_target_count: number;
  mentor_assigned_rate: number;
  young_person_views_rate: number;
  average_activities_per_skill: number;
  skills_at_target: number;
  by_skill_area: Record<string, number>;
  by_competency_level: Record<string, number>;
  by_child: Record<string, number>;
} {
  const notStarted = skills.filter((s) => s.competency_level === "not_started").length;
  const emerging = skills.filter((s) => s.competency_level === "emerging").length;
  const developing = skills.filter((s) => s.competency_level === "developing").length;
  const competent = skills.filter((s) => s.competency_level === "competent").length;
  const independent = skills.filter((s) => s.competency_level === "independent").length;

  const uniqueChildren = new Set(skills.map((s) => s.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : 0;

  // Skills at or above target
  const levelOrder: Record<CompetencyLevel, number> = {
    not_started: 0,
    emerging: 1,
    developing: 2,
    competent: 3,
    independent: 4,
  };
  const atTarget = skills.filter(
    (s) => levelOrder[s.competency_level] >= levelOrder[s.target_level],
  ).length;

  const mentorAssigned = skills.filter((s) => s.mentor_assigned !== null).length;
  const mentorRate =
    skills.length > 0
      ? Math.round((mentorAssigned / skills.length) * 1000) / 10
      : 0;

  const viewsRecorded = skills.filter((s) => s.young_person_views !== null).length;
  const viewsRate =
    skills.length > 0
      ? Math.round((viewsRecorded / skills.length) * 1000) / 10
      : 0;

  const totalActivities = skills.reduce((sum, s) => sum + s.activities_completed.length, 0);
  const avgActivities =
    skills.length > 0
      ? Math.round((totalActivities / skills.length) * 10) / 10
      : 0;

  // By skill area
  const bySkillArea: Record<string, number> = {};
  for (const s of skills) {
    bySkillArea[s.skill_area] = (bySkillArea[s.skill_area] ?? 0) + 1;
  }

  // By competency level
  const byCompetencyLevel: Record<string, number> = {};
  for (const s of skills) {
    byCompetencyLevel[s.competency_level] = (byCompetencyLevel[s.competency_level] ?? 0) + 1;
  }

  // By child
  const byChild: Record<string, number> = {};
  for (const s of skills) {
    byChild[s.child_name] = (byChild[s.child_name] ?? 0) + 1;
  }

  return {
    total_assessments: skills.length,
    children_assessed: uniqueChildren,
    assessment_coverage: coverage,
    not_started_count: notStarted,
    emerging_count: emerging,
    developing_count: developing,
    competent_count: competent,
    independent_count: independent,
    on_target_count: atTarget,
    mentor_assigned_rate: mentorRate,
    young_person_views_rate: viewsRate,
    average_activities_per_skill: avgActivities,
    skills_at_target: atTarget,
    by_skill_area: bySkillArea,
    by_competency_level: byCompetencyLevel,
    by_child: byChild,
  };
}

/**
 * Identify independence preparation alerts.
 */
export function identifyIndependenceAlerts(
  skills: IndependenceSkill[],
  totalChildren: number,
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

  // Children without assessments
  const childrenAssessed = new Set(skills.map((s) => s.child_id));
  if (totalChildren > 0 && childrenAssessed.size < totalChildren) {
    const gap = totalChildren - childrenAssessed.size;
    alerts.push({
      type: "no_assessment",
      severity: "high",
      message: `${gap} ${gap === 1 ? "child has" : "children have"} no independence skills assessment — all young people should have preparation plans`,
      id: "assessment_gap",
    });
  }

  // Skills below target with passed target date
  const levelOrder: Record<CompetencyLevel, number> = {
    not_started: 0,
    emerging: 1,
    developing: 2,
    competent: 3,
    independent: 4,
  };
  for (const s of skills) {
    if (
      s.target_date &&
      new Date(s.target_date) < new Date() &&
      levelOrder[s.competency_level] < levelOrder[s.target_level]
    ) {
      alerts.push({
        type: "target_missed",
        severity: "medium",
        message: `${s.child_name}'s ${s.skill_area.replace(/_/g, " ")} target missed — currently ${s.competency_level.replace(/_/g, " ")}, target was ${s.target_level.replace(/_/g, " ")} by ${s.target_date}`,
        id: s.id,
      });
    }
  }

  // Multiple skills at "not started" for a child
  const notStartedByChild: Record<string, { name: string; count: number }> = {};
  for (const s of skills) {
    if (s.competency_level === "not_started") {
      if (!notStartedByChild[s.child_id]) {
        notStartedByChild[s.child_id] = { name: s.child_name, count: 0 };
      }
      notStartedByChild[s.child_id].count += 1;
    }
  }
  for (const [id, data] of Object.entries(notStartedByChild)) {
    if (data.count >= 3) {
      alerts.push({
        type: "many_not_started",
        severity: "high",
        message: `${data.name} has ${data.count} independence skills not yet started — prioritise practical skills development`,
        id: `not_started_${id}`,
      });
    }
  }

  // No young person views recorded
  for (const s of skills) {
    if (s.young_person_views === null) {
      alerts.push({
        type: "no_yp_views",
        severity: "medium",
        message: `Young person's views not recorded for ${s.child_name}'s ${s.skill_area.replace(/_/g, " ")} assessment — involve them in their own preparation`,
        id: s.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listSkills(
  homeId: string,
  filters?: {
    childId?: string;
    skillArea?: SkillArea;
    competencyLevel?: CompetencyLevel;
    limit?: number;
  },
): Promise<ServiceResult<IndependenceSkill[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_independence_skills") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.skillArea) q = q.eq("skill_area", filters.skillArea);
  if (filters?.competencyLevel) q = q.eq("competency_level", filters.competencyLevel);
  q = q.order("assessed_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSkill(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    skillArea: SkillArea;
    competencyLevel: CompetencyLevel;
    assessedDate: string;
    assessedBy: string;
    targetLevel: CompetencyLevel;
    targetDate?: string;
    activitiesCompleted: string[];
    youngPersonViews?: string;
    nextSteps: string[];
    supportNeeded?: string;
    mentorAssigned?: string;
    notes?: string;
  },
): Promise<ServiceResult<IndependenceSkill>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_independence_skills") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      skill_area: input.skillArea,
      competency_level: input.competencyLevel,
      assessed_date: input.assessedDate,
      assessed_by: input.assessedBy,
      target_level: input.targetLevel,
      target_date: input.targetDate ?? null,
      activities_completed: input.activitiesCompleted,
      young_person_views: input.youngPersonViews ?? null,
      next_steps: input.nextSteps,
      support_needed: input.supportNeeded ?? null,
      mentor_assigned: input.mentorAssigned ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSkill(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<IndependenceSkill>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_independence_skills") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeIndependenceMetrics,
  identifyIndependenceAlerts,
};
