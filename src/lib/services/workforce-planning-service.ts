// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFORCE PLANNING SERVICE
// Manages staffing levels, ratios, succession planning, vacancy tracking,
// and workforce modelling for the home.
// CHR 2015 Reg 33 (employment of staff — sufficient numbers, suitable
// qualifications, skills, experience),
// Reg 34 (fitness of workers — ongoing suitability).
//
// Ensures the home always has sufficient staff of the right calibre,
// monitors vacancies, agency usage, and succession readiness, and
// evidences compliance with staffing expectations.
//
// SCCIF: Well-Led — "The home has sufficient, suitably qualified and
// experienced staff." "Staffing arrangements ensure children's needs
// are met at all times."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import { londonDayDiff } from "@/lib/utils";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type StaffRole =
  | "registered_manager"
  | "deputy_manager"
  | "senior_rcw"
  | "residential_care_worker"
  | "waking_night"
  | "bank_staff"
  | "agency"
  | "team_leader"
  | "admin"
  | "maintenance"
  | "other";

export type VacancyStatus =
  | "open"
  | "advertised"
  | "shortlisted"
  | "interviewing"
  | "offered"
  | "filled"
  | "withdrawn";

export type ShiftType =
  | "day"
  | "long_day"
  | "early"
  | "late"
  | "waking_night"
  | "sleep_in"
  | "on_call";

export type SuccessionReadiness =
  | "ready_now"
  | "ready_1_year"
  | "ready_2_years"
  | "development_needed"
  | "not_identified";

export interface StaffingSnapshot {
  id: string;
  home_id: string;
  snapshot_date: string;
  established_posts: number;
  filled_posts: number;
  vacancies: number;
  agency_staff: number;
  bank_staff: number;
  staff_on_leave: number;
  staff_on_sickness: number;
  children_in_placement: number;
  staff_child_ratio: number;
  meets_minimum_ratio: boolean;
  commentary: string | null;
  recorded_by: string;
  created_at: string;
}

