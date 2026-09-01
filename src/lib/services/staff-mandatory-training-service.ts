// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF MANDATORY TRAINING MATRIX SERVICE
// Tracks mandatory training requirements per role — completion dates, expiry
// dates, compliance rates. Ensures all staff hold current, valid training in
// safeguarding, first aid, fire safety, medication, restraint, food hygiene,
// data protection, and more.
//
// CHR 2015 Reg 33 (employment of staff), Reg 34 (fitness of workers),
// Reg 35 (supervision and training). Schedule 2 — fitness of workers.
//
// SCCIF: Well-Led — "Staff are trained and supported. Leaders ensure training
// is current and fit for purpose."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TrainingCategory =
  | "safeguarding_level_3"
  | "first_aid"
  | "fire_safety"
  | "medication_administration"
  | "physical_intervention"
  | "food_hygiene"
  | "data_protection"
  | "health_and_safety"
  | "equality_diversity"
  | "other";

export type ComplianceStatus =
  | "current"
  | "expiring_soon"
  | "expired"
  | "not_started"
  | "booked";

export type TrainingLevel =
  | "awareness"
  | "foundation"
  | "intermediate"
  | "advanced"
  | "specialist";

export type DeliveryMethod =
  | "classroom"
  | "e_learning"
  | "blended"
  | "workplace"
  | "external_provider"
  | "conference"
  | "shadowing"
  | "self_directed"
  | "coaching"
  | "other";

export interface StaffMandatoryTrainingRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  training_category: TrainingCategory;
  compliance_status: ComplianceStatus;
  training_level: TrainingLevel;
  delivery_method: DeliveryMethod;
  session_date: string;
  recorded_by: string;
  training_title: string;
  provider_name: string;
  completion_date: string | null;
  expiry_date: string | null;
  certificate_reference: string | null;
  cost: string | null;
  staff_feedback: string | null;
  competence_assessment: string | null;
  refresher_due: string | null;
  manager_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  certificate_held: boolean;
  competence_assessed: boolean;
  staff_attended: boolean;
  learning_objectives_met: boolean;
  applied_in_practice: boolean;
  refresher_scheduled: boolean;
  manager_verified: boolean;
  cost_approved: boolean;
  linked_to_development_plan: boolean;
  accessible_format: boolean;
  evaluation_completed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TRAINING_CATEGORIES: { category: TrainingCategory; label: string }[] = [
  { category: "safeguarding_level_3", label: "Safeguarding Level 3" },
  { category: "first_aid", label: "First Aid" },
  { category: "fire_safety", label: "Fire Safety" },
  { category: "medication_administration", label: "Medication Administration" },
  { category: "physical_intervention", label: "Physical Intervention" },
  { category: "food_hygiene", label: "Food Hygiene" },
  { category: "data_protection", label: "Data Protection" },
  { category: "health_and_safety", label: "Health & Safety" },
  { category: "equality_diversity", label: "Equality & Diversity" },
  { category: "other", label: "Other" },
];

export const COMPLIANCE_STATUSES: { status: ComplianceStatus; label: string }[] = [
  { status: "current", label: "Current" },
  { status: "expiring_soon", label: "Expiring Soon" },
  { status: "expired", label: "Expired" },
  { status: "not_started", label: "Not Started" },
  { status: "booked", label: "Booked" },
];

export const TRAINING_LEVELS: { level: TrainingLevel; label: string }[] = [
  { level: "awareness", label: "Awareness" },
  { level: "foundation", label: "Foundation" },
  { level: "intermediate", label: "Intermediate" },
  { level: "advanced", label: "Advanced" },
  { level: "specialist", label: "Specialist" },
];

