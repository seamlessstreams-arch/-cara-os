// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PERSONAL HYGIENE SUPPORT SERVICE
// Tracks personal hygiene support, self-care skill development, and
// independence building for looked-after children.
// CHR 2015 Reg 7 (welfare — physical and emotional wellbeing),
// Reg 10 (contact — dignity and respect),
// Reg 9 (enjoyment — age-appropriate independence).
//
// Covers: bathing/showering routines, dental hygiene, hair care,
// clothing appropriateness, menstrual hygiene support, skin care,
// and independence in personal care.
//
// SCCIF: Overall Experiences — "Children are supported with dignity."
// "Personal care needs are met sensitively and age-appropriately."
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

export type HygieneArea =
  | "bathing_showering"
  | "dental_care"
  | "hair_care"
  | "skin_care"
  | "nail_care"
  | "menstrual_hygiene"
  | "clothing_appropriateness"
  | "hand_washing"
  | "general_grooming"
  | "other";

export type SupportLevel =
  | "independent"
  | "minimal_prompting"
  | "verbal_guidance"
  | "physical_assistance"
  | "full_support";

export type ProgressRating =
  | "excellent"
  | "good"
  | "developing"
  | "needs_improvement"
  | "not_assessed";

export type SensitivityLevel =
  | "standard"
  | "cultural_consideration"
  | "trauma_informed"
  | "disability_related"
  | "age_specific";

export interface PersonalHygieneRecord {
  id: string;
  home_id: string;
  hygiene_area: HygieneArea;
  support_level: SupportLevel;
  progress_rating: ProgressRating;
  sensitivity_level: SensitivityLevel;
  assessment_date: string;
  child_name: string;
  child_id: string | null;
  child_consulted: boolean;
  child_comfortable: boolean;
  dignity_maintained: boolean;
  age_appropriate: boolean;
  culturally_sensitive: boolean;
  products_available: boolean;
  products_preferred: boolean;
  independence_encouraged: boolean;
  routine_established: boolean;
  care_plan_updated: boolean;
  training_provided: boolean;
  issues_found: string[];
  actions_taken: string[];
  assessed_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const HYGIENE_AREAS: { area: HygieneArea; label: string }[] = [
  { area: "bathing_showering", label: "Bathing/Showering" },
  { area: "dental_care", label: "Dental Care" },
  { area: "hair_care", label: "Hair Care" },
  { area: "skin_care", label: "Skin Care" },
  { area: "nail_care", label: "Nail Care" },
  { area: "menstrual_hygiene", label: "Menstrual Hygiene" },
  { area: "clothing_appropriateness", label: "Clothing Appropriateness" },
  { area: "hand_washing", label: "Hand Washing" },
  { area: "general_grooming", label: "General Grooming" },
  { area: "other", label: "Other" },
];

export const SUPPORT_LEVELS: { level: SupportLevel; label: string }[] = [
  { level: "independent", label: "Independent" },
  { level: "minimal_prompting", label: "Minimal Prompting" },
  { level: "verbal_guidance", label: "Verbal Guidance" },
  { level: "physical_assistance", label: "Physical Assistance" },
  { level: "full_support", label: "Full Support" },
];

export const PROGRESS_RATINGS: { rating: ProgressRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "developing", label: "Developing" },
  { rating: "needs_improvement", label: "Needs Improvement" },
  { rating: "not_assessed", label: "Not Assessed" },
];

