// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DECORATION & PERSONALISATION SERVICE
// Tracks how children personalise their bedrooms and contribute
// to communal spaces, ensuring a homely environment that reflects
// individual identity and preferences.
// CHR 2015 Reg 10 (enjoyment and achievement — personalisation),
// Reg 6 (quality of care — homely environment),
// Reg 5 (engaging with wider community — home as base).
//
// Covers: bedroom personalisation, communal space contributions,
// choice and control, cultural expression, sensory needs,
// budget tracking, and child satisfaction.
//
// SCCIF: Experiences — "The home feels like a home, not an institution."
// "Children can personalise their rooms and feel ownership."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type PersonalisationType =
  | "bedroom_decoration"
  | "bedding_choice"
  | "wall_art_posters"
  | "furniture_arrangement"
  | "colour_scheme"
  | "communal_area_input"
  | "garden_outdoor"
  | "sensory_items"
  | "cultural_items"
  | "other";

export type SatisfactionLevel =
  | "very_satisfied"
  | "satisfied"
  | "neutral"
  | "dissatisfied"
  | "very_dissatisfied";

export type PersonalisationScope =
  | "bedroom_only"
  | "communal_areas"
  | "both"
  | "outdoor"
  | "whole_home";

export type BudgetStatus =
  | "within_budget"
  | "over_budget"
  | "under_budget"
  | "no_budget_set"
  | "awaiting_approval";

