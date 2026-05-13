// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COURT PROCEEDINGS SERVICE
// Tracks court proceedings, hearings, statements, and legal representation
// for children in care. Manages court dates, guardian involvement,
// statement preparation, and court-directed actions.
// CHR 2015 Reg 38 (providing information to courts),
// Reg 8 (parental responsibility — court orders),
// Children Act 1989 (court involvement in care proceedings).
//
// Monitors active cases, upcoming hearings, statement deadlines,
// guardian appointments, and court outcomes.
//
// SCCIF: Leadership & Management — "The home cooperates with courts
// and provides timely, accurate information."
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

export type ProceedingType =
  | "care_order"
  | "supervision_order"
  | "epo"
  | "secure_accommodation"
  | "adoption"
  | "special_guardianship"
  | "child_arrangement"
  | "discharge_of_order"
  | "variation"
  | "appeal"
  | "other";

export type ProceedingStatus =
  | "active"
  | "adjourned"
  | "concluded"
  | "withdrawn"
  | "pending_decision"
  | "appeal_pending";

export type HearingType =
  | "first_hearing"
  | "case_management"
  | "issues_resolution"
  | "final_hearing"
  | "review_hearing"
  | "directions_hearing"
  | "emergency"
  | "appeal"
  | "other";

export type StatementStatus =
  | "not_started"
  | "drafting"
  | "under_review"
  | "submitted"
  | "filed_with_court"
  | "late";

export interface CourtProceeding {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  proceeding_type: ProceedingType;
  proceeding_status: ProceedingStatus;
  court_name: string;
  case_number: string | null;
  start_date: string;
  next_hearing_date: string | null;
  next_hearing_type: HearingType | null;
  guardian_appointed: boolean;
  guardian_name: string | null;
  solicitor_name: string | null;
  statement_status: StatementStatus;
  statement_deadline: string | null;
  la_social_worker: string;
  home_statement_required: boolean;
  home_statement_submitted: boolean;
  court_actions: string[];
  child_views_sought: boolean;
  child_wishes_communicated: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PROCEEDING_TYPES: { type: ProceedingType; label: string }[] = [
  { type: "care_order", label: "Care Order" },
  { type: "supervision_order", label: "Supervision Order" },
  { type: "epo", label: "Emergency Protection Order" },
  { type: "secure_accommodation", label: "Secure Accommodation" },
  { type: "adoption", label: "Adoption" },
  { type: "special_guardianship", label: "Special Guardianship" },
  { type: "child_arrangement", label: "Child Arrangement" },
  { type: "discharge_of_order", label: "Discharge of Order" },
  { type: "variation", label: "Variation" },
  { type: "appeal", label: "Appeal" },
  { type: "other", label: "Other" },
];

export const PROCEEDING_STATUSES: { status: ProceedingStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "adjourned", label: "Adjourned" },
  { status: "concluded", label: "Concluded" },
  { status: "withdrawn", label: "Withdrawn" },
  { status: "pending_decision", label: "Pending Decision" },
  { status: "appeal_pending", label: "Appeal Pending" },
];

export const HEARING_TYPES: { type: HearingType; label: string }[] = [
  { type: "first_hearing", label: "First Hearing" },
  { type: "case_management", label: "Case Management" },
  { type: "issues_resolution", label: "Issues Resolution" },
  { type: "final_hearing", label: "Final Hearing" },
  { type: "review_hearing", label: "Review Hearing" },
  { type: "directions_hearing", label: "Directions Hearing" },
  { type: "emergency", label: "Emergency" },
  { type: "appeal", label: "Appeal" },
  { type: "other", label: "Other" },
];