export const DELIVERY_METHODS: { method: DeliveryMethod; label: string }[] = [
  { method: "classroom", label: "Classroom" },
  { method: "e_learning", label: "E-Learning" },
  { method: "blended", label: "Blended" },
  { method: "workplace", label: "Workplace" },
  { method: "external_provider", label: "External Provider" },
  { method: "conference", label: "Conference" },
  { method: "shadowing", label: "Shadowing" },
  { method: "self_directed", label: "Self-Directed" },
  { method: "coaching", label: "Coaching" },
  { method: "other", label: "Other" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computeMandatoryTrainingMetrics(records: StaffMandatoryTrainingRecord[]): {
  total_records: number;
  expired_count: number;
  expiring_soon_count: number;
  not_started_count: number;
  current_count: number;
  certificate_held_rate: number | null;
  competence_assessed_rate: number | null;
  staff_attended_rate: number | null;
  learning_objectives_rate: number | null;
  applied_in_practice_rate: number | null;
  refresher_scheduled_rate: number | null;
  manager_verified_rate: number | null;
  cost_approved_rate: number | null;
  development_plan_rate: number | null;
  accessible_format_rate: number | null;
  evaluation_completed_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_training_category: Record<string, number>;
  by_compliance_status: Record<string, number>;
  by_training_level: Record<string, number>;
  by_delivery_method: Record<string, number>;
} {
  const expiredCount = records.filter((r) => r.compliance_status === "expired").length;
  const expiringSoonCount = records.filter((r) => r.compliance_status === "expiring_soon").length;
  const notStartedCount = records.filter((r) => r.compliance_status === "not_started").length;
  const currentCount = records.filter((r) => r.compliance_status === "current").length;

  // Rated over the rows where the question was answered either way — with the
  // judgement columns tri-state, silence in the denominator would read as "no".
  // While every field is still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof StaffMandatoryTrainingRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0 ? Math.round((count / recorded.length) * 1000) / 10 : null;
  };

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.training_category] = (byCategory[r.training_category] ?? 0) + 1;
  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.compliance_status] = (byStatus[r.compliance_status] ?? 0) + 1;
  const byLevel: Record<string, number> = {};
  for (const r of records) byLevel[r.training_level] = (byLevel[r.training_level] ?? 0) + 1;
  const byMethod: Record<string, number> = {};
  for (const r of records) byMethod[r.delivery_method] = (byMethod[r.delivery_method] ?? 0) + 1;

  return {
    total_records: records.length,
    expired_count: expiredCount,
    expiring_soon_count: expiringSoonCount,
    not_started_count: notStartedCount,
    current_count: currentCount,
    certificate_held_rate: boolRate("certificate_held"),
    competence_assessed_rate: boolRate("competence_assessed"),
    staff_attended_rate: boolRate("staff_attended"),
    learning_objectives_rate: boolRate("learning_objectives_met"),
    applied_in_practice_rate: boolRate("applied_in_practice"),
    refresher_scheduled_rate: boolRate("refresher_scheduled"),
    manager_verified_rate: boolRate("manager_verified"),
    cost_approved_rate: boolRate("cost_approved"),
    development_plan_rate: boolRate("linked_to_development_plan"),
    accessible_format_rate: boolRate("accessible_format"),
    evaluation_completed_rate: boolRate("evaluation_completed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: new Set(records.map((r) => r.staff_name)).size,
    by_training_category: byCategory,
    by_compliance_status: byStatus,
    by_training_level: byLevel,
    by_delivery_method: byMethod,
  };
}

// ── Alerts ──────────────────────────────────────────────────────────────