export interface VacancyRecord {
  id: string;
  home_id: string;
  role: StaffRole;
  title: string;
  status: VacancyStatus;
  date_opened: string;
  date_filled: string | null;
  closing_date: string | null;
  applications_received: number;
  interviews_scheduled: number;
  offers_made: number;
  agency_cover: boolean;
  recruitment_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuccessionPlan {
  id: string;
  home_id: string;
  critical_role: StaffRole;
  role_title: string;
  current_holder: string;
  successor_name: string | null;
  readiness: SuccessionReadiness;
  development_actions: string[];
  risk_if_vacant: string;
  last_reviewed: string;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const STAFF_ROLES: { role: StaffRole; label: string }[] = [
  { role: "registered_manager", label: "Registered Manager" },
  { role: "deputy_manager", label: "Deputy Manager" },
  { role: "senior_rcw", label: "Senior Residential Care Worker" },
  { role: "residential_care_worker", label: "Residential Care Worker" },
  { role: "waking_night", label: "Waking Night Staff" },
  { role: "bank_staff", label: "Bank Staff" },
  { role: "agency", label: "Agency Staff" },
  { role: "team_leader", label: "Team Leader" },
  { role: "admin", label: "Administrator" },
  { role: "maintenance", label: "Maintenance" },
  { role: "other", label: "Other" },
];

export const VACANCY_STATUSES: { status: VacancyStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "advertised", label: "Advertised" },
  { status: "shortlisted", label: "Shortlisted" },
  { status: "interviewing", label: "Interviewing" },
  { status: "offered", label: "Offered" },
  { status: "filled", label: "Filled" },
  { status: "withdrawn", label: "Withdrawn" },
];

export const SHIFT_TYPES: { type: ShiftType; label: string }[] = [
  { type: "day", label: "Day Shift" },
  { type: "long_day", label: "Long Day" },
  { type: "early", label: "Early Shift" },
  { type: "late", label: "Late Shift" },
  { type: "waking_night", label: "Waking Night" },
  { type: "sleep_in", label: "Sleep-In" },
  { type: "on_call", label: "On Call" },
];

export const SUCCESSION_READINESS: { readiness: SuccessionReadiness; label: string }[] = [
  { readiness: "ready_now", label: "Ready Now" },
  { readiness: "ready_1_year", label: "Ready in 1 Year" },
  { readiness: "ready_2_years", label: "Ready in 2 Years" },
  { readiness: "development_needed", label: "Development Needed" },
  { readiness: "not_identified", label: "Not Identified" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute workforce planning metrics.
 */
export function computeWorkforceMetrics(
  snapshots: StaffingSnapshot[],
  vacancies: VacancyRecord[],
  successionPlans: SuccessionPlan[],
): {
  latest_established: number;
  latest_filled: number;
  latest_vacancies: number;
  vacancy_rate: number | null;
  agency_count: number;
  agency_rate: number | null;
  staff_child_ratio: number;
  meets_ratio: boolean | null; // null = not recorded; judgements are tri-state — credit needs === true, breach needs === false
  open_vacancies: number;
  avg_time_to_fill: number;
  succession_coverage: number | null;
  roles_at_risk: number;
  by_role: Record<string, number>;
  by_vacancy_status: Record<string, number>;
} {
  // Latest snapshot
  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime(),
  );
  const latest = sorted[0];

  const established = latest?.established_posts ?? 0;
  const filled = latest?.filled_posts ?? 0;
  const vacs = latest?.vacancies ?? 0;
  const agencyCount = latest?.agency_staff ?? 0;
  const vacancyRate = established > 0 ? Math.round((vacs / established) * 1000) / 10 : null;
  const agencyRate = filled > 0 ? Math.round((agencyCount / (filled + agencyCount)) * 1000) / 10 : null;

  // Open vacancies
  const openVacancies = vacancies.filter(
    (v) => v.status !== "filled" && v.status !== "withdrawn",
  ).length;

  // Average time to fill (filled vacancies only)
  const filledVacancies = vacancies.filter((v) => v.status === "filled" && v.date_filled);
  let avgTimeToFill = 0;
  if (filledVacancies.length > 0) {
    const totalDays = filledVacancies.reduce((sum, v) => {
      const opened = new Date(v.date_opened);
      const filled = new Date(v.date_filled!);
      return sum + Math.round((filled.getTime() - opened.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    avgTimeToFill = Math.round(totalDays / filledVacancies.length);
  }

  // Succession
  const criticalRoles = successionPlans.length;
  const coveredRoles = successionPlans.filter(
    (s) => s.readiness === "ready_now" || s.readiness === "ready_1_year",
  ).length;
  const successionCoverage =
    criticalRoles > 0
      ? Math.round((coveredRoles / criticalRoles) * 1000) / 10
      : null;
  const rolesAtRisk = successionPlans.filter(
    (s) => s.readiness === "not_identified" || s.readiness === "development_needed",
  ).length;

  // By role (open vacancies)
  const byRole: Record<string, number> = {};
  for (const v of vacancies.filter((v) => v.status !== "filled" && v.status !== "withdrawn")) {
    byRole[v.role] = (byRole[v.role] ?? 0) + 1;
  }

  // By vacancy status
  const byVacancyStatus: Record<string, number> = {};
  for (const v of vacancies) {
    byVacancyStatus[v.status] = (byVacancyStatus[v.status] ?? 0) + 1;
  }

  return {
    latest_established: established,
    latest_filled: filled,
    latest_vacancies: vacs,
    vacancy_rate: vacancyRate,
    agency_count: agencyCount,
    agency_rate: agencyRate,
    staff_child_ratio: latest?.staff_child_ratio ?? 0,
    meets_ratio: latest?.meets_minimum_ratio ?? null,
    open_vacancies: openVacancies,
    avg_time_to_fill: avgTimeToFill,
    succession_coverage: successionCoverage,
    roles_at_risk: rolesAtRisk,
    by_role: byRole,
    by_vacancy_status: byVacancyStatus,
  };
}

/**
 * Identify workforce planning alerts.
 */
export function identifyWorkforceAlerts(
  snapshots: StaffingSnapshot[],
  vacancies: VacancyRecord[],
  successionPlans: SuccessionPlan[],
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

  // Latest snapshot checks
  const sorted = [...snapshots].sort(
    (a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime(),
  );
  const latest = sorted[0];

  if (latest && !latest.meets_minimum_ratio) {
    alerts.push({
      type: "ratio_not_met",
      severity: "critical",
      message: `Staff-to-child ratio (${latest.staff_child_ratio}) does not meet minimum requirements — ${latest.vacancies} vacancies, ${latest.agency_staff} agency staff covering`,
      id: latest.id,
    });
  }

  // High agency usage (>15%)
  if (latest) {
    const total = latest.filled_posts + latest.agency_staff;
    if (total > 0) {
      const agencyRate = (latest.agency_staff / total) * 100;
      if (agencyRate > 15) {
        alerts.push({
          type: "high_agency_usage",
          severity: "high",
          message: `Agency staff usage at ${Math.round(agencyRate)}% — aim below 15% for consistency of care`,
          id: latest.id,
        });
      }
    }
  }

  // Long-standing vacancies (>30 days)
  for (const v of vacancies) {
    if (v.status === "filled" || v.status === "withdrawn") continue;
    const daysSinceOpened = Math.round(
-londonDayDiff(new Date(v.date_opened), now),
    );
    if (daysSinceOpened > 60) {
      alerts.push({
        type: "long_vacancy",
        severity: "critical",
        message: `${v.title} vacancy open for ${daysSinceOpened} days — review recruitment strategy urgently`,
        id: v.id,
      });
    } else if (daysSinceOpened > 30) {
      alerts.push({
        type: "long_vacancy",
        severity: "high",
        message: `${v.title} vacancy open for ${daysSinceOpened} days — consider widening recruitment`,
        id: v.id,
      });
    }
  }

  // Succession gaps for critical roles
  for (const s of successionPlans) {
    if (s.readiness === "not_identified") {
      alerts.push({
        type: "succession_gap",
        severity: "high",
        message: `No successor identified for ${s.role_title} (${s.current_holder}) — ${s.risk_if_vacant}`,
        id: s.id,
      });
    }
  }

  // High sickness
  if (latest && latest.staff_on_sickness > 0) {
    const sicknessRate = latest.established_posts > 0
      ? (latest.staff_on_sickness / latest.established_posts) * 100
      : null;
    if ((sicknessRate ?? 0) > 15) {
      alerts.push({
        type: "high_sickness",
        severity: "high",
        message: `${latest.staff_on_sickness} staff on sickness (${Math.round(sicknessRate ?? 0)}%) — review wellbeing support and coverage arrangements`,
        id: latest.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Staffing Snapshots ─────────────────────────────────────────────

export async function listSnapshots(
  homeId: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<StaffingSnapshot[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staffing_snapshots") as SB).select("*").eq("home_id", homeId);
  if (filters?.dateFrom) q = q.gte("snapshot_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("snapshot_date", filters.dateTo);
  q = q.order("snapshot_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSnapshot(
  input: {
    homeId: string;
    snapshotDate: string;
    establishedPosts: number;
    filledPosts: number;
    vacancies: number;
    agencyStaff: number;
    bankStaff: number;
    staffOnLeave: number;
    staffOnSickness: number;
    childrenInPlacement: number;
    staffChildRatio: number;
    meetsMinimumRatio: boolean;
    commentary?: string;
    recordedBy: string;
  },
): Promise<ServiceResult<StaffingSnapshot>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staffing_snapshots") as SB)
    .insert({
      home_id: input.homeId,
      snapshot_date: input.snapshotDate,
      established_posts: input.establishedPosts,
      filled_posts: input.filledPosts,
      vacancies: input.vacancies,
      agency_staff: input.agencyStaff,
      bank_staff: input.bankStaff,
      staff_on_leave: input.staffOnLeave,
      staff_on_sickness: input.staffOnSickness,
      children_in_placement: input.childrenInPlacement,
      staff_child_ratio: input.staffChildRatio,
      meets_minimum_ratio: input.meetsMinimumRatio,
      commentary: input.commentary ?? null,
      recorded_by: input.recordedBy,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Vacancies ──────────────────────────────────────────────────────

export async function listVacancies(
  homeId: string,
  filters?: {
    status?: VacancyStatus;
    role?: StaffRole;
    limit?: number;
  },
): Promise<ServiceResult<VacancyRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_vacancy_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.role) q = q.eq("role", filters.role);
  q = q.order("date_opened", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createVacancy(
  input: {
    homeId: string;
    role: StaffRole;
    title: string;
    dateOpened: string;
    closingDate?: string;
    agencyCover?: boolean;
    recruitmentNotes?: string;
  },
): Promise<ServiceResult<VacancyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_vacancy_records") as SB)
    .insert({
      home_id: input.homeId,
      role: input.role,
      title: input.title,
      status: "open",
      date_opened: input.dateOpened,
      closing_date: input.closingDate ?? null,
      applications_received: 0,
      interviews_scheduled: 0,
      offers_made: 0,
      agency_cover: input.agencyCover ?? false,
      recruitment_notes: input.recruitmentNotes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateVacancy(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<VacancyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_vacancy_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Succession Plans ──────────────────────────────────────────────

export async function listSuccessionPlans(
  homeId: string,
  filters?: {
    readiness?: SuccessionReadiness;
    limit?: number;
  },
): Promise<ServiceResult<SuccessionPlan[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_succession_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.readiness) q = q.eq("readiness", filters.readiness);
  q = q.order("critical_role", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSuccessionPlan(
  input: {
    homeId: string;
    criticalRole: StaffRole;
    roleTitle: string;
    currentHolder: string;
    successorName?: string;
    readiness: SuccessionReadiness;
    developmentActions: string[];
    riskIfVacant: string;
    lastReviewed: string;
  },
): Promise<ServiceResult<SuccessionPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_succession_plans") as SB)
    .insert({
      home_id: input.homeId,
      critical_role: input.criticalRole,
      role_title: input.roleTitle,
      current_holder: input.currentHolder,
      successor_name: input.successorName ?? null,
      readiness: input.readiness,
      development_actions: input.developmentActions,
      risk_if_vacant: input.riskIfVacant,
      last_reviewed: input.lastReviewed,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSuccessionPlan(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<SuccessionPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_succession_plans") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeWorkforceMetrics,
  identifyWorkforceAlerts,
};
