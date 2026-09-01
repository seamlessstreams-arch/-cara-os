// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF SUPPORT PLAN SERVICE
// Manages supportive, pre-formal staff support plans — part of the
// Cara Staff Development, Support and Risk Intelligence layer.
// CHR 2015 Reg 33 (employment of staff — support and development),
// Reg 34 (fitness of workers), Reg 13 (leadership and management).
//
// This is SUPPORTIVE and PRE-FORMAL, not disciplinary. Support plans
// are created to help staff develop, maintain wellbeing, and address
// concerns early — showing care, fairness and evidence at every step.
//
// Covers: concern identification, support planning, wellbeing considerations,
// reasonable adjustments, mentor/buddy allocation, staff consultation,
// supervision frequency, and senior approval tracking.
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

export type ConcernArea =
  | "wellbeing"
  | "workload"
  | "confidence"
  | "competence"
  | "attendance"
  | "relationships"
  | "boundaries"
  | "communication"
  | "record_keeping"
  | "professional_conduct";

export type PlanStatus =
  | "draft"
  | "active"
  | "under_review"
  | "completed"
  | "escalated";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "returned"
  | "withdrawn"
  | "not_required";

export type SupervisionFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "six_weekly"
  | "as_needed";

export interface StaffSupportPlanRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_id: string | null;
  concern_area: ConcernArea;
  plan_status: PlanStatus;
  approval_status: ApprovalStatus;
  supervision_frequency: SupervisionFrequency;
  session_date: string;
  created_by: string;
  what_is_working_well: string;
  what_we_are_worried_about: string;
  what_needs_to_improve: string;
  support_being_offered: string | null;
  wellbeing_considerations: string | null;
  reasonable_adjustments: string | null;
  mentor_buddy: string | null;
  timescale: string | null;
  staff_response: string | null;
  approved_by: string | null;
  approved_at: string | null;
  what_working_well_recorded: boolean;
  concerns_documented: boolean;
  improvements_identified: boolean;
  support_offered: boolean;
  wellbeing_considered: boolean;
  adjustments_offered: boolean;
  mentor_assigned: boolean;
  staff_consulted: boolean;
  staff_agreed: boolean;
  review_date_set: boolean;
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

export const CONCERN_AREAS: { area: ConcernArea; label: string }[] = [
  { area: "wellbeing", label: "Wellbeing" },
  { area: "workload", label: "Workload" },
  { area: "confidence", label: "Confidence" },
  { area: "competence", label: "Competence" },
  { area: "attendance", label: "Attendance" },
  { area: "relationships", label: "Relationships" },
  { area: "boundaries", label: "Boundaries" },
  { area: "communication", label: "Communication" },
  { area: "record_keeping", label: "Record Keeping" },
  { area: "professional_conduct", label: "Professional Conduct" },
];

export const PLAN_STATUSES: { status: PlanStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "active", label: "Active" },
  { status: "under_review", label: "Under Review" },
  { status: "completed", label: "Completed" },
  { status: "escalated", label: "Escalated" },
];

export const APPROVAL_STATUSES: { approval: ApprovalStatus; label: string }[] = [
  { approval: "pending", label: "Pending" },
  { approval: "approved", label: "Approved" },
  { approval: "returned", label: "Returned" },
  { approval: "withdrawn", label: "Withdrawn" },
  { approval: "not_required", label: "Not Required" },
];

