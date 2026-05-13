// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF INDUCTION SERVICE
// Manages staff induction checklists, probation tracking, competency
// sign-off, and new starter onboarding.
// CHR 2015 Reg 33 (employment of staff — recruitment, fitness),
// Reg 34 (employment of staff — support, training, supervision),
// Schedule 2 (information in respect of persons seeking to carry
// on, manage, or work at a children's home).
//
// Tracks induction tasks, mandatory training completion, probation
// milestones, and ensures all new staff are safe and competent.
//
// SCCIF: Well-Led — "Staff are safely recruited and inducted."
// "New staff receive thorough induction before working unsupervised."
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

export type InductionCategory =
  | "safeguarding"
  | "health_safety"
  | "fire_safety"
  | "first_aid"
  | "medication"
  | "behaviour_management"
  | "restraint"
  | "data_protection"
  | "whistleblowing"
  | "complaints"
  | "policies_procedures"
  | "lone_working"
  | "equality_diversity"
  | "record_keeping"
  | "children_introductions"
  | "premises_orientation"
  | "emergency_procedures"
  | "other";

export type InductionTaskStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "deferred"
  | "not_applicable";

export type ProbationStatus =
  | "in_probation"
  | "extended"
  | "passed"
  | "failed"
  | "not_applicable";

export type ProbationMilestone =
  | "week_1_review"
  | "month_1_review"
  | "month_3_review"
  | "month_6_review"
  | "final_review";