export interface HomeDecorationPersonalisationRecord {
  id: string;
  home_id: string;
  personalisation_type: PersonalisationType;
  satisfaction_level: SatisfactionLevel;
  personalisation_scope: PersonalisationScope;
  budget_status: BudgetStatus;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  assessed_by: string;
  child_chose: boolean;
  child_involved_planning: boolean;
  reflects_identity: boolean;
  culturally_appropriate: boolean;
  sensory_needs_met: boolean;
  age_appropriate: boolean;
  safety_checked: boolean;
  photographs_taken: boolean;
  social_worker_informed: boolean;
  budget_discussed: boolean;
  child_satisfied: boolean;
  regularly_updated: boolean;
  issues_found: string[];
  actions_taken: string[];
  budget_amount: number | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PERSONALISATION_TYPES: { type: PersonalisationType; label: string }[] = [
  { type: "bedroom_decoration", label: "Bedroom Decoration" },
  { type: "bedding_choice", label: "Bedding Choice" },
  { type: "wall_art_posters", label: "Wall Art/Posters" },
  { type: "furniture_arrangement", label: "Furniture Arrangement" },
  { type: "colour_scheme", label: "Colour Scheme" },
  { type: "communal_area_input", label: "Communal Area Input" },
  { type: "garden_outdoor", label: "Garden/Outdoor" },
  { type: "sensory_items", label: "Sensory Items" },
  { type: "cultural_items", label: "Cultural Items" },
  { type: "other", label: "Other" },
];

export const SATISFACTION_LEVELS: { level: SatisfactionLevel; label: string }[] = [
  { level: "very_satisfied", label: "Very Satisfied" },
  { level: "satisfied", label: "Satisfied" },
  { level: "neutral", label: "Neutral" },
  { level: "dissatisfied", label: "Dissatisfied" },
  { level: "very_dissatisfied", label: "Very Dissatisfied" },
];

export const PERSONALISATION_SCOPES: { scope: PersonalisationScope; label: string }[] = [
  { scope: "bedroom_only", label: "Bedroom Only" },
  { scope: "communal_areas", label: "Communal Areas" },
  { scope: "both", label: "Both" },
  { scope: "outdoor", label: "Outdoor" },
  { scope: "whole_home", label: "Whole Home" },
];

export const BUDGET_STATUSES: { status: BudgetStatus; label: string }[] = [
  { status: "within_budget", label: "Within Budget" },
  { status: "over_budget", label: "Over Budget" },
  { status: "under_budget", label: "Under Budget" },
  { status: "no_budget_set", label: "No Budget Set" },
  { status: "awaiting_approval", label: "Awaiting Approval" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeHomeDecorationMetrics(
  records: HomeDecorationPersonalisationRecord[],
): {
  total_assessments: number;
  very_satisfied_count: number;
  dissatisfied_count: number;
  over_budget_count: number;
  within_budget_count: number;
  child_chose_rate: number | null;
  child_involved_rate: number | null;
  reflects_identity_rate: number | null;
  culturally_appropriate_rate: number | null;
  sensory_needs_rate: number | null;
  age_appropriate_rate: number | null;
  safety_checked_rate: number | null;
  photographs_taken_rate: number | null;
  social_worker_informed_rate: number | null;
  budget_discussed_rate: number | null;
  child_satisfied_rate: number | null;
  regularly_updated_rate: number | null;
  unique_children: number;
  by_personalisation_type: Record<string, number>;
  by_satisfaction_level: Record<string, number>;
  by_personalisation_scope: Record<string, number>;
  by_budget_status: Record<string, number>;
} {
  const verySatisfied = records.filter((r) => r.satisfaction_level === "very_satisfied").length;
  const dissatisfied = records.filter((r) => r.satisfaction_level === "dissatisfied" || r.satisfaction_level === "very_dissatisfied").length;
  const overBudget = records.filter((r) => r.budget_status === "over_budget").length;
  const withinBudget = records.filter((r) => r.budget_status === "within_budget").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof HomeDecorationPersonalisationRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.personalisation_type] = (byType[r.personalisation_type] ?? 0) + 1;

  const bySatisfaction: Record<string, number> = {};
  for (const r of records) bySatisfaction[r.satisfaction_level] = (bySatisfaction[r.satisfaction_level] ?? 0) + 1;

  const byScope: Record<string, number> = {};
  for (const r of records) byScope[r.personalisation_scope] = (byScope[r.personalisation_scope] ?? 0) + 1;

  const byBudget: Record<string, number> = {};
  for (const r of records) byBudget[r.budget_status] = (byBudget[r.budget_status] ?? 0) + 1;

  return {
    total_assessments: records.length,
    very_satisfied_count: verySatisfied,
    dissatisfied_count: dissatisfied,
    over_budget_count: overBudget,
    within_budget_count: withinBudget,
    child_chose_rate: boolRate("child_chose"),
    child_involved_rate: boolRate("child_involved_planning"),
    reflects_identity_rate: boolRate("reflects_identity"),
    culturally_appropriate_rate: boolRate("culturally_appropriate"),
    sensory_needs_rate: boolRate("sensory_needs_met"),
    age_appropriate_rate: boolRate("age_appropriate"),
    safety_checked_rate: boolRate("safety_checked"),
    photographs_taken_rate: boolRate("photographs_taken"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    budget_discussed_rate: boolRate("budget_discussed"),
    child_satisfied_rate: boolRate("child_satisfied"),
    regularly_updated_rate: boolRate("regularly_updated"),
    unique_children: uniqueChildren,
    by_personalisation_type: byType,
    by_satisfaction_level: bySatisfaction,
    by_personalisation_scope: byScope,
    by_budget_status: byBudget,
  };
}

export function identifyHomeDecorationAlerts(
  records: HomeDecorationPersonalisationRecord[],
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

  // Dissatisfied child with no choice
  for (const r of records) {
    if ((r.satisfaction_level === "dissatisfied" || r.satisfaction_level === "very_dissatisfied") && !r.child_chose) {
      alerts.push({
        type: "dissatisfied_no_choice",
        severity: "critical",
        message: `${r.child_name} dissatisfied with ${r.personalisation_type.replace(/_/g, " ")} and had no choice — address immediately`,
        id: r.id,
      });
    }
  }

  // Not reflecting identity
  const noIdentity = records.filter((r) => !r.reflects_identity).length;
  if (noIdentity >= 1) {
    alerts.push({
      type: "not_reflecting_identity",
      severity: "high",
      message: `${noIdentity} ${noIdentity === 1 ? "assessment shows" : "assessments show"} personalisation not reflecting identity`,
      id: "not_reflecting_identity",
    });
  }

  // Safety not checked
  const noSafety = records.filter((r) => !r.safety_checked).length;
  if (noSafety >= 1) {
    alerts.push({
      type: "safety_not_checked",
      severity: "high",
      message: `${noSafety} ${noSafety === 1 ? "item has" : "items have"} not been safety checked — ensure safe environment`,
      id: "safety_not_checked",
    });
  }

  // Not culturally appropriate
  const noCultural = records.filter((r) => !r.culturally_appropriate).length;
  if (noCultural >= 2) {
    alerts.push({
      type: "not_culturally_appropriate",
      severity: "medium",
      message: `${noCultural} assessments not culturally appropriate — review cultural sensitivity`,
      id: "not_culturally_appropriate",
    });
  }

  // Not regularly updated
  const notUpdated = records.filter((r) => !r.regularly_updated).length;
  if (notUpdated >= 3) {
    alerts.push({
      type: "not_regularly_updated",
      severity: "medium",
      message: `${notUpdated} personalisation areas not regularly updated — keep environments fresh`,
      id: "not_regularly_updated",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    personalisationType?: PersonalisationType;
    satisfactionLevel?: SatisfactionLevel;
    personalisationScope?: PersonalisationScope;
    budgetStatus?: BudgetStatus;
    limit?: number;
  },
): Promise<ServiceResult<HomeDecorationPersonalisationRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_home_decoration_personalisation") as SB).select("*").eq("home_id", homeId);
  if (filters?.personalisationType) q = q.eq("personalisation_type", filters.personalisationType);
  if (filters?.satisfactionLevel) q = q.eq("satisfaction_level", filters.satisfactionLevel);
  if (filters?.personalisationScope) q = q.eq("personalisation_scope", filters.personalisationScope);
  if (filters?.budgetStatus) q = q.eq("budget_status", filters.budgetStatus);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    personalisationType: PersonalisationType;
    satisfactionLevel: SatisfactionLevel;
    personalisationScope: PersonalisationScope;
    budgetStatus: BudgetStatus;
    assessmentDate: string;
    childName: string;
    childId?: string | null;
    assessedBy: string;
    childChose?: boolean;
    childInvolvedPlanning?: boolean;
    reflectsIdentity?: boolean;
    culturallyAppropriate?: boolean;
    sensoryNeedsMet?: boolean;
    ageAppropriate?: boolean;
    safetyChecked?: boolean;
    photographsTaken?: boolean;
    socialWorkerInformed?: boolean;
    budgetDiscussed?: boolean;
    childSatisfied?: boolean;
    regularlyUpdated?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    budgetAmount?: number | null;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<HomeDecorationPersonalisationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_home_decoration_personalisation") as SB)
    .insert({
      home_id: payload.homeId,
      personalisation_type: payload.personalisationType,
      satisfaction_level: payload.satisfactionLevel,
      personalisation_scope: payload.personalisationScope,
      budget_status: payload.budgetStatus,
      assessment_date: payload.assessmentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      assessed_by: payload.assessedBy,
      child_chose: payload.childChose ?? true,
      child_involved_planning: payload.childInvolvedPlanning ?? true,
      reflects_identity: payload.reflectsIdentity ?? true,
      culturally_appropriate: payload.culturallyAppropriate ?? true,
      sensory_needs_met: payload.sensoryNeedsMet ?? true,
      age_appropriate: payload.ageAppropriate ?? true,
      safety_checked: payload.safetyChecked ?? true,
      photographs_taken: payload.photographsTaken ?? false,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      budget_discussed: payload.budgetDiscussed ?? false,
      child_satisfied: payload.childSatisfied ?? true,
      regularly_updated: payload.regularlyUpdated ?? true,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      budget_amount: payload.budgetAmount ?? null,
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
    personalisationType: PersonalisationType;
    satisfactionLevel: SatisfactionLevel;
    personalisationScope: PersonalisationScope;
    budgetStatus: BudgetStatus;
    assessmentDate: string;
    childName: string;
    childId: string | null;
    assessedBy: string;
    childChose: boolean;
    childInvolvedPlanning: boolean;
    reflectsIdentity: boolean;
    culturallyAppropriate: boolean;
    sensoryNeedsMet: boolean;
    ageAppropriate: boolean;
    safetyChecked: boolean;
    photographsTaken: boolean;
    socialWorkerInformed: boolean;
    budgetDiscussed: boolean;
    childSatisfied: boolean;
    regularlyUpdated: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    budgetAmount: number | null;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<HomeDecorationPersonalisationRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.personalisationType !== undefined) mapped.personalisation_type = updates.personalisationType;
  if (updates.satisfactionLevel !== undefined) mapped.satisfaction_level = updates.satisfactionLevel;
  if (updates.personalisationScope !== undefined) mapped.personalisation_scope = updates.personalisationScope;
  if (updates.budgetStatus !== undefined) mapped.budget_status = updates.budgetStatus;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.childChose !== undefined) mapped.child_chose = updates.childChose;
  if (updates.childInvolvedPlanning !== undefined) mapped.child_involved_planning = updates.childInvolvedPlanning;
  if (updates.reflectsIdentity !== undefined) mapped.reflects_identity = updates.reflectsIdentity;
  if (updates.culturallyAppropriate !== undefined) mapped.culturally_appropriate = updates.culturallyAppropriate;
  if (updates.sensoryNeedsMet !== undefined) mapped.sensory_needs_met = updates.sensoryNeedsMet;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.safetyChecked !== undefined) mapped.safety_checked = updates.safetyChecked;
  if (updates.photographsTaken !== undefined) mapped.photographs_taken = updates.photographsTaken;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.budgetDiscussed !== undefined) mapped.budget_discussed = updates.budgetDiscussed;
  if (updates.childSatisfied !== undefined) mapped.child_satisfied = updates.childSatisfied;
  if (updates.regularlyUpdated !== undefined) mapped.regularly_updated = updates.regularlyUpdated;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.budgetAmount !== undefined) mapped.budget_amount = updates.budgetAmount;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_home_decoration_personalisation") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeHomeDecorationMetrics,
  identifyHomeDecorationAlerts,
};
