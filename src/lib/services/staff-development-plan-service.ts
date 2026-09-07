// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DEVELOPMENT PLAN SERVICE
// Manages Cara-generated evidence-based staff development plans — part of the
// Staff Development, Support and Risk Intelligence layer.
// CHR 2015 Reg 33 (employment of staff — competence and support),
// Reg 34 (fitness of workers), Reg 13 (leadership and management).
//
// This is STRENGTHS-BASED, FAIR, CONTEXTUAL, and EVIDENCE-LED.
// Development plans build on identified strengths, are created with
// staff involvement, and set clear success measures — supporting
// continuous professional growth, not punitive action.
//
// Covers: development area identification, evidence gathering, strengths
// recognition, manager and staff actions, training/mentoring, success
// measures, staff consultation, and senior approval tracking.
//
// SCCIF: Well-Led — "Leaders support staff to improve practice."
// "Staff feel valued and are helped to develop their skills."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type DevelopmentArea =
  | "de_escalation"
  | "safeguarding_practice"
  | "recording_quality"
  | "medication_management"
  | "care_planning"
  | "communication"
  | "leadership"
  | "child_engagement"
  | "team_working"
  | "professional_boundaries";

export type PlanStatus =
  | "draft"
  | "active"
  | "under_review"
  | "completed"
  | "cancelled";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "returned"
  | "withdrawn"
  | "not_required";

export type PriorityLevel =
  | "urgent"
  | "high"
  | "medium"
  | "low"
  | "developmental";

export interface StaffDevelopmentPlanRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  development_area: DevelopmentArea;
  plan_status: PlanStatus;
  approval_status: ApprovalStatus;
  priority_level: PriorityLevel;
  session_date: string;
  created_by: string;
  development_area_detail: string;
  evidence_summary: string;
  possible_underlying_reason: string | null;
  impact_description: string | null;
  strengths_to_build_on: string | null;
  manager_support_actions: string | null;
  staff_actions_detail: string | null;
  training_required: string | null;
  mentoring_detail: string | null;
  success_measures: string | null;
  staff_response: string | null;
  approved_by: string | null;
  approved_at: string | null;
  evidence_based: boolean;
  strengths_identified: boolean;
  staff_consulted: boolean;
  manager_actions_set: boolean;
  staff_actions_set: boolean;
  training_identified: boolean;
  mentoring_arranged: boolean;
  success_measures_set: boolean;
  review_date_set: boolean;
  staff_agreed: boolean;
  approved_by_senior: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DEVELOPMENT_AREAS: { area: DevelopmentArea; label: string }[] = [
  { area: "de_escalation", label: "De-Escalation" },
  { area: "safeguarding_practice", label: "Safeguarding Practice" },
  { area: "recording_quality", label: "Recording Quality" },
  { area: "medication_management", label: "Medication Management" },
  { area: "care_planning", label: "Care Planning" },
  { area: "communication", label: "Communication" },
  { area: "leadership", label: "Leadership" },
  { area: "child_engagement", label: "Child Engagement" },
  { area: "team_working", label: "Team Working" },
  { area: "professional_boundaries", label: "Professional Boundaries" },
];

export const PLAN_STATUSES: { status: PlanStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "active", label: "Active" },
  { status: "under_review", label: "Under Review" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
];

export const APPROVAL_STATUSES: { approval: ApprovalStatus; label: string }[] = [
  { approval: "pending", label: "Pending" },
  { approval: "approved", label: "Approved" },
  { approval: "returned", label: "Returned" },
  { approval: "withdrawn", label: "Withdrawn" },
  { approval: "not_required", label: "Not Required" },
];

