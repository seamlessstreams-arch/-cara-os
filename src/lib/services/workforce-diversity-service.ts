// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WORKFORCE DIVERSITY & EQUALITY SERVICE
// Tracks staff diversity monitoring, equality training,
// reasonable adjustments, and equality impact assessments.
// CHR 2015 Reg 16 (providing suitable staff — diversity),
// Equality Act 2010 (protected characteristics),
// PSED (Public Sector Equality Duty — due regard).
//
// Covers: diversity data, equality training, adjustments,
// EIAs, and representation analysis.
//
// SCCIF: Leadership & Management — "The workforce is diverse
// and reflects the community." "Equality and inclusion are
// promoted across the home."
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

export type DiversityCategory =
  | "ethnicity"
  | "disability"
  | "gender"
  | "sexual_orientation"
  | "religion_belief"
  | "age_group"
  | "marital_status"
  | "pregnancy_maternity"
  | "gender_reassignment"
  | "other";

export type TrainingStatus =
  | "completed"
  | "in_progress"
  | "not_started"
  | "overdue"
  | "refresher_due";

export type AdjustmentStatus =
  | "in_place"
  | "requested"
  | "under_review"
  | "denied"
  | "no_longer_needed";

export type EiaOutcome =
  | "positive_impact"
  | "neutral"
  | "negative_impact_mitigated"
  | "negative_impact_unmitigated"
  | "not_assessed";

export interface WorkforceDiversityRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string;
  diversity_category: DiversityCategory;
  disclosure_status: "disclosed" | "prefer_not_to_say" | "not_asked";
  equality_training_status: TrainingStatus;
  equality_training_date: string | null;
  adjustment_status: AdjustmentStatus;
  adjustment_details: string | null;
  eia_outcome: EiaOutcome;
  discrimination_reported: boolean;
  discrimination_details: string | null;
  inclusive_practice_rating: number;
  staff_satisfaction_with_inclusion: number | null;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DIVERSITY_CATEGORIES: { category: DiversityCategory; label: string }[] = [
  { category: "ethnicity", label: "Ethnicity" },
  { category: "disability", label: "Disability" },
  { category: "gender", label: "Gender" },
  { category: "sexual_orientation", label: "Sexual Orientation" },
  { category: "religion_belief", label: "Religion/Belief" },
  { category: "age_group", label: "Age Group" },
  { category: "marital_status", label: "Marital Status" },
  { category: "pregnancy_maternity", label: "Pregnancy/Maternity" },
  { category: "gender_reassignment", label: "Gender Reassignment" },
  { category: "other", label: "Other" },
];

export const TRAINING_STATUSES: { status: TrainingStatus; label: string }[] = [
  { status: "completed", label: "Completed" },
  { status: "in_progress", label: "In Progress" },
  { status: "not_started", label: "Not Started" },
  { status: "overdue", label: "Overdue" },
  { status: "refresher_due", label: "Refresher Due" },
];

export const ADJUSTMENT_STATUSES: { status: AdjustmentStatus; label: string }[] = [
  { status: "in_place", label: "In Place" },
  { status: "requested", label: "Requested" },
  { status: "under_review", label: "Under Review" },
  { status: "denied", label: "Denied" },
  { status: "no_longer_needed", label: "No Longer Needed" },
];