export const SENSITIVITY_LEVELS: { level: SensitivityLevel; label: string }[] = [
  { level: "standard", label: "Standard" },
  { level: "cultural_consideration", label: "Cultural Consideration" },
  { level: "trauma_informed", label: "Trauma-Informed" },
  { level: "disability_related", label: "Disability Related" },
  { level: "age_specific", label: "Age Specific" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePersonalHygieneMetrics(
  records: PersonalHygieneRecord[],
): {
  total_assessments: number;
  independent_count: number;
  full_support_count: number;
  independence_rate: number;
  excellent_progress_count: number;
  needs_improvement_count: number;
  child_consulted_rate: number;
  child_comfortable_rate: number;
  dignity_maintained_rate: number;
  age_appropriate_rate: number;
  culturally_sensitive_rate: number;
  products_available_rate: number;
  independence_encouraged_rate: number;
  routine_established_rate: number;
  care_plan_updated_rate: number;
  unique_children: number;
  by_hygiene_area: Record<string, number>;
  by_support_level: Record<string, number>;
  by_progress_rating: Record<string, number>;
  by_sensitivity_level: Record<string, number>;
} {
  const independent = records.filter((r) => r.support_level === "independent").length;
  const fullSupport = records.filter((r) => r.support_level === "full_support").length;
  const independenceRate =
    records.length > 0
      ? Math.round((independent / records.length) * 1000) / 10
      : 0;

  const excellentProgress = records.filter((r) => r.progress_rating === "excellent").length;
  const needsImprovement = records.filter((r) => r.progress_rating === "needs_improvement").length;

  const boolRate = (field: keyof PersonalHygieneRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byArea: Record<string, number> = {};
  for (const r of records) byArea[r.hygiene_area] = (byArea[r.hygiene_area] ?? 0) + 1;

  const bySupport: Record<string, number> = {};
  for (const r of records) bySupport[r.support_level] = (bySupport[r.support_level] ?? 0) + 1;

  const byProgress: Record<string, number> = {};
  for (const r of records) byProgress[r.progress_rating] = (byProgress[r.progress_rating] ?? 0) + 1;

  const bySensitivity: Record<string, number> = {};
  for (const r of records) bySensitivity[r.sensitivity_level] = (bySensitivity[r.sensitivity_level] ?? 0) + 1;

  return {
    total_assessments: records.length,
    independent_count: independent,
    full_support_count: fullSupport,
    independence_rate: independenceRate,
    excellent_progress_count: excellentProgress,
    needs_improvement_count: needsImprovement,
    child_consulted_rate: boolRate("child_consulted"),
    child_comfortable_rate: boolRate("child_comfortable"),
    dignity_maintained_rate: boolRate("dignity_maintained"),
    age_appropriate_rate: boolRate("age_appropriate"),
    culturally_sensitive_rate: boolRate("culturally_sensitive"),
    products_available_rate: boolRate("products_available"),
    independence_encouraged_rate: boolRate("independence_encouraged"),
    routine_established_rate: boolRate("routine_established"),
    care_plan_updated_rate: boolRate("care_plan_updated"),
    unique_children: uniqueChildren,
    by_hygiene_area: byArea,
    by_support_level: bySupport,
    by_progress_rating: byProgress,
    by_sensitivity_level: bySensitivity,
  };
}

export function identifyPersonalHygieneAlerts(
  records: PersonalHygieneRecord[],
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

  // Dignity not maintained
  for (const r of records) {
    if (!r.dignity_maintained) {
      alerts.push({
        type: "dignity_not_maintained",
        severity: "critical",
        message: `Dignity not maintained for ${r.child_name} during ${r.hygiene_area.replace(/_/g, " ")} on ${r.assessment_date} — review practice immediately`,
        id: r.id,
      });
    }
  }

  // Child not comfortable
  const notComfortable = records.filter((r) => !r.child_comfortable).length;
  if (notComfortable >= 1) {
    alerts.push({
      type: "child_not_comfortable",
      severity: "high",
      message: `${notComfortable} ${notComfortable === 1 ? "assessment shows" : "assessments show"} child not comfortable — review approach and consult child`,
      id: "child_not_comfortable",
    });
  }

  // Products not available
  const noProducts = records.filter((r) => !r.products_available).length;
  if (noProducts >= 2) {
    alerts.push({
      type: "products_unavailable",
      severity: "high",
      message: `${noProducts} assessments without adequate products — ensure appropriate supplies are available`,
      id: "products_unavailable",
    });
  }

  // Not culturally sensitive
  const notCultural = records.filter((r) => !r.culturally_sensitive).length;
  if (notCultural >= 2) {
    alerts.push({
      type: "not_culturally_sensitive",
      severity: "medium",
      message: `${notCultural} assessments not culturally sensitive — review training and care plans`,
      id: "not_culturally_sensitive",
    });
  }

  // Care plan not updated
  const planNotUpdated = records.filter((r) => !r.care_plan_updated).length;
  if (planNotUpdated >= 3) {
    alerts.push({
      type: "care_plan_not_updated",
      severity: "medium",
      message: `${planNotUpdated} assessments without care plan updates — ensure records reflect current needs`,
      id: "care_plan_not_updated",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    hygieneArea?: HygieneArea;
    supportLevel?: SupportLevel;
    progressRating?: ProgressRating;
    limit?: number;
  },
): Promise<ServiceResult<PersonalHygieneRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_personal_hygiene") as SB).select("*").eq("home_id", homeId);
  if (filters?.hygieneArea) q = q.eq("hygiene_area", filters.hygieneArea);
  if (filters?.supportLevel) q = q.eq("support_level", filters.supportLevel);
  if (filters?.progressRating) q = q.eq("progress_rating", filters.progressRating);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    hygieneArea: HygieneArea;
    supportLevel: SupportLevel;
    progressRating: ProgressRating;
    sensitivityLevel: SensitivityLevel;
    assessmentDate: string;
    childName: string;
    childId?: string;
    childConsulted: boolean;
    childComfortable: boolean;
    dignityMaintained: boolean;
    ageAppropriate: boolean;
    culturallySensitive: boolean;
    productsAvailable: boolean;
    productsPreferred: boolean;
    independenceEncouraged: boolean;
    routineEstablished: boolean;
    carePlanUpdated: boolean;
    trainingProvided: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    assessedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<PersonalHygieneRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_personal_hygiene") as SB)
    .insert({
      home_id: input.homeId,
      hygiene_area: input.hygieneArea,
      support_level: input.supportLevel,
      progress_rating: input.progressRating,
      sensitivity_level: input.sensitivityLevel,
      assessment_date: input.assessmentDate,
      child_name: input.childName,
      child_id: input.childId ?? null,
      child_consulted: input.childConsulted,
      child_comfortable: input.childComfortable,
      dignity_maintained: input.dignityMaintained,
      age_appropriate: input.ageAppropriate,
      culturally_sensitive: input.culturallySensitive,
      products_available: input.productsAvailable,
      products_preferred: input.productsPreferred,
      independence_encouraged: input.independenceEncouraged,
      routine_established: input.routineEstablished,
      care_plan_updated: input.carePlanUpdated,
      training_provided: input.trainingProvided,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      assessed_by: input.assessedBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<PersonalHygieneRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_personal_hygiene") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePersonalHygieneMetrics,
  identifyPersonalHygieneAlerts,
};
