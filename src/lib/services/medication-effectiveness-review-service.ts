// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION EFFECTIVENESS REVIEW SERVICE
// Monitors medication impact, side-effect tracking, therapeutic
// effectiveness, and ongoing medication review compliance.
// CHR 2015 Reg 23 (health — medication management),
// Reg 12 (health and wellbeing — ongoing monitoring).
//
// Covers: medication category, effectiveness rating, adherence level,
// review compliance, and prescriber engagement.
//
// SCCIF: Safety — "Medication is reviewed regularly for effectiveness."
// "Side effects are monitored and acted upon promptly."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type MedicationCategory =
  | "antidepressant"
  | "antipsychotic"
  | "anxiolytic"
  | "stimulant"
  | "anticonvulsant"
  | "pain_management"
  | "inhaler_respiratory"
  | "hormone_treatment"
  | "antibiotic"
  | "other";

export type EffectivenessRating =
  | "highly_effective"
  | "effective"
  | "partially_effective"
  | "ineffective"
  | "adverse_effects";

export type AdherenceLevel =
  | "full_adherence"
  | "mostly_adherent"
  | "variable_adherence"
  | "poor_adherence"
  | "non_adherent";

export type ReviewCompliance =
  | "fully_compliant"
  | "minor_delay"
  | "significantly_overdue"
  | "no_review"
  | "not_applicable";

export interface MedicationEffectivenessReviewRecord {
  id: string;
  home_id: string;
  medication_category: MedicationCategory;
  effectiveness_rating: EffectivenessRating;
  adherence_level: AdherenceLevel;
  review_compliance: ReviewCompliance;
  review_date: string;
  child_name: string;
  child_id: string | null;
  reviewed_by: string;
  child_views_sought: boolean | null; // null = not recorded; judgements are tri-state — credit needs === true, breach needs === false
  side_effects_monitored: boolean | null;
  prescriber_consulted: boolean | null;
  gp_informed: boolean | null;
  dosage_appropriate: boolean | null;
  consent_current: boolean | null;
  care_plan_reflects: boolean | null;
  social_worker_informed: boolean | null;
  school_aware: boolean | null;
  storage_compliant: boolean | null;
  administration_correct: boolean | null;
  recorded_promptly: boolean | null;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MEDICATION_CATEGORIES: { category: MedicationCategory; label: string }[] = [
  { category: "antidepressant", label: "Antidepressant" },
  { category: "antipsychotic", label: "Antipsychotic" },
  { category: "anxiolytic", label: "Anxiolytic" },
  { category: "stimulant", label: "Stimulant" },
  { category: "anticonvulsant", label: "Anticonvulsant" },
  { category: "pain_management", label: "Pain Management" },
  { category: "inhaler_respiratory", label: "Inhaler/Respiratory" },
  { category: "hormone_treatment", label: "Hormone Treatment" },
  { category: "antibiotic", label: "Antibiotic" },
  { category: "other", label: "Other" },
];

export const EFFECTIVENESS_RATINGS: { rating: EffectivenessRating; label: string }[] = [
  { rating: "highly_effective", label: "Highly Effective" },
  { rating: "effective", label: "Effective" },
  { rating: "partially_effective", label: "Partially Effective" },
  { rating: "ineffective", label: "Ineffective" },
  { rating: "adverse_effects", label: "Adverse Effects" },
];

export const ADHERENCE_LEVELS: { level: AdherenceLevel; label: string }[] = [
  { level: "full_adherence", label: "Full Adherence" },
  { level: "mostly_adherent", label: "Mostly Adherent" },
  { level: "variable_adherence", label: "Variable Adherence" },
  { level: "poor_adherence", label: "Poor Adherence" },
  { level: "non_adherent", label: "Non-Adherent" },
];

export const REVIEW_COMPLIANCES: { compliance: ReviewCompliance; label: string }[] = [
  { compliance: "fully_compliant", label: "Fully Compliant" },
  { compliance: "minor_delay", label: "Minor Delay" },
  { compliance: "significantly_overdue", label: "Significantly Overdue" },
  { compliance: "no_review", label: "No Review" },
  { compliance: "not_applicable", label: "Not Applicable" },
];

// ── Pure compute ────────────────────────────────────────────────────────

export function computeMedicationEffectivenessMetrics(
  records: MedicationEffectivenessReviewRecord[],
): {
  total_reviews: number;
  ineffective_count: number;
  adverse_effects_count: number;
  non_adherent_count: number;
  overdue_review_count: number;
  child_views_rate: number | null;
  side_effects_rate: number | null;
  prescriber_rate: number | null;
  gp_informed_rate: number | null;
  dosage_rate: number | null;
  consent_rate: number | null;
  care_plan_rate: number | null;
  social_worker_rate: number | null;
  school_aware_rate: number | null;
  storage_rate: number | null;
  administration_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_medication_category: Record<string, number>;
  by_effectiveness_rating: Record<string, number>;
  by_adherence_level: Record<string, number>;
  by_review_compliance: Record<string, number>;
} {
  const ineffective = records.filter((r) => r.effectiveness_rating === "ineffective").length;
  const adverse = records.filter((r) => r.effectiveness_rating === "adverse_effects").length;
  const nonAdherent = records.filter((r) => r.adherence_level === "non_adherent").length;
  const overdue = records.filter((r) => r.review_compliance === "significantly_overdue").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof MedicationEffectivenessReviewRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.medication_category] = (byCategory[r.medication_category] ?? 0) + 1;

