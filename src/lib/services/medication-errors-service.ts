// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION ERRORS SERVICE
// Dedicated tracking of medication errors, near-misses, root cause analysis,
// corrective actions, and learning from medication incidents.
// CHR 2015 Reg 23 (medication — safe administration),
// Reg 40 (notifications — serious medication errors),
// Duty of Candour (informing families of errors).
//
// Distinct from medication-service (which manages prescriptions/MAR/audits).
// This service focuses on error investigation, trends, and prevention.
//
// SCCIF: Helped & Protected — "Medication is managed safely."
// "When errors occur, they are reported, investigated, and learned from."
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

export type ErrorType =
  | "wrong_dose"
  | "wrong_medication"
  | "wrong_time"
  | "wrong_child"
  | "omission"
  | "double_dose"
  | "wrong_route"
  | "expired_medication"
  | "documentation_error"
  | "storage_error"
  | "near_miss"
  | "other";

export type ErrorSeverity =
  | "no_harm"
  | "low_harm"
  | "moderate_harm"
  | "severe_harm"
  | "death";

export type RootCause =
  | "human_error"
  | "system_failure"
  | "training_gap"
  | "communication_breakdown"
  | "workload_pressure"
  | "unclear_instructions"
  | "equipment_failure"
  | "environmental_factor"
  | "under_investigation"
  | "other";

export type InvestigationStatus =
  | "reported"
  | "under_investigation"
  | "investigation_complete"
  | "actions_identified"
  | "actions_completed"
  | "closed";

