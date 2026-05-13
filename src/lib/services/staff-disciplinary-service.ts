// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF DISCIPLINARY & GRIEVANCES SERVICE
// Manages disciplinary proceedings and staff grievance handling under
// CHR 2015 Reg 33 (employment of staff), Reg 34 (fitness of workers),
// Reg 40 (notifications to Ofsted), and SCCIF Leadership & Management.
//
// Tracks disciplinary cases from report through investigation, hearing, and
// outcome — including LADO/DBS/Ofsted referral requirements. Also manages
// formal grievance procedures through informal resolution, formal stages,
// and appeals.
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

export type DisciplinaryCategory =
  | "conduct"
  | "capability"
  | "absence"
  | "gross_misconduct"
  | "safeguarding_concern";

export type OutcomeType =
  | "no_action"
  | "verbal_warning"
  | "first_written_warning"
  | "final_written_warning"
  | "dismissal"
  | "summary_dismissal"
  | "demotion"
  | "suspension";

export type DisciplinaryStatus =
  | "reported"
  | "under_investigation"
  | "hearing_scheduled"
  | "outcome_issued"
  | "appeal_in_progress"
  | "closed";

export type GrievanceType =
  | "working_conditions"
  | "bullying_harassment"
  | "pay_conditions"
  | "management"
  | "health_safety"
  | "discrimination"
  | "other";

export type GrievanceStage =
  | "stage_1"
  | "stage_2"
  | "appeal"
  | "resolved"
  | "withdrawn";

export type GrievanceStatus =
  | "raised"
  | "informal_resolution"
  | "formal_stage_1"
  | "formal_stage_2"
  | "appeal"
  | "resolved"
  | "withdrawn";

export interface DisciplinaryRecord {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  category: DisciplinaryCategory;
  description: string;
  date_of_incident: string;
  reported_by: string;
  reported_date: string;
  investigation_required: boolean;
  investigating_officer: string | null;
  investigation_started_date: string | null;
  investigation_completed_date: string | null;
  hearing_date: string | null;
  hearing_outcome: string | null;
  outcome_type: OutcomeType | null;
  outcome_date: string | null;
  outcome_expiry_date: string | null;
  appeal_submitted: boolean;
  appeal_date: string | null;
  appeal_outcome: string | null;
  lado_referral_required: boolean;
  lado_referral_date: string | null;
  dbs_referral_required: boolean;
  dbs_referral_date: string | null;
  ofsted_notification_required: boolean;
  ofsted_notification_date: string | null;
  status: DisciplinaryStatus;
  notes: string | null;
  supporting_documents: string[];
  created_at: string;
  updated_at: string;
}