  const byEffectiveness: Record<string, number> = {};
  for (const r of records) byEffectiveness[r.effectiveness_rating] = (byEffectiveness[r.effectiveness_rating] ?? 0) + 1;

  const byAdherence: Record<string, number> = {};
  for (const r of records) byAdherence[r.adherence_level] = (byAdherence[r.adherence_level] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.review_compliance] = (byCompliance[r.review_compliance] ?? 0) + 1;

  return {
    total_reviews: records.length,
    ineffective_count: ineffective,
    adverse_effects_count: adverse,
    non_adherent_count: nonAdherent,
    overdue_review_count: overdue,
    child_views_rate: boolRate("child_views_sought"),
    side_effects_rate: boolRate("side_effects_monitored"),
    prescriber_rate: boolRate("prescriber_consulted"),
    gp_informed_rate: boolRate("gp_informed"),
    dosage_rate: boolRate("dosage_appropriate"),
    consent_rate: boolRate("consent_current"),
    care_plan_rate: boolRate("care_plan_reflects"),
    social_worker_rate: boolRate("social_worker_informed"),
    school_aware_rate: boolRate("school_aware"),
    storage_rate: boolRate("storage_compliant"),
    administration_rate: boolRate("administration_correct"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_medication_category: byCategory,
    by_effectiveness_rating: byEffectiveness,
    by_adherence_level: byAdherence,
    by_review_compliance: byCompliance,
  };
}

export function identifyMedicationEffectivenessAlerts(
  records: MedicationEffectivenessReviewRecord[],
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

  // Adverse effects without prescriber consultation — per-record
  for (const r of records) {
    if (r.effectiveness_rating === "adverse_effects" && !r.prescriber_consulted) {
      alerts.push({
        type: "adverse_no_prescriber",
        severity: "critical",
        message: `${r.child_name}'s ${r.medication_category.replace(/_/g, " ")} showing adverse effects without prescriber consultation — urgent clinical review`,
        id: r.id,
      });
    }
  }

  // Side effects not monitored
  const noMonitoring = records.filter((r) => r.side_effects_monitored !== true).length;
  if (noMonitoring >= 1) {
    alerts.push({
      type: "side_effects_not_monitored",
      severity: "high",
      message: `${noMonitoring} ${noMonitoring === 1 ? "review has" : "reviews have"} no side-effect monitoring evidenced — ensure ongoing vigilance`,
      id: "side_effects_not_monitored",
    });
  }

  // Consent not current
  const noConsent = records.filter((r) => r.consent_current !== true).length;
  if (noConsent >= 1) {
    alerts.push({
      type: "consent_not_current",
      severity: "high",
      message: `${noConsent} ${noConsent === 1 ? "review has" : "reviews have"} no current consent evidenced — update medication consent`,
      id: "consent_not_current",
    });
  }

  // Storage not compliant
  const noStorage = records.filter((r) => r.storage_compliant !== true).length;
  if (noStorage >= 2) {
    alerts.push({
      type: "storage_not_compliant",
      severity: "medium",
      message: `${noStorage} reviews without evidenced compliant medication storage — review storage procedures`,
      id: "storage_not_compliant",
    });
  }

  // Administration not correct
  const noAdmin = records.filter((r) => r.administration_correct !== true).length;
  if (noAdmin >= 2) {
    alerts.push({
      type: "administration_issues",
      severity: "medium",
      message: `${noAdmin} reviews without evidenced correct administration — retrain medication administration`,
      id: "administration_issues",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    medicationCategory?: MedicationCategory;
    effectivenessRating?: EffectivenessRating;
    adherenceLevel?: AdherenceLevel;
    reviewCompliance?: ReviewCompliance;
    limit?: number;
  },
): Promise<ServiceResult<MedicationEffectivenessReviewRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };
  const client = sb()!;
  let q = (client.from("cs_medication_effectiveness_review") as SB).select("*").eq("home_id", homeId);
  if (filters?.medicationCategory) q = q.eq("medication_category", filters.medicationCategory);
  if (filters?.effectivenessRating) q = q.eq("effectiveness_rating", filters.effectivenessRating);
  if (filters?.adherenceLevel) q = q.eq("adherence_level", filters.adherenceLevel);
  if (filters?.reviewCompliance) q = q.eq("review_compliance", filters.reviewCompliance);
  q = q.order("review_date", { ascending: false });
  if (filters?.limit) q = q.limit(filters.limit);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as MedicationEffectivenessReviewRecord[] };
}