export const PRIORITY_LEVELS: { priority: PriorityLevel; label: string }[] = [
  { priority: "urgent", label: "Urgent" },
  { priority: "high", label: "High" },
  { priority: "medium", label: "Medium" },
  { priority: "low", label: "Low" },
  { priority: "developmental", label: "Developmental" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary metrics across staff development plan records.
 */
export function computeDevelopmentPlanMetrics(
  records: StaffDevelopmentPlanRecord[],
): {
  total_plans: number;
  urgent_count: number;
  active_count: number;
  pending_approval_count: number;
  completed_count: number;
  evidence_based_rate: number | null;
  strengths_identified_rate: number | null;
  staff_consulted_rate: number | null;
  manager_actions_rate: number | null;
  staff_actions_rate: number | null;
  training_identified_rate: number | null;
  mentoring_arranged_rate: number | null;
  success_measures_rate: number | null;
  review_date_rate: number | null;
  staff_agreed_rate: number | null;
  approved_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_development_area: Record<string, number>;
  by_plan_status: Record<string, number>;
  by_approval_status: Record<string, number>;
  by_priority_level: Record<string, number>;
} {
  const urgentCount = records.filter((r) => r.priority_level === "urgent").length;
  const activeCount = records.filter((r) => r.plan_status === "active").length;
  const pendingApprovalCount = records.filter((r) => r.approval_status === "pending").length;
  const completedCount = records.filter((r) => r.plan_status === "completed").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof StaffDevelopmentPlanRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byDevelopmentArea: Record<string, number> = {};
  for (const r of records) byDevelopmentArea[r.development_area] = (byDevelopmentArea[r.development_area] ?? 0) + 1;

  const byPlanStatus: Record<string, number> = {};
  for (const r of records) byPlanStatus[r.plan_status] = (byPlanStatus[r.plan_status] ?? 0) + 1;

  const byApprovalStatus: Record<string, number> = {};
  for (const r of records) byApprovalStatus[r.approval_status] = (byApprovalStatus[r.approval_status] ?? 0) + 1;

  const byPriorityLevel: Record<string, number> = {};
  for (const r of records) byPriorityLevel[r.priority_level] = (byPriorityLevel[r.priority_level] ?? 0) + 1;

  return {
    total_plans: records.length,
    urgent_count: urgentCount,
    active_count: activeCount,
    pending_approval_count: pendingApprovalCount,
    completed_count: completedCount,
    evidence_based_rate: boolRate("evidence_based"),
    strengths_identified_rate: boolRate("strengths_identified"),
    staff_consulted_rate: boolRate("staff_consulted"),
    manager_actions_rate: boolRate("manager_actions_set"),
    staff_actions_rate: boolRate("staff_actions_set"),
    training_identified_rate: boolRate("training_identified"),
    mentoring_arranged_rate: boolRate("mentoring_arranged"),
    success_measures_rate: boolRate("success_measures_set"),
    review_date_rate: boolRate("review_date_set"),
    staff_agreed_rate: boolRate("staff_agreed"),
    approved_rate: boolRate("approved_by_senior"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: uniqueStaff,
    by_development_area: byDevelopmentArea,
    by_plan_status: byPlanStatus,
    by_approval_status: byApprovalStatus,
    by_priority_level: byPriorityLevel,
  };
}

/**
 * Identify development plan alerts requiring management attention.
 */
export function identifyDevelopmentPlanAlerts(
  records: StaffDevelopmentPlanRecord[],
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

  // Urgent unapproved — per-record, critical
  for (const r of records) {
    if (r.priority_level === "urgent" && r.approval_status === "pending") {
      alerts.push({
        type: "urgent_unapproved",
        severity: "critical",
        message: `${r.staff_name} has an urgent development plan awaiting approval — manager action needed.`,
        id: r.id,
      });
    }
  }

  // No staff consulted — high, count >= 1
  const noStaffConsultedCount = records.filter((r) => r.staff_consulted === false).length;
  if (noStaffConsultedCount >= 1) {
    alerts.push({
      type: "no_staff_consulted",
      severity: "high",
      message: `${noStaffConsultedCount} ${noStaffConsultedCount === 1 ? "plan has" : "plans have"} staff not consulted.`,
      id: "no_staff_consulted",
    });
  }

  // No strengths identified — high, count >= 1
  const noStrengthsCount = records.filter((r) => r.strengths_identified === false).length;
  if (noStrengthsCount >= 1) {
    alerts.push({
      type: "no_strengths_identified",
      severity: "high",
      message: `${noStrengthsCount} ${noStrengthsCount === 1 ? "plan has" : "plans have"} no strengths identified.`,
      id: "no_strengths_identified",
    });
  }

  // No success measures — medium, count >= 2
  const noSuccessMeasuresCount = records.filter((r) => r.success_measures_set === false).length;
  if (noSuccessMeasuresCount >= 2) {
    alerts.push({
      type: "no_success_measures",
      severity: "medium",
      message: `${noSuccessMeasuresCount} plans have no success measures set.`,
      id: "no_success_measures",
    });
  }

  // No mentoring — medium, count >= 2
  const noMentoringCount = records.filter((r) => r.mentoring_arranged === false).length;
  if (noMentoringCount >= 2) {
    alerts.push({
      type: "no_mentoring",
      severity: "medium",
      message: `${noMentoringCount} plans have no mentoring arranged.`,
      id: "no_mentoring",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listDevelopmentPlans(
  homeId: string,
  filters?: {
    staffName?: string;
    developmentArea?: DevelopmentArea;
    planStatus?: PlanStatus;
    approvalStatus?: ApprovalStatus;
    priorityLevel?: PriorityLevel;
    limit?: number;
  },
): Promise<ServiceResult<StaffDevelopmentPlanRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_development_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffName) q = q.eq("staff_name", filters.staffName);
  if (filters?.developmentArea) q = q.eq("development_area", filters.developmentArea);
  if (filters?.planStatus) q = q.eq("plan_status", filters.planStatus);
  if (filters?.approvalStatus) q = q.eq("approval_status", filters.approvalStatus);
  if (filters?.priorityLevel) q = q.eq("priority_level", filters.priorityLevel);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDevelopmentPlan(
  input: {
    homeId: string;
    staffName: string;
    staffId?: string | null;
    developmentArea: DevelopmentArea;
    planStatus?: PlanStatus;
    approvalStatus?: ApprovalStatus;
    priorityLevel: PriorityLevel;
    sessionDate: string;
    createdBy: string;
    developmentAreaDetail: string;
    evidenceSummary: string;
    possibleUnderlyingReason?: string | null;
    impactDescription?: string | null;
    strengthsToBuildOn?: string | null;
    managerSupportActions?: string | null;
    staffActionsDetail?: string | null;
    trainingRequired?: string | null;
    mentoringDetail?: string | null;
    successMeasures?: string | null;
    staffResponse?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    evidenceBased?: boolean;
    strengthsIdentified?: boolean;
    staffConsulted?: boolean;
    managerActionsSet?: boolean;
    staffActionsSet?: boolean;
    trainingIdentified?: boolean;
    mentoringArranged?: boolean;
    successMeasuresSet?: boolean;
    reviewDateSet?: boolean;
    staffAgreed?: boolean;
    approvedBySenior?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffDevelopmentPlanRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_development_plans") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      development_area: input.developmentArea,
      plan_status: input.planStatus ?? "draft",
      approval_status: input.approvalStatus ?? "pending",
      priority_level: input.priorityLevel,
      session_date: input.sessionDate,
      created_by: input.createdBy,
      development_area_detail: input.developmentAreaDetail,
      evidence_summary: input.evidenceSummary,
      possible_underlying_reason: input.possibleUnderlyingReason ?? null,
      impact_description: input.impactDescription ?? null,
      strengths_to_build_on: input.strengthsToBuildOn ?? null,
      manager_support_actions: input.managerSupportActions ?? null,
      staff_actions_detail: input.staffActionsDetail ?? null,
      training_required: input.trainingRequired ?? null,
      mentoring_detail: input.mentoringDetail ?? null,
      success_measures: input.successMeasures ?? null,
      staff_response: input.staffResponse ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      evidence_based: input.evidenceBased ?? true,
      strengths_identified: input.strengthsIdentified ?? false,
      staff_consulted: input.staffConsulted ?? false,
      manager_actions_set: input.managerActionsSet ?? false,
      staff_actions_set: input.staffActionsSet ?? false,
      training_identified: input.trainingIdentified ?? false,
      mentoring_arranged: input.mentoringArranged ?? false,
      success_measures_set: input.successMeasuresSet ?? false,
      review_date_set: input.reviewDateSet ?? false,
      staff_agreed: input.staffAgreed ?? false,
      approved_by_senior: input.approvedBySenior ?? false,
      recorded_promptly: input.recordedPromptly ?? true,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateDevelopmentPlan(
  id: string,
  updates: Partial<{
    staffName: string;
    staffId: string | null;
    developmentArea: DevelopmentArea;
    planStatus: PlanStatus;
    approvalStatus: ApprovalStatus;
    priorityLevel: PriorityLevel;
    sessionDate: string;
    createdBy: string;
    developmentAreaDetail: string;
    evidenceSummary: string;
    possibleUnderlyingReason: string | null;
    impactDescription: string | null;
    strengthsToBuildOn: string | null;
    managerSupportActions: string | null;
    staffActionsDetail: string | null;
    trainingRequired: string | null;
    mentoringDetail: string | null;
    successMeasures: string | null;
    staffResponse: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    evidenceBased: boolean;
    strengthsIdentified: boolean;
    staffConsulted: boolean;
    managerActionsSet: boolean;
    staffActionsSet: boolean;
    trainingIdentified: boolean;
    mentoringArranged: boolean;
    successMeasuresSet: boolean;
    reviewDateSet: boolean;
    staffAgreed: boolean;
    approvedBySenior: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffDevelopmentPlanRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.staffId !== undefined) mapped.staff_id = updates.staffId;
  if (updates.developmentArea !== undefined) mapped.development_area = updates.developmentArea;
  if (updates.planStatus !== undefined) mapped.plan_status = updates.planStatus;
  if (updates.approvalStatus !== undefined) mapped.approval_status = updates.approvalStatus;
  if (updates.priorityLevel !== undefined) mapped.priority_level = updates.priorityLevel;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.createdBy !== undefined) mapped.created_by = updates.createdBy;
  if (updates.developmentAreaDetail !== undefined) mapped.development_area_detail = updates.developmentAreaDetail;
  if (updates.evidenceSummary !== undefined) mapped.evidence_summary = updates.evidenceSummary;
  if (updates.possibleUnderlyingReason !== undefined) mapped.possible_underlying_reason = updates.possibleUnderlyingReason;
  if (updates.impactDescription !== undefined) mapped.impact_description = updates.impactDescription;
  if (updates.strengthsToBuildOn !== undefined) mapped.strengths_to_build_on = updates.strengthsToBuildOn;
  if (updates.managerSupportActions !== undefined) mapped.manager_support_actions = updates.managerSupportActions;
  if (updates.staffActionsDetail !== undefined) mapped.staff_actions_detail = updates.staffActionsDetail;
  if (updates.trainingRequired !== undefined) mapped.training_required = updates.trainingRequired;
  if (updates.mentoringDetail !== undefined) mapped.mentoring_detail = updates.mentoringDetail;
  if (updates.successMeasures !== undefined) mapped.success_measures = updates.successMeasures;
  if (updates.staffResponse !== undefined) mapped.staff_response = updates.staffResponse;
  if (updates.approvedBy !== undefined) mapped.approved_by = updates.approvedBy;
  if (updates.approvedAt !== undefined) mapped.approved_at = updates.approvedAt;
  if (updates.evidenceBased !== undefined) mapped.evidence_based = updates.evidenceBased;
  if (updates.strengthsIdentified !== undefined) mapped.strengths_identified = updates.strengthsIdentified;
  if (updates.staffConsulted !== undefined) mapped.staff_consulted = updates.staffConsulted;
  if (updates.managerActionsSet !== undefined) mapped.manager_actions_set = updates.managerActionsSet;
  if (updates.staffActionsSet !== undefined) mapped.staff_actions_set = updates.staffActionsSet;
  if (updates.trainingIdentified !== undefined) mapped.training_identified = updates.trainingIdentified;
  if (updates.mentoringArranged !== undefined) mapped.mentoring_arranged = updates.mentoringArranged;
  if (updates.successMeasuresSet !== undefined) mapped.success_measures_set = updates.successMeasuresSet;
  if (updates.reviewDateSet !== undefined) mapped.review_date_set = updates.reviewDateSet;
  if (updates.staffAgreed !== undefined) mapped.staff_agreed = updates.staffAgreed;
  if (updates.approvedBySenior !== undefined) mapped.approved_by_senior = updates.approvedBySenior;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_development_plans") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeDevelopmentPlanMetrics,
  identifyDevelopmentPlanAlerts,
};
