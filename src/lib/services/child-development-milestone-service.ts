// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD DEVELOPMENT MILESTONE SERVICE
// Tracks developmental milestones, progress assessments, and
// support interventions across key developmental domains.
// CHR 2015 Reg 7 (individual child — holistic development),
// Reg 8 (health plan — developmental needs).
//
// Covers: developmental domain, achievement status, support level,
// progress tracking, and multi-agency coordination.
//
// SCCIF: Experiences — "Children make progress in their development."
// "Support is tailored to individual developmental needs."
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

export type DevelopmentalDomain =
  | "cognitive"
  | "language_communication"
  | "physical_motor"
  | "social_emotional"
  | "self_care"
  | "play_creativity"
  | "moral_spiritual"
  | "identity_belonging"
  | "resilience"
  | "other";

export type AchievementStatus =
  | "exceeded"
  | "met"
  | "progressing"
  | "not_met"
  | "regressed";

export type SupportLevel =
  | "independent"
  | "minimal_support"
  | "moderate_support"
  | "significant_support"
  | "intensive_support";

export type ProgressRating =
  | "excellent_progress"
  | "good_progress"
  | "steady_progress"
  | "limited_progress"
  | "no_progress";

export interface ChildDevelopmentMilestoneRecord {
  id: string;
  home_id: string;
  developmental_domain: DevelopmentalDomain;
  achievement_status: AchievementStatus;
  support_level: SupportLevel;
  progress_rating: ProgressRating;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  assessed_by: string;
  child_views_included: boolean;
  age_appropriate_targets: boolean;
  care_plan_linked: boolean;
  school_input_obtained: boolean;
  specialist_input_obtained: boolean;
  parent_informed: boolean;
  social_worker_informed: boolean;
  celebration_of_achievement: boolean;
  next_steps_identified: boolean;
  resources_in_place: boolean;
  multi_agency_coordinated: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DEVELOPMENTAL_DOMAINS: { domain: DevelopmentalDomain; label: string }[] = [
  { domain: "cognitive", label: "Cognitive" },
  { domain: "language_communication", label: "Language & Communication" },
  { domain: "physical_motor", label: "Physical & Motor" },
  { domain: "social_emotional", label: "Social & Emotional" },
  { domain: "self_care", label: "Self-Care" },
  { domain: "play_creativity", label: "Play & Creativity" },
  { domain: "moral_spiritual", label: "Moral & Spiritual" },
  { domain: "identity_belonging", label: "Identity & Belonging" },
  { domain: "resilience", label: "Resilience" },
  { domain: "other", label: "Other" },
];

export const ACHIEVEMENT_STATUSES: { status: AchievementStatus; label: string }[] = [
  { status: "exceeded", label: "Exceeded" },
  { status: "met", label: "Met" },
  { status: "progressing", label: "Progressing" },
  { status: "not_met", label: "Not Met" },
  { status: "regressed", label: "Regressed" },
];

export const SUPPORT_LEVELS: { level: SupportLevel; label: string }[] = [
  { level: "independent", label: "Independent" },
  { level: "minimal_support", label: "Minimal Support" },
  { level: "moderate_support", label: "Moderate Support" },
  { level: "significant_support", label: "Significant Support" },
  { level: "intensive_support", label: "Intensive Support" },
];

export const PROGRESS_RATINGS: { rating: ProgressRating; label: string }[] = [
  { rating: "excellent_progress", label: "Excellent Progress" },
  { rating: "good_progress", label: "Good Progress" },
  { rating: "steady_progress", label: "Steady Progress" },
  { rating: "limited_progress", label: "Limited Progress" },
  { rating: "no_progress", label: "No Progress" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeChildDevelopmentMetrics(
  records: ChildDevelopmentMilestoneRecord[],
): {
  total_milestones: number;
  not_met_count: number;
  regressed_count: number;
  intensive_support_count: number;
  no_progress_count: number;
  child_views_rate: number;
  age_appropriate_rate: number;
  care_plan_linked_rate: number;
  school_input_rate: number;
  specialist_input_rate: number;
  parent_informed_rate: number;
  social_worker_rate: number;
  celebration_rate: number;
  next_steps_rate: number;
  resources_rate: number;
  multi_agency_rate: number;
  recorded_promptly_rate: number;
  unique_children: number;
  by_developmental_domain: Record<string, number>;
  by_achievement_status: Record<string, number>;
  by_support_level: Record<string, number>;
  by_progress_rating: Record<string, number>;
} {
  const notMet = records.filter((r) => r.achievement_status === "not_met").length;
  const regressed = records.filter((r) => r.achievement_status === "regressed").length;
  const intensiveSupport = records.filter((r) => r.support_level === "intensive_support").length;
  const noProgress = records.filter((r) => r.progress_rating === "no_progress").length;

  const boolRate = (field: keyof ChildDevelopmentMilestoneRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byDomain: Record<string, number> = {};
  for (const r of records) byDomain[r.developmental_domain] = (byDomain[r.developmental_domain] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.achievement_status] = (byStatus[r.achievement_status] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.support_level] = (byLevel[r.support_level] ?? 0) + 1;

  const byRating: Record<string, number> = {};
  for (const r of records) byRating[r.progress_rating] = (byRating[r.progress_rating] ?? 0) + 1;

  return {
    total_milestones: records.length,
    not_met_count: notMet,
    regressed_count: regressed,
    intensive_support_count: intensiveSupport,
    no_progress_count: noProgress,
    child_views_rate: boolRate("child_views_included"),
    age_appropriate_rate: boolRate("age_appropriate_targets"),
    care_plan_linked_rate: boolRate("care_plan_linked"),
    school_input_rate: boolRate("school_input_obtained"),
    specialist_input_rate: boolRate("specialist_input_obtained"),
    parent_informed_rate: boolRate("parent_informed"),
    social_worker_rate: boolRate("social_worker_informed"),
    celebration_rate: boolRate("celebration_of_achievement"),
    next_steps_rate: boolRate("next_steps_identified"),
    resources_rate: boolRate("resources_in_place"),
    multi_agency_rate: boolRate("multi_agency_coordinated"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_developmental_domain: byDomain,
    by_achievement_status: byStatus,
    by_support_level: byLevel,
    by_progress_rating: byRating,
  };
}

export function identifyChildDevelopmentAlerts(
  records: ChildDevelopmentMilestoneRecord[],
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

  // Regressed without specialist input
  for (const r of records) {
    if (r.achievement_status === "regressed" && !r.specialist_input_obtained) {
      alerts.push({
        type: "regressed_no_specialist",
        severity: "critical",
        message: `${r.child_name} has regressed in ${r.developmental_domain.replace(/_/g, " ")} without specialist input — arrange assessment`,
        id: r.id,
      });
    }
  }

  // No progress identified
  const noProgressCount = records.filter((r) => r.progress_rating === "no_progress").length;
  if (noProgressCount >= 1) {
    alerts.push({
      type: "no_progress",
      severity: "high",
      message: `${noProgressCount} ${noProgressCount === 1 ? "milestone shows" : "milestones show"} no progress — review support strategies`,
      id: "no_progress",
    });
  }

  // Next steps not identified
  const noNextSteps = records.filter((r) => !r.next_steps_identified).length;
  if (noNextSteps >= 1) {
    alerts.push({
      type: "no_next_steps",
      severity: "high",
      message: `${noNextSteps} ${noNextSteps === 1 ? "milestone has" : "milestones have"} no next steps identified — update development plans`,
      id: "no_next_steps",
    });
  }

  // Achievement not celebrated
  const noCelebration = records.filter((r) => !r.celebration_of_achievement).length;
  if (noCelebration >= 2) {
    alerts.push({
      type: "achievement_not_celebrated",
      severity: "medium",
      message: `${noCelebration} milestones without celebration of achievement — recognise children's progress`,
      id: "achievement_not_celebrated",
    });
  }

  // Resources not in place
  const noResources = records.filter((r) => !r.resources_in_place).length;
  if (noResources >= 2) {
    alerts.push({
      type: "resources_not_in_place",
      severity: "medium",
      message: `${noResources} milestones without resources in place — review developmental support`,
      id: "resources_not_in_place",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    developmentalDomain?: DevelopmentalDomain;
    achievementStatus?: AchievementStatus;
    supportLevel?: SupportLevel;
    progressRating?: ProgressRating;
    limit?: number;
  },
): Promise<ServiceResult<ChildDevelopmentMilestoneRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_development_milestone") as SB).select("*").eq("home_id", homeId);
  if (filters?.developmentalDomain) q = q.eq("developmental_domain", filters.developmentalDomain);
  if (filters?.achievementStatus) q = q.eq("achievement_status", filters.achievementStatus);
  if (filters?.supportLevel) q = q.eq("support_level", filters.supportLevel);
  if (filters?.progressRating) q = q.eq("progress_rating", filters.progressRating);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    developmentalDomain: DevelopmentalDomain;
    achievementStatus: AchievementStatus;
    supportLevel: SupportLevel;
    progressRating: ProgressRating;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    assessedBy: string;
    childViewsIncluded?: boolean;
    ageAppropriateTargets?: boolean;
    carePlanLinked?: boolean;
    schoolInputObtained?: boolean;
    specialistInputObtained?: boolean;
    parentInformed?: boolean;
    socialWorkerInformed?: boolean;
    celebrationOfAchievement?: boolean;
    nextStepsIdentified?: boolean;
    resourcesInPlace?: boolean;
    multiAgencyCoordinated?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<ChildDevelopmentMilestoneRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_development_milestone") as SB)
    .insert({
      home_id: payload.homeId,
      developmental_domain: payload.developmentalDomain,
      achievement_status: payload.achievementStatus,
      support_level: payload.supportLevel,
      progress_rating: payload.progressRating,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      assessed_by: payload.assessedBy,
      child_views_included: payload.childViewsIncluded ?? true,
      age_appropriate_targets: payload.ageAppropriateTargets ?? true,
      care_plan_linked: payload.carePlanLinked ?? true,
      school_input_obtained: payload.schoolInputObtained ?? true,
      specialist_input_obtained: payload.specialistInputObtained ?? false,
      parent_informed: payload.parentInformed ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      celebration_of_achievement: payload.celebrationOfAchievement ?? true,
      next_steps_identified: payload.nextStepsIdentified ?? true,
      resources_in_place: payload.resourcesInPlace ?? true,
      multi_agency_coordinated: payload.multiAgencyCoordinated ?? false,
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
    developmentalDomain: DevelopmentalDomain;
    achievementStatus: AchievementStatus;
    supportLevel: SupportLevel;
    progressRating: ProgressRating;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    assessedBy: string;
    childViewsIncluded: boolean;
    ageAppropriateTargets: boolean;
    carePlanLinked: boolean;
    schoolInputObtained: boolean;
    specialistInputObtained: boolean;
    parentInformed: boolean;
    socialWorkerInformed: boolean;
    celebrationOfAchievement: boolean;
    nextStepsIdentified: boolean;
    resourcesInPlace: boolean;
    multiAgencyCoordinated: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildDevelopmentMilestoneRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.developmentalDomain !== undefined) mapped.developmental_domain = updates.developmentalDomain;
  if (updates.achievementStatus !== undefined) mapped.achievement_status = updates.achievementStatus;
  if (updates.supportLevel !== undefined) mapped.support_level = updates.supportLevel;
  if (updates.progressRating !== undefined) mapped.progress_rating = updates.progressRating;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.childViewsIncluded !== undefined) mapped.child_views_included = updates.childViewsIncluded;
  if (updates.ageAppropriateTargets !== undefined) mapped.age_appropriate_targets = updates.ageAppropriateTargets;
  if (updates.carePlanLinked !== undefined) mapped.care_plan_linked = updates.carePlanLinked;
  if (updates.schoolInputObtained !== undefined) mapped.school_input_obtained = updates.schoolInputObtained;
  if (updates.specialistInputObtained !== undefined) mapped.specialist_input_obtained = updates.specialistInputObtained;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.celebrationOfAchievement !== undefined) mapped.celebration_of_achievement = updates.celebrationOfAchievement;
  if (updates.nextStepsIdentified !== undefined) mapped.next_steps_identified = updates.nextStepsIdentified;
  if (updates.resourcesInPlace !== undefined) mapped.resources_in_place = updates.resourcesInPlace;
  if (updates.multiAgencyCoordinated !== undefined) mapped.multi_agency_coordinated = updates.multiAgencyCoordinated;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_child_development_milestone") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeChildDevelopmentMetrics,
  identifyChildDevelopmentAlerts,
};