export interface GrievanceRecord {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  grievance_type: GrievanceType;
  description: string;
  date_raised: string;
  informal_resolution_attempted: boolean;
  informal_resolution_date: string | null;
  informal_outcome: string | null;
  formal_stage: GrievanceStage | null;
  hearing_date: string | null;
  hearing_officer: string | null;
  outcome: string | null;
  outcome_date: string | null;
  appeal_submitted: boolean;
  appeal_date: string | null;
  appeal_outcome: string | null;
  status: GrievanceStatus;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DISCIPLINARY_CATEGORIES: { value: DisciplinaryCategory; label: string }[] = [
  { value: "conduct", label: "Conduct" },
  { value: "capability", label: "Capability" },
  { value: "absence", label: "Absence" },
  { value: "gross_misconduct", label: "Gross Misconduct" },
  { value: "safeguarding_concern", label: "Safeguarding Concern" },
];

export const OUTCOME_TYPES: { value: OutcomeType; label: string }[] = [
  { value: "no_action", label: "No Action" },
  { value: "verbal_warning", label: "Verbal Warning" },
  { value: "first_written_warning", label: "First Written Warning" },
  { value: "final_written_warning", label: "Final Written Warning" },
  { value: "dismissal", label: "Dismissal" },
  { value: "summary_dismissal", label: "Summary Dismissal" },
  { value: "demotion", label: "Demotion" },
  { value: "suspension", label: "Suspension" },
];

export const DISCIPLINARY_STATUS: { value: DisciplinaryStatus; label: string }[] = [
  { value: "reported", label: "Reported" },
  { value: "under_investigation", label: "Under Investigation" },
  { value: "hearing_scheduled", label: "Hearing Scheduled" },
  { value: "outcome_issued", label: "Outcome Issued" },
  { value: "appeal_in_progress", label: "Appeal in Progress" },
  { value: "closed", label: "Closed" },
];

export const GRIEVANCE_TYPES: { value: GrievanceType; label: string }[] = [
  { value: "working_conditions", label: "Working Conditions" },
  { value: "bullying_harassment", label: "Bullying & Harassment" },
  { value: "pay_conditions", label: "Pay & Conditions" },
  { value: "management", label: "Management" },
  { value: "health_safety", label: "Health & Safety" },
  { value: "discrimination", label: "Discrimination" },
  { value: "other", label: "Other" },
];

export const GRIEVANCE_STAGES: { value: GrievanceStage; label: string }[] = [
  { value: "stage_1", label: "Stage 1" },
  { value: "stage_2", label: "Stage 2" },
  { value: "appeal", label: "Appeal" },
  { value: "resolved", label: "Resolved" },
  { value: "withdrawn", label: "Withdrawn" },
];

export const GRIEVANCE_STATUS: { value: GrievanceStatus; label: string }[] = [
  { value: "raised", label: "Raised" },
  { value: "informal_resolution", label: "Informal Resolution" },
  { value: "formal_stage_1", label: "Formal Stage 1" },
  { value: "formal_stage_2", label: "Formal Stage 2" },
  { value: "appeal", label: "Appeal" },
  { value: "resolved", label: "Resolved" },
  { value: "withdrawn", label: "Withdrawn" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary metrics across disciplinary and grievance records.
 */
export function computeDisciplinaryMetrics(
  disciplinaries: DisciplinaryRecord[],
  grievances: GrievanceRecord[],
): {
  active_disciplinary_cases: number;
  active_grievance_cases: number;
  total_disciplinary: number;
  total_grievances: number;
  by_category: Record<string, number>;
  by_outcome_type: Record<string, number>;
  avg_investigation_days: number;
  lado_referral_rate: number;
  dbs_referral_rate: number;
  ofsted_notification_rate: number;
  by_grievance_type: Record<string, number>;
  informal_resolution_rate: number;
} {
  const activeDisciplinaryStatuses: DisciplinaryStatus[] = [
    "reported",
    "under_investigation",
    "hearing_scheduled",
    "outcome_issued",
    "appeal_in_progress",
  ];

  const activeGrievanceStatuses: GrievanceStatus[] = [
    "raised",
    "informal_resolution",
    "formal_stage_1",
    "formal_stage_2",
    "appeal",
  ];

  let activeDisciplinaryCases = 0;
  let activeGrievanceCases = 0;

  const byCategory: Record<string, number> = {};
  const byOutcomeType: Record<string, number> = {};
  const byGrievanceType: Record<string, number> = {};

  let totalInvestigationDays = 0;
  let investigationCount = 0;

  let ladoReferralCount = 0;
  let dbsReferralCount = 0;
  let ofstedNotificationCount = 0;

  let informalResolutionCount = 0;
  let resolvedGrievances = 0;

  // Process disciplinary records
  for (const d of disciplinaries) {
    if (activeDisciplinaryStatuses.includes(d.status)) {
      activeDisciplinaryCases++;
    }

    // By category
    byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;

    // By outcome type (only where outcome has been issued)
    if (d.outcome_type) {
      byOutcomeType[d.outcome_type] = (byOutcomeType[d.outcome_type] ?? 0) + 1;
    }

    // Average investigation time (completed investigations only)
    if (d.investigation_started_date && d.investigation_completed_date) {
      const started = new Date(d.investigation_started_date).getTime();
      const completed = new Date(d.investigation_completed_date).getTime();
      const days = (completed - started) / (1000 * 60 * 60 * 24);
      totalInvestigationDays += days;
      investigationCount++;
    }

    // Referral counts
    if (d.lado_referral_required) ladoReferralCount++;
    if (d.dbs_referral_required) dbsReferralCount++;
    if (d.ofsted_notification_required) ofstedNotificationCount++;
  }

  // Process grievance records
  for (const g of grievances) {
    if (activeGrievanceStatuses.includes(g.status)) {
      activeGrievanceCases++;
    }

    // By grievance type
    byGrievanceType[g.grievance_type] = (byGrievanceType[g.grievance_type] ?? 0) + 1;

    // Informal resolution rate (of resolved grievances)
    if (g.status === "resolved") {
      resolvedGrievances++;
      if (g.informal_resolution_attempted && g.informal_outcome) {
        informalResolutionCount++;
      }
    }
  }

  const totalDisciplinary = disciplinaries.length;
  const totalGrievances = grievances.length;

  const avgInvestigationDays =
    investigationCount > 0
      ? Math.round((totalInvestigationDays / investigationCount) * 10) / 10
      : 0;

  const ladoReferralRate =
    totalDisciplinary > 0
      ? Math.round((ladoReferralCount / totalDisciplinary) * 1000) / 10
      : 0;

  const dbsReferralRate =
    totalDisciplinary > 0
      ? Math.round((dbsReferralCount / totalDisciplinary) * 1000) / 10
      : 0;

  const ofstedNotificationRate =
    totalDisciplinary > 0
      ? Math.round((ofstedNotificationCount / totalDisciplinary) * 1000) / 10
      : 0;

  const informalResolutionRate =
    resolvedGrievances > 0
      ? Math.round((informalResolutionCount / resolvedGrievances) * 1000) / 10
      : 0;

  return {
    active_disciplinary_cases: activeDisciplinaryCases,
    active_grievance_cases: activeGrievanceCases,
    total_disciplinary: totalDisciplinary,
    total_grievances: totalGrievances,
    by_category: byCategory,
    by_outcome_type: byOutcomeType,
    avg_investigation_days: avgInvestigationDays,
    lado_referral_rate: ladoReferralRate,
    dbs_referral_rate: dbsReferralRate,
    ofsted_notification_rate: ofstedNotificationRate,
    by_grievance_type: byGrievanceType,
    informal_resolution_rate: informalResolutionRate,
  };
}

/**
 * Identify alerts requiring management attention from disciplinary and grievance records.
 */
export function identifyDisciplinaryAlerts(
  disciplinaries: DisciplinaryRecord[],
  grievances: GrievanceRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium" | "low";
    message: string;
    id: string;
  }[] = [];
  const now = new Date();

  // ── Disciplinary alerts ─────────────────────────────────────────────

  for (const d of disciplinaries) {
    // Safeguarding concern — always critical
    if (d.category === "safeguarding_concern" && d.status !== "closed") {
      alerts.push({
        type: "safeguarding_concern",
        severity: "critical",
        message: `Active safeguarding concern for ${d.staff_name} — requires immediate management attention (Reg 34)`,
        id: d.id,
      });
    }

    // LADO referral required but not made
    if (d.lado_referral_required && !d.lado_referral_date && d.status !== "closed") {
      alerts.push({
        type: "lado_referral_pending",
        severity: "critical",
        message: `LADO referral required for ${d.staff_name} but not yet made — mandatory under safeguarding procedures`,
        id: d.id,
      });
    }

    // DBS referral required but not made
    if (d.dbs_referral_required && !d.dbs_referral_date && d.status !== "closed") {
      alerts.push({
        type: "dbs_referral_pending",
        severity: "high",
        message: `DBS referral required for ${d.staff_name} but not yet submitted`,
        id: d.id,
      });
    }

    // Ofsted notification required but not sent (Reg 40)
    if (d.ofsted_notification_required && !d.ofsted_notification_date && d.status !== "closed") {
      alerts.push({
        type: "ofsted_notification_pending",
        severity: "critical",
        message: `Ofsted notification required for ${d.staff_name} but not yet sent — Reg 40 statutory duty`,
        id: d.id,
      });
    }

    // Overdue investigation — under_investigation for more than 28 days
    if (d.status === "under_investigation" && d.investigation_started_date) {
      const started = new Date(d.investigation_started_date).getTime();
      const daysElapsed = Math.round((now.getTime() - started) / (1000 * 60 * 60 * 24));
      if (daysElapsed > 28) {
        alerts.push({
          type: "investigation_overdue",
          severity: "high",
          message: `Investigation for ${d.staff_name} has been running for ${daysElapsed} days — investigations should normally complete within 28 days`,
          id: d.id,
        });
      }
    }

    // Investigation required but not started
    if (
      d.investigation_required &&
      !d.investigation_started_date &&
      d.status === "reported"
    ) {
      const reportedDate = new Date(d.reported_date).getTime();
      const daysElapsed = Math.round((now.getTime() - reportedDate) / (1000 * 60 * 60 * 24));
      if (daysElapsed > 3) {
        alerts.push({
          type: "investigation_not_started",
          severity: "high",
          message: `Investigation required for ${d.staff_name} but not started — reported ${daysElapsed} days ago`,
          id: d.id,
        });
      }
    }

    // Long-running case — open for more than 90 days
    if (d.status !== "closed") {
      const reportedDate = new Date(d.reported_date).getTime();
      const daysElapsed = Math.round((now.getTime() - reportedDate) / (1000 * 60 * 60 * 24));
      if (daysElapsed > 90) {
        alerts.push({
          type: "long_running_case",
          severity: "medium",
          message: `Disciplinary case for ${d.staff_name} has been open for ${daysElapsed} days — review whether case can be concluded`,
          id: d.id,
        });
      }
    }

    // Gross misconduct requiring urgent action
    if (d.category === "gross_misconduct" && d.status === "reported") {
      alerts.push({
        type: "gross_misconduct_reported",
        severity: "critical",
        message: `Gross misconduct reported for ${d.staff_name} — requires immediate investigation and potential suspension`,
        id: d.id,
      });
    }
  }

  // ── Grievance alerts ────────────────────────────────────────────────

  for (const g of grievances) {
    // Grievance unresolved for more than 28 days
    if (
      g.status !== "resolved" &&
      g.status !== "withdrawn"
    ) {
      const raisedDate = new Date(g.date_raised).getTime();
      const daysElapsed = Math.round((now.getTime() - raisedDate) / (1000 * 60 * 60 * 24));
      if (daysElapsed > 28) {
        alerts.push({
          type: "grievance_overdue",
          severity: "medium",
          message: `Grievance from ${g.staff_name} has been open for ${daysElapsed} days — aim to resolve within 28 days`,
          id: g.id,
        });
      }
    }

    // Bullying/harassment or discrimination — escalated priority
    if (
      (g.grievance_type === "bullying_harassment" || g.grievance_type === "discrimination") &&
      g.status !== "resolved" &&
      g.status !== "withdrawn"
    ) {
      alerts.push({
        type: "sensitive_grievance",
        severity: "high",
        message: `Active ${g.grievance_type.replace(/_/g, " ")} grievance from ${g.staff_name} — requires careful handling and may need external investigation`,
        id: g.id,
      });
    }

    // Grievance at appeal stage
    if (g.status === "appeal") {
      alerts.push({
        type: "grievance_appeal",
        severity: "medium",
        message: `Grievance from ${g.staff_name} is at appeal stage — senior management review required`,
        id: g.id,
      });
    }
  }

  // ── Pattern detection: multiple cases for the same staff member ──────

  const staffDisciplinaryCount: Record<string, { count: number; name: string }> = {};
  for (const d of disciplinaries) {
    if (d.status !== "closed") {
      if (!staffDisciplinaryCount[d.staff_id]) {
        staffDisciplinaryCount[d.staff_id] = { count: 0, name: d.staff_name };
      }
      staffDisciplinaryCount[d.staff_id].count++;
    }
  }

  for (const [staffId, info] of Object.entries(staffDisciplinaryCount)) {
    if (info.count >= 2) {
      alerts.push({
        type: "repeat_disciplinary",
        severity: "high",
        message: `${info.name} has ${info.count} active disciplinary cases — pattern may indicate fitness concern (Reg 34)`,
        id: staffId,
      });
    }
  }

  return alerts;
}

// ── CRUD — Disciplinary Records ──────────────────────────────────────────

export async function listDisciplinaryRecords(
  homeId: string,
  filters?: {
    staffId?: string;
    category?: DisciplinaryCategory;
    status?: DisciplinaryStatus;
    limit?: number;
  },
): Promise<ServiceResult<DisciplinaryRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<DisciplinaryRecord[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<DisciplinaryRecord[]>;

  let q = (s.from("cs_disciplinary_records") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDisciplinaryRecord(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    category: DisciplinaryCategory;
    description: string;
    dateOfIncident: string;
    reportedBy: string;
    reportedDate: string;
    investigationRequired: boolean;
    investigatingOfficer?: string;
    ladoReferralRequired?: boolean;
    dbsReferralRequired?: boolean;
    ofstedNotificationRequired?: boolean;
    notes?: string;
    supportingDocuments?: string[];
  },
): Promise<ServiceResult<DisciplinaryRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_disciplinary_records") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      category: input.category,
      description: input.description,
      date_of_incident: input.dateOfIncident,
      reported_by: input.reportedBy,
      reported_date: input.reportedDate,
      investigation_required: input.investigationRequired,
      investigating_officer: input.investigatingOfficer ?? null,
      investigation_started_date: null,
      investigation_completed_date: null,
      hearing_date: null,
      hearing_outcome: null,
      outcome_type: null,
      outcome_date: null,
      outcome_expiry_date: null,
      appeal_submitted: false,
      appeal_date: null,
      appeal_outcome: null,
      lado_referral_required: input.ladoReferralRequired ?? false,
      lado_referral_date: null,
      dbs_referral_required: input.dbsReferralRequired ?? false,
      dbs_referral_date: null,
      ofsted_notification_required: input.ofstedNotificationRequired ?? false,
      ofsted_notification_date: null,
      status: "reported",
      notes: input.notes ?? null,
      supporting_documents: input.supportingDocuments ?? [],
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateDisciplinaryRecord(
  id: string,
  updates: Partial<DisciplinaryRecord>,
): Promise<ServiceResult<DisciplinaryRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_disciplinary_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Grievance Records ─────────────────────────────────────────────

export async function listGrievances(
  homeId: string,
  filters?: {
    staffId?: string;
    grievanceType?: GrievanceType;
    status?: GrievanceStatus;
    limit?: number;
  },
): Promise<ServiceResult<GrievanceRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<GrievanceRecord[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<GrievanceRecord[]>;

  let q = (s.from("cs_grievance_records") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.grievanceType) q = q.eq("grievance_type", filters.grievanceType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createGrievance(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    grievanceType: GrievanceType;
    description: string;
    dateRaised: string;
    informalResolutionAttempted?: boolean;
    informalResolutionDate?: string;
    informalOutcome?: string;
  },
): Promise<ServiceResult<GrievanceRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const informalAttempted = input.informalResolutionAttempted ?? false;
  const initialStatus: GrievanceStatus = informalAttempted
    ? "informal_resolution"
    : "raised";

  const { data, error } = await (s.from("cs_grievance_records") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      grievance_type: input.grievanceType,
      description: input.description,
      date_raised: input.dateRaised,
      informal_resolution_attempted: informalAttempted,
      informal_resolution_date: input.informalResolutionDate ?? null,
      informal_outcome: input.informalOutcome ?? null,
      formal_stage: null,
      hearing_date: null,
      hearing_officer: null,
      outcome: null,
      outcome_date: null,
      appeal_submitted: false,
      appeal_date: null,
      appeal_outcome: null,
      status: initialStatus,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateGrievance(
  id: string,
  updates: Partial<GrievanceRecord>,
): Promise<ServiceResult<GrievanceRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_grievance_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeDisciplinaryMetrics,
  identifyDisciplinaryAlerts,
};
