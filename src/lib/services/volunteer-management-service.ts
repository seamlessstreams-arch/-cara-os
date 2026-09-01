// ══════════════════════════════════════════════════════════════════════════════
// CARA — VOLUNTEER MANAGEMENT SERVICE
// Tracks volunteers, DBS checks, training, supervision, and safeguarding
// compliance for people supporting children's residential homes.
// CHR 2015 Reg 32 (fitness of workers — includes volunteers),
// Reg 12 (protection — safeguarding checks),
// Reg 33 (employment of staff — extended to volunteers).
//
// Covers: volunteer registration, DBS verification, training records,
// supervision sessions, activity logs, and departure management.
//
// SCCIF: Leadership — "Volunteers are vetted and supervised."
// "Safe recruitment practices extend to all adults in the home."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type VolunteerStatus =
  | "active"
  | "pending_checks"
  | "suspended"
  | "inactive"
  | "departed";

export type DbsStatus =
  | "clear"
  | "pending"
  | "expired"
  | "barred"
  | "not_submitted";

export type TrainingStatus =
  | "up_to_date"
  | "due_soon"
  | "overdue"
  | "not_started"
  | "exempt";

export type SupervisionFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "as_needed";

export type VolunteerRole =
  | "mentor"
  | "tutor"
  | "activity_leader"
  | "befriender"
  | "advocate"
  | "sports_coach"
  | "music_teacher"
  | "general_support"
  | "fundraiser"
  | "other";

export interface VolunteerRecord {
  id: string;
  home_id: string;
  volunteer_name: string;
  volunteer_role: VolunteerRole;
  volunteer_status: VolunteerStatus;
  dbs_status: DbsStatus;
  training_status: TrainingStatus;
  supervision_frequency: SupervisionFrequency;
  start_date: string;
  dbs_check_date: string | null;
  dbs_expiry_date: string | null;
  safeguarding_trained: boolean;
  first_aid_trained: boolean;
  health_safety_trained: boolean;
  data_protection_trained: boolean;
  lone_working_allowed: boolean;
  references_obtained: boolean;
  interview_completed: boolean;
  induction_completed: boolean;
  last_supervision_date: string | null;
  next_supervision_date: string | null;
  hours_this_month: number;
  children_worked_with: string[];
  skills_offered: string[];
  issues_found: string[];
  actions_taken: string[];
  managed_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const VOLUNTEER_STATUSES: { status: VolunteerStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "pending_checks", label: "Pending Checks" },
  { status: "suspended", label: "Suspended" },
  { status: "inactive", label: "Inactive" },
  { status: "departed", label: "Departed" },
];

export const DBS_STATUSES: { status: DbsStatus; label: string }[] = [
  { status: "clear", label: "Clear" },
  { status: "pending", label: "Pending" },
  { status: "expired", label: "Expired" },
  { status: "barred", label: "Barred" },
  { status: "not_submitted", label: "Not Submitted" },
];

export const TRAINING_STATUSES: { status: TrainingStatus; label: string }[] = [
  { status: "up_to_date", label: "Up to Date" },
  { status: "due_soon", label: "Due Soon" },
  { status: "overdue", label: "Overdue" },
  { status: "not_started", label: "Not Started" },
  { status: "exempt", label: "Exempt" },
];