export interface MedicationError {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  error_date: string;
  error_time: string;
  error_type: ErrorType;
  error_severity: ErrorSeverity;
  medication_name: string;
  reported_by: string;
  root_cause: RootCause;
  investigation_status: InvestigationStatus;
  corrective_actions: string[];
  actions_completed: boolean;
  child_harmed: boolean;
  medical_attention_required: boolean;
  parent_informed: boolean;
  social_worker_informed: boolean;
  ofsted_notified: boolean;
  duty_of_candour_applied: boolean;
  staff_involved: string | null;
  lessons_learned: string | null;
  policy_reviewed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ERROR_TYPES: { type: ErrorType; label: string }[] = [
  { type: "wrong_dose", label: "Wrong Dose" },
  { type: "wrong_medication", label: "Wrong Medication" },
  { type: "wrong_time", label: "Wrong Time" },
  { type: "wrong_child", label: "Wrong Child" },
  { type: "omission", label: "Omission" },
  { type: "double_dose", label: "Double Dose" },
  { type: "wrong_route", label: "Wrong Route" },
  { type: "expired_medication", label: "Expired Medication" },
  { type: "documentation_error", label: "Documentation Error" },
  { type: "storage_error", label: "Storage Error" },
  { type: "near_miss", label: "Near Miss" },
  { type: "other", label: "Other" },
];

export const ERROR_SEVERITIES: { severity: ErrorSeverity; label: string }[] = [
  { severity: "no_harm", label: "No Harm" },
  { severity: "low_harm", label: "Low Harm" },
  { severity: "moderate_harm", label: "Moderate Harm" },
  { severity: "severe_harm", label: "Severe Harm" },
  { severity: "death", label: "Death" },
];

export const ROOT_CAUSES: { cause: RootCause; label: string }[] = [
  { cause: "human_error", label: "Human Error" },
  { cause: "system_failure", label: "System Failure" },
  { cause: "training_gap", label: "Training Gap" },
  { cause: "communication_breakdown", label: "Communication Breakdown" },
  { cause: "workload_pressure", label: "Workload Pressure" },
  { cause: "unclear_instructions", label: "Unclear Instructions" },
  { cause: "equipment_failure", label: "Equipment Failure" },
  { cause: "environmental_factor", label: "Environmental Factor" },
  { cause: "under_investigation", label: "Under Investigation" },
  { cause: "other", label: "Other" },
];

export const INVESTIGATION_STATUSES: { status: InvestigationStatus; label: string }[] = [
  { status: "reported", label: "Reported" },
  { status: "under_investigation", label: "Under Investigation" },
  { status: "investigation_complete", label: "Investigation Complete" },
  { status: "actions_identified", label: "Actions Identified" },
  { status: "actions_completed", label: "Actions Completed" },
  { status: "closed", label: "Closed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMedErrorMetrics(
  errors: MedicationError[],
): {
  total_errors: number;
  near_miss_count: number;
  actual_error_count: number;
  no_harm_count: number;
  harm_caused_count: number;
  severe_harm_count: number;
  child_harmed_count: number;
  medical_attention_count: number;
  open_investigations: number;
  actions_outstanding: number;
  parent_informed_rate: number | null;
  duty_of_candour_rate: number | null;
  ofsted_notified_count: number;
  policy_reviewed_rate: number | null;
  lessons_learned_rate: number | null;
  by_error_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_root_cause: Record<string, number>;
  by_investigation_status: Record<string, number>;
} {
  const nearMiss = errors.filter((e) => e.error_type === "near_miss").length;
  const actual = errors.length - nearMiss;

  const noHarm = errors.filter((e) => e.error_severity === "no_harm").length;
  const harmCaused = errors.filter(
    (e) => e.error_severity !== "no_harm",
  ).length;
  const severeHarm = errors.filter(
    (e) => e.error_severity === "severe_harm" || e.error_severity === "death",
  ).length;

  const childHarmed = errors.filter((e) => e.child_harmed).length;
  const medicalAttention = errors.filter((e) => e.medical_attention_required).length;

  const openInvestigations = errors.filter(
    (e) => e.investigation_status === "reported" || e.investigation_status === "under_investigation",
  ).length;

  const actionsOutstanding = errors.filter(
    (e) => e.investigation_status === "actions_identified" && !e.actions_completed,
  ).length;

  const parentInformed = errors.filter((e) => e.parent_informed).length;
  const parentRate =
    errors.length > 0
      ? Math.round((parentInformed / errors.length) * 1000) / 10
      : null;

  const docApplied = errors.filter((e) => e.duty_of_candour_applied).length;
  const docRate =
    errors.length > 0
      ? Math.round((docApplied / errors.length) * 1000) / 10
      : null;

  const ofstedNotified = errors.filter((e) => e.ofsted_notified).length;

  const policyReviewed = errors.filter((e) => e.policy_reviewed).length;
  const policyRate =
    errors.length > 0
      ? Math.round((policyReviewed / errors.length) * 1000) / 10
      : null;

  const lessonsLearned = errors.filter((e) => e.lessons_learned !== null).length;
  const lessonsRate =
    errors.length > 0
      ? Math.round((lessonsLearned / errors.length) * 1000) / 10
      : null;

  const byType: Record<string, number> = {};
  for (const e of errors) byType[e.error_type] = (byType[e.error_type] ?? 0) + 1;

  const bySeverity: Record<string, number> = {};
  for (const e of errors) bySeverity[e.error_severity] = (bySeverity[e.error_severity] ?? 0) + 1;

  const byCause: Record<string, number> = {};
  for (const e of errors) byCause[e.root_cause] = (byCause[e.root_cause] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const e of errors) byStatus[e.investigation_status] = (byStatus[e.investigation_status] ?? 0) + 1;

  return {
    total_errors: errors.length,
    near_miss_count: nearMiss,
    actual_error_count: actual,
    no_harm_count: noHarm,
    harm_caused_count: harmCaused,
    severe_harm_count: severeHarm,
    child_harmed_count: childHarmed,
    medical_attention_count: medicalAttention,
    open_investigations: openInvestigations,
    actions_outstanding: actionsOutstanding,
    parent_informed_rate: parentRate,
    duty_of_candour_rate: docRate,
    ofsted_notified_count: ofstedNotified,
    policy_reviewed_rate: policyRate,
    lessons_learned_rate: lessonsRate,
    by_error_type: byType,
    by_severity: bySeverity,
    by_root_cause: byCause,
    by_investigation_status: byStatus,
  };
}

export function identifyMedErrorAlerts(
  errors: MedicationError[],
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

  // Severe harm or death
  for (const e of errors) {
    if (e.error_severity === "severe_harm" || e.error_severity === "death") {
      alerts.push({
        type: "severe_error",
        severity: "critical",
        message: `Severe medication error for ${e.child_name} (${e.medication_name}) — ${e.error_type.replace(/_/g, " ")} causing ${e.error_severity.replace(/_/g, " ")}`,
        id: e.id,
      });
    }
  }

  // Parent not informed of harm
  for (const e of errors) {
    if (e.child_harmed && !e.parent_informed) {
      alerts.push({
        type: "parent_not_informed",
        severity: "critical",
        message: `Parent not informed of medication error causing harm to ${e.child_name} — duty of candour requires immediate disclosure`,
        id: e.id,
      });
    }
  }

  // Open investigations with actions outstanding
  for (const e of errors) {
    if (e.investigation_status === "actions_identified" && !e.actions_completed) {
      alerts.push({
        type: "actions_outstanding",
        severity: "high",
        message: `Corrective actions outstanding for medication error involving ${e.child_name} (${e.medication_name}) — complete actions to prevent recurrence`,
        id: e.id,
      });
    }
  }

  // Training gap root cause — systemic issue
  const trainingGaps = errors.filter((e) => e.root_cause === "training_gap");
  if (trainingGaps.length >= 2) {
    alerts.push({
      type: "training_gap_pattern",
      severity: "high",
      message: `${trainingGaps.length} medication errors attributed to training gaps — review medication training programme urgently`,
      id: "training_pattern",
    });
  }

  // Errors not investigated
  for (const e of errors) {
    if (e.investigation_status === "reported") {
      alerts.push({
        type: "not_investigated",
        severity: "medium",
        message: `Medication error for ${e.child_name} (${e.medication_name}) reported but not yet investigated — begin investigation`,
        id: e.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listErrors(
  homeId: string,
  filters?: {
    childId?: string;
    errorType?: ErrorType;
    errorSeverity?: ErrorSeverity;
    investigationStatus?: InvestigationStatus;
    limit?: number;
  },
): Promise<ServiceResult<MedicationError[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_medication_errors") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.errorType) q = q.eq("error_type", filters.errorType);
  if (filters?.errorSeverity) q = q.eq("error_severity", filters.errorSeverity);
  if (filters?.investigationStatus) q = q.eq("investigation_status", filters.investigationStatus);
  q = q.order("error_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createError(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    errorDate: string;
    errorTime: string;
    errorType: ErrorType;
    errorSeverity: ErrorSeverity;
    medicationName: string;
    reportedBy: string;
    rootCause: RootCause;
    investigationStatus: InvestigationStatus;
    correctiveActions: string[];
    actionsCompleted: boolean;
    childHarmed: boolean;
    medicalAttentionRequired: boolean;
    parentInformed: boolean;
    socialWorkerInformed: boolean;
    ofstedNotified: boolean;
    dutyOfCandourApplied: boolean;
    staffInvolved?: string;
    lessonsLearned?: string;
    policyReviewed: boolean;
    notes?: string;
  },
): Promise<ServiceResult<MedicationError>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_errors") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      error_date: input.errorDate,
      error_time: input.errorTime,
      error_type: input.errorType,
      error_severity: input.errorSeverity,
      medication_name: input.medicationName,
      reported_by: input.reportedBy,
      root_cause: input.rootCause,
      investigation_status: input.investigationStatus,
      corrective_actions: input.correctiveActions,
      actions_completed: input.actionsCompleted,
      child_harmed: input.childHarmed,
      medical_attention_required: input.medicalAttentionRequired,
      parent_informed: input.parentInformed,
      social_worker_informed: input.socialWorkerInformed,
      ofsted_notified: input.ofstedNotified,
      duty_of_candour_applied: input.dutyOfCandourApplied,
      staff_involved: input.staffInvolved ?? null,
      lessons_learned: input.lessonsLearned ?? null,
      policy_reviewed: input.policyReviewed,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateError(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<MedicationError>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_errors") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMedErrorMetrics,
  identifyMedErrorAlerts,
};