export const SUPERVISION_FREQUENCIES: { frequency: SupervisionFrequency; label: string }[] = [
  { frequency: "weekly", label: "Weekly" },
  { frequency: "fortnightly", label: "Fortnightly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "six_weekly", label: "Six-Weekly" },
  { frequency: "as_needed", label: "As Needed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute staff support plan metrics.
 */
export function computeSupportPlanMetrics(
  records: StaffSupportPlanRecord[],
): {
  total_plans: number;
  active_count: number;
  escalated_count: number;
  pending_approval_count: number;
  completed_count: number;
  working_well_rate: number | null;
  concerns_documented_rate: number | null;
  improvements_rate: number | null;
  support_offered_rate: number | null;
  wellbeing_rate: number | null;
  adjustments_rate: number | null;
  mentor_rate: number | null;
  staff_consulted_rate: number | null;
  staff_agreed_rate: number | null;
  review_date_rate: number | null;
  approved_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_staff: number;
  by_concern_area: Record<string, number>;
  by_plan_status: Record<string, number>;
  by_approval_status: Record<string, number>;
  by_supervision_frequency: Record<string, number>;
} {
  const activeCount = records.filter((r) => r.plan_status === "active").length;
  const escalatedCount = records.filter((r) => r.plan_status === "escalated").length;
  const pendingApprovalCount = records.filter((r) => r.approval_status === "pending").length;
  const completedCount = records.filter((r) => r.plan_status === "completed").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof StaffSupportPlanRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const uniqueStaff = new Set(records.map((r) => r.staff_name)).size;

  const byConcernArea: Record<string, number> = {};
  for (const r of records) byConcernArea[r.concern_area] = (byConcernArea[r.concern_area] ?? 0) + 1;

  const byPlanStatus: Record<string, number> = {};
  for (const r of records) byPlanStatus[r.plan_status] = (byPlanStatus[r.plan_status] ?? 0) + 1;

  const byApprovalStatus: Record<string, number> = {};
  for (const r of records) byApprovalStatus[r.approval_status] = (byApprovalStatus[r.approval_status] ?? 0) + 1;

  const bySupervisionFrequency: Record<string, number> = {};
  for (const r of records) bySupervisionFrequency[r.supervision_frequency] = (bySupervisionFrequency[r.supervision_frequency] ?? 0) + 1;

  return {
    total_plans: records.length,
    active_count: activeCount,
    escalated_count: escalatedCount,
    pending_approval_count: pendingApprovalCount,
    completed_count: completedCount,
    working_well_rate: boolRate("what_working_well_recorded"),
    concerns_documented_rate: boolRate("concerns_documented"),
    improvements_rate: boolRate("improvements_identified"),
    support_offered_rate: boolRate("support_offered"),
    wellbeing_rate: boolRate("wellbeing_considered"),
    adjustments_rate: boolRate("adjustments_offered"),
    mentor_rate: boolRate("mentor_assigned"),
    staff_consulted_rate: boolRate("staff_consulted"),
    staff_agreed_rate: boolRate("staff_agreed"),
    review_date_rate: boolRate("review_date_set"),
    approved_rate: boolRate("approved_by_senior"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_staff: uniqueStaff,
    by_concern_area: byConcernArea,
    by_plan_status: byPlanStatus,
    by_approval_status: byApprovalStatus,
    by_supervision_frequency: bySupervisionFrequency,
  };
}

/**
 * Identify staff support plan alerts requiring management attention.
 */
export function identifySupportPlanAlerts(
  records: StaffSupportPlanRecord[],
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

  // Escalated and unapproved — per-record, critical
  for (const r of records) {
    if (r.plan_status === "escalated" && r.approval_status === "pending") {
      alerts.push({
        type: "escalated_unapproved",
        severity: "critical",
        message: `${r.staff_name} has an escalated support plan awaiting approval — manager action needed.`,
        id: r.id,
      });
    }
  }

  // Staff not consulted — high, count >= 1
  const notConsultedCount = records.filter((r) => r.staff_consulted === false).length;
  if (notConsultedCount >= 1) {
    alerts.push({
      type: "no_staff_consulted",
      severity: "high",
      message: `${notConsultedCount} ${notConsultedCount === 1 ? "plan has" : "plans have"} staff not consulted.`,
      id: "no_staff_consulted",
    });
  }

  // Wellbeing not considered — high, count >= 1
  const noWellbeingCount = records.filter((r) => r.wellbeing_considered === false).length;
  if (noWellbeingCount >= 1) {
    alerts.push({
      type: "no_wellbeing_considered",
      severity: "high",
      message: `${noWellbeingCount} ${noWellbeingCount === 1 ? "plan has" : "plans have"} wellbeing not considered.`,
      id: "no_wellbeing_considered",
    });
  }

  // No mentor assigned — medium, count >= 2
  const noMentorCount = records.filter((r) => r.mentor_assigned === false).length;
  if (noMentorCount >= 2) {
    alerts.push({
      type: "no_mentor_assigned",
      severity: "medium",
      message: `${noMentorCount} plans have no mentor/buddy assigned.`,
      id: "no_mentor_assigned",
    });
  }

  // No adjustments offered — medium, count >= 2
  const noAdjustmentsCount = records.filter((r) => r.adjustments_offered === false).length;
  if (noAdjustmentsCount >= 2) {
    alerts.push({
      type: "no_adjustments_offered",
      severity: "medium",
      message: `${noAdjustmentsCount} plans have no reasonable adjustments offered.`,
      id: "no_adjustments_offered",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listSupportPlans(
  homeId: string,
  filters?: {
    staffName?: string;
    concernArea?: ConcernArea;
    planStatus?: PlanStatus;
    approvalStatus?: ApprovalStatus;
    supervisionFrequency?: SupervisionFrequency;
    limit?: number;
  },
): Promise<ServiceResult<StaffSupportPlanRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_support_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffName) q = q.eq("staff_name", filters.staffName);
  if (filters?.concernArea) q = q.eq("concern_area", filters.concernArea);
  if (filters?.planStatus) q = q.eq("plan_status", filters.planStatus);
  if (filters?.approvalStatus) q = q.eq("approval_status", filters.approvalStatus);
  if (filters?.supervisionFrequency) q = q.eq("supervision_frequency", filters.supervisionFrequency);
  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSupportPlan(
  input: {
    homeId: string;
    staffName: string;
    staffId?: string | null;
    concernArea: ConcernArea;
    planStatus?: PlanStatus;
    approvalStatus?: ApprovalStatus;
    supervisionFrequency: SupervisionFrequency;
    sessionDate: string;
    createdBy: string;
    whatIsWorkingWell: string;
    whatWeAreWorriedAbout: string;
    whatNeedsToImprove: string;
    supportBeingOffered?: string | null;
    wellbeingConsiderations?: string | null;
    reasonableAdjustments?: string | null;
    mentorBuddy?: string | null;
    timescale?: string | null;
    staffResponse?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    whatWorkingWellRecorded?: boolean;
    concernsDocumented?: boolean;
    improvementsIdentified?: boolean;
    supportOffered?: boolean;
    wellbeingConsidered?: boolean;
    adjustmentsOffered?: boolean;
    mentorAssigned?: boolean;
    staffConsulted?: boolean;
    staffAgreed?: boolean;
    reviewDateSet?: boolean;
    approvedBySenior?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<StaffSupportPlanRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_support_plans") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_id: input.staffId ?? null,
      concern_area: input.concernArea,
      plan_status: input.planStatus ?? "draft",
      approval_status: input.approvalStatus ?? "pending",
      supervision_frequency: input.supervisionFrequency,
      session_date: input.sessionDate,
      created_by: input.createdBy,
      what_is_working_well: input.whatIsWorkingWell,
      what_we_are_worried_about: input.whatWeAreWorriedAbout,
      what_needs_to_improve: input.whatNeedsToImprove,
      support_being_offered: input.supportBeingOffered ?? null,
      wellbeing_considerations: input.wellbeingConsiderations ?? null,
      reasonable_adjustments: input.reasonableAdjustments ?? null,
      mentor_buddy: input.mentorBuddy ?? null,
      timescale: input.timescale ?? null,
      staff_response: input.staffResponse ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      what_working_well_recorded: input.whatWorkingWellRecorded ?? false,
      concerns_documented: input.concernsDocumented ?? false,
      improvements_identified: input.improvementsIdentified ?? false,
      support_offered: input.supportOffered ?? false,
      wellbeing_considered: input.wellbeingConsidered ?? false,
      adjustments_offered: input.adjustmentsOffered ?? false,
      mentor_assigned: input.mentorAssigned ?? false,
      staff_consulted: input.staffConsulted ?? false,
      staff_agreed: input.staffAgreed ?? false,
      review_date_set: input.reviewDateSet ?? false,
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

export async function updateSupportPlan(
  id: string,
  updates: Partial<{
    staffName: string;
    staffId: string | null;
    concernArea: ConcernArea;
    planStatus: PlanStatus;
    approvalStatus: ApprovalStatus;
    supervisionFrequency: SupervisionFrequency;
    sessionDate: string;
    createdBy: string;
    whatIsWorkingWell: string;
    whatWeAreWorriedAbout: string;
    whatNeedsToImprove: string;
    supportBeingOffered: string | null;
    wellbeingConsiderations: string | null;
    reasonableAdjustments: string | null;
    mentorBuddy: string | null;
    timescale: string | null;
    staffResponse: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    whatWorkingWellRecorded: boolean;
    concernsDocumented: boolean;
    improvementsIdentified: boolean;
    supportOffered: boolean;
    wellbeingConsidered: boolean;
    adjustmentsOffered: boolean;
    mentorAssigned: boolean;
    staffConsulted: boolean;
    staffAgreed: boolean;
    reviewDateSet: boolean;
    approvedBySenior: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<StaffSupportPlanRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.staffId !== undefined) mapped.staff_id = updates.staffId;
  if (updates.concernArea !== undefined) mapped.concern_area = updates.concernArea;
  if (updates.planStatus !== undefined) mapped.plan_status = updates.planStatus;
  if (updates.approvalStatus !== undefined) mapped.approval_status = updates.approvalStatus;
  if (updates.supervisionFrequency !== undefined) mapped.supervision_frequency = updates.supervisionFrequency;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.createdBy !== undefined) mapped.created_by = updates.createdBy;
  if (updates.whatIsWorkingWell !== undefined) mapped.what_is_working_well = updates.whatIsWorkingWell;
  if (updates.whatWeAreWorriedAbout !== undefined) mapped.what_we_are_worried_about = updates.whatWeAreWorriedAbout;
  if (updates.whatNeedsToImprove !== undefined) mapped.what_needs_to_improve = updates.whatNeedsToImprove;
  if (updates.supportBeingOffered !== undefined) mapped.support_being_offered = updates.supportBeingOffered;
  if (updates.wellbeingConsiderations !== undefined) mapped.wellbeing_considerations = updates.wellbeingConsiderations;
  if (updates.reasonableAdjustments !== undefined) mapped.reasonable_adjustments = updates.reasonableAdjustments;
  if (updates.mentorBuddy !== undefined) mapped.mentor_buddy = updates.mentorBuddy;
  if (updates.timescale !== undefined) mapped.timescale = updates.timescale;
  if (updates.staffResponse !== undefined) mapped.staff_response = updates.staffResponse;
  if (updates.approvedBy !== undefined) mapped.approved_by = updates.approvedBy;
  if (updates.approvedAt !== undefined) mapped.approved_at = updates.approvedAt;
  if (updates.whatWorkingWellRecorded !== undefined) mapped.what_working_well_recorded = updates.whatWorkingWellRecorded;
  if (updates.concernsDocumented !== undefined) mapped.concerns_documented = updates.concernsDocumented;
  if (updates.improvementsIdentified !== undefined) mapped.improvements_identified = updates.improvementsIdentified;
  if (updates.supportOffered !== undefined) mapped.support_offered = updates.supportOffered;
  if (updates.wellbeingConsidered !== undefined) mapped.wellbeing_considered = updates.wellbeingConsidered;
  if (updates.adjustmentsOffered !== undefined) mapped.adjustments_offered = updates.adjustmentsOffered;
  if (updates.mentorAssigned !== undefined) mapped.mentor_assigned = updates.mentorAssigned;
  if (updates.staffConsulted !== undefined) mapped.staff_consulted = updates.staffConsulted;
  if (updates.staffAgreed !== undefined) mapped.staff_agreed = updates.staffAgreed;
  if (updates.reviewDateSet !== undefined) mapped.review_date_set = updates.reviewDateSet;
  if (updates.approvedBySenior !== undefined) mapped.approved_by_senior = updates.approvedBySenior;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_staff_support_plans") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSupportPlanMetrics,
  identifySupportPlanAlerts,
};
