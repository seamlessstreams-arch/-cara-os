// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF MEDICATION COMPETENCY SERVICE
// Tracks staff competency assessments for medication administration
// including training, observed practice, knowledge checks, and
// ongoing competency reviews.
// CHR 2015 Reg 32 (fitness of workers — competency and training),
// Reg 33 (employment practices — professional development),
// Reg 23 (health needs — medication management).
//
// Covers: competency type, assessment outcome, medication categories,
// controlled drug competency, observed practice, error handling,
// and refresher scheduling.
//
// SCCIF: Leadership — "Staff are competent to administer medication."
// "Training and competency assessments are current."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type CompetencyType =
  | "initial_assessment"
  | "annual_review"
  | "observed_practice"
  | "knowledge_test"
  | "controlled_drug_competency"
  | "self_administration_support"
  | "error_retraining"
  | "specialist_medication"
  | "emergency_medication"
  | "other";

export type AssessmentOutcome =
  | "competent"
  | "competent_with_conditions"
  | "not_yet_competent"
  | "requires_retraining"
  | "suspended";

export type MedicationCategory =
  | "oral_medication"
  | "topical"
  | "inhaler"
  | "injection"
  | "controlled_drugs"
  | "prn_medication"
  | "emergency_medication"
  | "homely_remedies"
  | "supplements"
  | "other";

export type TrainingProvider =
  | "in_house_trainer"
  | "external_provider"
  | "pharmacy"
  | "nhs_training"
  | "online_module";

