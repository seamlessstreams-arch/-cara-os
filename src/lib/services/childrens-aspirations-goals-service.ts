// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S ASPIRATIONS & GOALS SERVICE
// Tracks children's dreams, ambitions, future planning,
// goal setting, and progress toward personal aspirations.
// CHR 2015 Reg 7 (children's wishes — future aspirations),
// Reg 14 (care planning — goals and outcomes).
//
// Covers: aspiration category, goal status, motivation level,
// support quality, and progress tracking.
//
// SCCIF: Experiences — "Children's ambitions are nurtured and supported."
// "Goals are meaningful, realistic, and regularly reviewed."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type AspirationCategory =
  | "education"
  | "career"
  | "creative_arts"
  | "sport_fitness"
  | "relationships"
  | "independent_living"
  | "travel_experiences"
  | "personal_growth"
  | "community_involvement"
  | "other";

export type GoalStatus =
  | "achieved"
  | "on_track"
  | "in_progress"
  | "stalled"
  | "not_started";

export type MotivationLevel =
  | "highly_motivated"
  | "motivated"
  | "variable"
  | "low_motivation"
  | "disengaged";

export type SupportQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "no_support";

export interface ChildrensAspirationsGoalsRecord {
  id: string;
  home_id: string;
  aspiration_category: AspirationCategory;
  goal_status: GoalStatus;
  motivation_level: MotivationLevel;
  support_quality: SupportQuality;
  review_date: string;
  child_name: string;
  child_id: string | null;
  supported_by: string;
  child_led_goal: boolean;
  realistic_timeframe: boolean;
  resources_identified: boolean;
  mentor_involved: boolean;
  progress_celebrated: boolean;
  barriers_addressed: boolean;
  care_plan_reflects: boolean;
  social_worker_informed: boolean;
  family_aware: boolean;
  school_linked: boolean;
  review_scheduled: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ASPIRATION_CATEGORIES: { category: AspirationCategory; label: string }[] = [
  { category: "education", label: "Education" },
  { category: "career", label: "Career" },
  { category: "creative_arts", label: "Creative Arts" },
  { category: "sport_fitness", label: "Sport/Fitness" },
  { category: "relationships", label: "Relationships" },
  { category: "independent_living", label: "Independent Living" },
  { category: "travel_experiences", label: "Travel/Experiences" },
  { category: "personal_growth", label: "Personal Growth" },
  { category: "community_involvement", label: "Community Involvement" },
  { category: "other", label: "Other" },
];

export const GOAL_STATUSES: { status: GoalStatus; label: string }[] = [
  { status: "achieved", label: "Achieved" },
  { status: "on_track", label: "On Track" },
  { status: "in_progress", label: "In Progress" },
  { status: "stalled", label: "Stalled" },
  { status: "not_started", label: "Not Started" },
];

export const MOTIVATION_LEVELS: { level: MotivationLevel; label: string }[] = [
  { level: "highly_motivated", label: "Highly Motivated" },
  { level: "motivated", label: "Motivated" },
  { level: "variable", label: "Variable" },
  { level: "low_motivation", label: "Low Motivation" },
  { level: "disengaged", label: "Disengaged" },
];

export const SUPPORT_QUALITIES: { quality: SupportQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "poor", label: "Poor" },
  { quality: "no_support", label: "No Support" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeAspirationsGoalsMetrics(
  records: ChildrensAspirationsGoalsRecord[],
): {
  total_goals: number;
  stalled_count: number;
  not_started_count: number;
  disengaged_count: number;
  no_support_count: number;
  child_led_rate: number | null;
  realistic_timeframe_rate: number | null;
  resources_rate: number | null;
  mentor_rate: number | null;
  progress_celebrated_rate: number | null;
  barriers_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  family_aware_rate: number | null;
  school_linked_rate: number | null;
  review_scheduled_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_aspiration_category: Record<string, number>;
  by_goal_status: Record<string, number>;
  by_motivation_level: Record<string, number>;
  by_support_quality: Record<string, number>;
} {
  const stalled = records.filter((r) => r.goal_status === "stalled").length;
  const notStarted = records.filter((r) => r.goal_status === "not_started").length;
  const disengaged = records.filter((r) => r.motivation_level === "disengaged").length;
  const noSupport = records.filter((r) => r.support_quality === "no_support").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof ChildrensAspirationsGoalsRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.aspiration_category] = (byCategory[r.aspiration_category] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.goal_status] = (byStatus[r.goal_status] ?? 0) + 1;

  const byMotivation: Record<string, number> = {};
  for (const r of records) byMotivation[r.motivation_level] = (byMotivation[r.motivation_level] ?? 0) + 1;

  const bySupport: Record<string, number> = {};
  for (const r of records) bySupport[r.support_quality] = (bySupport[r.support_quality] ?? 0) + 1;

  return {
    total_goals: records.length,
    stalled_count: stalled,
    not_started_count: notStarted,
    disengaged_count: disengaged,
    no_support_count: noSupport,
    child_led_rate: boolRate("child_led_goal"),
    realistic_timeframe_rate: boolRate("realistic_timeframe"),
    resources_rate: boolRate("resources_identified"),
    mentor_rate: boolRate("mentor_involved"),
    progress_celebrated_rate: boolRate("progress_celebrated"),
    barriers_rate: boolRate("barriers_addressed"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    family_aware_rate: boolRate("family_aware"),
    school_linked_rate: boolRate("school_linked"),
    review_scheduled_rate: boolRate("review_scheduled"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_aspiration_category: byCategory,
    by_goal_status: byStatus,
    by_motivation_level: byMotivation,
    by_support_quality: bySupport,
  };
}

export function identifyAspirationsGoalsAlerts(
  records: ChildrensAspirationsGoalsRecord[],
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

  // Disengaged with no support — per-record
  for (const r of records) {
    if (r.motivation_level === "disengaged" && r.support_quality === "no_support") {
      alerts.push({
        type: "disengaged_no_support",
        severity: "critical",
        message: `${r.child_name} is disengaged from ${r.aspiration_category.replace(/_/g, " ")} goal with no support — urgent intervention needed`,
        id: r.id,
      });
    }
  }

  // Goals stalled
  const stalledGoals = records.filter((r) => r.goal_status === "stalled").length;
  if (stalledGoals >= 1) {
    alerts.push({
      type: "goals_stalled",
      severity: "high",
      message: `${stalledGoals} ${stalledGoals === 1 ? "goal has" : "goals have"} stalled — review support and remove barriers`,
      id: "goals_stalled",
    });
  }

  // Progress not celebrated
  const noCelebration = records.filter((r) => !r.progress_celebrated).length;
  if (noCelebration >= 1) {
    alerts.push({
      type: "progress_not_celebrated",
      severity: "high",
      message: `${noCelebration} ${noCelebration === 1 ? "goal has" : "goals have"} progress not celebrated — reinforce positive achievement`,
      id: "progress_not_celebrated",
    });
  }

  // No mentor involved
  const noMentor = records.filter((r) => !r.mentor_involved).length;
  if (noMentor >= 2) {
    alerts.push({
      type: "no_mentor",
      severity: "medium",
      message: `${noMentor} goals without mentor involvement — consider mentoring support`,
      id: "no_mentor",
    });
  }

  // Review not scheduled
  const noReview = records.filter((r) => !r.review_scheduled).length;
  if (noReview >= 2) {
    alerts.push({
      type: "review_not_scheduled",
      severity: "medium",
      message: `${noReview} goals without review scheduled — ensure ongoing progress tracking`,
      id: "review_not_scheduled",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    aspirationCategory?: AspirationCategory;
    goalStatus?: GoalStatus;
    motivationLevel?: MotivationLevel;
    supportQuality?: SupportQuality;
    limit?: number;
  },
): Promise<ServiceResult<ChildrensAspirationsGoalsRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_childrens_aspirations_goals") as SB).select("*").eq("home_id", homeId);
  if (filters?.aspirationCategory) q = q.eq("aspiration_category", filters.aspirationCategory);
  if (filters?.goalStatus) q = q.eq("goal_status", filters.goalStatus);
  if (filters?.motivationLevel) q = q.eq("motivation_level", filters.motivationLevel);
  if (filters?.supportQuality) q = q.eq("support_quality", filters.supportQuality);
  q = q.order("review_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ChildrensAspirationsGoalsRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  aspirationCategory: AspirationCategory;
  goalStatus: GoalStatus;
  motivationLevel: MotivationLevel;
  supportQuality: SupportQuality;
  reviewDate: string;
  childName: string;
  childId?: string | null;
  supportedBy: string;
  childLedGoal?: boolean;
  realisticTimeframe?: boolean;
  resourcesIdentified?: boolean;
  mentorInvolved?: boolean;
  progressCelebrated?: boolean;
  barriersAddressed?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  familyAware?: boolean;
  schoolLinked?: boolean;
  reviewScheduled?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<ChildrensAspirationsGoalsRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_childrens_aspirations_goals") as SB)
    .insert({
      home_id: payload.homeId,
      aspiration_category: payload.aspirationCategory,
      goal_status: payload.goalStatus,
      motivation_level: payload.motivationLevel,
      support_quality: payload.supportQuality,
      review_date: payload.reviewDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      supported_by: payload.supportedBy,
      child_led_goal: payload.childLedGoal ?? true,
      realistic_timeframe: payload.realisticTimeframe ?? true,
      resources_identified: payload.resourcesIdentified ?? true,
      mentor_involved: payload.mentorInvolved ?? true,
      progress_celebrated: payload.progressCelebrated ?? true,
      barriers_addressed: payload.barriersAddressed ?? true,
      care_plan_reflects: payload.carePlanReflects ?? true,
      social_worker_informed: payload.socialWorkerInformed ?? true,
      family_aware: payload.familyAware ?? true,
      school_linked: payload.schoolLinked ?? true,
      review_scheduled: payload.reviewScheduled ?? true,
      recorded_promptly: payload.recordedPromptly ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ChildrensAspirationsGoalsRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    aspirationCategory: AspirationCategory;
    goalStatus: GoalStatus;
    motivationLevel: MotivationLevel;
    supportQuality: SupportQuality;
    reviewDate: string;
    childName: string;
    childId: string | null;
    supportedBy: string;
    childLedGoal: boolean;
    realisticTimeframe: boolean;
    resourcesIdentified: boolean;
    mentorInvolved: boolean;
    progressCelebrated: boolean;
    barriersAddressed: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    familyAware: boolean;
    schoolLinked: boolean;
    reviewScheduled: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<ChildrensAspirationsGoalsRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.aspirationCategory !== undefined) mapped.aspiration_category = updates.aspirationCategory;
  if (updates.goalStatus !== undefined) mapped.goal_status = updates.goalStatus;
  if (updates.motivationLevel !== undefined) mapped.motivation_level = updates.motivationLevel;
  if (updates.supportQuality !== undefined) mapped.support_quality = updates.supportQuality;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.supportedBy !== undefined) mapped.supported_by = updates.supportedBy;
  if (updates.childLedGoal !== undefined) mapped.child_led_goal = updates.childLedGoal;
  if (updates.realisticTimeframe !== undefined) mapped.realistic_timeframe = updates.realisticTimeframe;
  if (updates.resourcesIdentified !== undefined) mapped.resources_identified = updates.resourcesIdentified;
  if (updates.mentorInvolved !== undefined) mapped.mentor_involved = updates.mentorInvolved;
  if (updates.progressCelebrated !== undefined) mapped.progress_celebrated = updates.progressCelebrated;
  if (updates.barriersAddressed !== undefined) mapped.barriers_addressed = updates.barriersAddressed;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.familyAware !== undefined) mapped.family_aware = updates.familyAware;
  if (updates.schoolLinked !== undefined) mapped.school_linked = updates.schoolLinked;
  if (updates.reviewScheduled !== undefined) mapped.review_scheduled = updates.reviewScheduled;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_childrens_aspirations_goals") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ChildrensAspirationsGoalsRecord };
}

export const _testing = { computeAspirationsGoalsMetrics, identifyAspirationsGoalsAlerts };