export function identifyMandatoryTrainingAlerts(
  records: StaffMandatoryTrainingRecord[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical per-record: expired safeguarding or first aid
  for (const r of records) {
    if (
      r.compliance_status === "expired" &&
      (r.training_category === "safeguarding_level_3" || r.training_category === "first_aid" || r.training_category === "physical_intervention")
    ) {
      alerts.push({
        type: "expired_critical_training",
        severity: "critical",
        message: `${r.staff_name} has expired ${r.training_title || r.training_category.replace(/_/g, " ")} training — immediate action required.`,
        record_id: r.id,
      });
    }
  }

  // High: any expired training >= 1
  const expiredCount = records.filter((r) => r.compliance_status === "expired").length;
  if (expiredCount > 0) {
    alerts.push({
      type: "expired_training",
      severity: "high",
      message: `${expiredCount} training record${expiredCount === 1 ? " has" : "s have"} expired.`,
    });
  }

  // High: competence not assessed >= 1
  const noCompetenceCount = records.filter((r) => r.competence_assessed === false).length;
  if (noCompetenceCount > 0) {
    alerts.push({
      type: "no_competence_assessed",
      severity: "high",
      message: `${noCompetenceCount} training record${noCompetenceCount === 1 ? " has" : "s have"} competence not assessed.`,
    });
  }

  // Medium: no refresher scheduled >= 2
  const noRefresherCount = records.filter((r) => r.refresher_scheduled === false).length;
  if (noRefresherCount >= 2) {
    alerts.push({
      type: "no_refresher_scheduled",
      severity: "medium",
      message: `${noRefresherCount} training records have no refresher scheduled.`,
    });
  }

  // Medium: no evaluation >= 2
  const noEvalCount = records.filter((r) => r.evaluation_completed === false).length;
  if (noEvalCount >= 2) {
    alerts.push({
      type: "no_evaluation",
      severity: "medium",
      message: `${noEvalCount} training records have evaluation not completed.`,
    });
  }

  return alerts;
}

// ── CRUD ────────────────────────────────────────────────────────────────

export async function listMandatoryTraining(
  homeId: string,
): Promise<ServiceResult<StaffMandatoryTrainingRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_mandatory_training") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffMandatoryTrainingRecord[] };
}

export async function createMandatoryTraining(input: {
  homeId: string;
  staffName: string;
  staffId?: string | null;
  trainingCategory: TrainingCategory;
  complianceStatus: ComplianceStatus;
  trainingLevel: TrainingLevel;
  deliveryMethod: DeliveryMethod;
  sessionDate: string;
  recordedBy: string;
  trainingTitle: string;
  providerName: string;
  completionDate?: string | null;
  expiryDate?: string | null;
  certificateReference?: string | null;
  cost?: string | null;
  staffFeedback?: string | null;
  competenceAssessment?: string | null;
  refresherDue?: string | null;
  managerNotes?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  certificateHeld: boolean;
  competenceAssessed: boolean;
  staffAttended: boolean;
  learningObjectivesMet: boolean;
  appliedInPractice: boolean;
  refresherScheduled: boolean;
  managerVerified: boolean;
  costApproved: boolean;
  linkedToDevelopmentPlan: boolean;
  accessibleFormat: boolean;
  evaluationCompleted: boolean;
  recordedPromptly: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<StaffMandatoryTrainingRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_mandatory_training") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      training_category: input.trainingCategory,
      compliance_status: input.complianceStatus,
      training_level: input.trainingLevel,
      delivery_method: input.deliveryMethod,
      session_date: input.sessionDate,
      recorded_by: input.recordedBy,
      training_title: input.trainingTitle,
      provider_name: input.providerName,
      completion_date: input.completionDate ?? null,
      expiry_date: input.expiryDate ?? null,
      certificate_reference: input.certificateReference ?? null,
      cost: input.cost ?? null,
      staff_feedback: input.staffFeedback ?? null,
      competence_assessment: input.competenceAssessment ?? null,
      refresher_due: input.refresherDue ?? null,
      manager_notes: input.managerNotes ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      certificate_held: input.certificateHeld,
      competence_assessed: input.competenceAssessed,
      staff_attended: input.staffAttended,
      learning_objectives_met: input.learningObjectivesMet,
      applied_in_practice: input.appliedInPractice,
      refresher_scheduled: input.refresherScheduled,
      manager_verified: input.managerVerified,
      cost_approved: input.costApproved,
      linked_to_development_plan: input.linkedToDevelopmentPlan,
      accessible_format: input.accessibleFormat,
      evaluation_completed: input.evaluationCompleted,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffMandatoryTrainingRecord };
}

export async function updateMandatoryTraining(
  id: string,
  updates: Partial<Omit<StaffMandatoryTrainingRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffMandatoryTrainingRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_mandatory_training") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffMandatoryTrainingRecord };
}

// ── Testing export ─────────────────────────────────────────────────────

export const _testing = { computeMandatoryTrainingMetrics, identifyMandatoryTrainingAlerts };