export const SUPERVISION_FREQUENCIES: { frequency: SupervisionFrequency; label: string }[] = [
  { frequency: "weekly", label: "Weekly" },
  { frequency: "fortnightly", label: "Fortnightly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "quarterly", label: "Quarterly" },
  { frequency: "as_needed", label: "As Needed" },
];

export const VOLUNTEER_ROLES: { role: VolunteerRole; label: string }[] = [
  { role: "mentor", label: "Mentor" },
  { role: "tutor", label: "Tutor" },
  { role: "activity_leader", label: "Activity Leader" },
  { role: "befriender", label: "Befriender" },
  { role: "advocate", label: "Advocate" },
  { role: "sports_coach", label: "Sports Coach" },
  { role: "music_teacher", label: "Music Teacher" },
  { role: "general_support", label: "General Support" },
  { role: "fundraiser", label: "Fundraiser" },
  { role: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeVolunteerMetrics(
  records: VolunteerRecord[],
): {
  total_volunteers: number;
  active_count: number;
  pending_count: number;
  suspended_count: number;
  dbs_clear_rate: number | null;
  dbs_expired_count: number;
  dbs_pending_count: number;
  training_up_to_date_rate: number | null;
  training_overdue_count: number;
  safeguarding_trained_rate: number | null;
  first_aid_trained_rate: number | null;
  references_obtained_rate: number | null;
  induction_completed_rate: number | null;
  interview_completed_rate: number | null;
  lone_working_count: number;
  total_hours: number;
  average_hours: number | null;
  unique_children: number;
  by_volunteer_status: Record<string, number>;
  by_dbs_status: Record<string, number>;
  by_training_status: Record<string, number>;
  by_volunteer_role: Record<string, number>;
} {
  const active = records.filter((r) => r.volunteer_status === "active").length;
  const pending = records.filter((r) => r.volunteer_status === "pending_checks").length;
  const suspended = records.filter((r) => r.volunteer_status === "suspended").length;

  const dbsClear = records.filter((r) => r.dbs_status === "clear").length;
  const dbsClearRate =
    records.length > 0
      ? Math.round((dbsClear / records.length) * 1000) / 10
      : null;

  const dbsExpired = records.filter((r) => r.dbs_status === "expired").length;
  const dbsPending = records.filter((r) => r.dbs_status === "pending").length;

  const trainingUpToDate = records.filter((r) => r.training_status === "up_to_date").length;
  const trainingRate =
    records.length > 0
      ? Math.round((trainingUpToDate / records.length) * 1000) / 10
      : null;

  const trainingOverdue = records.filter((r) => r.training_status === "overdue").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof VolunteerRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const loneWorking = records.filter((r) => r.lone_working_allowed).length;

  const totalHours = Math.round(records.reduce((a, r) => a + r.hours_this_month, 0) * 10) / 10;
  const avgHours =
    records.length > 0
      ? Math.round((totalHours / records.length) * 10) / 10
      : null;

  const uniqueChildren = new Set(records.flatMap((r) => r.children_worked_with)).size;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.volunteer_status] = (byStatus[r.volunteer_status] ?? 0) + 1;

  const byDbs: Record<string, number> = {};
  for (const r of records) byDbs[r.dbs_status] = (byDbs[r.dbs_status] ?? 0) + 1;

  const byTraining: Record<string, number> = {};
  for (const r of records) byTraining[r.training_status] = (byTraining[r.training_status] ?? 0) + 1;

  const byRole: Record<string, number> = {};
  for (const r of records) byRole[r.volunteer_role] = (byRole[r.volunteer_role] ?? 0) + 1;

  return {
    total_volunteers: records.length,
    active_count: active,
    pending_count: pending,
    suspended_count: suspended,
    dbs_clear_rate: dbsClearRate,
    dbs_expired_count: dbsExpired,
    dbs_pending_count: dbsPending,
    training_up_to_date_rate: trainingRate,
    training_overdue_count: trainingOverdue,
    safeguarding_trained_rate: boolRate("safeguarding_trained"),
    first_aid_trained_rate: boolRate("first_aid_trained"),
    references_obtained_rate: boolRate("references_obtained"),
    induction_completed_rate: boolRate("induction_completed"),
    interview_completed_rate: boolRate("interview_completed"),
    lone_working_count: loneWorking,
    total_hours: totalHours,
    average_hours: avgHours,
    unique_children: uniqueChildren,
    by_volunteer_status: byStatus,
    by_dbs_status: byDbs,
    by_training_status: byTraining,
    by_volunteer_role: byRole,
  };
}

export function identifyVolunteerAlerts(
  records: VolunteerRecord[],
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

  // DBS barred
  for (const r of records) {
    if (r.dbs_status === "barred") {
      alerts.push({
        type: "dbs_barred",
        severity: "critical",
        message: `Volunteer ${r.volunteer_name} has a barred DBS status — remove from duties immediately`,
        id: r.id,
      });
    }
  }

  // DBS expired
  const dbsExpired = records.filter((r) => r.dbs_status === "expired").length;
  if (dbsExpired >= 1) {
    alerts.push({
      type: "dbs_expired",
      severity: "high",
      message: `${dbsExpired} ${dbsExpired === 1 ? "volunteer has" : "volunteers have"} expired DBS — renew before contact with children`,
      id: "dbs_expired",
    });
  }

  // Training overdue
  const trainingOverdue = records.filter((r) => r.training_status === "overdue").length;
  if (trainingOverdue >= 1) {
    alerts.push({
      type: "training_overdue",
      severity: "high",
      message: `${trainingOverdue} ${trainingOverdue === 1 ? "volunteer has" : "volunteers have"} overdue training — schedule promptly`,
      id: "training_overdue",
    });
  }

  // No safeguarding training
  const noSafeguarding = records.filter(
    (r) => !r.safeguarding_trained && r.volunteer_status === "active",
  ).length;
  if (noSafeguarding >= 1) {
    alerts.push({
      type: "no_safeguarding",
      severity: "high",
      message: `${noSafeguarding} active ${noSafeguarding === 1 ? "volunteer" : "volunteers"} without safeguarding training — complete before duties`,
      id: "no_safeguarding",
    });
  }

  // References not obtained
  const noRefs = records.filter(
    (r) => !r.references_obtained && r.volunteer_status !== "departed",
  ).length;
  if (noRefs >= 2) {
    alerts.push({
      type: "no_references",
      severity: "medium",
      message: `${noRefs} volunteers without references obtained — complete safer recruitment checks`,
      id: "no_references",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    volunteerStatus?: VolunteerStatus;
    dbsStatus?: DbsStatus;
    trainingStatus?: TrainingStatus;
    limit?: number;
  },
): Promise<ServiceResult<VolunteerRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_volunteers") as SB).select("*").eq("home_id", homeId);
  if (filters?.volunteerStatus) q = q.eq("volunteer_status", filters.volunteerStatus);
  if (filters?.dbsStatus) q = q.eq("dbs_status", filters.dbsStatus);
  if (filters?.trainingStatus) q = q.eq("training_status", filters.trainingStatus);
  q = q.order("start_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    volunteerName: string;
    volunteerRole: VolunteerRole;
    volunteerStatus: VolunteerStatus;
    dbsStatus: DbsStatus;
    trainingStatus: TrainingStatus;
    supervisionFrequency: SupervisionFrequency;
    startDate: string;
    dbsCheckDate?: string;
    dbsExpiryDate?: string;
    safeguardingTrained: boolean;
    firstAidTrained: boolean;
    healthSafetyTrained: boolean;
    dataProtectionTrained: boolean;
    loneWorkingAllowed: boolean;
    referencesObtained: boolean;
    interviewCompleted: boolean;
    inductionCompleted: boolean;
    lastSupervisionDate?: string;
    nextSupervisionDate?: string;
    hoursThisMonth: number;
    childrenWorkedWith: string[];
    skillsOffered: string[];
    issuesFound: string[];
    actionsTaken: string[];
    managedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<VolunteerRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_volunteers") as SB)
    .insert({
      home_id: input.homeId,
      volunteer_name: input.volunteerName,
      volunteer_role: input.volunteerRole,
      volunteer_status: input.volunteerStatus,
      dbs_status: input.dbsStatus,
      training_status: input.trainingStatus,
      supervision_frequency: input.supervisionFrequency,
      start_date: input.startDate,
      dbs_check_date: input.dbsCheckDate ?? null,
      dbs_expiry_date: input.dbsExpiryDate ?? null,
      safeguarding_trained: input.safeguardingTrained,
      first_aid_trained: input.firstAidTrained,
      health_safety_trained: input.healthSafetyTrained,
      data_protection_trained: input.dataProtectionTrained,
      lone_working_allowed: input.loneWorkingAllowed,
      references_obtained: input.referencesObtained,
      interview_completed: input.interviewCompleted,
      induction_completed: input.inductionCompleted,
      last_supervision_date: input.lastSupervisionDate ?? null,
      next_supervision_date: input.nextSupervisionDate ?? null,
      hours_this_month: input.hoursThisMonth,
      children_worked_with: input.childrenWorkedWith,
      skills_offered: input.skillsOffered,
      issues_found: input.issuesFound,
      actions_taken: input.actionsTaken,
      managed_by: input.managedBy,
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
): Promise<ServiceResult<VolunteerRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_volunteers") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeVolunteerMetrics,
  identifyVolunteerAlerts,
};