export interface StaffMedicationCompetencyRecord {
  id: string;
  home_id: string;
  competency_type: CompetencyType;
  assessment_outcome: AssessmentOutcome;
  medication_category: MedicationCategory;
  training_provider: TrainingProvider;
  assessment_date: string;
  staff_name: string;
  assessed_by: string;
  theory_passed: boolean;
  practical_observed: boolean;
  error_procedure_known: boolean;
  storage_knowledge: boolean;
  controlled_drug_trained: boolean;
  side_effects_knowledge: boolean;
  consent_understanding: boolean;
  record_keeping_competent: boolean;
  emergency_response_trained: boolean;
  disposal_knowledge: boolean;
  child_specific_trained: boolean;
  refresher_scheduled: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const COMPETENCY_TYPES: { type: CompetencyType; label: string }[] = [
  { type: "initial_assessment", label: "Initial Assessment" },
  { type: "annual_review", label: "Annual Review" },
  { type: "observed_practice", label: "Observed Practice" },
  { type: "knowledge_test", label: "Knowledge Test" },
  { type: "controlled_drug_competency", label: "Controlled Drug Competency" },
  { type: "self_administration_support", label: "Self-Administration Support" },
  { type: "error_retraining", label: "Error Retraining" },
  { type: "specialist_medication", label: "Specialist Medication" },
  { type: "emergency_medication", label: "Emergency Medication" },
  { type: "other", label: "Other" },
];

export const ASSESSMENT_OUTCOMES: { outcome: AssessmentOutcome; label: string }[] = [
  { outcome: "competent", label: "Competent" },
  { outcome: "competent_with_conditions", label: "Competent with Conditions" },
  { outcome: "not_yet_competent", label: "Not Yet Competent" },
  { outcome: "requires_retraining", label: "Requires Retraining" },
  { outcome: "suspended", label: "Suspended" },
];

export const MEDICATION_CATEGORIES: { category: MedicationCategory; label: string }[] = [
  { category: "oral_medication", label: "Oral Medication" },
  { category: "topical", label: "Topical" },
  { category: "inhaler", label: "Inhaler" },
  { category: "injection", label: "Injection" },
  { category: "controlled_drugs", label: "Controlled Drugs" },
  { category: "prn_medication", label: "PRN Medication" },
  { category: "emergency_medication", label: "Emergency Medication" },
  { category: "homely_remedies", label: "Homely Remedies" },
  { category: "supplements", label: "Supplements" },
  { category: "other", label: "Other" },
];

export const TRAINING_PROVIDERS: { provider: TrainingProvider; label: string }[] = [
  { provider: "in_house_trainer", label: "In-House Trainer" },
  { provider: "external_provider", label: "External Provider" },
  { provider: "pharmacy", label: "Pharmacy" },
  { provider: "nhs_training", label: "NHS Training" },
  { provider: "online_module", label: "Online Module" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeStaffMedicationCompetencyMetrics(
  records: StaffMedicationCompetencyRecord[],
): {
  total_assessments: number;
  competent_count: number;
  not_yet_competent_count: number;
  requires_retraining_count: number;
  suspended_count: number;
  theory_passed_rate: number | null;
  practical_observed_rate: number | null;
  error_procedure_rate: number | null;
  storage_knowledge_rate: number | null;
  controlled_drug_rate: number | null;
  side_effects_rate: number | null;
  consent_understanding_rate: number | null;
  record_keeping_rate: number | null;
  emergency_response_rate: number | null;
  disposal_knowledge_rate: number | null;
  child_specific_rate: number | null;
  refresher_scheduled_rate: number | null;
  unique_staff: number;
  by_competency_type: Record<string, number>;
  by_assessment_outcome: Record<string, number>;
  by_medication_category: Record<string, number>;
  by_training_provider: Record<string, number>;
} {
  const competent = records.filter((r) => r.assessment_outcome === "competent").length;
  const notYetCompetent = records.filter((r) => r.assessment_outcome === "not_yet_competent").length;
  const requiresRetraining = records.filter((r) => r.assessment_outcome === "requires_retraining").length;
  const suspended = records.filter((r) => r.assessment_outcome === "suspended").length;

  const boolRate = (field: keyof StaffMedicationCompetencyRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.competency_type] = (byType[r.competency_type] ?? 0) + 1;

  const byOutcome: Record<string, number> = {};
  for (const r of records) byOutcome[r.assessment_outcome] = (byOutcome[r.assessment_outcome] ?? 0) + 1;

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.medication_category] = (byCategory[r.medication_category] ?? 0) + 1;

  const byProvider: Record<string, number> = {};
  for (const r of records) byProvider[r.training_provider] = (byProvider[r.training_provider] ?? 0) + 1;

  return {
    total_assessments: records.length,
    competent_count: competent,
    not_yet_competent_count: notYetCompetent,
    requires_retraining_count: requiresRetraining,
    suspended_count: suspended,
    theory_passed_rate: boolRate("theory_passed"),
    practical_observed_rate: boolRate("practical_observed"),
    error_procedure_rate: boolRate("error_procedure_known"),
    storage_knowledge_rate: boolRate("storage_knowledge"),
    controlled_drug_rate: boolRate("controlled_drug_trained"),
    side_effects_rate: boolRate("side_effects_knowledge"),
    consent_understanding_rate: boolRate("consent_understanding"),
    record_keeping_rate: boolRate("record_keeping_competent"),
    emergency_response_rate: boolRate("emergency_response_trained"),
    disposal_knowledge_rate: boolRate("disposal_knowledge"),
    child_specific_rate: boolRate("child_specific_trained"),
    refresher_scheduled_rate: boolRate("refresher_scheduled"),
    unique_staff: uniqueStaff,
    by_competency_type: byType,
    by_assessment_outcome: byOutcome,
    by_medication_category: byCategory,
    by_training_provider: byProvider,
  };
}

export function identifyStaffMedicationCompetencyAlerts(
  records: StaffMedicationCompetencyRecord[],
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

  // Suspended staff still assessed
  for (const r of records) {
    if (r.assessment_outcome === "suspended" && r.medication_category === "controlled_drugs") {
      alerts.push({
        type: "suspended_controlled_drugs",
        severity: "critical",
        message: `${r.staff_name} suspended from controlled drug administration — ensure no access to controlled medications`,
        id: r.id,
      });
    }
  }

  // Not yet competent
  const notCompetent = records.filter((r) => r.assessment_outcome === "not_yet_competent" || r.assessment_outcome === "requires_retraining").length;
  if (notCompetent >= 1) {
    alerts.push({
      type: "not_competent",
      severity: "high",
      message: `${notCompetent} ${notCompetent === 1 ? "staff member" : "staff members"} not yet competent or requiring retraining — arrange training`,
      id: "not_competent",
    });
  }

  // Practical not observed
  const noObserved = records.filter((r) => !r.practical_observed).length;
  if (noObserved >= 1) {
    alerts.push({
      type: "practical_not_observed",
      severity: "high",
      message: `${noObserved} ${noObserved === 1 ? "assessment has" : "assessments have"} no observed practice — schedule observation`,
      id: "practical_not_observed",
    });
  }

  // No refresher scheduled
  const noRefresher = records.filter((r) => !r.refresher_scheduled).length;
  if (noRefresher >= 2) {
    alerts.push({
      type: "no_refresher_scheduled",
      severity: "medium",
      message: `${noRefresher} assessments without refresher scheduled — plan ongoing competency reviews`,
      id: "no_refresher_scheduled",
    });
  }

  // Error procedure not known
  const noErrorProc = records.filter((r) => !r.error_procedure_known).length;
  if (noErrorProc >= 2) {
    alerts.push({
      type: "error_procedure_unknown",
      severity: "medium",
      message: `${noErrorProc} staff without error procedure knowledge — include in training`,
      id: "error_procedure_unknown",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    competencyType?: CompetencyType;
    assessmentOutcome?: AssessmentOutcome;
    medicationCategory?: MedicationCategory;
    trainingProvider?: TrainingProvider;
    limit?: number;
  },
): Promise<ServiceResult<StaffMedicationCompetencyRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_medication_competency") as SB).select("*").eq("home_id", homeId);
  if (filters?.competencyType) q = q.eq("competency_type", filters.competencyType);
  if (filters?.assessmentOutcome) q = q.eq("assessment_outcome", filters.assessmentOutcome);
  if (filters?.medicationCategory) q = q.eq("medication_category", filters.medicationCategory);
  if (filters?.trainingProvider) q = q.eq("training_provider", filters.trainingProvider);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    competencyType: CompetencyType;
    assessmentOutcome: AssessmentOutcome;
    medicationCategory: MedicationCategory;
    trainingProvider: TrainingProvider;
    assessmentDate: string;
    staffName: string;
    assessedBy: string;
    theoryPassed?: boolean;
    practicalObserved?: boolean;
    errorProcedureKnown?: boolean;
    storageKnowledge?: boolean;
    controlledDrugTrained?: boolean;
    sideEffectsKnowledge?: boolean;
    consentUnderstanding?: boolean;
    recordKeepingCompetent?: boolean;
    emergencyResponseTrained?: boolean;
    disposalKnowledge?: boolean;
    childSpecificTrained?: boolean;
    refresherScheduled?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffMedicationCompetencyRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_medication_competency") as SB)
    .insert({
      home_id: payload.homeId,
      competency_type: payload.competencyType,
      assessment_outcome: payload.assessmentOutcome,
      medication_category: payload.medicationCategory,
      training_provider: payload.trainingProvider,
      assessment_date: payload.assessmentDate,
      staff_name: payload.staffName,
      assessed_by: payload.assessedBy,
      theory_passed: payload.theoryPassed ?? true,
      practical_observed: payload.practicalObserved ?? true,
      error_procedure_known: payload.errorProcedureKnown ?? true,
      storage_knowledge: payload.storageKnowledge ?? true,
      controlled_drug_trained: payload.controlledDrugTrained ?? false,
      side_effects_knowledge: payload.sideEffectsKnowledge ?? true,
      consent_understanding: payload.consentUnderstanding ?? true,
      record_keeping_competent: payload.recordKeepingCompetent ?? true,
      emergency_response_trained: payload.emergencyResponseTrained ?? true,
      disposal_knowledge: payload.disposalKnowledge ?? true,
      child_specific_trained: payload.childSpecificTrained ?? true,
      refresher_scheduled: payload.refresherScheduled ?? true,
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
    competencyType: CompetencyType;
    assessmentOutcome: AssessmentOutcome;
    medicationCategory: MedicationCategory;
    trainingProvider: TrainingProvider;
    assessmentDate: string;
    staffName: string;
    assessedBy: string;
    theoryPassed: boolean;
    practicalObserved: boolean;
    errorProcedureKnown: boolean;
    storageKnowledge: boolean;
    controlledDrugTrained: boolean;
    sideEffectsKnowledge: boolean;
    consentUnderstanding: boolean;
    recordKeepingCompetent: boolean;
    emergencyResponseTrained: boolean;
    disposalKnowledge: boolean;
    childSpecificTrained: boolean;
    refresherScheduled: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffMedicationCompetencyRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.competencyType !== undefined) mapped.competency_type = updates.competencyType;
  if (updates.assessmentOutcome !== undefined) mapped.assessment_outcome = updates.assessmentOutcome;
  if (updates.medicationCategory !== undefined) mapped.medication_category = updates.medicationCategory;
  if (updates.trainingProvider !== undefined) mapped.training_provider = updates.trainingProvider;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.assessedBy !== undefined) mapped.assessed_by = updates.assessedBy;
  if (updates.theoryPassed !== undefined) mapped.theory_passed = updates.theoryPassed;
  if (updates.practicalObserved !== undefined) mapped.practical_observed = updates.practicalObserved;
  if (updates.errorProcedureKnown !== undefined) mapped.error_procedure_known = updates.errorProcedureKnown;
  if (updates.storageKnowledge !== undefined) mapped.storage_knowledge = updates.storageKnowledge;
  if (updates.controlledDrugTrained !== undefined) mapped.controlled_drug_trained = updates.controlledDrugTrained;
  if (updates.sideEffectsKnowledge !== undefined) mapped.side_effects_knowledge = updates.sideEffectsKnowledge;
  if (updates.consentUnderstanding !== undefined) mapped.consent_understanding = updates.consentUnderstanding;
  if (updates.recordKeepingCompetent !== undefined) mapped.record_keeping_competent = updates.recordKeepingCompetent;
  if (updates.emergencyResponseTrained !== undefined) mapped.emergency_response_trained = updates.emergencyResponseTrained;
  if (updates.disposalKnowledge !== undefined) mapped.disposal_knowledge = updates.disposalKnowledge;
  if (updates.childSpecificTrained !== undefined) mapped.child_specific_trained = updates.childSpecificTrained;
  if (updates.refresherScheduled !== undefined) mapped.refresher_scheduled = updates.refresherScheduled;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_medication_competency") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeStaffMedicationCompetencyMetrics,
  identifyStaffMedicationCompetencyAlerts,
};