export const STATEMENT_STATUSES: { status: StatementStatus; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "drafting", label: "Drafting" },
  { status: "under_review", label: "Under Review" },
  { status: "submitted", label: "Submitted" },
  { status: "filed_with_court", label: "Filed with Court" },
  { status: "late", label: "Late" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeCourtMetrics(
  proceedings: CourtProceeding[],
): {
  total_proceedings: number;
  active_count: number;
  concluded_count: number;
  adjourned_count: number;
  pending_decision_count: number;
  children_involved: number;
  guardian_appointed_rate: number;
  statement_submitted_rate: number;
  statement_late_count: number;
  home_statement_required_count: number;
  home_statement_submitted_rate: number;
  child_views_sought_rate: number;
  child_wishes_communicated_rate: number;
  upcoming_hearings: number;
  by_proceeding_type: Record<string, number>;
  by_proceeding_status: Record<string, number>;
  by_hearing_type: Record<string, number>;
  by_statement_status: Record<string, number>;
} {
  const active = proceedings.filter((p) => p.proceeding_status === "active").length;
  const concluded = proceedings.filter((p) => p.proceeding_status === "concluded").length;
  const adjourned = proceedings.filter((p) => p.proceeding_status === "adjourned").length;
  const pendingDecision = proceedings.filter((p) => p.proceeding_status === "pending_decision").length;

  const children = new Set(proceedings.map((p) => p.child_id)).size;

  const guardianAppointed = proceedings.filter((p) => p.guardian_appointed).length;
  const guardianRate =
    proceedings.length > 0
      ? Math.round((guardianAppointed / proceedings.length) * 1000) / 10
      : 0;

  const stmtSubmitted = proceedings.filter(
    (p) => p.statement_status === "submitted" || p.statement_status === "filed_with_court",
  ).length;
  const stmtRate =
    proceedings.length > 0
      ? Math.round((stmtSubmitted / proceedings.length) * 1000) / 10
      : 0;

  const stmtLate = proceedings.filter((p) => p.statement_status === "late").length;

  const homeRequired = proceedings.filter((p) => p.home_statement_required).length;
  const homeSubmitted = proceedings.filter((p) => p.home_statement_required && p.home_statement_submitted).length;
  const homeRate =
    homeRequired > 0
      ? Math.round((homeSubmitted / homeRequired) * 1000) / 10
      : 0;

  const viewsSought = proceedings.filter((p) => p.child_views_sought).length;
  const viewsRate =
    proceedings.length > 0
      ? Math.round((viewsSought / proceedings.length) * 1000) / 10
      : 0;

  const wishesCommunicated = proceedings.filter((p) => p.child_wishes_communicated).length;
  const wishesRate =
    proceedings.length > 0
      ? Math.round((wishesCommunicated / proceedings.length) * 1000) / 10
      : 0;

  const upcoming = proceedings.filter((p) => p.next_hearing_date !== null).length;

  const byType: Record<string, number> = {};
  for (const p of proceedings) byType[p.proceeding_type] = (byType[p.proceeding_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const p of proceedings) byStatus[p.proceeding_status] = (byStatus[p.proceeding_status] ?? 0) + 1;

  const byHearing: Record<string, number> = {};
  for (const p of proceedings) {
    if (p.next_hearing_type) byHearing[p.next_hearing_type] = (byHearing[p.next_hearing_type] ?? 0) + 1;
  }

  const byStmt: Record<string, number> = {};
  for (const p of proceedings) byStmt[p.statement_status] = (byStmt[p.statement_status] ?? 0) + 1;

  return {
    total_proceedings: proceedings.length,
    active_count: active,
    concluded_count: concluded,
    adjourned_count: adjourned,
    pending_decision_count: pendingDecision,
    children_involved: children,
    guardian_appointed_rate: guardianRate,
    statement_submitted_rate: stmtRate,
    statement_late_count: stmtLate,
    home_statement_required_count: homeRequired,
    home_statement_submitted_rate: homeRate,
    child_views_sought_rate: viewsRate,
    child_wishes_communicated_rate: wishesRate,
    upcoming_hearings: upcoming,
    by_proceeding_type: byType,
    by_proceeding_status: byStatus,
    by_hearing_type: byHearing,
    by_statement_status: byStmt,
  };
}

export function identifyCourtAlerts(
  proceedings: CourtProceeding[],
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

  // Statement late
  for (const p of proceedings) {
    if (p.statement_status === "late") {
      alerts.push({
        type: "statement_late",
        severity: "critical",
        message: `Court statement for ${p.child_name} (${p.court_name}) is late — submit immediately to avoid contempt`,
        id: p.id,
      });
    }
  }

  // Statement deadline approaching (within 7 days)
  for (const p of proceedings) {
    if (
      p.statement_deadline &&
      p.statement_status !== "submitted" &&
      p.statement_status !== "filed_with_court" &&
      p.statement_status !== "late"
    ) {
      const deadline = new Date(p.statement_deadline);
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7 && daysUntil >= 0) {
        alerts.push({
          type: "statement_deadline_soon",
          severity: "high",
          message: `Statement deadline for ${p.child_name} is in ${daysUntil} ${daysUntil === 1 ? "day" : "days"} (${p.statement_deadline}) — prioritise completion`,
          id: p.id,
        });
      }
    }
  }

  // Home statement required but not submitted
  for (const p of proceedings) {
    if (p.home_statement_required && !p.home_statement_submitted && p.proceeding_status === "active") {
      alerts.push({
        type: "home_statement_pending",
        severity: "high",
        message: `Home statement required for ${p.child_name}'s ${p.proceeding_type.replace(/_/g, " ")} proceedings but not yet submitted`,
        id: p.id,
      });
    }
  }

  // Child views not sought in active proceedings
  for (const p of proceedings) {
    if (!p.child_views_sought && p.proceeding_status === "active") {
      alerts.push({
        type: "child_views_not_sought",
        severity: "high",
        message: `Child views not sought for ${p.child_name}'s court proceedings — Reg 7 requires children's wishes to be ascertained`,
        id: p.id,
      });
    }
  }

  // Pending decisions
  for (const p of proceedings) {
    if (p.proceeding_status === "pending_decision") {
      alerts.push({
        type: "pending_decision",
        severity: "medium",
        message: `Court decision pending for ${p.child_name} (${p.proceeding_type.replace(/_/g, " ")}) — prepare for all possible outcomes`,
        id: p.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listProceedings(
  homeId: string,
  filters?: {
    childId?: string;
    proceedingType?: ProceedingType;
    proceedingStatus?: ProceedingStatus;
    limit?: number;
  },
): Promise<ServiceResult<CourtProceeding[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_court_proceedings") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.proceedingType) q = q.eq("proceeding_type", filters.proceedingType);
  if (filters?.proceedingStatus) q = q.eq("proceeding_status", filters.proceedingStatus);
  q = q.order("start_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createProceeding(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    proceedingType: ProceedingType;
    proceedingStatus: ProceedingStatus;
    courtName: string;
    caseNumber?: string;
    startDate: string;
    nextHearingDate?: string;
    nextHearingType?: HearingType;
    guardianAppointed: boolean;
    guardianName?: string;
    solicitorName?: string;
    statementStatus: StatementStatus;
    statementDeadline?: string;
    laSocialWorker: string;
    homeStatementRequired: boolean;
    homeStatementSubmitted: boolean;
    courtActions: string[];
    childViewsSought: boolean;
    childWishesCommunicated: boolean;
    notes?: string;
  },
): Promise<ServiceResult<CourtProceeding>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_court_proceedings") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      proceeding_type: input.proceedingType,
      proceeding_status: input.proceedingStatus,
      court_name: input.courtName,
      case_number: input.caseNumber ?? null,
      start_date: input.startDate,
      next_hearing_date: input.nextHearingDate ?? null,
      next_hearing_type: input.nextHearingType ?? null,
      guardian_appointed: input.guardianAppointed,
      guardian_name: input.guardianName ?? null,
      solicitor_name: input.solicitorName ?? null,
      statement_status: input.statementStatus,
      statement_deadline: input.statementDeadline ?? null,
      la_social_worker: input.laSocialWorker,
      home_statement_required: input.homeStatementRequired,
      home_statement_submitted: input.homeStatementSubmitted,
      court_actions: input.courtActions,
      child_views_sought: input.childViewsSought,
      child_wishes_communicated: input.childWishesCommunicated,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateProceeding(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<CourtProceeding>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_court_proceedings") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeCourtMetrics,
  identifyCourtAlerts,
};