export async function createRecord(payload: {
  homeId: string;
  medicationCategory: MedicationCategory;
  effectivenessRating: EffectivenessRating;
  adherenceLevel: AdherenceLevel;
  reviewCompliance: ReviewCompliance;
  reviewDate: string;
  childName: string;
  childId?: string | null;
  reviewedBy: string;
  childViewsSought?: boolean;
  sideEffectsMonitored?: boolean;
  prescriberConsulted?: boolean;
  gpInformed?: boolean;
  dosageAppropriate?: boolean;
  consentCurrent?: boolean;
  carePlanReflects?: boolean;
  socialWorkerInformed?: boolean;
  schoolAware?: boolean;
  storageCompliant?: boolean;
  administrationCorrect?: boolean;
  recordedPromptly?: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<MedicationEffectivenessReviewRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const { data, error } = await (client.from("cs_medication_effectiveness_review") as SB)
    .insert({
      home_id: payload.homeId,
      medication_category: payload.medicationCategory,
      effectiveness_rating: payload.effectivenessRating,
      adherence_level: payload.adherenceLevel,
      review_compliance: payload.reviewCompliance,
      review_date: payload.reviewDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      reviewed_by: payload.reviewedBy,
      child_views_sought: payload.childViewsSought ?? null,
      side_effects_monitored: payload.sideEffectsMonitored ?? null,
      prescriber_consulted: payload.prescriberConsulted ?? null,
      gp_informed: payload.gpInformed ?? null,
      dosage_appropriate: payload.dosageAppropriate ?? null,
      consent_current: payload.consentCurrent ?? null,
      care_plan_reflects: payload.carePlanReflects ?? null,
      social_worker_informed: payload.socialWorkerInformed ?? null,
      school_aware: payload.schoolAware ?? null,
      storage_compliant: payload.storageCompliant ?? null,
      administration_correct: payload.administrationCorrect ?? null,
      recorded_promptly: payload.recordedPromptly ?? null,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as MedicationEffectivenessReviewRecord };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    medicationCategory: MedicationCategory;
    effectivenessRating: EffectivenessRating;
    adherenceLevel: AdherenceLevel;
    reviewCompliance: ReviewCompliance;
    reviewDate: string;
    childName: string;
    childId: string | null;
    reviewedBy: string;
    childViewsSought: boolean;
    sideEffectsMonitored: boolean;
    prescriberConsulted: boolean;
    gpInformed: boolean;
    dosageAppropriate: boolean;
    consentCurrent: boolean;
    carePlanReflects: boolean;
    socialWorkerInformed: boolean;
    schoolAware: boolean;
    storageCompliant: boolean;
    administrationCorrect: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<MedicationEffectivenessReviewRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };
  const client = sb()!;
  const mapped: Record<string, unknown> = {};
  if (updates.medicationCategory !== undefined) mapped.medication_category = updates.medicationCategory;
  if (updates.effectivenessRating !== undefined) mapped.effectiveness_rating = updates.effectivenessRating;
  if (updates.adherenceLevel !== undefined) mapped.adherence_level = updates.adherenceLevel;
  if (updates.reviewCompliance !== undefined) mapped.review_compliance = updates.reviewCompliance;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.reviewedBy !== undefined) mapped.reviewed_by = updates.reviewedBy;
  if (updates.childViewsSought !== undefined) mapped.child_views_sought = updates.childViewsSought;
  if (updates.sideEffectsMonitored !== undefined) mapped.side_effects_monitored = updates.sideEffectsMonitored;
  if (updates.prescriberConsulted !== undefined) mapped.prescriber_consulted = updates.prescriberConsulted;
  if (updates.gpInformed !== undefined) mapped.gp_informed = updates.gpInformed;
  if (updates.dosageAppropriate !== undefined) mapped.dosage_appropriate = updates.dosageAppropriate;
  if (updates.consentCurrent !== undefined) mapped.consent_current = updates.consentCurrent;
  if (updates.carePlanReflects !== undefined) mapped.care_plan_reflects = updates.carePlanReflects;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.schoolAware !== undefined) mapped.school_aware = updates.schoolAware;
  if (updates.storageCompliant !== undefined) mapped.storage_compliant = updates.storageCompliant;
  if (updates.administrationCorrect !== undefined) mapped.administration_correct = updates.administrationCorrect;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;
  mapped.updated_at = new Date().toISOString();
  const { data, error } = await (client.from("cs_medication_effectiveness_review") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as MedicationEffectivenessReviewRecord };
}

export const _testing = { computeMedicationEffectivenessMetrics, identifyMedicationEffectivenessAlerts };