export const EIA_OUTCOMES: { outcome: EiaOutcome; label: string }[] = [
  { outcome: "positive_impact", label: "Positive Impact" },
  { outcome: "neutral", label: "Neutral" },
  { outcome: "negative_impact_mitigated", label: "Negative Impact (Mitigated)" },
  { outcome: "negative_impact_unmitigated", label: "Negative Impact (Unmitigated)" },
  { outcome: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeDiversityMetrics(
  records: WorkforceDiversityRecord[],
  totalStaff: number,
): {
  total_records: number;
  staff_with_records: number;
  diversity_coverage: number;
  disclosure_rate: number;
  training_completed_count: number;
  training_completed_rate: number;
  training_overdue_count: number;
  adjustments_in_place: number;
  adjustments_requested: number;
  discrimination_reported_count: number;
  average_inclusive_practice: number;
  average_satisfaction: number;
  eia_not_assessed_count: number;
  negative_unmitigated_count: number;
  by_diversity_category: Record<string, number>;
  by_training_status: Record<string, number>;
  by_adjustment_status: Record<string, number>;
  by_eia_outcome: Record<string, number>;
} {
  const uniqueStaff = new Set(records.map((r) => r.staff_id)).size;
  const coverage =
    totalStaff > 0
      ? Math.round((uniqueStaff / totalStaff) * 1000) / 10
      : 0;

  const disclosed = records.filter((r) => r.disclosure_status === "disclosed").length;
  const disclosureRate =
    records.length > 0
      ? Math.round((disclosed / records.length) * 1000) / 10
      : 0;

  const trainingCompleted = records.filter((r) => r.equality_training_status === "completed").length;
  const trainingRate =
    records.length > 0
      ? Math.round((trainingCompleted / records.length) * 1000) / 10
      : 0;

  const trainingOverdue = records.filter((r) => r.equality_training_status === "overdue").length;

  const adjustmentsInPlace = records.filter((r) => r.adjustment_status === "in_place").length;
  const adjustmentsRequested = records.filter((r) => r.adjustment_status === "requested").length;

  const discriminationReported = records.filter((r) => r.discrimination_reported).length;

  const avgInclusive =
    records.length > 0
      ? Math.round((records.reduce((sum, r) => sum + r.inclusive_practice_rating, 0) / records.length) * 10) / 10
      : 0;

  const withSatisfaction = records.filter((r) => r.staff_satisfaction_with_inclusion !== null);
  const avgSatisfaction =
    withSatisfaction.length > 0
      ? Math.round((withSatisfaction.reduce((sum, r) => sum + (r.staff_satisfaction_with_inclusion ?? 0), 0) / withSatisfaction.length) * 10) / 10
      : 0;

  const eiaNotAssessed = records.filter((r) => r.eia_outcome === "not_assessed").length;
  const negUnmitigated = records.filter((r) => r.eia_outcome === "negative_impact_unmitigated").length;

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.diversity_category] = (byCategory[r.diversity_category] ?? 0) + 1;

  const byTraining: Record<string, number> = {};
  for (const r of records) byTraining[r.equality_training_status] = (byTraining[r.equality_training_status] ?? 0) + 1;

  const byAdjustment: Record<string, number> = {};
  for (const r of records) byAdjustment[r.adjustment_status] = (byAdjustment[r.adjustment_status] ?? 0) + 1;

  const byEia: Record<string, number> = {};
  for (const r of records) byEia[r.eia_outcome] = (byEia[r.eia_outcome] ?? 0) + 1;

  return {
    total_records: records.length,
    staff_with_records: uniqueStaff,
    diversity_coverage: coverage,
    disclosure_rate: disclosureRate,
    training_completed_count: trainingCompleted,
    training_completed_rate: trainingRate,
    training_overdue_count: trainingOverdue,
    adjustments_in_place: adjustmentsInPlace,
    adjustments_requested: adjustmentsRequested,
    discrimination_reported_count: discriminationReported,
    average_inclusive_practice: avgInclusive,
    average_satisfaction: avgSatisfaction,
    eia_not_assessed_count: eiaNotAssessed,
    negative_unmitigated_count: negUnmitigated,
    by_diversity_category: byCategory,
    by_training_status: byTraining,
    by_adjustment_status: byAdjustment,
    by_eia_outcome: byEia,
  };
}

export function identifyDiversityAlerts(
  records: WorkforceDiversityRecord[],
  totalStaff: number,
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

  // Discrimination reported
  for (const r of records) {
    if (r.discrimination_reported) {
      alerts.push({
        type: "discrimination_reported",
        severity: "critical",
        message: `Discrimination reported by ${r.staff_name} (${r.diversity_category.replace(/_/g, " ")}) — ${r.discrimination_details ?? "investigate and take action"}`,
        id: r.id,
      });
    }
  }

  // Negative impact unmitigated
  for (const r of records) {
    if (r.eia_outcome === "negative_impact_unmitigated") {
      alerts.push({
        type: "negative_unmitigated",
        severity: "high",
        message: `Unmitigated negative equality impact for ${r.staff_name} (${r.diversity_category.replace(/_/g, " ")}) — develop mitigation plan`,
        id: r.id,
      });
    }
  }

  // Training overdue
  const overdue = records.filter((r) => r.equality_training_status === "overdue").length;
  if (overdue >= 2) {
    alerts.push({
      type: "training_overdue",
      severity: "high",
      message: `${overdue} staff ${overdue === 1 ? "member has" : "members have"} overdue equality training — schedule immediately`,
      id: "training_overdue",
    });
  }

  // Adjustments requested but not in place
  const requested = records.filter((r) => r.adjustment_status === "requested").length;
  if (requested >= 1) {
    alerts.push({
      type: "adjustments_pending",
      severity: "medium",
      message: `${requested} reasonable ${requested === 1 ? "adjustment has" : "adjustments have"} been requested — review and implement per Equality Act 2010`,
      id: "adjustments_pending",
    });
  }

  // Low diversity coverage
  const staffCovered = new Set(records.map((r) => r.staff_id)).size;
  if (totalStaff > 0 && staffCovered < totalStaff) {
    const gap = totalStaff - staffCovered;
    alerts.push({
      type: "low_coverage",
      severity: "medium",
      message: `${gap} staff ${gap === 1 ? "member has" : "members have"} no diversity monitoring record — ensure all staff are included`,
      id: "low_coverage",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    staffId?: string;
    diversityCategory?: DiversityCategory;
    trainingStatus?: TrainingStatus;
    limit?: number;
  },
): Promise<ServiceResult<WorkforceDiversityRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_workforce_diversity") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.diversityCategory) q = q.eq("diversity_category", filters.diversityCategory);
  if (filters?.trainingStatus) q = q.eq("equality_training_status", filters.trainingStatus);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    staffName: string;
    staffId: string;
    diversityCategory: DiversityCategory;
    disclosureStatus: "disclosed" | "prefer_not_to_say" | "not_asked";
    equalityTrainingStatus: TrainingStatus;
    equalityTrainingDate?: string;
    adjustmentStatus: AdjustmentStatus;
    adjustmentDetails?: string;
    eiaOutcome: EiaOutcome;
    discriminationReported: boolean;
    discriminationDetails?: string;
    inclusivePracticeRating: number;
    staffSatisfactionWithInclusion?: number;
    reviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<WorkforceDiversityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_workforce_diversity") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId,
      diversity_category: input.diversityCategory,
      disclosure_status: input.disclosureStatus,
      equality_training_status: input.equalityTrainingStatus,
      equality_training_date: input.equalityTrainingDate ?? null,
      adjustment_status: input.adjustmentStatus,
      adjustment_details: input.adjustmentDetails ?? null,
      eia_outcome: input.eiaOutcome,
      discrimination_reported: input.discriminationReported,
      discrimination_details: input.discriminationDetails ?? null,
      inclusive_practice_rating: input.inclusivePracticeRating,
      staff_satisfaction_with_inclusion: input.staffSatisfactionWithInclusion ?? null,
      review_date: input.reviewDate ?? null,
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
): Promise<ServiceResult<WorkforceDiversityRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_workforce_diversity") as SB)
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