export interface InductionRecord {
  id: string;
  home_id: string;
  staff_name: string;
  staff_role: string;
  start_date: string;
  induction_lead: string;
  probation_status: ProbationStatus;
  probation_end_date: string | null;
  total_tasks: number;
  tasks_completed: number;
  tasks_overdue: number;
  dbs_verified: boolean;
  references_verified: boolean;
  right_to_work_verified: boolean;
  can_work_unsupervised: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InductionTask {
  id: string;
  home_id: string;
  induction_id: string;
  category: InductionCategory;
  task: string;
  target_date: string;
  status: InductionTaskStatus;
  completed_date: string | null;
  signed_off_by: string | null;
  evidence: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const INDUCTION_CATEGORIES: { category: InductionCategory; label: string }[] = [
  { category: "safeguarding", label: "Safeguarding" },
  { category: "health_safety", label: "Health & Safety" },
  { category: "fire_safety", label: "Fire Safety" },
  { category: "first_aid", label: "First Aid" },
  { category: "medication", label: "Medication" },
  { category: "behaviour_management", label: "Behaviour Management" },
  { category: "restraint", label: "Restraint" },
  { category: "data_protection", label: "Data Protection" },
  { category: "whistleblowing", label: "Whistleblowing" },
  { category: "complaints", label: "Complaints" },
  { category: "policies_procedures", label: "Policies & Procedures" },
  { category: "lone_working", label: "Lone Working" },
  { category: "equality_diversity", label: "Equality & Diversity" },
  { category: "record_keeping", label: "Record Keeping" },
  { category: "children_introductions", label: "Children Introductions" },
  { category: "premises_orientation", label: "Premises Orientation" },
  { category: "emergency_procedures", label: "Emergency Procedures" },
  { category: "other", label: "Other" },
];

export const INDUCTION_TASK_STATUSES: { status: InductionTaskStatus; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "deferred", label: "Deferred" },
  { status: "not_applicable", label: "Not Applicable" },
];

export const PROBATION_STATUSES: { status: ProbationStatus; label: string }[] = [
  { status: "in_probation", label: "In Probation" },
  { status: "extended", label: "Extended" },
  { status: "passed", label: "Passed" },
  { status: "failed", label: "Failed" },
  { status: "not_applicable", label: "Not Applicable" },
];

export const PROBATION_MILESTONES: { milestone: ProbationMilestone; label: string }[] = [
  { milestone: "week_1_review", label: "Week 1 Review" },
  { milestone: "month_1_review", label: "Month 1 Review" },
  { milestone: "month_3_review", label: "Month 3 Review" },
  { milestone: "month_6_review", label: "Month 6 Review" },
  { milestone: "final_review", label: "Final Review" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute staff induction metrics.
 */
export function computeInductionMetrics(
  records: InductionRecord[],
  tasks: InductionTask[],
  now: Date = new Date(),
): {
  total_records: number;
  in_probation: number;
  probation_extended: number;
  probation_passed: number;
  probation_failed: number;
  total_tasks: number;
  tasks_completed: number;
  tasks_overdue: number;
  completion_rate: number;
  dbs_verified_rate: number;
  references_verified_rate: number;
  can_work_unsupervised_count: number;
  right_to_work_verified_rate: number;
  avg_completion: number;
  by_category: Record<string, number>;
  by_task_status: Record<string, number>;
  by_probation_status: Record<string, number>;
} {
  const inProbation = records.filter((r) => r.probation_status === "in_probation").length;
  const extended = records.filter((r) => r.probation_status === "extended").length;
  const passed = records.filter((r) => r.probation_status === "passed").length;
  const failed = records.filter((r) => r.probation_status === "failed").length;

  const activeTasks = tasks.filter((t) => t.status !== "not_applicable").length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter(
    (t) =>
      (t.status === "not_started" || t.status === "in_progress") &&
      new Date(t.target_date) < now,
  ).length;

  const completionRate =
    activeTasks > 0
      ? Math.round((completed / activeTasks) * 1000) / 10
      : 0;

  const activeRecords = records.filter(
    (r) => r.probation_status === "in_probation" || r.probation_status === "extended",
  );

  const dbsVerified = records.filter((r) => r.dbs_verified).length;
  const dbsRate =
    records.length > 0 ? Math.round((dbsVerified / records.length) * 1000) / 10 : 0;

  const refsVerified = records.filter((r) => r.references_verified).length;
  const refsRate =
    records.length > 0 ? Math.round((refsVerified / records.length) * 1000) / 10 : 0;

  const rtwVerified = records.filter((r) => r.right_to_work_verified).length;
  const rtwRate =
    records.length > 0 ? Math.round((rtwVerified / records.length) * 1000) / 10 : 0;

  const unsupervised = records.filter((r) => r.can_work_unsupervised).length;

  // Average completion percentage across active records
  const avgCompletion =
    activeRecords.length > 0
      ? Math.round(
          (activeRecords.reduce(
            (sum, r) =>
              sum + (r.total_tasks > 0 ? (r.tasks_completed / r.total_tasks) * 100 : 0),
            0,
          ) /
            activeRecords.length) *
            10,
        ) / 10
      : 0;

  // By category
  const byCategory: Record<string, number> = {};
  for (const t of tasks) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;
  }

  // By task status
  const byTaskStatus: Record<string, number> = {};
  for (const t of tasks) {
    byTaskStatus[t.status] = (byTaskStatus[t.status] ?? 0) + 1;
  }

  // By probation status
  const byProbationStatus: Record<string, number> = {};
  for (const r of records) {
    byProbationStatus[r.probation_status] = (byProbationStatus[r.probation_status] ?? 0) + 1;
  }

  return {
    total_records: records.length,
    in_probation: inProbation,
    probation_extended: extended,
    probation_passed: passed,
    probation_failed: failed,
    total_tasks: tasks.length,
    tasks_completed: completed,
    tasks_overdue: overdue,
    completion_rate: completionRate,
    dbs_verified_rate: dbsRate,
    references_verified_rate: refsRate,
    can_work_unsupervised_count: unsupervised,
    right_to_work_verified_rate: rtwRate,
    avg_completion: avgCompletion,
    by_category: byCategory,
    by_task_status: byTaskStatus,
    by_probation_status: byProbationStatus,
  };
}

/**
 * Identify staff induction alerts.
 */
export function identifyInductionAlerts(
  records: InductionRecord[],
  tasks: InductionTask[],
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

  // Pre-employment checks not verified
  for (const r of records) {
    if (!r.dbs_verified || !r.references_verified || !r.right_to_work_verified) {
      const missing: string[] = [];
      if (!r.dbs_verified) missing.push("DBS");
      if (!r.references_verified) missing.push("references");
      if (!r.right_to_work_verified) missing.push("right to work");
      alerts.push({
        type: "checks_incomplete",
        severity: "critical",
        message: `${r.staff_name} (${r.staff_role}) — pre-employment checks incomplete: ${missing.join(", ")}. Must not work unsupervised`,
        id: r.id,
      });
    }
  }

  // Overdue induction tasks
  for (const t of tasks) {
    if (
      (t.status === "not_started" || t.status === "in_progress") &&
      new Date(t.target_date) < now
    ) {
      alerts.push({
        type: "task_overdue",
        severity: "high",
        message: `Induction task "${t.task}" (${t.category}) overdue since ${t.target_date} — complete urgently`,
        id: t.id,
      });
    }
  }

  // Probation end date approaching
  const fourteenDaysAhead = new Date(now);
  fourteenDaysAhead.setDate(fourteenDaysAhead.getDate() + 14);
  for (const r of records) {
    if (
      (r.probation_status === "in_probation" || r.probation_status === "extended") &&
      r.probation_end_date &&
      new Date(r.probation_end_date) >= now &&
      new Date(r.probation_end_date) <= fourteenDaysAhead
    ) {
      alerts.push({
        type: "probation_ending",
        severity: "medium",
        message: `${r.staff_name} probation ends ${r.probation_end_date} — schedule final review`,
        id: r.id,
      });
    }
  }

  // Probation overdue (past end date but still in_probation/extended)
  for (const r of records) {
    if (
      (r.probation_status === "in_probation" || r.probation_status === "extended") &&
      r.probation_end_date &&
      new Date(r.probation_end_date) < now
    ) {
      alerts.push({
        type: "probation_overdue",
        severity: "high",
        message: `${r.staff_name} probation end date (${r.probation_end_date}) has passed — complete final review or extend`,
        id: r.id,
      });
    }
  }

  // Working unsupervised without checks
  for (const r of records) {
    if (r.can_work_unsupervised && (!r.dbs_verified || !r.references_verified)) {
      alerts.push({
        type: "unsupervised_without_checks",
        severity: "critical",
        message: `${r.staff_name} is marked as able to work unsupervised but pre-employment checks are incomplete — immediate action required`,
        id: r.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Induction Records ──────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    probationStatus?: ProbationStatus;
    limit?: number;
  },
): Promise<ServiceResult<InductionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_induction_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.probationStatus) q = q.eq("probation_status", filters.probationStatus);
  q = q.order("start_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    staffName: string;
    staffRole: string;
    startDate: string;
    inductionLead: string;
    probationEndDate?: string;
  },
): Promise<ServiceResult<InductionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_induction_records") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      staff_role: input.staffRole,
      start_date: input.startDate,
      induction_lead: input.inductionLead,
      probation_status: "in_probation",
      probation_end_date: input.probationEndDate ?? null,
      total_tasks: 0,
      tasks_completed: 0,
      tasks_overdue: 0,
      dbs_verified: false,
      references_verified: false,
      right_to_work_verified: false,
      can_work_unsupervised: false,
      notes: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<InductionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_induction_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Induction Tasks ────────────────────────────────────────────

export async function listTasks(
  homeId: string,
  filters?: {
    inductionId?: string;
    category?: InductionCategory;
    status?: InductionTaskStatus;
    limit?: number;
  },
): Promise<ServiceResult<InductionTask[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_induction_tasks") as SB).select("*").eq("home_id", homeId);
  if (filters?.inductionId) q = q.eq("induction_id", filters.inductionId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("target_date", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createTask(
  input: {
    homeId: string;
    inductionId: string;
    category: InductionCategory;
    task: string;
    targetDate: string;
  },
): Promise<ServiceResult<InductionTask>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_induction_tasks") as SB)
    .insert({
      home_id: input.homeId,
      induction_id: input.inductionId,
      category: input.category,
      task: input.task,
      target_date: input.targetDate,
      status: "not_started",
      completed_date: null,
      signed_off_by: null,
      evidence: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeInductionMetrics,
  identifyInductionAlerts,
};
