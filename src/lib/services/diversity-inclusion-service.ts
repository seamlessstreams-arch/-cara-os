// ══════════════════════════════════════════════════════════════════════════════
// CARA — DIVERSITY & INCLUSION SERVICE
// Monitors equality, diversity, and inclusion practice within the home,
// tracking protected characteristics support, accessibility adaptations,
// equality impact assessments, and inclusive practice evidence.
// CHR 2015 Reg 6 (quality and purpose of care — individual needs),
// Reg 11 (positive relationships — respecting diversity),
// Equality Act 2010 (protected characteristics).
//
// Tracks EDI assessments, adaptations, staff training completion,
// and outcomes for children with protected characteristics.
//
// SCCIF: Overall Experiences — "Children's diversity is celebrated."
// "The home promotes equality and prevents discrimination."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ProtectedCharacteristic =
  | "race_ethnicity"
  | "religion_belief"
  | "disability"
  | "gender_identity"
  | "sexual_orientation"
  | "age"
  | "language"
  | "cultural_heritage"
  | "other";

export type SupportCategory =
  | "dietary_requirement"
  | "religious_observance"
  | "language_support"
  | "accessibility_adaptation"
  | "cultural_activity"
  | "identity_support"
  | "community_link"
  | "specialist_provision"
  | "staff_training"
  | "policy_adaptation"
  | "other";

export type SupportStatus =
  | "in_place"
  | "partially_met"
  | "not_met"
  | "under_review"
  | "not_applicable";

export type ReviewOutcome =
  | "fully_effective"
  | "partially_effective"
  | "not_effective"
  | "needs_adjustment"
  | "not_reviewed";

export interface DiversityRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  protected_characteristic: ProtectedCharacteristic;
  characteristic_detail: string;
  support_category: SupportCategory;
  support_description: string;
  support_status: SupportStatus;
  review_outcome: ReviewOutcome;
  reviewed_date: string | null;
  next_review_date: string | null;
  child_views: string | null;
  child_satisfied: boolean | null;
  staff_aware: boolean;
  staff_trained: boolean;
  external_support: string | null;
  equality_impact_assessed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PROTECTED_CHARACTERISTICS: { characteristic: ProtectedCharacteristic; label: string }[] = [
  { characteristic: "race_ethnicity", label: "Race / Ethnicity" },
  { characteristic: "religion_belief", label: "Religion / Belief" },
  { characteristic: "disability", label: "Disability" },
  { characteristic: "gender_identity", label: "Gender Identity" },
  { characteristic: "sexual_orientation", label: "Sexual Orientation" },
  { characteristic: "age", label: "Age" },
  { characteristic: "language", label: "Language" },
  { characteristic: "cultural_heritage", label: "Cultural Heritage" },
  { characteristic: "other", label: "Other" },
];

export const SUPPORT_CATEGORIES: { category: SupportCategory; label: string }[] = [
  { category: "dietary_requirement", label: "Dietary Requirement" },
  { category: "religious_observance", label: "Religious Observance" },
  { category: "language_support", label: "Language Support" },
  { category: "accessibility_adaptation", label: "Accessibility Adaptation" },
  { category: "cultural_activity", label: "Cultural Activity" },
  { category: "identity_support", label: "Identity Support" },
  { category: "community_link", label: "Community Link" },
  { category: "specialist_provision", label: "Specialist Provision" },
  { category: "staff_training", label: "Staff Training" },
  { category: "policy_adaptation", label: "Policy Adaptation" },
  { category: "other", label: "Other" },
];

export const SUPPORT_STATUSES: { status: SupportStatus; label: string }[] = [
  { status: "in_place", label: "In Place" },
  { status: "partially_met", label: "Partially Met" },
  { status: "not_met", label: "Not Met" },
  { status: "under_review", label: "Under Review" },
  { status: "not_applicable", label: "Not Applicable" },
];

export const REVIEW_OUTCOMES: { outcome: ReviewOutcome; label: string }[] = [
  { outcome: "fully_effective", label: "Fully Effective" },
  { outcome: "partially_effective", label: "Partially Effective" },
  { outcome: "not_effective", label: "Not Effective" },
  { outcome: "needs_adjustment", label: "Needs Adjustment" },
  { outcome: "not_reviewed", label: "Not Reviewed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeDiversityMetrics(
  records: DiversityRecord[],
  totalChildren: number,
): {
  total_records: number;
  children_with_records: number;
  children_coverage: number | null;
  in_place_count: number;
  partially_met_count: number;
  not_met_count: number;
  under_review_count: number;
  fully_effective_count: number;
  not_effective_count: number;
  child_satisfied_rate: number | null;
  staff_aware_rate: number | null;
  staff_trained_rate: number | null;
  equality_impact_rate: number | null;
  child_views_rate: number | null;
  by_characteristic: Record<string, number>;
  by_support_category: Record<string, number>;
  by_support_status: Record<string, number>;
  by_review_outcome: Record<string, number>;
} {
  const uniqueChildren = new Set(records.map((r) => r.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : null;

  const inPlace = records.filter((r) => r.support_status === "in_place").length;
  const partiallyMet = records.filter((r) => r.support_status === "partially_met").length;
  const notMet = records.filter((r) => r.support_status === "not_met").length;
  const underReview = records.filter((r) => r.support_status === "under_review").length;

  const fullyEffective = records.filter((r) => r.review_outcome === "fully_effective").length;
  const notEffective = records.filter((r) => r.review_outcome === "not_effective").length;

  const withSatisfaction = records.filter((r) => r.child_satisfied !== null);
  const satisfied = withSatisfaction.filter((r) => r.child_satisfied === true).length;
  const satisfiedRate =
    withSatisfaction.length > 0
      ? Math.round((satisfied / withSatisfaction.length) * 1000) / 10
      : null;

  const staffAware = records.filter((r) => r.staff_aware).length;
  const awareRate =
    records.length > 0
      ? Math.round((staffAware / records.length) * 1000) / 10
      : null;

  const staffTrained = records.filter((r) => r.staff_trained).length;
  const trainedRate =
    records.length > 0
      ? Math.round((staffTrained / records.length) * 1000) / 10
      : null;

  const eiaRecords = records.filter((r) => r.equality_impact_assessed).length;
  const eiaRate =
    records.length > 0
      ? Math.round((eiaRecords / records.length) * 1000) / 10
      : null;

  const childViews = records.filter((r) => r.child_views !== null).length;
  const childRate =
    records.length > 0
      ? Math.round((childViews / records.length) * 1000) / 10
      : null;

  const byChar: Record<string, number> = {};
  for (const r of records) byChar[r.protected_characteristic] = (byChar[r.protected_characteristic] ?? 0) + 1;

  const byCat: Record<string, number> = {};
  for (const r of records) byCat[r.support_category] = (byCat[r.support_category] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.support_status] = (byStatus[r.support_status] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.review_outcome] = (byOutcome[r.review_outcome] ?? 0) + 1;

  return {
    total_records: records.length,
    children_with_records: uniqueChildren,
    children_coverage: coverage,
    in_place_count: inPlace,
    partially_met_count: partiallyMet,
    not_met_count: notMet,
    under_review_count: underReview,
    fully_effective_count: fullyEffective,
    not_effective_count: notEffective,
    child_satisfied_rate: satisfiedRate,
    staff_aware_rate: awareRate,
    staff_trained_rate: trainedRate,
    equality_impact_rate: eiaRate,
    child_views_rate: childRate,
    by_characteristic: byChar,
    by_support_category: byCat,
    by_support_status: byStatus,
    by_review_outcome: byOutcome,
  };
}

export function identifyDiversityAlerts(
  records: DiversityRecord[],
  _totalChildren: number,
  now: Date = new Date(),
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

  // Needs not met
  for (const r of records) {
    if (r.support_status === "not_met") {
      alerts.push({
        type: "need_not_met",
        severity: "critical",
        message: `${r.child_name}'s ${r.protected_characteristic.replace(/_/g, " ")} need (${r.support_description}) is not met — immediate action required`,
        id: r.id,
      });
    }
  }

  // Staff not aware of diversity needs
  for (const r of records) {
    if (!r.staff_aware && r.support_status !== "not_applicable") {
      alerts.push({
        type: "staff_not_aware",
        severity: "high",
        message: `Staff not aware of ${r.child_name}'s ${r.protected_characteristic.replace(/_/g, " ")} needs — brief all staff immediately`,
        id: r.id,
      });
    }
  }

  // Support not effective
  for (const r of records) {
    if (r.review_outcome === "not_effective") {
      alerts.push({
        type: "support_not_effective",
        severity: "high",
        message: `Support for ${r.child_name}'s ${r.protected_characteristic.replace(/_/g, " ")} needs rated not effective — review and revise approach`,
        id: r.id,
      });
    }
  }

  // Review overdue
  for (const r of records) {
    if (r.next_review_date && new Date(r.next_review_date) < now) {
      alerts.push({
        type: "review_overdue",
        severity: "medium",
        message: `Diversity support review for ${r.child_name} (${r.protected_characteristic.replace(/_/g, " ")}) overdue since ${r.next_review_date}`,
        id: r.id,
      });
    }
  }

  // No equality impact assessment
  for (const r of records) {
    if (!r.equality_impact_assessed && r.support_status !== "not_applicable") {
      alerts.push({
        type: "no_eia",
        severity: "medium",
        message: `No equality impact assessment for ${r.child_name}'s ${r.protected_characteristic.replace(/_/g, " ")} support — complete EIA`,
        id: r.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    protectedCharacteristic?: ProtectedCharacteristic;
    supportCategory?: SupportCategory;
    supportStatus?: SupportStatus;
    limit?: number;
  },
): Promise<ServiceResult<DiversityRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_diversity_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.protectedCharacteristic) q = q.eq("protected_characteristic", filters.protectedCharacteristic);
  if (filters?.supportCategory) q = q.eq("support_category", filters.supportCategory);
  if (filters?.supportStatus) q = q.eq("support_status", filters.supportStatus);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    protectedCharacteristic: ProtectedCharacteristic;
    characteristicDetail: string;
    supportCategory: SupportCategory;
    supportDescription: string;
    supportStatus: SupportStatus;
    reviewOutcome: ReviewOutcome;
    reviewedDate?: string;
    nextReviewDate?: string;
    childViews?: string;
    childSatisfied?: boolean;
    staffAware: boolean;
    staffTrained: boolean;
    externalSupport?: string;
    equalityImpactAssessed: boolean;
    notes?: string;
  },
): Promise<ServiceResult<DiversityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_diversity_records") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      protected_characteristic: input.protectedCharacteristic,
      characteristic_detail: input.characteristicDetail,
      support_category: input.supportCategory,
      support_description: input.supportDescription,
      support_status: input.supportStatus,
      review_outcome: input.reviewOutcome,
      reviewed_date: input.reviewedDate ?? null,
      next_review_date: input.nextReviewDate ?? null,
      child_views: input.childViews ?? null,
      child_satisfied: input.childSatisfied ?? null,
      staff_aware: input.staffAware,
      staff_trained: input.staffTrained,
      external_support: input.externalSupport ?? null,
      equality_impact_assessed: input.equalityImpactAssessed,
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
): Promise<ServiceResult<DiversityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_diversity_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeDiversityMetrics,
  identifyDiversityAlerts,
};
